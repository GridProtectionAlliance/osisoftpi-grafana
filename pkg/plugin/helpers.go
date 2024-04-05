package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"regexp"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func replaceAccentsWithEscape(s string) string {
	// Define a mapping of accents to their corresponding escape sequences
	accentMap := map[rune]string{
		'á': "%C3%A1", 'à': "%C3%A0", 'â': "%C3%A2", 'ä': "%C3%A4", 'ã': "%C3%A3", 'å': "%C3%A5",
		'é': "%C3%A9", 'è': "%C3%A8", 'ê': "%C3%AA", 'ë': "%C3%AB",
		'í': "%C3%AD", 'ì': "%C3%AC", 'î': "%C3%AE", 'ï': "%C3%AF",
		'ó': "%C3%B3", 'ò': "%C3%B2", 'ô': "%C3%B4", 'ö': "%C3%B6", 'õ': "%C3%B5", 'ø': "%C3%B8",
		'ú': "%C3%BA", 'ù': "%C3%B9", 'û': "%C3%BB", 'ü': "%C3%BC",
		'ñ': "%C3%B1",
		'ç': "%C3%A7",
		'Á': "%C3%81", 'À': "%C3%80", 'Â': "%C3%82", 'Ä': "%C3%84", 'Ã': "%C3%83", 'Å': "%C3%85",
		'É': "%C3%89", 'È': "%C3%88", 'Ê': "%C3%8A", 'Ë': "%C3%8B",
		'Í': "%C3%8D", 'Ì': "%C3%8C", 'Î': "%C3%8E", 'Ï': "%C3%8F",
		'Ó': "%C3%93", 'Ò': "%C3%92", 'Ô': "%C3%94", 'Ö': "%C3%96", 'Õ': "%C3%95", 'Ø': "%C3%98",
		'Ú': "%C3%9A", 'Ù': "%C3%99", 'Û': "%C3%9B", 'Ü': "%C3%9C",
		'Ñ': "%C3%91",
		'Ç': "%C3%87",
		'|': "%7C", '(': "%28", ')': "%29",
	}

	var result strings.Builder

	// Iterate over each character in the input string
	for _, char := range s {
		// Check if the character is an accent
		if escapeSeq, ok := accentMap[char]; ok {
			// If it is, append the escape sequence to the result
			result.WriteString(escapeSeq)
		} else {
			// If it's not an accent, append the character as it is
			result.WriteRune(char)
		}
	}

	return strings.ReplaceAll(result.String(), ` `, `%20`)
}

