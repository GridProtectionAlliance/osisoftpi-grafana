package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// apiGet performs a GET request against the PI Web API. It returns the response body as a byte slice.
// If the request fails, an error is returned.
func (d *Datasource) apiGet(ctx context.Context, path string) ([]byte, error) {
	uri := d.settings.URL + path
	req, err := http.NewRequest(http.MethodGet, uri, nil)
	if err != nil {
		return nil, err
	}
	//TODO: grafana http client automatically adds basic auth, remove once confirmed
	// if d.settings.BasicAuthEnabled {
	// 	req.SetBasicAuth(d.settings.BasicAuthUser, d.settings.DecryptedSecureJSONData["basicAuthPassword"])
	// }
	resp, err := d.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return body, nil
}

// apiBatchRequest performs a batch request against the PI Web API. It returns the response body as a byte slice.
// If the request fails, an error is returned.
func (d *Datasource) apiBatchRequest(ctx context.Context, BatchSubRequests map[string]BatchSubRequest) ([]byte, error) {
	uri := d.settings.URL + "/batch"
	jsonValue, err := json.Marshal(BatchSubRequests)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uri, bytes.NewBuffer(jsonValue))
	if err != nil {
		return nil, err
	}
	//TODO: grafana http client automatically adds basic auth, remove once confirmed
	// if d.settings.BasicAuthEnabled {
	// 	req.SetBasicAuth(d.settings.BasicAuthUser, d.settings.DecryptedSecureJSONData["basicAuthPassword"])
	// }
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Requested-With", "message/http")
	req.Header.Set("X-PIWEBAPI-HTTP-METHOD", "GET")
	req.Header.Set("X-PIWEBAPI-RESOURCE-ADDRESS", uri)

	resp, err := d.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	backend.Logger.Debug("Batch request response", "body", string(body))

	return body, nil
}

// convertSliceToPointers converts a slice of values to a slice of
// pointers to those values. This is used to create point values that are nullable.
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

func handleTimestampValue(val reflect.Value) (reflect.Value, error) {
	if val.Kind() != reflect.String {
		return reflect.Value{}, fmt.Errorf("timestamp value must be a string")
	}

	ts := getTimeStamp(val)
	if ts.Kind() == reflect.Interface && ts.Interface() != nil {
		return reflect.Value{}, fmt.Errorf("error parsing timestamp value: %v", ts.Interface())
	}

	return ts, nil
}

func convertAnnotationResponsetoFrame(annotations []AnnotationQueryResponse) (*data.Frame, error) {
	frame := data.NewFrame("Anno")

	var annotationData []*json.RawMessage

	for _, annotation := range annotations {
		for _, annotationValue := range annotation.Items {
			rawMsg, err := json.Marshal(annotationValue)
			if err != nil {
				return nil, fmt.Errorf("error marshalling annotationValue: %w", err)
			}
			rm := json.RawMessage(rawMsg)
			annotationData = append(annotationData, &rm)
		}
	}

	frame.Fields = append(frame.Fields, data.NewField("annotation", nil, annotationData))

	frame.Meta = &data.FrameMeta{}
	return frame, nil
}

// TODO: Code simplification: Determine if we should create metadata here.
// if we passed in the entire query we could do that.
// if we pass a pointer to the webid cache and the webid that might simplify things

