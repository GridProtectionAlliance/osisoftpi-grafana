package plugin

import (
	"encoding/json"
	"sync"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func newNilTestDatasource() *Datasource {
	return &Datasource{
		settings:          backend.DataSourceInstanceSettings{URL: "https://server/piwebapi"},
		webIDCache:        newWebIDCache(1),
		datasourceMutex:   &sync.Mutex{},
		dataSourceOptions: &PIWebAPIDataSourceJsonData{},
	}
}

func processTestQuery(t *testing.T, d *Datasource, query map[string]interface{}) []PiProcessedQuery {
	t.Helper()
	raw, err := json.Marshal(query)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	return d.processQuery([]backend.DataQuery{{
		RefID:         "A",
		JSON:          raw,
		MaxDataPoints: 500,
		Interval:      10 * time.Second,
		TimeRange:     backend.TimeRange{From: now.Add(-time.Hour), To: now},
	}}, "uid")
}

// Queries built outside the query editor (API calls, alert rules, hand-written or old dashboards) may omit the
// optional objects. The backend must not panic on them.
func TestProcessQueryWithMissingOptionalObjects(t *testing.T) {
	tests := []struct {
		name  string
		query map[string]interface{}
	}{
		{
			name: "no recordedValues, summary or other options",
			query: map[string]interface{}{
				"target":     `MyAFServer\MyDatabase\MyElement;MyAttribute`,
				"attributes": []map[string]interface{}{{"value": map[string]interface{}{"value": "MyAttribute"}}},
			},
		},
		{
			name: "recordedValues enabled without maxNumber and boundaryType",
			query: map[string]interface{}{
				"target":         `MyAFServer\MyDatabase\MyElement;MyAttribute`,
				"attributes":     []map[string]interface{}{{"value": map[string]interface{}{"value": "MyAttribute"}}},
				"recordedValues": map[string]interface{}{"enable": true},
			},
		},
		{
			name: "summary enabled without basis and types",
			query: map[string]interface{}{
				"target":     `MyAFServer\MyDatabase\MyElement;MyAttribute`,
				"attributes": []map[string]interface{}{{"value": map[string]interface{}{"value": "MyAttribute"}}},
				"summary":    map[string]interface{}{"enable": true},
			},
		},
		{
			name: "PI point without optional objects",
			query: map[string]interface{}{
				"target":     `PISERVER;SINUSOID`,
				"isPiPoint":  true,
				"attributes": []map[string]interface{}{{"value": map[string]interface{}{"value": "SINUSOID"}}},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			processed := processTestQuery(t, newNilTestDatasource(), tt.query)
			if len(processed) != 1 || processed[0].Error != nil {
				t.Fatalf("expected one valid processed query, got %+v", processed)
			}
			if len(processed[0].BatchRequest) == 0 {
				t.Fatalf("expected batch requests to be built")
			}
		})
	}
}

// The query from the issue report has no "attributes" array: the attributes are read from the target.
func TestProcessQueryAttributesFromTarget(t *testing.T) {
	processed := processTestQuery(t, newNilTestDatasource(), map[string]interface{}{
		"target":    `MyAFServer\MyDatabase\MyElement;MyAttribute;Other`,
		"isPiPoint": false,
	})
	if len(processed) != 2 {
		t.Fatalf("expected 2 processed queries, got %d: %+v", len(processed), processed)
	}
	if processed[0].FullTargetPath != `MyAFServer\MyDatabase\MyElement|MyAttribute` ||
		processed[1].FullTargetPath != `MyAFServer\MyDatabase\MyElement|Other` {
		t.Errorf("unexpected target paths %q, %q", processed[0].FullTargetPath, processed[1].FullTargetPath)
	}
}

func TestDataLabelsWithInvalidRegex(t *testing.T) {
	enable, search, replace := true, "(", "x"
	q := &PiProcessedQuery{
		Label:          "Temperature",
		FullTargetPath: `\\AF\DB\Element|Temperature`,
		Regex:          &Regex{Enable: &enable, Search: &search, Replace: &replace},
	}
	if got := getDataLabels(false, q, "Float32", "", "", "")["name"]; got != "Element|Temperature" {
		t.Errorf("label = %q, want the unmodified label", got)
	}
}
