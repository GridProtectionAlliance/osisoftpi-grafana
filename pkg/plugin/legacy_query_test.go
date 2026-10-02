package plugin

import (
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// Saved panel queries of plugin versions 4.x and 5.0 (issue GridProtectionAlliance/osisoftpi-grafana#194): the summary was enabled by selecting summary
// types, its duration was "interval", and "nodata" (Replace Bad Data) was part of the summary.
func TestLegacySummaryQueries(t *testing.T) {
	tests := []struct {
		name          string
		query         string
		wantSummary   string // part of the data request, "" when the query must not be summarized
		wantNoSummary bool
		wantNodata    string
	}{
		{
			name: "4.x AF query with summary",
			query: `{"refId":"A","target":"AF\\DB\\E;Level","elementPath":"AF\\DB\\E","isPiPoint":false,
				"attributes":[{"label":"Level","value":{"value":"Level","expandable":false}}],
				"segments":[{"label":"AF","value":{"value":"AF","expandable":true}}],
				"summary":{"types":[{"label":"Average","value":{"value":"Average","expandable":true}}],
					"basis":"TimeWeighted","interval":"1h","nodata":"Previous"},
				"interpolate":{"enable":false},"recordedValues":{"enable":false},"useLastValue":{"enable":false},
				"digitalStates":{"enable":false},"useUnit":{"enable":false},"regex":{"enable":false},"expression":""}`,
			wantSummary: "/summary?",
			wantNodata:  "Previous",
		},
		{
			name: "5.0 PI point query with summary without duration",
			query: `{"refId":"A","target":"PISRV;SINUSOID","isPiPoint":true,
				"attributes":[{"label":"SINUSOID","value":{"value":"SINUSOID","expandable":false}}],
				"segments":[{"label":"PISRV","value":{"value":"PISRV","webId":"F1DS","expandable":false}}],
				"summary":{"types":[{"label":"Maximum","value":{"value":"Maximum","expandable":true}}],
					"basis":"EventWeighted","interval":"","nodata":"Null"},
				"enableStreaming":{"enable":false}}`,
			wantSummary: "summaryType=Maximum",
			wantNodata:  "Null",
		},
		{
			name: "4.x query re-saved by 5.1 or 5.2",
			query: `{"refId":"A","target":"AF\\DB\\E;Level",
				"attributes":[{"label":"Level","value":{"value":"Level"}}],
				"summary":{"enable":false,"duration":"","sampleTypeInterval":false,"sampleInterval":"",
					"types":[{"label":"Average","value":{"value":"Average"}}],"basis":"TimeWeighted","interval":"30m","nodata":"Drop"}}`,
			wantSummary: "summaryDuration=30m",
			wantNodata:  "Drop",
		},
		{
			name: "4.x query without summary",
			query: `{"refId":"A","target":"AF\\DB\\E;Level","attributes":[{"label":"Level","value":{"value":"Level"}}],
				"summary":{"types":[],"basis":"EventWeighted","interval":"","nodata":"Zero"}}`,
			wantNoSummary: true,
			wantNodata:    "Zero",
		},
		{
			name: "Replace Bad Data set after the upgrade wins",
			query: `{"refId":"A","target":"AF\\DB\\E;Level","attributes":[{"label":"Level","value":{"value":"Level"}}],
				"nodata":"Previous","summary":{"types":[],"basis":"EventWeighted","interval":"","nodata":"Zero"}}`,
			wantNoSummary: true,
			wantNodata:    "Previous",
		},
		{
			name: "Replace Bad Data defaulted by the query editor",
			query: `{"refId":"A","target":"AF\\DB\\E;Level","attributes":[{"label":"Level","value":{"value":"Level"}}],
				"nodata":"Null","summary":{"types":[],"basis":"EventWeighted","interval":"","nodata":"Previous"}}`,
			wantNoSummary: true,
			wantNodata:    "Previous",
		},
		{
			name: "current query with the summary disabled",
			query: `{"refId":"A","target":"AF\\DB\\E;Level","attributes":[{"label":"Level","value":{"value":"Level"}}],
				"nodata":"Null","summary":{"enable":false,"duration":"1h","basis":"EventWeighted",
					"types":[{"label":"Average","value":{"value":"Average"}}]}}`,
			wantNoSummary: true,
			wantNodata:    "Null",
		},
	}

	d := newFakeDatasource("http://pi", PIWebAPIDataSourceJsonData{})
	now := time.Now()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			processed := d.processQuery([]backend.DataQuery{{
				RefID: "A", JSON: []byte(tt.query), MaxDataPoints: 100,
				TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now},
			}}, "uid")
			if len(processed) != 1 || processed[0].Error != nil {
				t.Fatalf("unexpected processed queries: %+v", processed)
			}
			q := processed[0]
			if tt.wantNoSummary {
				if strings.Contains(q.Resource, "/summary") {
					t.Errorf("query must not be summarized: %s", q.Resource)
				}
			} else if !strings.Contains(q.Resource, "/summary") || !strings.Contains(q.Resource, tt.wantSummary) {
				t.Errorf("request %s, want a summary with %q", q.Resource, tt.wantSummary)
			}
			if got := q.getNoDataReplace(); got != tt.wantNodata {
				t.Errorf("Replace Bad Data = %q, want %q", got, tt.wantNodata)
			}
		})
	}
}
