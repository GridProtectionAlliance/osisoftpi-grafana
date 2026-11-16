package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"reflect"
	"regexp"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// queryEscape URL-encodes a query string value for the PI Web API, so paths and names containing characters such
// as '#', '&', '+', '%' or spaces are not cut or altered. Spaces are encoded as %20 rather than '+'.
func queryEscape(s string) string {
	return strings.ReplaceAll(url.QueryEscape(s), "+", "%20")
}

// apiGet performs a GET request against the PI Web API. It returns the response body as a byte slice.
// If the request fails, a requestError is returned; the caller logs it.
func apiGet(ctx context.Context, d *Datasource, path string) ([]byte, error) {
	// path is already URL-encoded (resource proxy requests are encoded by the frontend)
	var uri = d.settings.URL
	if strings.HasSuffix(uri, "/") {
		uri = uri + path
	} else {
		uri = uri + "/" + path
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return nil, &requestError{errorType: errInternal, err: err}
	}
	resp, err := d.httpClient.Do(req)
	if err != nil {
		return nil, &requestError{errorType: errUnreachable, err: err}
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode >= 300 {
		// the error message of PI Web API is at the start of the body
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
		return nil, statusError(resp, body)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &requestError{errorType: errUnreachable, err: err}
	}
	return body, nil
}

// apiBatchRequest performs a batch request against the PI Web API. It returns the response body as a byte slice.
// If the request fails, a requestError is returned; the caller logs it.
func apiBatchRequest(ctx context.Context, d *Datasource, BatchSubRequests interface{}) ([]byte, error) {
	var uri = d.settings.URL
	if strings.HasSuffix(uri, "/") {
		uri = uri + "batch"
	} else {
		uri = uri + "/batch"
	}

	jsonValue, err := json.Marshal(BatchSubRequests)
	if err != nil {
		return nil, &requestError{errorType: errInternal, err: fmt.Errorf("request failed. parsing request: %w", err)}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uri, bytes.NewBuffer(jsonValue))
	if err != nil {
		return nil, &requestError{errorType: errInternal, err: fmt.Errorf("request failed: %w", err)}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "Grafana/grafana-osisoft")
	req.Header.Set("X-Requested-With", "message/http")
	req.Header.Set("X-PIWEBAPI-HTTP-METHOD", "GET")
	req.Header.Set("X-PIWEBAPI-RESOURCE-ADDRESS", uri)
	// The batch only contains GET sub-requests, so it can be sent again. A nil Idempotency-Key is not sent, but lets
	// the HTTP client retry the request once when the server closed a reused keep-alive connection (EOF, reset).
	req.Header["Idempotency-Key"] = nil

	resp, err := d.httpClient.Do(req)
	if err != nil {
		return nil, &requestError{errorType: errUnreachable, err: fmt.Errorf("request failed: %w", err)}
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &requestError{errorType: errUnreachable, err: fmt.Errorf("request failed. failed reading response body: %w", err)}
	}

	if resp.StatusCode != http.StatusMultiStatus {
		return nil, statusError(resp, body)
	}

	return body, nil
}

// convertSliceToPointers converts a slice of values to a slice of
// pointers to those values. This is used to create point values that are nullable: the values at the positions in
// badValues are nil.
func convertSliceToPointers(slice interface{}, badValues []int) interface{} {
	s := reflect.ValueOf(slice)
	pointers := reflect.MakeSlice(reflect.SliceOf(reflect.PointerTo(s.Type().Elem())), s.Len(), s.Len())
	for i := 0; i < s.Len(); i++ {
		pointers.Index(i).Set(s.Index(i).Addr())
	}
	for _, badValue := range badValues {
		pointers.Index(badValue).SetZero()
	}
	return pointers.Interface()
}

func updateBadData(fp FrameProcessed, timestamp time.Time, noDataReplace string) FrameProcessed {
	// reflect
	zeroVal := reflect.Zero(fp.sliceType.Elem())
	valuesValue := reflect.ValueOf(fp.values)
	// position of the value in the frame (not the item index: dropped items shift the positions)
	position := valuesValue.Len()
	// update
	switch noDataReplace {
	case "Null", "Keep": // "Keep" keeps the bad values in itemsToFrame; here there is no value to keep (see keepBadValue)
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.badValues = append(fp.badValues, position)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	case "0":
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	case "Previous":
		fp.timestamps = append(fp.timestamps, timestamp)
		if fp.prevVal.IsValid() {
			fp.values = reflect.Append(valuesValue, fp.prevVal).Interface()
		} else { // no good value yet
			fp.badValues = append(fp.badValues, position)
			fp.values = reflect.Append(valuesValue, zeroVal).Interface()
		}
	case "Drop":
	default:
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.badValues = append(fp.badValues, position)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	}
	log.DefaultLogger.Debug("bad_value_replaced", "nodata", noDataReplace, "timestamp", timestamp.UTC().Format(time.RFC3339Nano))
	return fp
}

// keepBadValue adds a bad value with Replace Bad Data = "Keep": the value returned by PI Web API is kept, as with
// the 4.x frontend. A system state (e.g. {"Name": "Shutdown", "Value": 254}) is kept as its name in text series and
// as its code in numeric and digital state series; the returned name is shown instead of the code when "Digital
// States" is on (see digitalStateNames). A value that the series cannot hold (e.g. a state in a time series) is null.
func keepBadValue(fp FrameProcessed, item PiBatchContentItem) (FrameProcessed, string) {
	elem := fp.sliceType.Elem()
	value := reflect.ValueOf(item.Value)
	var name string
	if state, isState := item.Value.(map[string]interface{}); isState {
		name, _ = state["Name"].(string)
		if elem.Kind() == reflect.String {
			value = reflect.ValueOf(name)
		} else {
			value = reflect.ValueOf(state["Value"])
		}
	}
	if !value.IsValid() || (value.Kind() != elem.Kind() && !compatible(value.Type(), elem)) {
		return updateBadData(fp, item.Timestamp, "Null"), name
	}
	fp.timestamps = append(fp.timestamps, item.Timestamp)
	fp.values = reflect.Append(reflect.ValueOf(fp.values), value.Convert(elem)).Interface()
	return fp, name
}

func compatible(actual reflect.Type, expected reflect.Type) bool {
	a := actual.Kind()
	k := expected.Kind()
	return (k == reflect.Int || k == reflect.Int32 ||
		k == reflect.Int64 || k == reflect.Float32 ||
		k == reflect.Float64) && (a == reflect.Int || a == reflect.Int32 ||
		a == reflect.Int64 || a == reflect.Float32 ||
		a == reflect.Float64)
}

func getDataLabels(useNewFormat bool, q *PiProcessedQuery, pointType string, description string,
	units string, summaryLabel string, logger log.Logger) map[string]string {
	var frameLabel map[string]string
	summaryType := summaryLabel
	if summaryLabel != "" {
		summaryLabel = "[" + summaryLabel + "]"
	}

	var label string
	if useNewFormat {
		label = q.Label
	} else if q.IsPIPoint {
		label = q.Label + summaryLabel
	} else {
		targetParts := strings.Split(q.FullTargetPath, `\`)
		if _, elementPath := afDatabaseAndPath(q.TargetPath); q.MultiVariable && elementPath != "" {
			// e.g. SiteA\Unit2\Pump|Flow
			label = elementPath + "|" + q.Label
		} else if q.Variable != "" {
			label = q.Variable + "|" + targetParts[len(targetParts)-1]
		} else {
			label = targetParts[len(targetParts)-1]
		}
		label += summaryLabel
	}

	if q.IsPIPoint {
		// New format returns the full path with metadata
		// PiPoint {element="PISERVER", name="Attribute", type="Float32"}
		targetParts := strings.Split(q.FullTargetPath, `\`)
		frameLabel = map[string]string{
			"element":     targetParts[0],
			"name":        label,
			"type":        pointType,
			"description": description,
			"units":       units,
		}
	} else {
		// New format returns the full path with metadata
		// Element|Attribute {element="Element", name="Attribute", type="Single"}
		targetParts := strings.Split(q.FullTargetPath, `\`)
		labelParts := strings.SplitN(targetParts[len(targetParts)-1], "|", 2)
		database, elementPath := afDatabaseAndPath(q.TargetPath)
		frameLabel = map[string]string{
			"database":    database,
			"path":        elementPath,
			"element":     labelParts[0],
			"name":        label,
			"type":        pointType,
			"description": description,
			"units":       units,
		}
	}

	if summaryType != "" {
		frameLabel["summaryType"] = summaryType
	}

	// Use ReplaceAllString to replace all instances of the search pattern with the replacement string
	// FIXME: This is working, but graph panels seem to not render the trend.
	if q.isRegexQuery() {
		// the search pattern is typed by the user, so an invalid pattern must not panic
		if regex, err := regexp.Compile(*q.Regex.Search); err == nil {
			frameLabel["name"] = regex.ReplaceAllString(frameLabel["name"], *q.Regex.Replace)
		} else {
			logError(orDefaultLogger(logger), "display_regex_invalid", errInvalidQuery, "refId", q.RefID, "target", q.FullTargetPath,
				"search", *q.Regex.Search, "error", err.Error())
		}
	} else if q.Display != nil && strings.TrimSpace(*q.Display) != "" {
		// Old format with display name
		frameLabel["name"] = strings.TrimSpace(*q.Display)
	}
	return frameLabel
}

func convertItemsToDataFrame(ctx context.Context, processedQuery *PiProcessedQuery, d *Datasource, SummaryType string) *data.Frame {
	// when the WebID is not cached, the type is taken from the values and the metadata is empty
	metadata, _ := d.getWebIDEntry(processedQuery.WebID)
	// calculations list their values directly; calculation/summary responses are summaries
	_, isCalculation := processedQuery.Response.(PiBatchDataWithFloatItem)
	return itemsToFrame(processedQuery, *processedQuery.Response.getItems(SummaryType), frameOptions{
		metadata:       metadata,
		responseUnits:  processedQuery.Response.getUnits(SummaryType),
		summaryType:    SummaryType,
		newFormat:      d.isUsingNewFormat(),
		units:          d.isUsingUnits(),
		typeFromValues: isCalculation || SummaryType != "",
		logger:         contextLogger(ctx),
	})
}

// convertStreamItemsToFrame converts the values of one stream of a PI Web API channel message, with the same
// rules as the query responses.
func convertStreamItemsToFrame(ctx context.Context, processedQuery *PiProcessedQuery, stream StreamData, cache streamFrameCache) *data.Frame {
	return itemsToFrame(processedQuery, stream.Items, frameOptions{
		metadata:      cache.metadata,
		responseUnits: stream.UnitsAbbreviation,
		newFormat:     cache.newFormat,
		units:         cache.units,
		logger:        contextLogger(ctx),
	})
}

// frameOptions are the WebID metadata and datasource options used by itemsToFrame.
type frameOptions struct {
	metadata      WebIDCacheEntry // empty when the WebID is not cached
	responseUnits string          // units abbreviation returned with the values
	summaryType   string
	newFormat     bool // "Enable New Data Format"
	units         bool // "Enable Unit From Data"
	// typeFromValues is set for calculations and summaries: their values have their own type (the text result of
	// an expression on a numeric point, the average of an integer point), not the type of the point or attribute
	typeFromValues bool
	logger         log.Logger // the logger of the request (see contextLogger); nil is the default logger
}

// itemsToFrame converts the values of a PI point or AF attribute to a data frame.
func itemsToFrame(processedQuery *PiProcessedQuery, items []PiBatchContentItem, o frameOptions) *data.Frame {
	metadata := o.metadata
	logger := orDefaultLogger(o.logger)
	// Units are only added when enabled in both the datasource configuration and the query.
	includeMetaData := processedQuery.UseUnit && o.units
	digitalStates := processedQuery.DigitalStates
	noDataReplace := processedQuery.getNoDataReplace()

	stateNames := map[int64]string{} // digital state code -> name, from the good values
	keptNames := map[int]string{}    // position -> name of the system states kept with Replace Bad Data = "Keep"
	sliceType := metadata.Type
	digitalState := metadata.DigitalState
	if o.typeFromValues {
		sliceType = nil
		digitalState = false // set from the values
	}
	if sliceType == nil {
		sliceType = inferValueType(items)
	}

	fP := FrameProcessed{
		sliceType:  sliceType,
		prevVal:    reflect.Value{}, // no good value yet
		values:     reflect.MakeSlice(reflect.SliceOf(sliceType.Elem()), 0, 0).Interface(),
		badValues:  make([]int, 0),
		timestamps: make([]time.Time, 0),
	}

	units := preferredUnits(o.responseUnits, metadata.Units)

	// get frame name
	frameLabel := getDataLabels(o.newFormat, processedQuery, metadata.PointType,
		metadata.Description, units, o.summaryType, logger)

	var labels map[string]string

	frame := data.NewFrame("")
	if o.newFormat {
		labels = frameLabel
	}

	for _, item := range items {
		if item.Value == nil {
			logger.Debug("value_missing", valueLogFields(processedQuery, metadata, item, noDataReplace)...)
			fP = updateBadData(fP, item.Timestamp, noDataReplace)
			continue
		}

		// a value decoded from JSON: float64, string, bool or map (digital state)
		fP.val = reflect.ValueOf(item.Value)

		// handle value being a timestamp, the PIWab API returns a timestamp as a string
		// we need to convert it to a time.Time
		if fP.sliceType == reflect.TypeOf([]time.Time{}) && item.isGood() {
			var err error
			fP.val, err = getTimeStamp(fP.val)
			if err != nil {
				logError(logger, "value_conversion_failed", errValueConversion,
					append(valueLogFields(processedQuery, metadata, item, noDataReplace), "seriesType", "time",
						"error", "the value is not a timestamp: "+err.Error())...)
				fP = updateBadData(fP, item.Timestamp, noDataReplace)
				continue
			}
		}

		_, isState := item.Value.(map[string]interface{})
		if !item.isGood() && noDataReplace == "Keep" {
			var name string
			if fP, name = keepBadValue(fP, item); name != "" {
				keptNames[len(fP.timestamps)-1] = name
			}
		} else if !item.isGood() { // bad values are system states such as "Shutdown"
			fP = updateBadData(fP, item.Timestamp, noDataReplace)
		} else if isState { // digital state
			var pds PointDigitalState
			if b, err := json.Marshal(item.Value); err == nil {
				if err := json.Unmarshal(b, &pds); err == nil {
					fP.timestamps = append(fP.timestamps, item.Timestamp)
					stateNames[int64(pds.Value)] = pds.Name
					digitalState = true
					pdsValue := reflect.ValueOf(pds.Value)
					itemValue := pdsValue.Convert(fP.sliceType.Elem())
					fP.values = reflect.Append(reflect.ValueOf(fP.values), itemValue).Interface()
					fP.prevVal = itemValue
				} else {
					// should not happen
					logError(logger, "value_conversion_failed", errValueConversion,
						append(valueLogFields(processedQuery, metadata, item, noDataReplace), "error", err.Error())...)
					fP = updateBadData(fP, item.Timestamp, noDataReplace)
				}
			} else {
				// should not happen
				logError(logger, "value_conversion_failed", errValueConversion,
					append(valueLogFields(processedQuery, metadata, item, noDataReplace), "error", err.Error())...)
				fP = updateBadData(fP, item.Timestamp, noDataReplace)
			}
		} else if fP.val.Type().Kind() != fP.sliceType.Elem().Kind() { // mismatch - try conversion
			if compatible(fP.val.Type(), fP.sliceType.Elem()) { // try to convert if numeric values
				converted := fP.val.Convert(fP.sliceType.Elem())
				fP.timestamps = append(fP.timestamps, item.Timestamp)
				fP.values = reflect.Append(reflect.ValueOf(fP.values), converted).Interface()
				fP.prevVal = converted
				logger.Debug("value_converted", append(valueLogFields(processedQuery, metadata, item, noDataReplace),
					"seriesType", fP.sliceType.Elem().String())...)
			} else {
				fP = updateBadData(fP, item.Timestamp, noDataReplace)
				logError(logger, "value_conversion_failed", errValueConversion,
					append(valueLogFields(processedQuery, metadata, item, noDataReplace), "seriesType", fP.sliceType.Elem().String(),
						"error", "the value does not fit the series type")...)
			}
		} else { // normal
			fP.timestamps = append(fP.timestamps, item.Timestamp)
			fP.values = reflect.Append(reflect.ValueOf(fP.values), fP.val).Interface()
			fP.prevVal = fP.val
		}
	}

	// Response cache
	logger.Debug("frame_built", "refId", processedQuery.RefID, "target", processedQuery.FullTargetPath,
		"values", len(fP.timestamps), "cached", processedQuery.Cached)
	if processedQuery.Cached {
		if len(fP.timestamps) > 1 && fP.prevVal.IsValid() {
			fP.values = reflect.Append(reflect.ValueOf(fP.values), fP.prevVal).Interface()
			fP.timestamps = append(fP.timestamps, processedQuery.EndTime)
		} else if len(fP.timestamps) == 1 {
			fP.timestamps[0] = processedQuery.EndTime
		}
	}
	// Convert the slice of values to a slice of pointers to the values
	// This is so that we can nullify the values that are "bad"
	// "Bad" values are values such as system type values that cannot be represented
	// in the slice type, or values that are not "good"
	valuepointers := convertSliceToPointers(fP.values, fP.badValues)

	timeField := data.NewField(data.TimeSeriesTimeFieldName, nil, fP.timestamps)
	var fieldConfig *data.FieldConfig
	if includeMetaData {
		fieldConfig = &data.FieldConfig{
			Unit:        units,
			Description: metadata.Description,
		}
	}
	values := valuepointers
	if digitalState && digitalStates {
		values = digitalStateNames(fP.values, fP.badValues, stateNames, keptNames)
	}
	valueField := data.NewField(frameLabel["name"], labels, values)
	valueField.SetConfig(fieldConfig)
	frame.Fields = append(frame.Fields, timeField, valueField)

	// create a metadata struct for the frame so we can set it later.
	frame.Meta = &data.FrameMeta{
		Custom: map[string]interface{}{
			"Cached": processedQuery.Cached,
		},
	}
	return frame
}

// valueLogFields returns the log fields of a value returned by PI Web API for a query target: the target, the
// declared type of its PI point or AF attribute (valueType), the value (cut to maxLoggedValue) with its kind and
// quality flags, and the Replace Bad Data option.
func valueLogFields(q *PiProcessedQuery, metadata WebIDCacheEntry, item PiBatchContentItem, noDataReplace string) []any {
	return []any{"refId", q.RefID, "target", q.FullTargetPath, "webId", q.WebID, "valueType", metadata.PointType,
		"timestamp", item.Timestamp.UTC().Format(time.RFC3339Nano), "value", valueExcerpt(item.Value),
		"valueKind", valueKind(item.Value), "good", item.Good, "questionable", item.Questionable,
		"substituted", item.Substituted, "nodata", noDataReplace}
}

// preferredUnits returns the units to show for a PI point or AF attribute: the abbreviation returned with the
// values (e.g. "m3/h"), or the units from the WebID metadata when there is none. AF attributes report
// DefaultUnitsName as the full name ("cubic meter per hour"), while PI points report the abbreviation.
func preferredUnits(responseUnits string, metadataUnits string) string {
	if units := strings.TrimSpace(responseUnits); units != "" {
		return units
	}
	return strings.TrimSpace(metadataUnits)
}

// inferValueType returns the slice type for a stream whose value type is not declared ("<Anything>", e.g. AF
// links) or not known to the plugin, based on the first good value returned by PI Web API. Bad values are
// system digital states (e.g. "Bad Input") and are skipped, so they do not turn a numeric stream into a digital one.
func inferValueType(items []PiBatchContentItem) reflect.Type {
	for _, item := range items {
		if item.Value == nil || !item.isGood() {
			continue
		}
		switch value := item.Value.(type) {
		case float64, float32, int, int32, int64:
			return reflect.TypeOf([]float64{})
		case bool:
			return reflect.TypeOf([]bool{})
		case string:
			return reflect.TypeOf([]string{})
		case map[string]interface{}:
			if isSystem, _ := value["IsSystem"].(bool); isSystem {
				continue
			}
			return reflect.TypeOf([]int32{}) // digital state
		default:
			return reflect.TypeOf([]string{})
		}
	}
	return reflect.TypeOf([]float64{})
}

// digitalStateNames returns the state name of each digital state code in values, or nil for a bad value (or a
// code without a known name). Bad values kept with Replace Bad Data = "Keep" have their own name in keptNames
// (e.g. "Shutdown"). It has one entry per value, so the frame fields keep the same length.
func digitalStateNames(values any, badValues []int, stateNames map[int64]string, keptNames map[int]string) []*string {
	bad := make(map[int]bool, len(badValues))
	for _, i := range badValues {
		bad[i] = true
	}
	v := reflect.ValueOf(values)
	names := make([]*string, v.Len())
	for i := range names {
		if name, ok := keptNames[i]; ok {
			names[i] = &name
			continue
		}
		if bad[i] {
			continue
		}
		var code int64
		switch e := v.Index(i); e.Kind() {
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			code = e.Int()
		case reflect.Float32, reflect.Float64:
			code = int64(e.Float())
		default:
			continue
		}
		if name, ok := stateNames[code]; ok {
			names[i] = &name
		}
	}
	return names
}

// afDatabaseAndPath splits an AF element path (server\database\element\...) into the database name and the
// element path below the database.
func afDatabaseAndPath(targetPath string) (database string, elementPath string) {
	parts := strings.SplitN(strings.TrimLeft(targetPath, `\`), `\`, 3)
	if len(parts) > 1 {
		database = parts[1]
	}
	if len(parts) > 2 {
		elementPath = parts[2]
	}
	return database, elementPath
}

func getTimeStamp(input reflect.Value) (reflect.Value, error) {
	if input.Kind() != reflect.String {
		// return an error value if the input is not a string
		return reflect.Value{}, fmt.Errorf("input is not a string")
	}

	// parse the timestamp string
	timeLayout := "2006-01-02T15:04:05.999999999Z07:00"
	timestamp, err := time.Parse(timeLayout, input.String())
	if err != nil {
		// return an error value if the timestamp string is invalid
		return reflect.Value{}, err
	}

	// return a reflect.Value of type time.Time
	return reflect.ValueOf(timestamp), nil
}
