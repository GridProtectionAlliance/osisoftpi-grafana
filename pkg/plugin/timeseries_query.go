package plugin

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

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
// A query that cannot be processed gets a PiProcessedQuery with its RefID and the error, which is reported on
// that query's response; the other queries are processed normally.
func (d *Datasource) processQuery(allQueries []backend.DataQuery, datasourceUID string) []PiProcessedQuery {
	var ProcessedQuery []PiProcessedQuery

	index := 0
	for _, query := range allQueries {
		var PiQuery Query

		// Unmarshal the query into a PiQuery struct, and then unmarshal the PiQuery into a PiProcessedQuery
		// if there are errors we'll set the error and return the PiProcessedQuery with an error set.
		invalid := func(err error) {
			ProcessedQuery = append(ProcessedQuery, PiProcessedQuery{RefID: query.RefID, Error: err, Status: http.StatusBadRequest})
		}
		tempJson, err := json.Marshal(query)
		if err != nil {
			log.DefaultLogger.Error("Process query - Error marshalling", "error", err)
			invalid(fmt.Errorf("error while processing the query"))
			continue
		}

		err = json.Unmarshal(tempJson, &PiQuery)
		if err != nil {
			log.DefaultLogger.Error("Process query - Error unmarshalling", "error", err, "json", string(tempJson))
			invalid(fmt.Errorf("error while processing the query: %w", err))
			continue
		}

		PiQuery.Pi.migrate()

		// Determine if we are using units in the response.
		// The front end doesn't guarantee that the UseUnit field will be set, so we need to check for nils
		var UseUnit = false
		if PiQuery.Pi.UseUnit != nil && PiQuery.Pi.UseUnit.Enable != nil {
			if *PiQuery.Pi.UseUnit.Enable {
				UseUnit = true
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
			invalid(err)
			continue
		}

		// At this point we expect that the query is valid, so we can start processing it.
		// Multi-value template variables in the element path and in the attributes are expanded
		// into every element/attribute combination.
		targets, err := PiQuery.Pi.getExpandedTargets()
		if err != nil {
			log.DefaultLogger.Warn("Process query - Error expanding template variables", "RefID", PiQuery.RefID, "error", err)
			invalid(err)
			continue
		}

		baseUrl := d.settings.URL
		if !strings.HasSuffix(baseUrl, "/") {
			baseUrl += "/"
		}
		queryBaseURL := baseUrl + PiQuery.getQueryBaseURL()
		streamable := PiQuery.isStreamable() && d.isUsingStreaming()
		endTime := PiQuery.TimeRange.To.Truncate(time.Second)
		separator := PiQuery.Pi.getTargetPathSeparator()

		for _, target := range targets {
			targetBasePath := target.BasePath
			fullTargetPath := targetBasePath + separator + target.Attribute
			// Index is unique within the request and is used to build the batch request keys
			index++
			// Create a processed query for the target
			piQuery := PiProcessedQuery{
				RefID:          PiQuery.RefID,
				Label:          target.Attribute,
				UID:            datasourceUID,
				IsPIPoint:      PiQuery.Pi.IsPiPoint,
				HideError:      PiQuery.Pi.HideError,
				Streamable:     streamable,
				FullTargetPath: fullTargetPath,
				TargetPath:     targetBasePath,
				UseUnit:        UseUnit,
				DigitalStates:  DigitalStates,
				Display:        target.resolveDisplay(PiQuery.Pi.Display),
				Regex:          PiQuery.Pi.Regex,
				Nodata:         PiQuery.Pi.Nodata,
				HashCode:       PiQuery.Pi.HashCode + "_" + fullTargetPath,
				EndTime:        endTime,
				Variable:       target.Variable,
				MultiVariable:  target.MultiVariable,
				Index:          index,
				PluginVersion:  PiQuery.Pi.PluginVersion,
				StreamFillGaps: PiQuery.isStreamFillGaps(),
				MaxDataPoints:  PiQuery.getMaxDataPoints(),
			}

			WebID := d.getCachedWebID(fullTargetPath)

			// initialize maps
			piQuery.BatchRequest = make(map[string]BatchSubRequest)

			dataId := piQuery.dataRequestKey()
			if WebID != nil && WebID.WebID != "" {
				piQuery.WebID = WebID.WebID
				// DATA FETCH
				batchSubRequest := BatchSubRequest{
					Method:   "GET",
					Resource: queryBaseURL + WebID.WebID,
					Headers: map[string]string{
						"Asset-Path": fullTargetPath,
					},
				}
				piQuery.Resource = batchSubRequest.Resource
				piQuery.BatchRequest[dataId] = batchSubRequest
			} else {
				parentId := piQuery.webIDRequestKey()
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
					Resource:   queryBaseURL + "{0}",
				}
				piQuery.Resource = batchSubRequest.Resource
				piQuery.BatchRequest[dataId] = batchSubRequest
			}

			ProcessedQuery = append(ProcessedQuery, piQuery)
		}
	}

	return ProcessedQuery
}