// TODO: Code cleanup: handle this directly using slices of pointers.
// TODO: Missing functionality: Add support for summary queries.
// TODO: Missing functionality: Add support for replacing bad data.
func convertItemsToDataFrame(frameName string, items []PiBatchContentItem, SliceType reflect.Type, digitalState bool, summaryQuery bool) (*data.Frame, error) {
	frame := data.NewFrame(frameName)

	//FIXME: Remove this once we have a better way to handle this
	if len(items) < 10 {
		itemsJSON, err := json.Marshal(items)
		if err != nil {
			backend.Logger.Warn("convertItemsToDataFrame", "Error marshalling items to JSON: ", err)
		} else {
			backend.Logger.Warn("convertItemsToDataFrame", "Items: ", string(itemsJSON))
		}
	}

	var timestamps []time.Time
	badValues := make([]int, 0)
	var values any
	values = reflect.MakeSlice(reflect.SliceOf(SliceType.Elem()), 0, 0).Interface()
	digitalStateValues := make([]int32, 0)

	for i, item := range items {
		var val reflect.Value
		val = reflect.ValueOf(item.Value)

		//handle value being a timestamp, the PIWab API returns a timestamp as a string
		// we need to convert it to a time.Time
		if SliceType == reflect.TypeOf([]time.Time{}) {
			var err error
			val, err = handleTimestampValue(val)
			if err != nil {
				continue
			}
		}

		// if the value is valid, get the underlying value
		// we need to complete both checks to prevent a panic on a null value
		if val.IsValid() && val.Kind() == reflect.Ptr {
			val = val.Elem()
		}

		if !val.IsValid() {
			timestamps = append(timestamps, item.getTimeStamp())
			badValues = append(badValues, i)
			zeroVal := reflect.Zero(SliceType.Elem())
			valuesValue := reflect.ValueOf(values)
			values = reflect.Append(valuesValue, zeroVal).Interface()
			continue
		}

		// if the value isn't good, or is not the same type as the slice,
		// add it to the list of bad values and nullify later
		//TODO we should make this pattern match the query options
		if val.Type().Kind() != SliceType.Elem().Kind() || digitalState || !item.isGood() {

			timestamps = append(timestamps, item.getTimeStamp())
			if digitalState {
				var pds PointDigitalState
				if b, err := json.Marshal(item.Value); err == nil {
					if err := json.Unmarshal(b, &pds); err != nil {
						backend.Logger.Info("Error unmarshalling digital state", err)
						badValues = append(badValues, i)
						zeroVal := reflect.Zero(SliceType.Elem())
						valuesValue := reflect.ValueOf(values)
						values = reflect.Append(valuesValue, zeroVal).Interface()
						continue
					}
					pdsValue := reflect.ValueOf(pds.Name)
					values = reflect.Append(reflect.ValueOf(values), pdsValue).Interface()
					digitalStateValues = append(digitalStateValues, int32(pds.Value))
					continue
				} else {
					backend.Logger.Info("Error unmarshalling digital state", err)
					badValues = append(badValues, i)
					zeroVal := reflect.Zero(SliceType.Elem())
					valuesValue := reflect.ValueOf(values)
					values = reflect.Append(valuesValue, zeroVal).Interface()
					continue
				}
			}

			badValues = append(badValues, i)
			zeroVal := reflect.Zero(SliceType.Elem())
			valuesValue := reflect.ValueOf(values)
			values = reflect.Append(valuesValue, zeroVal).Interface()
			continue
		}

		timestamps = append(timestamps, item.getTimeStamp())
		values = reflect.Append(reflect.ValueOf(values), val).Interface()
	}

	backend.Logger.Info("Converting slice to pointers")

	// Convert the slice of values to a slice of pointers to the values
	// This is so that we can nullify the values that are "bad"
	// "Bad" values are values such as system type values that cannot be represented
	// in the slice type, or values that are not "good"
	valuepointers := convertSliceToPointers(values, badValues)

	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, timestamps),
		data.NewField(frameName, nil, valuepointers),
	)

	if digitalState {
		frame.Fields = append(frame.Fields,
			data.NewField(frameName+".Value", nil, digitalStateValues),
		)
	}

	frame.Meta = &data.FrameMeta{}
	return frame, nil
}

func getTimeStamp(input reflect.Value) reflect.Value {
	if input.Kind() != reflect.String {
		// return an error value if the input is not a string
		return reflect.ValueOf(errors.New("input is not a string"))
	}

	// parse the timestamp string
	timeLayout := "2006-01-02T15:04:05.999999999Z07:00"
	timestamp, err := time.Parse(timeLayout, input.String())
	if err != nil {
		// return an error value if the timestamp string is invalid
		return reflect.ValueOf(err)
	}

	// return a reflect.Value of type time.Time
	return reflect.ValueOf(timestamp)
}
