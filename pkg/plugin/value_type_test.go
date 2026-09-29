package plugin

import (
	"reflect"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func strPtr(s string) *string { return &s }

// fieldValues returns the values of a frame field, dereferencing nullable values.
func fieldValues(f *data.Field) []interface{} {
	values := make([]interface{}, 0, f.Len())
	for i := 0; i < f.Len(); i++ {
		v, ok := f.ConcreteAt(i)
		if !ok {
			v = nil
		}
		values = append(values, v)
	}
	return values
}

// Attributes whose value type is "<Anything>" (empty Type, e.g. AF links) take the type of the values returned
// by PI Web API instead of being treated as strings ("Data is missing a number field", issue GridProtectionAlliance/osisoftpi-grafana#173).
func TestAttributeValueTypeFromValues(t *testing.T) {
	running := map[string]interface{}{"Name": "Running", "Value": 1, "IsSystem": false}
	stopped := map[string]interface{}{"Name": "Stopped", "Value": 0, "IsSystem": false}
	fake := &fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\E|Anything number`:  {valueType: strPtr("")},
		`\\AF\DB\E|Anything integer`: {valueType: strPtr(""), values: []interface{}{3, 4}},
		`\\AF\DB\E|Anything text`:    {valueType: strPtr(""), values: []interface{}{"Open", "Closed"}},
		`\\AF\DB\E|Anything bool`:    {valueType: strPtr(""), values: []interface{}{true, false}},
		`\\AF\DB\E|Anything state`:   {valueType: strPtr(""), values: []interface{}{running, stopped}},
		`\\AF\DB\E|Anything bad first`: {valueType: strPtr(""), values: []interface{}{
			map[string]interface{}{"Name": "Bad Input", "Value": 307, "IsSystem": true}, 2.5}},
		`\\AF\DB\E|Anything named`:      {valueType: strPtr("Anything"), values: []interface{}{2}},
		`\\AF\DB\E|Anything named text`: {valueType: strPtr("Anything"), values: []interface{}{"Normal operation"}},
		`\\AF\DB\E|Unknown type`:        {valueType: strPtr("SomeNewType"), values: []interface{}{7.5, 8.5}},
		`\\AF\DB\E|Single`:              {valueType: strPtr("Single")},
		`\\AF\DB\E|String`:              {valueType: strPtr("String"), values: []interface{}{"a", "b"}},
	}}
	server := fake.start(t)

	tests := []struct {
		attribute     string
		digitalStates bool
		wantType      data.FieldType
		want          []interface{}
	}{
		{attribute: "Anything number", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, 2.5}},
		{attribute: "Anything integer", wantType: data.FieldTypeNullableFloat64, want: []interface{}{3.0, 4.0}},
		{attribute: "Anything text", wantType: data.FieldTypeNullableString, want: []interface{}{"Open", "Closed"}},
		{attribute: "Anything bool", wantType: data.FieldTypeNullableBool, want: []interface{}{true, false}},
		{attribute: "Anything state", wantType: data.FieldTypeNullableInt32, want: []interface{}{int32(1), int32(0)}},
		{attribute: "Anything state", digitalStates: true, wantType: data.FieldTypeNullableString, want: []interface{}{"Running", "Stopped"}},
		{attribute: "Anything bad first", wantType: data.FieldTypeNullableFloat64, want: []interface{}{nil, 2.5}},
		// some PI Web API versions report <Anything> as the type name "Anything" instead of an empty type
		{attribute: "Anything named", wantType: data.FieldTypeNullableFloat64, want: []interface{}{2.0}},
		{attribute: "Anything named text", wantType: data.FieldTypeNullableString, want: []interface{}{"Normal operation"}},
		{attribute: "Unknown type", wantType: data.FieldTypeNullableFloat64, want: []interface{}{7.5, 8.5}},
		// declared types are unchanged
		{attribute: "Single", wantType: data.FieldTypeNullableFloat64, want: []interface{}{1.5, 2.5}},
		{attribute: "String", wantType: data.FieldTypeNullableString, want: []interface{}{"a", "b"}},
	}
	for _, tt := range tests {
		name := tt.attribute
		if tt.digitalStates {
			name += " (digital states)"
		}
		t.Run(name, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
			r := runFakeQuery(t, d, map[string]interface{}{
				"target":        `AF\DB\E;` + tt.attribute,
				"digitalStates": map[string]interface{}{"enable": tt.digitalStates},
			})
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
		})
	}
}