// apiGet performs a GET request against the PI Web API. It returns the response body as a byte slice.
// If the request fails, an error is returned.
func apiGet(ctx context.Context, d *Datasource, path string) ([]byte, error) {
	var uri = d.settings.URL
	var pathEscaped = replaceAccentsWithEscape(path)
	if strings.HasSuffix(uri, "/") {
		uri = uri + pathEscaped
	} else {
		uri = uri + "/" + pathEscaped
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
		backend.Logger.Error("API Get request failed", "error", err, "uri", uri, "body", string(body))
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
		backend.Logger.Error("Batch request create", "error", err)
		return nil, fmt.Errorf("request failed. parsing request")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uri, bytes.NewBuffer(jsonValue))
	if err != nil {
		backend.Logger.Error("Batch request create", "error", err)
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
		backend.Logger.Error("Batch request do", "error", err)
		return nil, fmt.Errorf("request timeout")
	}

	defer func() {
		err := resp.Body.Close()
		if err != nil {
			backend.Logger.Error("Batch request failed. body closed", "error", err, "uri", uri)
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		backend.Logger.Error("Batch request failed", "error", err, "uri", uri)
		return nil, fmt.Errorf("request failed. failed reading response body")
	}

	if resp.StatusCode != http.StatusMultiStatus {
		return nil, fmt.Errorf("request failed, status: %v", resp.Status)
	}

	return body, nil
}

// convertSliceToPointers converts a slice of values to a slice of
// pointers to those values. This is used to create point values that are nullable.
// TODO: handle bad value processing here
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

func updateBadData(index int, fp FrameProcessed, timestamp time.Time, noDataReplace string) FrameProcessed {
	// reflect
	zeroVal := reflect.Zero(fp.sliceType.Elem())
	valuesValue := reflect.ValueOf(fp.values)
	// update
	switch noDataReplace {
	case "Null":
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.badValues = append(fp.badValues, index)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	case "Keep":
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	case "0":
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	case "Previous":
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.values = reflect.Append(valuesValue, fp.prevVal).Interface()
	case "Drop":
	default:
		fp.timestamps = append(fp.timestamps, timestamp)
		fp.badValues = append(fp.badValues, index)
		fp.values = reflect.Append(valuesValue, zeroVal).Interface()
	}
	backend.Logger.Debug("Update bad data", "no_replace", noDataReplace, "zero", zeroVal.Interface())
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

func getDataLabels(useNewFormat bool, q *PiProcessedQuery, pointType string, summaryLabel string) map[string]string {
	var frameLabel map[string]string
	summaryNewFormat := ""

	if summaryLabel != "" {
		summaryNewFormat = "\" summaryType=\"" + summaryLabel
		summaryLabel = "[" + summaryLabel + "]"
	}

	var label string
	if useNewFormat {
		label = q.Label
	} else {
		label = q.Label + summaryLabel
	}

	if q.IsPIPoint {
		// New format returns the full path with metadata
		// PiPoint {element="PISERVER", name="Attribute", type="Float32"}
		targetParts := strings.Split(q.FullTargetPath, `\`)
		frameLabel = map[string]string{
			"element": targetParts[0],
			"name":    label,
			"type":    pointType + summaryNewFormat,
		}
	} else {
		// New format returns the full path with metadata
		// Element|Attribute {element="Element", name="Attribute", type="Single"}
		targetParts := strings.Split(q.FullTargetPath, `\`)
		labelParts := strings.SplitN(targetParts[len(targetParts)-1], "|", 2)
		frameLabel = map[string]string{
			"element": labelParts[0],
			"name":    label,
			"type":    pointType + summaryNewFormat,
		}
	}

	// Use ReplaceAllString to replace all instances of the search pattern with the replacement string
	// FIXME: This is working, but graph panels seem to not render the trend.
	if q.isRegexQuery() {
		regex := regexp.MustCompile(*q.Regex.Search)
		frameLabel["name"] = regex.ReplaceAllString(frameLabel["name"], *q.Regex.Replace)
	} else if q.Display != nil && strings.TrimSpace(*q.Display) != "" {
		// Old format with display name
		frameLabel["name"] = strings.TrimSpace(*q.Display)
	}
	return frameLabel
}

func convertItemsToDataFrame(processedQuery *PiProcessedQuery, d *Datasource, SummaryType string) (*data.Frame, error) {
	items := *processedQuery.Response.getItems(SummaryType)
	webID := processedQuery.WebID
	includeMetaData := processedQuery.UseUnit
	digitalStates := processedQuery.DigitalStates
	noDataReplace := processedQuery.getSummaryNoDataReplace()

	digitalStateValues := make([]string, 0)
	sliceType := d.getTypeForWebID(webID)

	fP := FrameProcessed{
		sliceType:  sliceType,
		prevVal:    reflect.Zero(sliceType),
		values:     reflect.MakeSlice(reflect.SliceOf(sliceType.Elem()), 0, 0).Interface(),
		badValues:  make([]int, 0),
		timestamps: make([]time.Time, 0),
	}

	// get frame name
	frameLabel := getDataLabels(d.isUsingNewFormat(), processedQuery, d.getPointTypeForWebID(webID), SummaryType)

	var labels map[string]string
	var digitalState = d.getDigitalStateForWebID(webID)

	frame := data.NewFrame("")
	if d.isUsingNewFormat() {
		labels = frameLabel
	}

	for i, item := range items {
		if item.Value == nil {
			backend.Logger.Warn("item.Value is nil", "value", item.Value, "item", item)
			fP = updateBadData(i, fP, item.Timestamp, noDataReplace)
			continue
		}

		fP.val = reflect.ValueOf(item.Value)

		if !fP.val.IsValid() {
			backend.Logger.Warn("Is Not Valid", "value", item.Value, "item", item)
			fP = updateBadData(i, fP, item.Timestamp, noDataReplace)
			continue
		}

		// if the value is valid, get the underlying value
		// we need to complete both checks to prevent a panic on a null value
		if fP.val.IsValid() && fP.val.Kind() == reflect.Ptr {
			fP.val = fP.val.Elem()
		}

		// handle value being a timestamp, the PIWab API returns a timestamp as a string
		// we need to convert it to a time.Time
		if fP.sliceType == reflect.TypeOf([]time.Time{}) {
			var err error
			fP.val, err = parseTimestampValue(fP.val)
			if err != nil {
				backend.Logger.Error("Error parseTimestampValue", "error", err.Error(), "kind", fP.val.Kind().String(), "item", item)
				continue
			}
		}

		// if the value isn't good, or is not the same type as the slice,
		// add it to the list of bad values and nullify later
		//TODO we should make this pattern match the query options
		_, digitalState := item.Value.(map[string]interface{})
		if !item.isGood() {
			fP = updateBadData(i, fP, item.Timestamp, noDataReplace)
		} else if digitalState {
			var pds PointDigitalState
			if b, err := json.Marshal(item.Value); err == nil {
				if err := json.Unmarshal(b, &pds); err == nil {
					fP.timestamps = append(fP.timestamps, item.Timestamp)
					digitalStateValues = append(digitalStateValues, pds.Name)
					pdsValue := reflect.ValueOf(pds.Value)
					itemValue := pdsValue.Convert(fP.sliceType.Elem())
					fP.values = reflect.Append(reflect.ValueOf(fP.values), itemValue).Interface()
					fP.prevVal = itemValue
				} else {
					// should not happen
					backend.Logger.Error("Error unmarshalling digital state", err)
					fP = updateBadData(i, fP, item.Timestamp, noDataReplace)
				}
			} else {
				// should not happen
				backend.Logger.Error("Error unmarshalling digital state", err)
				fP = updateBadData(i, fP, item.Timestamp, noDataReplace)
			}
		} else if fP.val.Type().Kind() != fP.sliceType.Elem().Kind() {
			backend.Logger.Warn("Mismatch type", "ValKind", fP.val.Type().String(), "Val", fP.val.Interface(),
				"SliceKind", fP.sliceType.Elem().String(), "item", item)
			if compatible(fP.val.Type(), fP.sliceType.Elem()) { // try to convert if numeric values
				fP.timestamps = append(fP.timestamps, item.Timestamp)
				fP.values = reflect.Append(reflect.ValueOf(fP.values), fP.val.Convert(fP.sliceType.Elem())).Interface()
				fP.prevVal = fP.val
			} else {
				fP = updateBadData(i, fP, item.Timestamp, noDataReplace)
			}
		} else {
			fP.timestamps = append(fP.timestamps, item.Timestamp)
			fP.values = reflect.Append(reflect.ValueOf(fP.values), fP.val).Interface()
			fP.prevVal = fP.val
		}
	}

	// Convert the slice of values to a slice of pointers to the values
	// This is so that we can nullify the values that are "bad"
	// "Bad" values are values such as system type values that cannot be represented
	// in the slice type, or values that are not "good"
	valuepointers := convertSliceToPointers(fP.values, fP.badValues)

	timeField := data.NewField("time", nil, fP.timestamps)
	if !digitalState || !digitalStates {
		valueField := data.NewField(frameLabel["name"], labels, valuepointers)
		frame.Fields = append(frame.Fields,
			timeField,
			valueField,
		)
	} else {
		fieldConfig := &data.FieldConfig{}
		if includeMetaData {
			fieldConfig.Unit = d.getUnitsForWebID(webID)
			fieldConfig.Description = d.getDescriptionForWebID(webID)
		}
		valueField := data.NewField(frameLabel["name"], labels, digitalStateValues)
		valueField.SetConfig(fieldConfig)
		frame.Fields = append(frame.Fields,
			timeField,
			valueField,
		)
	}

	// create a metadata struct for the frame so we can set it later.
	frame.Meta = &data.FrameMeta{}
	return frame, nil
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