// batchRequest sends the processed queries to the PI Web API and groups them by RefID. Queries that already have
// an error (they could not be processed) are not sent, and are returned with their error.
func (d *Datasource) batchRequest(ctx context.Context, PIWebAPIQueriesAll []PiProcessedQuery) map[string][]PiProcessedQuery {
	valid := make([]PiProcessedQuery, 0, len(PIWebAPIQueriesAll))
	var invalid []PiProcessedQuery
	for _, piQuery := range PIWebAPIQueriesAll {
		if piQuery.Error != nil {
			invalid = append(invalid, piQuery)
		} else {
			valid = append(valid, piQuery)
		}
	}
	PIWebAPIQueries := d.sendBatch(ctx, valid)
	for _, piQuery := range invalid {
		PIWebAPIQueries[piQuery.RefID] = append(PIWebAPIQueries[piQuery.RefID], piQuery)
	}
	return PIWebAPIQueries
}

func (d *Datasource) sendBatch(ctx context.Context, PIWebAPIQueriesAll []PiProcessedQuery) map[string][]PiProcessedQuery {
	batchRequest := make(map[string]BatchSubRequest)
	PIWebAPIQueries := make(map[string][]PiProcessedQuery)
	// create a map of the batch requests. This allows us to map the response back to the original query
	for _, piQuery := range PIWebAPIQueriesAll {
		for key, request := range piQuery.BatchRequest {
			batchRequest[key] = request
		}
		piQuery.Cached = false
		PIWebAPIQueries[piQuery.RefID] = append(PIWebAPIQueries[piQuery.RefID], piQuery)
	}

	if len(batchRequest) == 0 {
		return PIWebAPIQueries
	}

	// request the data from the PI Web API
	batchRequestResponse, err := apiBatchRequest(ctx, d, batchRequest)

	// process response
	if err != nil {
		for RefID, processedQuery := range PIWebAPIQueries {
			backend.Logger.Error("Batch request", "RefID", RefID, "error", err)
			for i, query := range processedQuery {
				if data, found := d.webCache.Get(query.HashCode); d.isUsingResponseCache() && found {
					log.DefaultLogger.Debug("Batch request - Cache get operation", "RefID", RefID, "index", query.Index)
					PIWebAPIQueries[RefID][i].Response = data
					PIWebAPIQueries[RefID][i].Status = http.StatusOK
					PIWebAPIQueries[RefID][i].Cached = true
				} else {
					PIWebAPIQueries[RefID][i].Error = fmt.Errorf("error during query: %s", err.Error())
					PIWebAPIQueries[RefID][i].Status = http.StatusBadGateway
				}
			}
		}
		return PIWebAPIQueries
	}

	tempresponse := make(map[string]PIBatchResponse)
	err = json.Unmarshal(batchRequestResponse, &tempresponse)
	if err != nil {
		for RefID, processedQuery := range PIWebAPIQueries {
			backend.Logger.Error("Batch request - Unmarshal", "RefID", RefID, "error", err, "tempresponse", tempresponse)
			for i := range processedQuery {
				PIWebAPIQueries[RefID][i].Error = fmt.Errorf("error during query. bad response format")
				PIWebAPIQueries[RefID][i].Status = http.StatusInternalServerError
			}
		}
		return PIWebAPIQueries
	}

	for RefID, processedQuery := range PIWebAPIQueries {
		// map the response back to the original query
		for i, query := range processedQuery {
			// WEBID
			var key = query.webIDRequestKey()
			WebIdData, ok := tempresponse[key]
			if ok {
				if WebIdData.Status == http.StatusOK {
					PIWebAPIQueries[RefID][i].WebID = d.saveWebID(WebIdData.Content, query.FullTargetPath, query.IsPIPoint)
				} else {
					backend.Logger.Debug("Batch request - WebID lookup failed", "RefID", RefID, "target", query.FullTargetPath,
						"status", WebIdData.Status, "content", WebIdData.Content)
					PIWebAPIQueries[RefID][i].Status = WebIdData.Status
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
			key = query.dataRequestKey()
			ResponseData, ok := tempresponse[key]
			if ok {
				if ResponseData.Status == http.StatusOK {
					PIWebAPIQueries[RefID][i].Response = ResponseData.Content.(PiBatchData)
					PIWebAPIQueries[RefID][i].Status = ResponseData.Status
					if d.isUsingResponseCache() {
						log.DefaultLogger.Debug("Batch request - Cache set", "RefID", RefID, "index", query.Index)
						d.webCache.Set(query.HashCode, PIWebAPIQueries[RefID][i].Response)
					}
				} else if data, found := d.webCache.Get(query.HashCode); d.isUsingResponseCache() && found {
					log.DefaultLogger.Debug("Batch request - Cache get", "RefID", RefID, "index", query.Index)
					PIWebAPIQueries[RefID][i].Response = data
					PIWebAPIQueries[RefID][i].Status = http.StatusOK
					PIWebAPIQueries[RefID][i].Cached = true
				} else {
					backend.Logger.Debug("Batch request - data request failed", "RefID", RefID, "target", query.FullTargetPath,
						"status", ResponseData.Status, "content", ResponseData.Content)
					d.webCache.Remove(query.HashCode)
					PIWebAPIQueries[RefID][i].Status = ResponseData.Status
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
						PIWebAPIQueries[RefID][i].Error = fmt.Errorf("api error %d - %s", ResponseData.Status, errorResponse.Error.Errors[0])
					} else {
						PIWebAPIQueries[RefID][i].Error = fmt.Errorf("unknown api error")
					}
				}
			} else if data, found := d.webCache.Get(query.HashCode); d.isUsingResponseCache() && found {
				log.DefaultLogger.Debug("Batch request - Cache get", "RefID", RefID, "index", query.Index)
				PIWebAPIQueries[RefID][i].Response = data
				PIWebAPIQueries[RefID][i].Status = http.StatusOK
				PIWebAPIQueries[RefID][i].Cached = true
			} else {
				d.webCache.Remove(query.HashCode)
				PIWebAPIQueries[RefID][i].Error = fmt.Errorf("error finding key %s in response", key)
				PIWebAPIQueries[RefID][i].Status = http.StatusInternalServerError
			}
		}
	}

	return PIWebAPIQueries
}

// webIDRequestKey is the key of the batch request that looks up the target's WebID, and dataRequestKey the key of
// the request of its data. They are built from Index only, which is unique within the batch: the RefID is any text
// the user typed, and in the JSONPath that passes the WebID to the data request, dots, brackets, quotes or spaces
// are read as JSONPath syntax.
func (q *PiProcessedQuery) webIDRequestKey() string {
	return fmt.Sprintf("Req%d", q.Index)
}

func (q *PiProcessedQuery) dataRequestKey() string {
	return fmt.Sprintf("Req%d_Data", q.Index)
}

// logFields returns the fields logged when the target fails: enough to reproduce the failing requests.
func (q *PiProcessedQuery) logFields() []any {
	fields := []any{"RefID", q.RefID, "target", q.FullTargetPath, "status", q.Status, "error", q.Error, "hideError", q.HideError}
	if q.WebID != "" {
		fields = append(fields, "webId", q.WebID)
	}
	if q.PluginVersion != "" {
		fields = append(fields, "savedByPluginVersion", q.PluginVersion)
	}
	if q.Resource != "" {
		fields = append(fields, "request", strings.ReplaceAll(q.Resource, "{0}", q.WebID))
	}
	if lookup, ok := q.BatchRequest[q.webIDRequestKey()]; ok {
		fields = append(fields, "webIdRequest", lookup.Resource)
	}
	return fields
}

func (d *Datasource) processBatchtoFrames(processedQuery map[string][]PiProcessedQuery) *backend.QueryDataResponse {
	response := backend.NewQueryDataResponse()

	// Pre-pass: collect all streamable WebIDs so every tag in this batch can share a
	// single streamsets/channel WebSocket connection instead of one socket per tag.
	var streamableWebIDs []string
	for _, queries := range processedQuery {
		for i := range queries {
			if queries[i].Streamable && queries[i].WebID != "" {
				streamableWebIDs = append(streamableWebIDs, queries[i].WebID)
			}
		}
	}
	var connectionKey string
	if len(streamableWebIDs) > 0 {
		sort.Strings(streamableWebIDs)
		// Deduplicate (same tag may appear in multiple summary types)
		uniq := streamableWebIDs[:0]
		for i, id := range streamableWebIDs {
			if i == 0 || id != streamableWebIDs[i-1] {
				uniq = append(uniq, id)
			}
		}
		connectionKey = strings.Join(uniq, "|")
		// Copy to break the reference to the local slice's backing array before long-term storage.
		webIDsCopy := make([]string, len(uniq))
		copy(webIDsCopy, uniq)
		d.datasourceMutex.Lock()
		d.connectionKeyWebIDs[connectionKey] = webIDsCopy
		d.datasourceMutex.Unlock()
	}

	for RefID, query := range processedQuery {
		var subResponse backend.DataResponse
		var errorStatus backend.Status
		for _, q := range query {
			// A failing target (e.g. an element of a multi-value variable without the attribute) reports its
			// error and the other targets of the query still return their data.
			if q.Error != nil {
				backend.Logger.Error("Query target failed", q.logFields()...)
				if !q.HideError && subResponse.Error == nil {
					subResponse.Error = q.Error
					errorStatus = backend.Status(q.Status)
				}
				continue
			}
			subResponse.Status = backend.Status(q.Status)

			for _, SummaryType := range *q.Response.getSummaryTypes() {
				frame := convertItemsToDataFrame(&q, d, SummaryType)
				frame.RefID = RefID
				// meta data
				frame.Meta.ExecutedQueryString = strings.ReplaceAll(q.Resource, "{0}", q.WebID)

				// If the query is streamable, register a channel so Grafana subscribes to
				// the live WebSocket stream for this tag. A generation counter is embedded in
				// the key: while the subscription is alive the generation stays constant
				// (repeated QueryData calls reuse the same centrifuge subscription, preventing
				// accumulation past ClientChannelLimit=128). When a subscription ends the
				// generation is incremented in sendStreamData, so the next QueryData call
				// returns a new channel URI → Grafana creates a fresh LiveDataStream →
				// panels recover from the "streaming channel error: expired" state.
				if q.Streamable {
					settings := streamSettings(&q)
					genKey := q.WebID + "|" + settings
					d.datasourceMutex.Lock()
					gen := d.channelGenerations[genKey]
					channelKey := channelKeyFor(q.WebID, settings, gen)
					_, exists := d.channelConstruct[channelKey]
					d.datasourceMutex.Unlock()
					channelURI := "ds/" + q.UID + "/" + channelKey
					if !exists {
						// buildStreamFrameCache acquires datasourceMutex internally
						// (via WebID cache lookups), so it must be called outside the lock.
						// the stream converts only the new values: without the query response, which is not kept
						streamQuery := q
						streamQuery.Response = nil
						streamQuery.Cached = false
						channel := StreamChannelConstruct{
							WebID:         q.WebID,
							ConnectionKey: connectionKey,
							query:         &streamQuery,
							frameCache:    buildStreamFrameCache(d, &q),
							generationKey: genKey,
						}
						d.datasourceMutex.Lock()
						// Re-check after building: a concurrent goroutine may have registered
						// first, or sendStreamData may have incremented the generation.
						// Read the latest gen and recompute key to avoid registering stale entries.
						gen = d.channelGenerations[genKey]
						channelKey = channelKeyFor(q.WebID, settings, gen)
						channelURI = "ds/" + q.UID + "/" + channelKey
						if _, exists = d.channelConstruct[channelKey]; !exists {
							channel.generationKey = genKey
							d.channelConstruct[channelKey] = channel
						}
						d.datasourceMutex.Unlock()
					}
					frame.Meta.Channel = channelURI
				}

				subResponse.Frames = append(subResponse.Frames, frame)
			}
		}
		if len(subResponse.Frames) == 0 && errorStatus != 0 {
			subResponse.Status = errorStatus
		}
		response.Responses[RefID] = subResponse
	}
	return response
}

// streamSettings returns the query settings that change the streamed values. Panels showing the same
// PI point with different settings get their own channel; the stream sends values only, so settings such as the
// display name do not matter.
func streamSettings(q *PiProcessedQuery) string {
	return fmt.Sprintf("digitalStates=%t|nodata=%s|fillGaps=%t", q.DigitalStates, q.getNoDataReplace(), q.StreamFillGaps)
}

// channelKeyFor returns a stable, deterministic 16-char hex key for a streaming channel.
// The generation parameter is incremented each time a subscription ends (see sendStreamData),
// so a recovered or expired subscription gets a new key → new Grafana LiveDataStream →
// panel recovers. While a subscription is alive the generation stays constant, so repeated
// QueryData calls (e.g. on time-range changes) reuse the same centrifuge subscription and
// never accumulate past ClientChannelLimit (128).
func channelKeyFor(webID, settings string, gen uint32) string {
	h := sha256.Sum256([]byte(fmt.Sprintf("%s|%s|%d", webID, settings, gen)))
	return hex.EncodeToString(h[:8])
}

func (q *PIWebAPIQuery) isSummary() bool {
	if q.Summary == nil {
		return false
	}
	if q.Summary.Enable == nil || q.Summary.Basis == nil || q.Summary.Types == nil {
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

// timeSpanParameter returns a time span (summary duration, sample interval or interpolation interval) as a URL query
// parameter value. It is sent as entered: PI Web API accepts many AFTimeSpan forms ("1y", "1.5d", "2 hours",
// "1h30m"...) and returns its own error for an invalid one.
func timeSpanParameter(span string) string {
	return queryEscape(strings.TrimSpace(span))
}

func (q *PIWebAPIQuery) getSummaryURIComponent() string {
	if !q.isSummary() {
		return ""
	}
	uri := ""
	for _, t := range *q.Summary.Types {
		uri += "&summaryType=" + t.Value.Value
	}
	uri += "&calculationBasis=" + *q.Summary.Basis
	if q.Summary.Duration != nil && strings.TrimSpace(*q.Summary.Duration) != "" {
		uri += "&summaryDuration=" + timeSpanParameter(*q.Summary.Duration)
	}
	if q.Summary.SampleTypeInterval != nil && *q.Summary.SampleTypeInterval &&
		q.Summary.SampleInterval != nil && strings.TrimSpace(*q.Summary.SampleInterval) != "" {
		uri += "&sampleType=Interval&sampleInterval=" + timeSpanParameter(*q.Summary.SampleInterval)
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

func (q *PIWebAPIQuery) getTargetPathSeparator() string {
	if q.IsPiPoint {
		return `\`
	}
	return "|"
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
	if strings.HasSuffix(*q.Target, ";") {
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

// getMaxDataPoints returns the panel's max data points.
func (q *Query) getMaxDataPoints() int {
	return q.MaxDataPoints
}

// defaultMaxRecordedValues is the number of recorded values returned when "Max Recorded Values" is not set: the
// default maxCount of PI Web API, and the placeholder of the query editor.
const defaultMaxRecordedValues = 1000

// getMaxRecordedValues returns "Max Recorded Values", or defaultMaxRecordedValues when it is not set.
func (q *Query) getMaxRecordedValues() int {
	if q.Pi.RecordedValues != nil && q.Pi.RecordedValues.MaxNumber != nil && *q.Pi.RecordedValues.MaxNumber > 0 {
		return *q.Pi.RecordedValues.MaxNumber
	}
	return defaultMaxRecordedValues
}

func (q *Query) getBoundaryType() string {
	if q.Pi.RecordedValues != nil && q.Pi.RecordedValues.BoundaryType != nil {
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
				uri += "&sampleInterval=" + timeSpanParameter(q.getIntervalTime())
			} else if q.Pi.isRecordedValues() {
				uri += "/recorded" + q.getTimeRangeURIComponent()
			} else {
				uri += "/recorded" + q.getTimeRangeURIComponent()
			}
		}
		uri += "&expression=" + queryEscape(q.Pi.Expression) + "&webId="
		log.DefaultLogger.Debug("Calculation log", "uri", uri)
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
				uri += "/interpolated" + q.getTimeRangeURIComponent() + "&interval=" + timeSpanParameter(q.getIntervalTime())
			} else if q.Pi.isRecordedValues() {
				uri += "/recorded" + q.getTimeRangeURIComponent() + fmt.Sprintf("&maxCount=%d", q.getMaxRecordedValues()) + "&boundaryType=" + q.getBoundaryType()
			} else {
				uri += "/plot" + q.getTimeRangeURIComponent() + fmt.Sprintf("&intervals=%d", q.getMaxDataPoints())
			}
			uri += "&webId="
		}
	}
	return uri
}
