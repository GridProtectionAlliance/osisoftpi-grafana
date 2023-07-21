package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type BatchSubRequest struct {
	Method   string `json:"Method"`
	Resource string `json:"Resource"`
}

// processQuery is the main function for processing queries. It takes a query and returns a slice of PiProcessedQuery
// that contains batched queries that are ready to be sent to the PI Web API.
// If there is an error, the error is set in the PiProcessedQuery and the slice is returned, the error propogates through
// the rest of the processing chain such that a dataframe with metadata is returned to the user to provide feedback to the user.
func (d Datasource) processQuery(ctx context.Context, query backend.DataQuery, datasourceUID string) []PiProcessedQuery {
	var ProcessedQuery []PiProcessedQuery
	var PiQuery Query

	// Unmarshal the query into a PiQuery struct, and then unmarshal the PiQuery into a PiProcessedQuery
	// if there are errors we'll set the error and return the PiProcessedQuery with an error set.
	tempJson, err := json.Marshal(query)
	if err != nil {
		log.DefaultLogger.Error("Error marshalling query", "error", err)

		piQuery := PiProcessedQuery{
			Error: err,
		}
		ProcessedQuery = append(ProcessedQuery, piQuery)
		return ProcessedQuery
	}

	err = json.Unmarshal(tempJson, &PiQuery)
	if err != nil {
		log.DefaultLogger.Error("Error unmarshalling query", "error", err)

		piQuery := PiProcessedQuery{
			Error: err,
		}
		ProcessedQuery = append(ProcessedQuery, piQuery)
		return ProcessedQuery
	}

	var UseUnits = false
	if PiQuery.Pi.UseUnit.Enable {
		UseUnits = true
	}

	// the queries are may contain multiple targets, so we need to loop through them
	for _, target := range PiQuery.Pi.getTargets() {
		fullTargetPath := PiQuery.Pi.getBasePath()

		//TODO: I think this would be cleaner in separate function.
		//set the full path for the query based on the type of the target
		if PiQuery.Pi.IsPiPoint {
			fullTargetPath += "\\" + target
		} else {
			fullTargetPath += "|" + target
		}

		//create a processed query for the target
		piQuery := PiProcessedQuery{
			Label:               target,
			UID:                 datasourceUID,
			IntervalNanoSeconds: PiQuery.Interval,
			IsPIPoint:           PiQuery.Pi.IsPiPoint,
			//Streamable:          PiQuery.isStreamable(), //TODO: Implement this
			FullTargetPath: fullTargetPath,
			UseUnit:        UseUnits,
		}

		WebID, err := d.getWebID(ctx, fullTargetPath, PiQuery.Pi.IsPiPoint)
		if err != nil {
			log.DefaultLogger.Error("Error getting WebID", "error", err)
			piQuery.Error = err
		}

		piQuery.WebID = WebID.WebID

		//Create the subrequest for the overall batch request
		batchSubRequest := BatchSubRequest{
			Method:   "GET",
			Resource: d.settings.URL + PiQuery.getQueryBaseURL() + "&webid=" + WebID.WebID,
		}

		piQuery.BatchRequest = batchSubRequest

		ProcessedQuery = append(ProcessedQuery, piQuery)
	}
	return ProcessedQuery
}

func (d Datasource) batchRequest(ctx context.Context, PIWebAPIQueries map[string][]PiProcessedQuery) map[string][]PiProcessedQuery {
	for RefID, processed := range PIWebAPIQueries {
		batchRequest := make(map[string]BatchSubRequest)
		backend.Logger.Info("Processing batch request", "RefID", RefID)

		// create a map of the batch requests. This allows us to map the response back to the original query
		for i, p := range processed {
			batchRequest[fmt.Sprint(i)] = p.BatchRequest
		}

		// request the data from the PI Web API
		r, err := d.apiBatchRequest(ctx, batchRequest)

		// if we get an error back from the PI Web API, we set the error in the PiProcessedQuery and break out of the loop
		if err != nil {
			log.DefaultLogger.Error("Error in batch request", "RefID", RefID, "error", err)
			// TODO: Create a user friendly error message
			for i := range processed {
				PIWebAPIQueries[RefID][i].Error = err
			}
			continue
		}

		tempresponse := make(map[int]PIBatchResponse)
		err = json.Unmarshal(r, &tempresponse)
		if err != nil {
			log.DefaultLogger.Error("Error unmarshaling batch response", "RefID", RefID, "error", err)
			for i := range processed {
				PIWebAPIQueries[RefID][i].Error = err
			}
			continue
		}

		// map the response back to the original query
		for i := range processed {
			PIWebAPIQueries[RefID][i].Response = tempresponse[i].Content
		}
	}
	return PIWebAPIQueries
}

