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
// If the request fails, an error is returned.
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
		return nil, err
	}
	resp, err := d.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("request failed, status: %v", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.DefaultLogger.Error("API Get - request failed", "error", err, "uri", uri, "body", string(body))
		return nil, err
	}
	return body, nil
}

// apiBatchRequest performs a batch request against the PI Web API. It returns the response body as a byte slice.
// If the request fails, an error is returned.
func apiBatchRequest(ctx context.Context, d *Datasource, BatchSubRequests interface{}) ([]byte, error) {
	var uri = d.settings.URL
	if strings.HasSuffix(uri, "/") {
		uri = uri + "batch"
	} else {
		uri = uri + "/batch"
	}

	jsonValue, err := json.Marshal(BatchSubRequests)
	if err != nil {
		log.DefaultLogger.Error("Batch request - marshal", "error", err)
		return nil, fmt.Errorf("request failed. parsing request")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uri, bytes.NewBuffer(jsonValue))
	if err != nil {
		log.DefaultLogger.Error("Batch request - create", "error", err)
		return nil, fmt.Errorf("request failed")
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "Grafana/grafana-osisoft")
	req.Header.Set("X-Requested-With", "message/http")
	req.Header.Set("X-PIWEBAPI-HTTP-METHOD", "GET")
	req.Header.Set("X-PIWEBAPI-RESOURCE-ADDRESS", uri)

	resp, err := d.httpClient.Do(req)
	if err != nil {
		log.DefaultLogger.Error("Batch request - do", "error", err)
		return nil, fmt.Errorf("request failed: %w", err)
	}

	defer func() {
		err := resp.Body.Close()
		if err != nil {
			log.DefaultLogger.Error("Batch request failed. body closed", "error", err, "uri", uri)
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.DefaultLogger.Error("Batch request failed", "error", err, "uri", uri)
		return nil, fmt.Errorf("request failed. failed reading response body")
	}

	if resp.StatusCode != http.StatusMultiStatus {
		return nil, fmt.Errorf("request failed, status: %v", resp.Status)
	}

	return body, nil
}

// convertSliceToPointers converts a slice of values to a slice of
// pointers to those values. This is used to create point values that are nullable: the values at the positions in
// badValues are nil.
func convertSliceToPointers(slice interface{}, badValues []int) interface{} {
	s := reflect.ValueOf(slice)
	t := reflect.TypeOf(slice).Elem()

	switch t.Kind() {
	case reflect.Int:
		pointers := make([]*int, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*int)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Int8:
		pointers := make([]*int8, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*int8)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Int16:
		pointers := make([]*int16, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*int16)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Int32:
		pointers := make([]*int32, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*int32)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Int64:
		pointers := make([]*int64, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*int64)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Uint8:
		pointers := make([]*uint8, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*uint8)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Uint16:
		pointers := make([]*uint16, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*uint16)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Uint32:
		pointers := make([]*uint32, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*uint32)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Uint64:
		pointers := make([]*uint64, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*uint64)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Float32:
		pointers := make([]*float32, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*float32)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Float64:
		pointers := make([]*float64, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*float64)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.String:
		pointers := make([]*string, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*string)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Bool:
		pointers := make([]*bool, s.Len())
		for i := 0; i < s.Len(); i++ {
			pointers[i] = s.Index(i).Addr().Interface().(*bool)
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	case reflect.Struct:
		if t == reflect.TypeOf(time.Time{}) {
			// Handle time.Time
			pointers := make([]*time.Time, s.Len())
			for i := 0; i < s.Len(); i++ {
				pointers[i] = s.Index(i).Addr().Interface().(*time.Time)
			}
			for _, badValue := range badValues {
				pointers[badValue] = nil
			}
			return pointers
		}
		return nil
	default:
		pointers := make([]interface{}, s.Len())
		for i := 0; i < s.Len(); i++ {
			v := s.Index(i)
			pointers[i] = v.Addr().Interface()
		}
		for _, badValue := range badValues {
			pointers[badValue] = nil
		}
		return pointers
	}
}

func parseTimestampValue(val reflect.Value) (reflect.Value, error) {
	if val.Kind() != reflect.String {
		return reflect.Value{}, fmt.Errorf("timestamp value must be a string")
	}

	ts, err := getTimeStamp(val)
	// If time.Parse returns an error, return the error immediately.
	if err != nil {
		return reflect.Value{}, fmt.Errorf("error parsing timestamp value: %v", err)
	}

	// Return an error if the timestamp value is invalid.
	if !ts.IsValid() {
		return reflect.Value{}, fmt.Errorf("error parsing timestamp value: invalid timestamp")
	}

	if ts.Kind() == reflect.Interface && ts.Interface() != nil {
		return reflect.Value{}, fmt.Errorf("error parsing timestamp value")
	}

	return ts, nil
}

func updateBadData(fp FrameProcessed, timestamp time.Time, noDataReplace string) FrameProcessed {
	// reflect
	zeroVal := reflect.Zero(fp.sliceType.Elem())
	valuesValue := reflect.ValueOf(fp.values)
	// position of the value in the frame (not the item index: dropped items shift the positions)
	position := valuesValue.Len()
	// update
	switch noDataReplace {
	case "Null":
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.badValues = append(fp.badValues, position)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	case "Keep":
		fp.timestamps = append(fp.timestamps, timestamp)
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
	log.DefaultLogger.Debug("Update bad data", "no_replace", noDataReplace, "zero", zeroVal.Interface())
	return fp
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
	units string, summaryLabel string) map[string]string {
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
			log.DefaultLogger.Warn("Invalid regex in query, the label is not replaced", "search", *q.Regex.Search, "error", err)
		}
	} else if q.Display != nil && strings.TrimSpace(*q.Display) != "" {
		// Old format with display name
		frameLabel["name"] = strings.TrimSpace(*q.Display)
	}
	return frameLabel
}

func convertItemsToDataFrame(processedQuery *PiProcessedQuery, d *Datasource, SummaryType string) *data.Frame {
	// when the WebID is not cached, the type is taken from the values and the metadata is empty
	metadata, _ := d.getWebIDEntry(processedQuery.WebID)
	return itemsToFrame(processedQuery, *processedQuery.Response.getItems(SummaryType), frameOptions{
		metadata:      metadata,
		responseUnits: processedQuery.Response.getUnits(SummaryType),
		summaryType:   SummaryType,
		newFormat:     d.isUsingNewFormat(),
		units:         d.isUsingUnits(),
	})
}

// convertStreamItemsToFrame converts the values of one stream of a PI Web API channel message, with the same
// rules as the query responses.
func convertStreamItemsToFrame(processedQuery *PiProcessedQuery, stream StreamData, cache streamFrameCache) *data.Frame {
	return itemsToFrame(processedQuery, stream.Items, frameOptions{
		metadata:      cache.metadata,
		responseUnits: stream.UnitsAbbreviation,
		newFormat:     cache.newFormat,
		units:         cache.units,
	})
}

// frameOptions are the WebID metadata and datasource options used by itemsToFrame.
type frameOptions struct {
	metadata      WebIDCacheEntry // empty when the WebID is not cached
	responseUnits string          // units abbreviation returned with the values
	summaryType   string
	newFormat     bool // "Enable New Data Format"
	units         bool // "Enable Unit From Data"
}

// itemsToFrame converts the values of a PI point or AF attribute to a data frame.
func itemsToFrame(processedQuery *PiProcessedQuery, items []PiBatchContentItem, o frameOptions) *data.Frame {
	metadata := o.metadata
	// Units are only added when enabled in both the datasource configuration and the query.
	includeMetaData := processedQuery.UseUnit && o.units
	digitalStates := processedQuery.DigitalStates
	noDataReplace := processedQuery.getNoDataReplace()

	stateNames := map[int64]string{} // digital state code -> name, from the good values
	sliceType := metadata.Type
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
		metadata.Description, units, o.summaryType)

	var labels map[string]string
	digitalState := metadata.DigitalState

	frame := data.NewFrame("")
	if o.newFormat {
		labels = frameLabel
	}

	for _, item := range items {
		if item.Value == nil {
			log.DefaultLogger.Debug("Convert items to frames - nil", "value", item.Value, "item", item)
			fP = updateBadData(fP, item.Timestamp, noDataReplace)
			continue
		}

		fP.val = reflect.ValueOf(item.Value)

		if !fP.val.IsValid() {
			log.DefaultLogger.Debug("Convert items to frames - invalid", "value", item.Value, "item", item)
			fP = updateBadData(fP, item.Timestamp, noDataReplace)
			continue
		}

		// if the value is valid, get the underlying value
		// we need to complete both checks to prevent a panic on a null value
		if fP.val.IsValid() && fP.val.Kind() == reflect.Ptr {
			fP.val = fP.val.Elem()
		}

		// handle value being a timestamp, the PIWab API returns a timestamp as a string
		// we need to convert it to a time.Time
		if fP.sliceType == reflect.TypeOf([]time.Time{}) && item.isGood() {
			var err error
			fP.val, err = parseTimestampValue(fP.val)
			if err != nil {
				log.DefaultLogger.Error("Convert items to frames - parseTimestampValue", "error", err.Error(), "item", item)
				fP = updateBadData(fP, item.Timestamp, noDataReplace)
				continue
			}
		}

		_, isState := item.Value.(map[string]interface{})
		if !item.isGood() { // bad values are system states such as "Shutdown"
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
					log.DefaultLogger.Error("Convert items to frames - error unmarshalling digital state", err)
					fP = updateBadData(fP, item.Timestamp, noDataReplace)
				}
			} else {
				// should not happen
				log.DefaultLogger.Error("Convert items to frames - error unmarshalling digital state", err)
				fP = updateBadData(fP, item.Timestamp, noDataReplace)
			}
		} else if fP.val.Type().Kind() != fP.sliceType.Elem().Kind() { // mismatch - try conversion
			if compatible(fP.val.Type(), fP.sliceType.Elem()) { // try to convert if numeric values
				converted := fP.val.Convert(fP.sliceType.Elem())
				fP.timestamps = append(fP.timestamps, item.Timestamp)
				fP.values = reflect.Append(reflect.ValueOf(fP.values), converted).Interface()
				fP.prevVal = converted
				log.DefaultLogger.Debug("Convert items to frames - Mismatch compatible", "ValKind", fP.val.Type().String(), "Val", fP.val.Interface(),
					"SliceKind", fP.sliceType.Elem().String(), "item", item)
			} else {
				fP = updateBadData(fP, item.Timestamp, noDataReplace)
				log.DefaultLogger.Warn("Convert items to frames - Mismatch", "ValKind", fP.val.Type().String(), "Val", fP.val.Interface(),
					"SliceKind", fP.sliceType.Elem().String(), "item", item)
			}
		} else { // normal
			fP.timestamps = append(fP.timestamps, item.Timestamp)
			fP.values = reflect.Append(reflect.ValueOf(fP.values), fP.val).Interface()
			fP.prevVal = fP.val
		}
	}

	// Response cache
	log.DefaultLogger.Debug("Convert items to frames - Cache", "Cached", processedQuery.Cached, "TimeLen", len(fP.timestamps),
		"RefID", processedQuery.RefID)
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
		values = digitalStateNames(fP.values, fP.badValues, stateNames)
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
// code without a known name). It has one entry per value, so the frame fields keep the same length.
func digitalStateNames(values any, badValues []int, stateNames map[int64]string) []*string {
	bad := make(map[int]bool, len(badValues))
	for _, i := range badValues {
		bad[i] = true
	}
	v := reflect.ValueOf(values)
	names := make([]*string, v.Len())
	for i := range names {
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
