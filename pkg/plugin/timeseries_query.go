package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type BatchSubRequest struct {
	Method     string            `json:"Method"`
	Resource   string            `json:"Resource"`
	ParentIds  []string          `json:"ParentIds"`
	Parameters []string          `json:"Parameters"`
	Headers    map[string]string `json:"Headers"`
}

type BatchSubRequestMap map[string]BatchSubRequest

// processQuery is the main function for processing queries. It takes a query and returns a slice of PiProcessedQuery
// that contains batched queries that are ready to be sent to the PI Web API.
// If there is an error, the error is set in the PiProcessedQuery and the slice is returned, the error propogates through
// the rest of the processing chain such that a dataframe with metadata is returned to the user to provide feedback to the user.
func (d *Datasource) processQuery(query backend.DataQuery, datasourceUID string) []PiProcessedQuery {
	var ProcessedQuery []PiProcessedQuery
	var PiQuery Query

	// Unmarshal the query into a PiQuery struct, and then unmarshal the PiQuery into a PiProcessedQuery
	// if there are errors we'll set the error and return the PiProcessedQuery with an error set.
	tempJson, err := json.Marshal(query)
	if err != nil {
		log.DefaultLogger.Error("Error marshalling query", "error", err)
		piQuery := PiProcessedQuery{
			Error: fmt.Errorf("error while processing the query"),
		}
		ProcessedQuery = append(ProcessedQuery, piQuery)
		return ProcessedQuery
	}

	err = json.Unmarshal(tempJson, &PiQuery)
	if err != nil {
		log.DefaultLogger.Error("Error unmarshalling query", "error", err, "json", string(tempJson))
		piQuery := PiProcessedQuery{
			Error: fmt.Errorf("error while processing the query"),
		}
		ProcessedQuery = append(ProcessedQuery, piQuery)
		return ProcessedQuery
	}

	// Determine if we are using units in the response.
	// The front end doesn't guarantee that the UseUnit field will be set, so we need to check for nils
	var UseUnits = false
	if PiQuery.Pi.UseUnit != nil && PiQuery.Pi.UseUnit.Enable != nil {
		if *PiQuery.Pi.UseUnit.Enable {
			UseUnits = true
		}
	}
	var DigitalStates = false
	if PiQuery.Pi.DigitalStates != nil && PiQuery.Pi.DigitalStates.Enable != nil {
		if *PiQuery.Pi.DigitalStates.Enable {
			DigitalStates = true
		}
	}

	// Upon creating a dashboard the initial query will be empty, so we need to check for that to avoid errors
	// if the query is empty, we'll return a PiProcessedQuery with an error set.
	err = PiQuery.isValidQuery()
	if err != nil {
		piQuery := PiProcessedQuery{
			Error: err,
		}
		ProcessedQuery = append(ProcessedQuery, piQuery)
		return ProcessedQuery
	}

	// At this point we expect that the query is valid, so we can start processing it.
	// the queries are may contain multiple targets, so we need to loop through them
	for i, targetBasePath := range PiQuery.Pi.getTargetBasePaths() {
		for j, attribute := range PiQuery.Pi.Attributes {
			fullTargetPath := targetBasePath + PiQuery.Pi.getTargetPathSeparator() + attribute.Value.Value
			// Create a processed query for the target
			piQuery := PiProcessedQuery{
				Label:               attribute.Value.Value,
				UID:                 datasourceUID,
				IntervalNanoSeconds: PiQuery.Interval,
				IsPIPoint:           PiQuery.Pi.IsPiPoint,
				HideError:           PiQuery.Pi.HideError,
				Streamable:          PiQuery.isStreamable() && *d.dataSourceOptions.UseExperimental && *d.dataSourceOptions.UseStreaming,
				FullTargetPath:      fullTargetPath,
				TargetPath:          targetBasePath,
				UseUnit:             UseUnits,
				DigitalStates:       DigitalStates,
				Display:             PiQuery.Pi.Display,
				Regex:               PiQuery.Pi.Regex,
				Nodata:              PiQuery.Pi.Nodata,
				Summary:             PiQuery.Pi.Summary,
				Variable:            PiQuery.Pi.getVariable(i),
				Index:               (j + 1) + 100*(i+1),
			}

			WebID := d.getCachedWebID(fullTargetPath)

			// initialize maps
			piQuery.BatchRequest = make(map[string]BatchSubRequest)

			var baseUrl = d.settings.URL
			if !strings.HasSuffix(baseUrl, "/") {
				baseUrl = baseUrl + "/"
			}
			dataId := fmt.Sprintf("%s_Req%d_Data", query.RefID, piQuery.Index)
			if WebID != nil && WebID.WebID != "" {
				piQuery.WebID = WebID.WebID
				// DATA FETCH
				batchSubRequest := BatchSubRequest{
					Method:   "GET",
					Resource: baseUrl + PiQuery.getQueryBaseURL() + WebID.WebID,
					Headers: map[string]string{
						"Asset-Path": fullTargetPath,
					},
				}
				piQuery.Resource = batchSubRequest.Resource
				piQuery.BatchRequest[dataId] = batchSubRequest
			} else {
				parentId := fmt.Sprintf("%s_Req%d", query.RefID, piQuery.Index)
				parameter := "$." + parentId + ".Content.WebId"
				// WEBID FETCH
				piQuery.BatchRequest[parentId] = BatchSubRequest{
					Method:   "GET",
					Resource: baseUrl + d.getRequestWebId(fullTargetPath, piQuery.IsPIPoint),
				}
				// DATA FETCH
				batchSubRequest := BatchSubRequest{
					Method:     "GET",
					ParentIds:  []string{parentId},
					Parameters: []string{parameter},
					Resource:   baseUrl + PiQuery.getQueryBaseURL() + "{0}",
				}
				piQuery.Resource = batchSubRequest.Resource
				piQuery.BatchRequest[dataId] = batchSubRequest
			}

			ProcessedQuery = append(ProcessedQuery, piQuery)
		}
	}
	return ProcessedQuery
}