func (d Datasource) processBatchtoFrames(processedQuery map[string][]PiProcessedQuery) *backend.QueryDataResponse {
	response := backend.NewQueryDataResponse()

	for RefID, query := range processedQuery {

		var subResponse backend.DataResponse
		for i, q := range query {
			backend.Logger.Info("Processing query", "RefID", RefID, "QueryIndex", i)

			// if there is an error in the query, we set the error in the subresponse and break out of the loop returning the error.
			if q.Error != nil {
				backend.Logger.Error("Error processing query", "RefID", RefID, "QueryIndex", i, "error", q.Error)
				subResponse.Error = q.Error
				break
			}

			var tagLabel string

			if d.dataSourceOptions.NewFormat != nil && *d.dataSourceOptions.NewFormat {
				if q.IsPIPoint {
					// New format returns the full path with metadata
					// PiPoint {element="PISERVER", name="Attribute", type="Float32"}
					targetParts := strings.Split(q.FullTargetPath, "\\")
					tagLabel = targetParts[len(targetParts)-1]
					var element = targetParts[0]
					var name = tagLabel
					var targettype = d.getPointTypeForWebID(q.WebID)
					tagLabel = tagLabel + " {element=\"" + element + "\", name=\"" + name + "\", type=\"" + targettype + "\"}"
					//tagLabel = q.FullTargetPath

				} else {

					// New format returns the full path with metadata
					// Element|Attribute {element="Element", name="Attribute", type="Single"}
					targetParts := strings.Split(q.FullTargetPath, "\\")
					tagLabel = targetParts[len(targetParts)-1]
					labelParts := strings.SplitN(tagLabel, "|", 2)
					var element = labelParts[0]
					var name = labelParts[1]
					var targettype = d.getPointTypeForWebID(q.WebID)
					tagLabel = tagLabel + " {element=\"" + element + "\", name=\"" + name + "\", type=\"" + targettype + "\"}"
				}

			} else {
				// Old format returns just the tag/attribute name
				tagLabel = q.Label
			}

			frame, err := convertItemsToDataFrame(tagLabel, *q.Response.getItems(), d, q.WebID, false, q.UseUnit)

			// if there is an error on a single frame we set metadata and continue to the next frame
			if err != nil {
				backend.Logger.Error("Error processing query", "RefID", RefID, "QueryIndex", i, "error", err.Error)
				continue
			}

			frame.RefID = RefID
			frame.Meta.ExecutedQueryString = q.BatchRequest.Resource

			// TODO: enable streaming
			// If the query is streamable, then we need to set the channel URI
			// and the executed query string.
			// if q.Streamable {
			// 	// Create a new channel for this frame request.
			// 	// Creating a new channel for each frame request is not ideal,
			// 	// but it is the only way to ensure that the frame data is refreshed
			// 	// on a time interval update.
			// 	channeluuid := uuid.New()
			// 	channelURI := "ds/" + q.UID + "/" + channeluuid.String()
			// 	channel := StreamChannelConstruct{
			// 		WebID:               q.WebID,
			// 		IntervalNanoSeconds: q.IntervalNanoSeconds,
			// 	}
			// 	d.channelConstruct[channeluuid.String()] = channel
			// 	frame.Meta.Channel = channelURI
			// }

			subResponse.Frames = append(subResponse.Frames, frame)
		}
		response.Responses[RefID] = subResponse
	}
	return response
}

func (q *PIWebAPIQuery) isSummary() bool {
	return q.Summary.Basis != "" && len(q.Summary.Types) > 0
}

func (q *PIWebAPIQuery) getSummaryDuration() string {
	if q.Summary.Interval == "" {
		return "30s"
	}
	return q.Summary.Interval
}

func (q *PIWebAPIQuery) getSummaryURIComponent() string {
	uri := ""
	// FIXME: Validate that we cannot have a summary for a calculation
	if !q.isExpression() {
		for _, t := range q.Summary.Types {
			uri += "&summaryType=" + t.Value.Value
		}
		uri += "&summaryBasis=" + q.Summary.Basis
		uri += "&summaryDuration=" + q.getSummaryDuration()
	}
	return uri
}

func (q *PIWebAPIQuery) isRecordedValues() bool {
	return q.RecordedValues.Enable
}

