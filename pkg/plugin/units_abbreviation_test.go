package plugin

import "testing"

// AF attributes report DefaultUnitsName as the full unit name ("cubic meter per hour") while PI points and the
// values returned by PI Web API carry the abbreviation ("m3/h"). The abbreviation is used, as for PI points.
func TestUnitsUseAbbreviation(t *testing.T) {
	fake := &fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\U-100\P-101|Flow`:  {units: "cubic meter per hour", abbreviation: "m3/h"},
		`\\AF\DB\U-100\P-101|Speed`: {units: "revolutions per minute"},
	}}
	server := fake.start(t)
	enabled := true

	tests := []struct {
		name      string
		attribute string
		newFormat bool
		want      string
	}{
		{name: "abbreviation returned with the values", attribute: "Flow", want: "m3/h"},
		{name: "abbreviation in the new data format labels", attribute: "Flow", newFormat: true, want: "m3/h"},
		{name: "no abbreviation: full unit name", attribute: "Speed", want: "revolutions per minute"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			newFormat := tt.newFormat
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{UseUnit: &enabled, NewFormat: &newFormat})
			r := runFakeQuery(t, d, map[string]interface{}{
				"target":  `AF\DB\U-100\P-101;` + tt.attribute,
				"useUnit": map[string]interface{}{"enable": true},
			})
			if r.Error != nil || len(r.Frames) != 1 {
				t.Fatalf("query failed: %v (%d frames)", r.Error, len(r.Frames))
			}
			field := r.Frames[0].Fields[1]
			if field.Config == nil || field.Config.Unit != tt.want {
				t.Errorf("field unit = %+v, want %q", field.Config, tt.want)
			}
			if tt.newFormat && field.Labels["units"] != tt.want {
				t.Errorf("units label = %q, want %q", field.Labels["units"], tt.want)
			}
		})
	}
}
