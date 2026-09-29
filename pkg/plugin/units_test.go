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

func TestConvertItemsToDataFrameUnits(t *testing.T) {
	enabled, disabled := true, false
	tests := []struct {
		name            string
		datasourceUnits *bool
		queryUnits      bool
		cachedUnits     string
		responseUnits   string // "-" for none; default "°C"
		wantUnit        string
		wantConfig      bool
	}{
		{name: "enabled in datasource and query: abbreviation from the values", datasourceUnits: &enabled, queryUnits: true, cachedUnits: "degree Celsius", wantUnit: "°C", wantConfig: true},
		{name: "no cached units: abbreviation from the values", datasourceUnits: &enabled, queryUnits: true, cachedUnits: "", wantUnit: "°C", wantConfig: true},
		{name: "no abbreviation: cached units", datasourceUnits: &enabled, queryUnits: true, cachedUnits: "degree Celsius", responseUnits: "-", wantUnit: "degree Celsius", wantConfig: true},
		{name: "disabled in query", datasourceUnits: &enabled, queryUnits: false, cachedUnits: "degree Celsius"},
		{name: "disabled in datasource", datasourceUnits: &disabled, queryUnits: true, cachedUnits: "degree Celsius"},
		{name: "not set in datasource", datasourceUnits: nil, queryUnits: true, cachedUnits: "degree Celsius"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newUnitsTestDatasource(tt.datasourceUnits, tt.cachedUnits)
			q := newUnitsTestQuery(tt.queryUnits)
			if tt.responseUnits == "-" {
				response := q.Response.(PiBatchDataWithoutSubItems)
				response.UnitsAbbreviation = ""
				q.Response = response
			}
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
