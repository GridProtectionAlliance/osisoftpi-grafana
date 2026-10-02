package plugin

import (
	"reflect"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

var badInput = map[string]interface{}{"Name": "Bad Input", "Value": 307, "IsSystem": true}

// runFakeQueryNoPanic runs a query and turns a panic into a test failure.
func runFakeQueryNoPanic(t *testing.T, d *Datasource, query map[string]interface{}) (r backend.DataResponse) {
	t.Helper()
	defer func() {
		if p := recover(); p != nil {
			t.Fatalf("query panicked: %v", p)
		}
	}()
	return runFakeQuery(t, d, query)
}

// Replace Bad Data: "Previous" repeats the last good value, and leaves a gap when there is none yet; "Null" leaves a
// gap; "Drop" removes the value; "0" replaces it with zero; "Keep" keeps the value returned by PI Web API (the code
// of a system state such as "Bad Input" in numeric series, its name in text series). A DateTime value that is not
// a time stamp is replaced like any bad value.
func TestNoDataReplace(t *testing.T) {
	fake := &fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\E|Int32`:    {valueType: strPtr("Int32"), values: []interface{}{5, badInput, 7}},
		`\\AF\DB\E|BadFirst`: {valueType: strPtr("Double"), values: []interface{}{badInput, 2.5}},
		`\\AF\DB\E|Double`:   {valueType: strPtr("Double"), values: []interface{}{1.5, badInput, 2.5}},
		`\\AF\DB\E|Anything`: {valueType: strPtr(""), values: []interface{}{1.5, badInput, 2.5}},
		// a value that is not a timestamp and a bad value are both replaced like any bad value
		`\\AF\DB\E|Times`: {valueType: strPtr("DateTime"), values: []interface{}{
			"2026-09-27T10:00:00Z", "not a time", badInput, "2026-09-27T11:00:00Z"}},
		`\\AF\DB\E|NullGaps`: {valueType: strPtr("Double"), values: []interface{}{badInput, 1.5, badInput, 2.5}},
		`\\AF\DB\E|Text`:     {valueType: strPtr("String"), values: []interface{}{"Open", badInput}},
		`\\AF\DB\E|Status`: {valueType: strPtr("EnumerationValue"), values: []interface{}{
			map[string]interface{}{"Name": "Running", "Value": 1, "IsSystem": false}, badInput}},
	}}
	server := fake.start(t)

	tests := []struct {
		attribute string
		nodata    string
		wantType  data.FieldType
		want      []interface{}
	}{
		{attribute: "Int32", nodata: "Previous", wantType: data.FieldTypeNullableInt32, want: []interface{}{int32(5), int32(5), int32(7)}},
		{attribute: "BadFirst", nodata: "Previous", wantType: data.FieldTypeNullableFloat64, want: []interface{}{nil, 2.5}},
		{attribute: "Double", nodata: "Previous", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, 1.5, 2.5}},
		{attribute: "Anything", nodata: "Previous", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, 1.5, 2.5}},
		{attribute: "Times", nodata: "Null", wantType: data.FieldTypeNullableTime, want: []interface{}{
			time.Date(2026, 9, 27, 10, 0, 0, 0, time.UTC), nil, nil, time.Date(2026, 9, 27, 11, 0, 0, 0, time.UTC)}},
		{attribute: "NullGaps", nodata: "Null", wantType: data.FieldTypeNullableFloat64, want: []interface{}{nil, 1.5, nil, 2.5}},
		{attribute: "NullGaps", nodata: "Drop", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, 2.5}},
		{attribute: "Double", nodata: "0", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, 0.0, 2.5}},
		{attribute: "Double", nodata: "Keep", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, 307.0, 2.5}},
		{attribute: "Int32", nodata: "Keep", wantType: data.FieldTypeNullableInt32, want: []interface{}{int32(5), int32(307), int32(7)}},
		{attribute: "Text", nodata: "Keep", wantType: data.FieldTypeNullableString, want: []interface{}{"Open", "Bad Input"}},
		{attribute: "Status", nodata: "Keep", wantType: data.FieldTypeNullableInt32, want: []interface{}{int32(1), int32(307)}},
		// a state cannot be kept in a time series, nor a value that is not a time stamp
		{attribute: "Times", nodata: "Keep", wantType: data.FieldTypeNullableTime, want: []interface{}{
			time.Date(2026, 9, 27, 10, 0, 0, 0, time.UTC), nil, nil, time.Date(2026, 9, 27, 11, 0, 0, 0, time.UTC)}},
	}
	for _, tt := range tests {
		t.Run(tt.attribute+" "+tt.nodata, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
			r := runFakeQueryNoPanic(t, d, map[string]interface{}{"target": `AF\DB\E;` + tt.attribute, "nodata": tt.nodata})
			if r.Error != nil || len(r.Frames) != 1 {
				t.Fatalf("query failed: %v (%d frames)", r.Error, len(r.Frames))
			}
			field := r.Frames[0].Fields[1]
			if field.Type() != tt.wantType {
				t.Errorf("field type = %s, want %s", field.Type(), tt.wantType)
			}
			if got := fieldValues(field); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("values = %#v, want %#v", got, tt.want)
			}
			if r.Frames[0].Fields[0].Len() != field.Len() {
				t.Errorf("time has %d values, value field %d", r.Frames[0].Fields[0].Len(), field.Len())
			}
		})
	}
}