func (d *Datasource) batchRequest(ctx context.Context, PIWebAPIQueries map[string][]PiProcessedQuery) map[string][]PiProcessedQuery {
	batchRequest := make(map[string]BatchSubRequest)
	for _, processedQuery := range PIWebAPIQueries {
		// create a map of the batch requests. This allows us to map the response back to the original query
		for _, piQuery := range processedQuery {
			if piQuery.Error != nil {
				continue
			}
			for key, request := range piQuery.BatchRequest {
				batchRequest[key] = request
			}
		}
	}

	// request the data from the PI Web API
	batchRequestResponse, err := apiBatchRequest(ctx, d, batchRequest)

	// process response
	if err != nil {
		// d.datasourceMutex.Lock()
		for RefID, processedQuery := range PIWebAPIQueries {
			backend.Logger.Error("Error in batch request", "RefID", RefID, "error", err)
			for i := range processedQuery {
				PIWebAPIQueries[RefID][i].Error = fmt.Errorf("error during query: %s", err.Error())
			}
		}
		// d.datasourceMutex.Unlock()
		return PIWebAPIQueries
	}

	tempresponse := make(map[string]PIBatchResponse)
	err = json.Unmarshal(batchRequestResponse, &tempresponse)
	if err != nil {
		// d.datasourceMutex.Lock()
		for RefID, processedQuery := range PIWebAPIQueries {
			backend.Logger.Error("Error in Unmarshal", "RefID", RefID, "error", err, "tempresponse", tempresponse)
			for i := range processedQuery {
				PIWebAPIQueries[RefID][i].Error = fmt.Errorf("error during query. bad response format")
			}
		}
		// d.datasourceMutex.Unlock()
		return PIWebAPIQueries
	}

	// d.datasourceMutex.Lock()
	for RefID, processedQuery := range PIWebAPIQueries {
		// map the response back to the original query
		for i, query := range processedQuery {
			// WEBID
			var key = fmt.Sprintf("%s_Req%d", RefID, query.Index)
			WebIdData, ok := tempresponse[key]
			if ok {
				if WebIdData.Status == http.StatusOK {
					PIWebAPIQueries[RefID][i].WebID = d.saveWebID(WebIdData.Content, query.FullTargetPath, query.IsPIPoint)
				} else {
					backend.Logger.Error("Batch request bad", "Content", WebIdData.Content)
					jWebIdData, err := json.Marshal(WebIdData.Content)
					if err != nil {
						PIWebAPIQueries[RefID][i].Error = err
						continue
					}
					var errorResponse PiBatchDataError
					err = json.Unmarshal(jWebIdData, &errorResponse)
					if err != nil {
						PIWebAPIQueries[RefID][i].Error = err
						continue
					}
					if errorResponse.Error != nil && len(errorResponse.Error.Errors) > 0 {
						PIWebAPIQueries[RefID][i].Error = fmt.Errorf("api error %d - %s", WebIdData.Status, errorResponse.Error.Errors[0])
					} else {
						PIWebAPIQueries[RefID][i].Error = fmt.Errorf("unknown api error")
					}
					continue
				}
			}
			// DATA
			key = fmt.Sprintf("%s_Req%d_Data", RefID, query.Index)
			ResponseData, ok := tempresponse[key]
			if ok {
				if ResponseData.Status == http.StatusOK {
					PIWebAPIQueries[RefID][i].Response = ResponseData.Content.(PiBatchData)
				} else {
					backend.Logger.Error("Batch request bad", "Content", ResponseData.Content)
					jResponseData, err := json.Marshal(ResponseData.Content)
					if err != nil {
						PIWebAPIQueries[RefID][i].Error = err
						continue
					}
					var errorResponse PiBatchDataError
					err = json.Unmarshal(jResponseData, &errorResponse)
					if err != nil {
						PIWebAPIQueries[RefID][i].Error = err
						continue
					}
					if errorResponse.Error != nil && len(errorResponse.Error.Errors) > 0 {
						PIWebAPIQueries[RefID][i].Error = fmt.Errorf("api error %d - %s", WebIdData.Status, errorResponse.Error.Errors[0])
					} else {
						PIWebAPIQueries[RefID][i].Error = fmt.Errorf("unknown api error")
					}
				}
			} else {
				PIWebAPIQueries[RefID][i].Error = fmt.Errorf("error finding key %s in response", key)
			}
		}
	}
	// d.datasourceMutex.Unlock()

	return PIWebAPIQueries
}

