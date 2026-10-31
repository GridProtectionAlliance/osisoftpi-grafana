package plugin

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// An invalid query must report its error and must not stop the other queries of the request.
func TestInvalidQueryDoesNotDropOtherQueries(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{`\\AF\DB\E|Level`: {}}}).start(t)
	valid := map[string]interface{}{"target": `AF\DB\E;Level`}

	tests := []struct {
		name    string
		invalid map[string]interface{}
		wantErr string
	}{
		{name: "target without attribute", invalid: map[string]interface{}{"target": `AF\DB\E;`}, wantErr: "no targets found"},
		{name: "target is not a string", invalid: map[string]interface{}{"target": 5}, wantErr: "error while processing the query"},
		{name: "too many targets", invalid: map[string]interface{}{"target": `AF\DB\{` + strings.Repeat("E,", 1000) + `E};Level`},
			wantErr: "too many targets"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
			now := time.Now()
			var queries []backend.DataQuery
			for refID, q := range map[string]map[string]interface{}{"A": tt.invalid, "B": valid} {
				raw, _ := json.Marshal(q)
				queries = append(queries, backend.DataQuery{RefID: refID, JSON: raw, MaxDataPoints: 100, Interval: time.Minute,
					TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}})
			}
			// the invalid query first
			if queries[0].RefID != "A" {
				queries[0], queries[1] = queries[1], queries[0]
			}
			resp, err := d.QueryTSData(t.Context(), &backend.QueryDataRequest{
				PluginContext: backend.PluginContext{DataSourceInstanceSettings: &backend.DataSourceInstanceSettings{UID: "uid"}},
				Queries:       queries,
			})
			if err != nil {
				t.Fatal(err)
			}
			a, b := resp.Responses["A"], resp.Responses["B"]
			if a.Error == nil || !strings.Contains(a.Error.Error(), tt.wantErr) {
				t.Errorf("query A: expected error %q, got %v", tt.wantErr, a.Error)
			}
			if a.Status != backend.StatusBadRequest {
				t.Errorf("query A: status %d, want 400", a.Status)
			}
			if b.Error != nil || len(b.Frames) != 1 {
				t.Errorf("query B: expected 1 frame, got %d (error %v)", len(b.Frames), b.Error)
			}
		})
	}
}
