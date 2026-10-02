package plugin

import (
	"sync"
	"testing"
	"time"
)

func newUnitsTestDatasource(useUnit *bool, units string) *Datasource {
	d := &Datasource{
		webIDCache:        newWebIDCache(1),
		datasourceMutex:   &sync.Mutex{},
		dataSourceOptions: &PIWebAPIDataSourceJsonData{UseUnit: useUnit},
	}
	d.saveWebID(map[string]interface{}{
		"WebId":            "W1",
		"Name":             "Temperature",
		"Path":             `\\AF\DB\Element|Temperature`,
		"Type":             "Double",
		"DefaultUnitsName": units,
		"Description":      "Inlet temperature",
	}, `AF\DB\Element|Temperature`, false)
	return d
}

func newUnitsTestQuery(useUnit bool) *PiProcessedQuery {
	now := time.Now()
	return &PiProcessedQuery{
		Label:   "Temperature",
		WebID:   "W1",
		UseUnit: useUnit,
		Response: PiBatchDataWithoutSubItems{
			Items: []PiBatchContentItem{
				{Timestamp: now.Add(-time.Minute), Value: 20.5, Good: true},
				{Timestamp: now, Value: 21.0, Good: true},
			},
			UnitsAbbreviation: "°C",
		},
	}
}

// Units are added only when enabled in the datasource and in the query, with the description of the WebID.
func TestConvertItemsToDataFrameUnits(t *testing.T) {
	enabled, disabled := true, false
	tests := []struct {
		name            string
		datasourceUnits *bool
		queryUnits      bool
		cachedUnits     string
		wantUnit        string
		wantConfig      bool
	}{
		{name: "no cached units: abbreviation from the values", datasourceUnits: &enabled, queryUnits: true, cachedUnits: "", wantUnit: "°C", wantConfig: true},
		{name: "disabled in query", datasourceUnits: &enabled, queryUnits: false, cachedUnits: "degree Celsius"},
		{name: "disabled in datasource", datasourceUnits: &disabled, queryUnits: true, cachedUnits: "degree Celsius"},
		{name: "not set in datasource", datasourceUnits: nil, queryUnits: true, cachedUnits: "degree Celsius"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newUnitsTestDatasource(tt.datasourceUnits, tt.cachedUnits)
			q := newUnitsTestQuery(tt.queryUnits)
			frame := convertItemsToDataFrame(q, d, "")
			if len(frame.Fields) != 2 {
				t.Fatalf("expected 2 fields, got %d", len(frame.Fields))
			}
			valueField := frame.Fields[1]
			if valueField.Len() != 2 {
				t.Fatalf("expected 2 values, got %d", valueField.Len())
			}
			if !tt.wantConfig {
				if valueField.Config != nil && valueField.Config.Unit != "" {
					t.Fatalf("expected no unit, got %q", valueField.Config.Unit)
				}
				return
			}
			if valueField.Config == nil {
				t.Fatalf("expected field config with unit %q, got nil", tt.wantUnit)
			}
			if valueField.Config.Unit != tt.wantUnit {
				t.Errorf("unit = %q, want %q", valueField.Config.Unit, tt.wantUnit)
			}
			if valueField.Config.Description != "Inlet temperature" {
				t.Errorf("description = %q, want %q", valueField.Config.Description, "Inlet temperature")
			}
		})
	}
}

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