func (d *Datasource) processBatchtoFrames(processedQuery map[string][]PiProcessedQuery) *backend.QueryDataResponse {
	response := backend.NewQueryDataResponse()

	for RefID, query := range processedQuery {
		var subResponse backend.DataResponse
		for _, q := range query {
			// if there is an error in the query, we set the error in the subresponse and break out of the loop returning the error.
			if q.Error != nil {
				backend.Logger.Error("Error processing query", "RefID", RefID, "query", q, "hide", q.HideError)
				if !q.HideError && strings.Contains(q.Error.Error(), "api error") {
					subResponse.Error = q.Error
				}
				break
			}

			for _, SummaryType := range *q.Response.getSummaryTypes() {
				frame, err := convertItemsToDataFrame(&q, d, SummaryType)

				// if there is an error on a single frame we set metadata and continue to the next frame
				if err != nil {
					backend.Logger.Error("Error processing convertItemsToDataFrame", "RefID", RefID, "query", q)
					subResponse.Error = q.Error
					continue
				}

				frame.RefID = RefID
				frame.Meta.ExecutedQueryString = strings.ReplaceAll(q.Resource, "{0}", q.WebID)

				// TODO: enable streaming
				// If the query is streamable, then we need to set the channel URI
				// and the executed query string.
				if q.Streamable {
					// Create a new channel for this frame request.
					// Creating a new channel for each frame request is not ideal,
					// but it is the only way to ensure that the frame data is refreshed
					// on a time interval update.
					channeluuid := uuid.New()
					channelURI := "ds/" + q.UID + "/" + channeluuid.String()
					channel := StreamChannelConstruct{
						WebID:               q.WebID,
						IntervalNanoSeconds: q.IntervalNanoSeconds,
						tagLabel:            q.Label,
						query:               &q,
					}
					d.channelConstruct[channeluuid.String()] = channel
					frame.Meta.Channel = channelURI
				}

				subResponse.Frames = append(subResponse.Frames, frame)
			}
		}
		response.Responses[RefID] = subResponse
	}
	return response
}

func (q *PIWebAPIQuery) isSummary() bool {
	if q.Summary == nil {
		return false
	}
	if q.Summary.Enable == nil {
		return false
	}
	return *q.Summary.Enable && *q.Summary.Basis != "" && len(*q.Summary.Types) > 0
}

// PiProcessedQuery isRegex returns true if the query is a regex query and is enabled
func (q *PiProcessedQuery) isRegex() bool {
	if q.Regex == nil {
		return false
	}
	if q.Regex.Enable == nil {
		return false
	}
	return *q.Regex.Enable
}

// PiProcessedQuery isRegexValid returns true if the regex query is valid and enabled
func (q *PiProcessedQuery) isRegexQuery() bool {
	if !q.isRegex() {
		return false
	}
	if q.Regex.Replace == nil {
		return false
	}
	if q.Regex.Search == nil {
		return false
	}
	if len(*q.Regex.Replace) == 0 {
		return false
	}
	if len(*q.Regex.Search) == 0 {
		return false
	}
	return true
}

