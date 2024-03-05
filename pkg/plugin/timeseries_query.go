package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/google/uuid"
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
	backend.Logger.Info("Processing Query", "Target", PiQuery.Pi.Target)

	for _, targetBasePath := range PiQuery.Pi.getTargetBasePaths() {
		backend.Logger.Info("Processing Query", "targetBasePath", targetBasePath)
		for _, target := range PiQuery.Pi.getTargets() {
			fullTargetPath := targetBasePath + PiQuery.Pi.getTargetPathSeparator() + target
			//create a processed query for the target
			piQuery := PiProcessedQuery{
				Label:               target,
				UID:                 datasourceUID,
				IntervalNanoSeconds: PiQuery.Interval,
				IsPIPoint:           PiQuery.Pi.IsPiPoint,
				Streamable:          PiQuery.isStreamable() && *d.dataSourceOptions.UseExperimental && *d.dataSourceOptions.UseStreaming,
				FullTargetPath:      fullTargetPath,
				UseUnit:             UseUnits,
				DigitalStates:       DigitalStates,
				Regex:               PiQuery.Pi.Regex,
			}

			// Get the WebID for the target
			WebID, err := d.getWebID(ctx, fullTargetPath, PiQuery.Pi.IsPiPoint)
			// If there is an error getting the WebID, set the error and move to next target
			if err != nil {
				log.DefaultLogger.Error("Error getting WebID", "error", err)
				piQuery.Error = err
				ProcessedQuery = append(ProcessedQuery, piQuery)
				continue
			}

			piQuery.WebID = WebID.WebID

			//Create the subrequest for the overall batch request
			batchSubRequest := BatchSubRequest{
				Method:   "GET",
				Resource: d.settings.URL + PiQuery.getQueryBaseURL() + "&webid=" + WebID.WebID,
			}

			backend.Logger.Info("Processing Query", "batchSubRequest", batchSubRequest)

			piQuery.BatchRequest = batchSubRequest

			ProcessedQuery = append(ProcessedQuery, piQuery)
		}
	}
	return ProcessedQuery
}