func (q *PIWebAPIQuery) isInterpolated() bool {
	return q.Interpolate.Enable
}

func (q *PIWebAPIQuery) isRegex() bool {
	return q.Regex.Enable
}

func (q *PIWebAPIQuery) isExpression() bool {
	return q.Expression != ""
}

func (q *PIWebAPIQuery) getBasePath() string {
	semiIndex := strings.Index(q.Target, ";")
	return q.Target[:semiIndex]
}

func (q *PIWebAPIQuery) getTargets() []string {
	semiIndex := strings.Index(q.Target, ";")
	return strings.Split(q.Target[semiIndex+1:], ";")
}

func (q *Query) getMaxDataPoints() int {
	maxDataPoints := q.Pi.MaxDataPoints
	if maxDataPoints == 0 {
		maxDataPoints = q.MaxDataPoints
	}
	return maxDataPoints
}

func (q Query) getQueryBaseURL() string {
	// TODO: validate all of the options.
	// Clean up this mess
	// Valid list:
	// - plot
	// - calulcation w/ interval
	// - recorded with no default max count override
	// - recorded with override max count
	// FIXME: Missing functionality
	//    - summary
	//    - regex replacement
	//    - display name updates
	//    - replace bad data

	var uri string
	if q.Pi.isExpression() {
		uri += "/calculation"
		if q.Pi.isSummary() {
			uri += "/summary" + q.getTimeRangeURIComponent()
			if q.Pi.isInterpolated() {
				uri += fmt.Sprintf("&sampleType=Interval&sampleInterval=%dms", q.getIntervalTime())
			}
		} else {
			uri += "/intervals" + q.getTimeRangeURIComponent()
			uri += fmt.Sprintf("&sampleInterval=%dms", q.getIntervalTime())
		}
		uri += "&expression=" + url.QueryEscape(q.Pi.Expression)
	} else {
		uri += "/streamsets"
		if q.Pi.isSummary() {
			uri += "/summary" + q.getTimeRangeURIComponent() + fmt.Sprintf("&intervals=%d", q.getMaxDataPoints())
			uri += q.Pi.getSummaryURIComponent()
		} else if q.Pi.isInterpolated() {
			uri += "/interpolated" + q.getTimeRangeURIComponent() + fmt.Sprintf("&interval=%d", q.getIntervalTime())
		} else if q.Pi.isRecordedValues() {
			uri += "/recorded" + q.getTimeRangeURIComponent() + fmt.Sprintf("&maxCount=%d", q.getMaxDataPoints())
		} else {
			uri += "/plot" + q.getTimeRangeURIComponent() + fmt.Sprintf("&intervals=%d", q.getMaxDataPoints())
		}
	}
	return uri
}

type ErrorResponse struct {
	Errors []string `json:"Errors"`
}

type PIBatchResponse struct {
	Status  int               `json:"Status"`
	Headers map[string]string `json:"Headers"`
	Content PiBatchData       `json:"Content"`
}

type PIBatchResponseBase struct {
	Status  int               `json:"Status"`
	Headers map[string]string `json:"Headers"`
}

type PiBatchData interface {
	getUnits() string
	getItems() *[]PiBatchContentItem
}

type PiBatchDataError struct {
	Error *ErrorResponse
}

func (p PiBatchDataError) getUnits() string {
	return ""
}

func (p PiBatchDataError) getItems() *[]PiBatchContentItem {
	var items []PiBatchContentItem
	return &items
}

// func (p PiBatchDataError) getDataFrame(frameName string, isStreamable bool) (*data.Frame, error) {
// 	frame := data.NewFrame(frameName)
// 	frame.AppendNotices(data.Notice{
// 		Severity: data.NoticeSeverityError,
// 		Text:     p.Error.Errors[0],
// 	})
// 	return frame, fmt.Errorf(p.Error.Errors[0])
// }

type PiBatchDataWithSubItems struct {
	Links map[string]interface{} `json:"Links"`
	Items []struct {
		WebId             string               `json:"WebId"`
		Name              string               `json:"Name"`
		Path              string               `json:"Path"`
		Links             PiBatchContentLinks  `json:"Links"`
		Items             []PiBatchContentItem `json:"Items"`
		UnitsAbbreviation string               `json:"UnitsAbbreviation"`
	} `json:"Items"`
	Error *string
}

func (p PiBatchDataWithSubItems) getUnits() string {
	return p.Items[0].UnitsAbbreviation
}