// getSummaryDuration returns the summary duration in the format piwebapi expects
// The summary duration is provided by the frontend in the format: <number><short_name>
// The short name can be one of the following: ms, s, m, h, d, mo, w, wd, yd
// A default of 30s is returned if the summary duration is not provided by the frontend
// or if the format is invalid
func (q *PIWebAPIQuery) getSummaryDuration() string {
	backend.Logger.Debug("Summary duration", "summary", q.Summary)
	// Return the default value if the summary is not provided by the frontend
	if q.Summary == nil || q.Summary.Duration == nil || *q.Summary.Duration == "" {
		return "30s"
	}
	return _getDurationBase(*q.Summary.Duration)
}

func (q *PIWebAPIQuery) getSampleInterval() string {
	// Return the default value if the summary is not provided by the frontend
	if q.Summary == nil || q.Summary.SampleInterval == nil || *q.Summary.SampleInterval == "" {
		return "30s"
	}
	return _getDurationBase(*q.Summary.SampleInterval)
}

func _getDurationBase(duration string) string {
	// If the summary duration is provided, then validate the format piwebapi expects
	// Regular expression to match the format: <number><short_name>
	pattern := `^(\d+(\.\d+)?)\s*(ms|s|m|h|d|mo|w|wd|yd)$`
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(duration)

	if len(matches) != 4 {
		return "30s" // Return the default value if the format is invalid
	}

	// Extract the numeric part and the short name from the interval
	numericPartStr := matches[1]
	shortName := matches[3]

	// Convert the numeric part to a float64
	numericPart, err := strconv.ParseFloat(numericPartStr, 64)
	if err != nil {
		return "30s" // Return the default value if conversion fails
	}

	// Check if the short name is valid and whether fractions are allowed for that time unit
	switch shortName {
	case "ms", "s", "m", "h":
		// Fractions allowed for millisecond, second, minute, and hour
		return duration
	case "d", "mo", "w", "wd", "yd":
		// No fractions allowed for day, month, week, weekday, yearday
		if numericPart == float64(int64(numericPart)) {
			return duration
		}
	default:
		return "30s" // Return the default value if the short name or fractions are not allowed
	}

	return "30s" // Return the default value if the short name or fractions are not allowed
}

func (q *PIWebAPIQuery) getSummaryURIComponent() string {
	uri := ""
	for _, t := range *q.Summary.Types {
		uri += "&summaryType=" + t.Value.Value
	}
	uri += "&summaryBasis=" + *q.Summary.Basis
	if q.Summary.Duration != nil && *q.Summary.Duration != "" {
		uri += "&summaryDuration=" + q.getSummaryDuration()
	}
	if q.Summary.SampleTypeInterval != nil && *q.Summary.SampleTypeInterval &&
		q.Summary.SampleInterval != nil && *q.Summary.SampleInterval != "" {
		uri += "&sampleType=Interval&sampleInterval=" + q.getSampleInterval()
	}
	return uri
}

func (q *PIWebAPIQuery) isRecordedValues() bool {
	if q.RecordedValues == nil {
		return false
	}
	if q.RecordedValues.Enable == nil {
		return false
	}
	return *q.RecordedValues.Enable
}

func (q *PIWebAPIQuery) isInterpolated() bool {
	return q.Interpolate.Enable
}

func (q *PIWebAPIQuery) isExpression() bool {
	return q.Expression != ""
}

func (q *PIWebAPIQuery) getBasePath() string {
	if q.Target == nil {
		return ""
	}
	semiIndex := strings.Index(*q.Target, ";")
	if semiIndex == -1 {
		return *q.Target
	}
	return (*q.Target)[:semiIndex]
}

func (q *PIWebAPIQuery) getTargetBasePaths() []string {
	if q.Target == nil {
		return []string{}
	}
	basePath := q.getBasePath()

	// Find and process a pattern like {<variable1>,< variable2>,..., <variable20>}
	startIndex := strings.Index(basePath, "{")
	endIndex := strings.Index(basePath, "}")

	if startIndex != -1 && endIndex != -1 && startIndex < endIndex {
		globalPrefix := basePath[:startIndex]
		globalSuffix := basePath[endIndex+1:]
		suffixes := basePath[startIndex+1 : endIndex]
		suffixList := strings.Split(suffixes, ",")

		basePaths := make([]string, 0, len(suffixList))
		for _, suffix := range suffixList {
			basePaths = append(basePaths, globalPrefix+strings.TrimSpace(suffix)+globalSuffix)
		}
		return basePaths
	}

	// If no pattern was found, return the base path as the only item in the slice
	return []string{basePath}
}

