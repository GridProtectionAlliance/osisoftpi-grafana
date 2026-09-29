package plugin

import (
	"reflect"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// With "Digital States" on, bad values (system states such as "Shutdown", Good=false) must follow the
// "Replace Bad Data" option like numeric values, and keep the time and value fields the same length: a frame
// with different field lengths makes the SDK fail the whole response.
func TestDigitalStatesWithBadValues(t *testing.T) {
	running := map[string]interface{}{"Name": "Running", "Value": 1, "IsSystem": false}
	stopped := map[string]interface{}{"Name": "Stopped", "Value": 0, "IsSystem": false}
	shutdown := map[string]interface{}{"Name": "Shutdown", "Value": 254, "IsSystem": true}
	fake := &fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\P|Status`:  {valueType: strPtr("EnumerationValue"), values: []interface{}{shutdown, running, shutdown, stopped}},
		`\\AF\DB\P|Flow`:    {valueType: strPtr("Double"), values: []interface{}{1.5, shutdown}},
		`\\AF\DB\P|Unknown`: {valueType: strPtr(""), values: []interface{}{running, shutdown}},
	}}
	server := fake.start(t)

	tests := []struct {
		attribute string
		nodata    string
		wantType  data.FieldType
		want      []interface{}
	}{
		{attribute: "Status", nodata: "Null", wantType: data.FieldTypeNullableString, want: []interface{}{nil, "Running", nil, "Stopped"}},
		{attribute: "Status", nodata: "Previous", wantType: data.FieldTypeNullableString, want: []interface{}{nil, "Running", "Running", "Stopped"}},
		{attribute: "Status", nodata: "Drop", wantType: data.FieldTypeNullableString, want: []interface{}{"Running", "Stopped"}},
		{attribute: "Unknown", nodata: "Null", wantType: data.FieldTypeNullableString, want: []interface{}{"Running", nil}},
		// a numeric attribute whose last value is bad is not a digital state
		{attribute: "Flow", nodata: "Null", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, nil}},
	}
	for _, tt := range tests {
		t.Run(tt.attribute+" "+tt.nodata, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
			r := runFakeQueryNoPanic(t, d, map[string]interface{}{
				"target":        `AF\DB\P;` + tt.attribute,
				"nodata":        tt.nodata,
				"digitalStates": map[string]interface{}{"enable": true},
			})
			if r.Error != nil || len(r.Frames) != 1 {
				t.Fatalf("query failed: %v (%d frames)", r.Error, len(r.Frames))
			}
			if _, err := r.Frames.MarshalArrow(); err != nil {
				t.Fatalf("frame cannot be serialized: %v", err)
			}
			field := r.Frames[0].Fields[1]
			if field.Type() != tt.wantType {
				t.Errorf("field type = %s, want %s", field.Type(), tt.wantType)
			}
			if got := fieldValues(field); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("values = %#v, want %#v", got, tt.want)
			}
		})
	}
}