func (p PiBatchDataWithSubItems) getItems() *[]PiBatchContentItem {
	return &p.Items[0].Items
}

type PiBatchDataWithoutSubItems struct {
	Links             map[string]interface{} `json:"Links"`
	Items             []PiBatchContentItem   `json:"Items"`
	UnitsAbbreviation string                 `json:"UnitsAbbreviation"`
}

func (p PiBatchDataWithoutSubItems) getUnits() string {
	return p.UnitsAbbreviation
}

func (p PiBatchDataWithoutSubItems) getItems() *[]PiBatchContentItem {
	return &p.Items
}

// Custom unmarshaler to unmarshal  PIBatchResponse to the correct struct type.
// If the first item in the Items array has a WebId, then we have a PiBatchDataWithSubItems
// If the first item in the Items array does not have a WebId, then we have a PiBatchDataWithoutSubItems
// All other formations will return an PiBatchDataError
func (p *PIBatchResponse) UnmarshalJSON(data []byte) error {
	var PIBatchResponseBase PIBatchResponseBase
	json.Unmarshal(data, &PIBatchResponseBase)
	p.Status = PIBatchResponseBase.Status
	p.Headers = PIBatchResponseBase.Headers

	// // Unmarshal into a generic map to get the "Items" key
	// // Determine if Items[0].WebId is valid. If it is,
	// // then we have a PiBatchDataWithSubItems
	var rawData map[string]interface{}
	err := json.Unmarshal(data, &rawData)
	if err != nil {
		backend.Logger.Info("Error unmarshalling batch response", err)
		return err
	}

	Content, ok := rawData["Content"].(map[string]interface{})
	if !ok {
		backend.Logger.Error("key 'Content' not found in raw JSON", "rawData", rawData)
		return fmt.Errorf("key 'Content' not found in raw JSON")
	}

	rawContent, _ := json.Marshal(Content)

	if p.Status != http.StatusOK {
		temp_error := &ErrorResponse{}
		err = json.Unmarshal(rawContent, temp_error)
		if err != nil {
			backend.Logger.Error("Error Batch Error Response", "Error", err)
			return err
		}
		p.Content = createPiBatchDataError(&temp_error.Errors)
		return nil
	}

	items, ok := Content["Items"].([]interface{})
	if !ok {
		backend.Logger.Error("key 'Items' not found in 'Content'", "Content", Content)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	item, ok := items[0].(map[string]interface{})
	if !ok {
		backend.Logger.Error("key '0' not found in 'Items'", "Items", items)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	// Check if the response contained a WebId, if the response did contain a WebID
	// then it is a PiBatchDataWithSubItems, otherwise it is a PiBatchDataWithoutSubItems
	_, ok = item["WebId"].(string)

	if !ok {
		ResContent := PiBatchDataWithoutSubItems{}
		err = json.Unmarshal(rawContent, &ResContent)
		if err != nil {
			backend.Logger.Info("Error unmarshalling batch response", err)
			//Return an error Batch Data Response so the user is notified
			errMessages := &[]string{"Could not process response from PI Web API"}
			p.Content = createPiBatchDataError(errMessages)
			return nil
		}
		p.Content = ResContent
		return nil
	}
	ResContent := PiBatchDataWithSubItems{}
	err = json.Unmarshal(rawContent, &ResContent)
	if err != nil {
		backend.Logger.Info("Error unmarshalling batch response", err)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}
	p.Content = ResContent
	return nil
}

func createPiBatchDataError(errorMessage *[]string) *PiBatchDataError {
	errorResponse := &ErrorResponse{Errors: *errorMessage}
	resContent := &PiBatchDataError{Error: errorResponse}
	return resContent
}

type PiBatchContentLinks struct {
	Source string `json:"Source"`
}

type PiBatchContentItems struct {
	WebId             string               `json:"WebId"`
	Name              string               `json:"Name"`
	Path              string               `json:"Path"`
	Links             PiBatchContentLinks  `json:"Links"`
	Items             []PiBatchContentItem `json:"Items"`
	UnitsAbbreviation string               `json:"UnitsAbbreviation"`
}

type PiBatchContentItem struct {
	Timestamp         string      `json:"Timestamp"`
	Value             interface{} `json:"Value"`
	UnitsAbbreviation string      `json:"UnitsAbbreviation"`
	Good              bool        `json:"Good"`
	Questionable      bool        `json:"Questionable"`
	Substituted       bool        `json:"Substituted"`
	Annotated         bool        `json:"Annotated"`
}