func (q *PIWebAPIQuery) getVariable(index int) string {
	basePath := q.getBasePath()

	// Find and process a pattern like {<variable1>,< variable2>,..., <variable20>}
	startIndex := strings.Index(basePath, "{")
	endIndex := strings.Index(basePath, "}")

	if startIndex != -1 && endIndex != -1 && startIndex < endIndex {
		suffixes := basePath[startIndex+1 : endIndex]
		suffixList := strings.Split(suffixes, ",")
		if index < len(suffixList) {
			return suffixList[index]
		}
	}
	return ""
}

// func (q *PIWebAPIQuery) getfullTargetPath(target string) string {
// 	fullTargetPath := q.getBasePath()
// 	if q.IsPiPoint {
// 		fullTargetPath += `\` + target
// 	} else {
// 		fullTargetPath += "|" + target
// 	}
// 	return fullTargetPath
// }

func (q *PIWebAPIQuery) getTargetPathSeparator() string {
	if q.IsPiPoint {
		return `\`
	}
	return "|"
}

// func (q *PIWebAPIQuery) getTargets() []string {
// 	if q.Target == nil {
// 		return nil
// 	}

// 	semiIndex := strings.Index(*q.Target, ";")
// 	if semiIndex == -1 || semiIndex == len(*q.Target)-1 {
// 		return nil
// 	}
// 	return strings.Split((*q.Target)[semiIndex+1:], ";")
// }

func (q *PIWebAPIQuery) checkNilSegments() bool {
	return q.Target == nil
}

func (q *PIWebAPIQuery) checkValidTargets() bool {
	if q.Target == nil {
		return false
	}

	// check if the target provided is just a semicolon
	if strings.Compare(*q.Target, ";") == 0 {
		return false
	}
	// check if the target provided ends with a semicolon
	if q.Target == nil || strings.HasSuffix(*q.Target, ";") {
		return false
	}

	return true
}

func (q *PIWebAPIQuery) isUseLastValue() bool {
	if q.UseLastValue == nil {
		return false
	}
	if q.UseLastValue.Enable == nil {
		return false
	}
	return *q.UseLastValue.Enable
}

func (q *Query) getMaxDataPoints() int {
	if q.Pi.RecordedValues.MaxNumber != nil {
		return *q.Pi.RecordedValues.MaxNumber
	}
	return q.MaxDataPoints
}

func (q *Query) getBoundaryType() string {
	if q.Pi.RecordedValues.BoundaryType != nil {
		return *q.Pi.RecordedValues.BoundaryType
	}
	return "Inside"
}

func (q Query) getQueryBaseURL() string {
	var uri string
	if q.Pi.isExpression() {
		uri += "calculation"
		if q.Pi.isUseLastValue() {
			uri += "/times?time=" + q.getTimeRangeURIToComponent()
		} else {
			if q.Pi.isSummary() {
				uri += "/summary" + q.getTimeRangeURIComponent() + q.Pi.getSummaryURIComponent()
			} else if q.Pi.isInterpolated() {
				uri += "/intervals" + q.getTimeRangeURIComponent()
				uri += fmt.Sprintf("&sampleInterval=%s", q.getIntervalTime())
			} else if q.Pi.isRecordedValues() {
				uri += "/recorded" + q.getTimeRangeURIComponent()
			} else {
				// uri += "/times?" + q.getWindowedTimeStampURI()
				uri += "/recorded" + q.getTimeRangeURIComponent()
			}
		}
		uri += "&expression=" + q.Pi.Expression + "&webId="
	} else {
		uri += "streamsets"
		if q.Pi.isUseLastValue() {
			if q.Pi.isRecordedValues() {
				uri += "/end?webId="
			} else {
				uri += "/value?time=" + q.getTimeRangeURIToComponent() + "&webId="
			}
		} else {
			if q.Pi.isSummary() {
				uri += "/summary" + q.getTimeRangeURIComponent() + q.Pi.getSummaryURIComponent()
			} else if q.Pi.isInterpolated() {
				uri += "/interpolated" + q.getTimeRangeURIComponent() + fmt.Sprintf("&interval=%s", q.getIntervalTime())
			} else if q.Pi.isRecordedValues() {
				uri += "/recorded" + q.getTimeRangeURIComponent() + fmt.Sprintf("&maxCount=%d", q.getMaxDataPoints()) + "&boundaryType=" + q.getBoundaryType()
			} else {
				uri += "/plot" + q.getTimeRangeURIComponent() + fmt.Sprintf("&intervals=%d", q.getMaxDataPoints())
			}
			uri += "&webId="
		}
	}
	backend.Logger.Debug("Base url", "uri", uri)
	return uri
}