func (d Datasource) batchRequest(ctx context.Context, PIWebAPIQueries map[string][]PiProcessedQuery) map[string][]PiProcessedQuery {
	for RefID, processed := range PIWebAPIQueries {
		batchRequest := make(map[string]BatchSubRequest)
		backend.Logger.Info("Processing batch request", "RefID", RefID, "batchRequest", batchRequest)

		// create a map of the batch requests. This allows us to map the response back to the original query
		for i, p := range processed {
			if p.Error != nil {
				continue
			}
			batchRequest[fmt.Sprint(i)] = p.BatchRequest
		}

		// request the data from the PI Web API
		r, err := d.apiBatchRequest(ctx, batchRequest)

		// if we get an error back from the PI Web API, we set the error in the PiProcessedQuery and break out of the loop
		if err != nil {
			log.DefaultLogger.Error("Error in batch request", "RefID", RefID, "error", err)
			for i := range processed {
				PIWebAPIQueries[RefID][i].Error = err
			}
			continue
		}

		tempresponse := make(map[int]PIBatchResponse)
		err = json.Unmarshal(r, &tempresponse)
		if err != nil {
			// This likely means that the PI Web API returned an error,
			// so we'll set the error in the PiProcessedQuery and break out of the loop
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

			for _, SummaryType := range *q.Response.getSummaryTypes() {
				frameName := getDataLabel(d.isUsingNewFormat(), &q, d.getPointTypeForWebID(q.WebID), SummaryType)
				frame, err := convertItemsToDataFrame(frameName, *q.Response.getItems(SummaryType), &d, q.WebID, q.UseUnit, q.DigitalStates)

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
						tagLabel:            frame.Name,
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
	if q.Summary.Types == nil {
		return false
	}
	return *q.Summary.Basis != "" && len(*q.Summary.Types) > 0
}

func getDataLabel(useNewFormat bool, q *PiProcessedQuery, pointType string, summaryLabel string) map[string]string {
	var frameLabel map[string]string
	summaryNewFormat := ""

	if summaryLabel != "" {
		summaryNewFormat = "\" summaryType=\"" + summaryLabel
		summaryLabel = "[" + summaryLabel + "]"
	}

	if useNewFormat {
		if q.IsPIPoint {
			// New format returns the full path with metadata
			// PiPoint {element="PISERVER", name="Attribute", type="Float32"}
			targetParts := strings.Split(q.FullTargetPath, `\`)
			frameLabel = map[string]string{
				"element": targetParts[0],
				"name":    targetParts[len(targetParts)-1],
				"type":    pointType + summaryNewFormat,
			}
		} else {
			// New format returns the full path with metadata
			// Element|Attribute {element="Element", name="Attribute", type="Single"}
			targetParts := strings.Split(q.FullTargetPath, `\`)
			labelParts := strings.SplitN(targetParts[len(targetParts)-1], "|", 2)
			frameLabel = map[string]string{
				"element": labelParts[0],
				"name":    labelParts[1],
				"type":    pointType + summaryNewFormat,
			}
		}

	} else {
		// Old format returns just the tag/attribute name
		frameLabel = map[string]string{
			"name": q.Label + summaryLabel,
		}
	}

	// Use ReplaceAllString to replace all instances of the search pattern with the replacement string
	// FIXME: This is working, but graph panels seem to not render the trend.
	if q.isRegexQuery() {
		backend.Logger.Info("Replacing string", "search", *q.Regex.Search, "replace", *q.Regex.Replace)
		regex := regexp.MustCompile(*q.Regex.Search)
		frameLabel["name"] = regex.ReplaceAllString(frameLabel["name"], *q.Regex.Replace)
	}
	return frameLabel
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
	// Return the default value if the summary is not provided by the frontend
	if q.Summary == nil || *q.Summary.Interval == "" {
		return "30s"
	}

	// If the summary duration is provided, then validate the format piwebapi expects

	// Regular expression to match the format: <number><short_name>
	pattern := `^(\d+(\.\d+)?)\s*(ms|s|m|h|d|mo|w|wd|yd)$`
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(*q.Summary.Interval)

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
		return *q.Summary.Interval
	case "d", "mo", "w", "wd", "yd":
		// No fractions allowed for day, month, week, weekday, yearday
		if numericPart == float64(int64(numericPart)) {
			return *q.Summary.Interval
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
	uri += "&summaryDuration=" + q.getSummaryDuration()
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

	semiIndex := strings.Index(*q.Target, ";")
	basePath := ""
	if semiIndex == -1 {
		basePath = *q.Target
	} else {
		basePath = (*q.Target)[:semiIndex]
	}

	// Find and process a pattern like {<variable1>,< variable2>,..., <variable20>}
	startIndex := strings.Index(basePath, "{")
	endIndex := strings.Index(basePath, "}")

	if startIndex != -1 && endIndex != -1 && startIndex < endIndex {
		prefix := basePath[:startIndex]
		suffixes := basePath[startIndex+1 : endIndex]
		suffixList := strings.Split(suffixes, ",")

		basePaths := make([]string, 0, len(suffixList))
		for _, suffix := range suffixList {
			basePaths = append(basePaths, prefix+strings.TrimSpace(suffix))
		}
		return basePaths
	}

	// If no pattern was found, return the base path as the only item in the slice
	return []string{basePath}
}

func (q *PIWebAPIQuery) getfullTargetPath(target string) string {
	fullTargetPath := q.getBasePath()
	if q.IsPiPoint {
		fullTargetPath += `\` + target
	} else {
		fullTargetPath += "|" + target
	}
	return fullTargetPath
}

func (q *PIWebAPIQuery) getTargetPathSeparator() string {
	if q.IsPiPoint {
		return `\`
	}
	return "|"
}

func (q *PIWebAPIQuery) getTargets() []string {
	if q.Target == nil {
		return nil
	}

	semiIndex := strings.Index(*q.Target, ";")
	if semiIndex == -1 || semiIndex == len(*q.Target)-1 {
		return nil
	}
	return strings.Split((*q.Target)[semiIndex+1:], ";")
}

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

func (q Query) getQueryBaseURL() string {
	var uri string
	if q.Pi.isExpression() {
		uri += "/calculation"
		if q.Pi.isUseLastValue() {
			uri += "/times?time=" + q.getTimeRangeURIToComponent()
		} else {
			if q.Pi.isSummary() {
				uri += "/summary" + q.getTimeRangeURIComponent()
				if q.Pi.isInterpolated() {
					uri += fmt.Sprintf("&sampleType=Interval&sampleInterval=%s", q.getIntervalTime())
				}
			} else if q.Pi.isInterpolated() {
				uri += "/intervals" + q.getTimeRangeURIComponent()
				uri += fmt.Sprintf("&sampleInterval=%s", q.getIntervalTime())
			} else if q.Pi.isRecordedValues() {
				uri += "/recorded" + q.getTimeRangeURIComponent()
			} else {
				uri += "/times?" + q.getWindowedTimeStampURI()
			}
		}
		uri += "&expression=" + url.QueryEscape(q.Pi.Expression)
	} else {
		uri += "/streamsets"
		if q.Pi.isUseLastValue() {
			uri += "/value?time=" + q.getTimeRangeURIToComponent()
		} else {
			if q.Pi.isSummary() {
				uri += "/summary" + q.getTimeRangeURIComponent() + fmt.Sprintf("&intervals=%d", q.getMaxDataPoints())
				uri += q.Pi.getSummaryURIComponent()
			} else if q.Pi.isInterpolated() {
				uri += "/interpolated" + q.getTimeRangeURIComponent() + fmt.Sprintf("&interval=%s", q.getIntervalTime())
			} else if q.Pi.isRecordedValues() {
				uri += "/recorded" + q.getTimeRangeURIComponent() + fmt.Sprintf("&maxCount=%d", q.getMaxDataPoints())
			} else {
				uri += "/plot" + q.getTimeRangeURIComponent() + fmt.Sprintf("&intervals=%d", q.getMaxDataPoints())
			}
		}
	}
	return uri
}
