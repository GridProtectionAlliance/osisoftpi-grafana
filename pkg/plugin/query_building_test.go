package plugin

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// jsonPathParameter is the only JSONPath form that every PI Web API version reads the same way: dot notation with
// a plain name. Dots, brackets, quotes and spaces in the name are read as JSONPath syntax (or rejected).
var jsonPathParameter = regexp.MustCompile(`^\$\.([A-Za-z_][A-Za-z0-9_]*)\.Content\.WebId$`)

// startJSONPathFake starts fakePIWebAPI behind a handler that checks the JSONPath Parameters of the batch requests:
// like PI Web API, a request whose parameter does not resolve to its parent's WebID gets no WebID.
func startJSONPathFake(t *testing.T, fake *fakePIWebAPI) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/batch") {
			var requests map[string]BatchSubRequest
			if err := json.NewDecoder(r.Body).Decode(&requests); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			for key, req := range requests {
				for i, parameter := range req.Parameters {
					match := jsonPathParameter.FindStringSubmatch(parameter)
					if match == nil || i >= len(req.ParentIds) || match[1] != req.ParentIds[i] {
						t.Logf("request %q: JSONPath %q does not resolve to its parent", key, parameter)
						req.Resource = strings.ReplaceAll(req.Resource, "{0}", "!unresolved")
						req.ParentIds, req.Parameters = nil, nil
						requests[key] = req
						break
					}
				}
			}
			body, err := json.Marshal(requests)
			if err != nil {
				t.Error(err)
				return
			}
			r.Body = io.NopCloser(bytes.NewReader(body))
		}
		fake.serve(w, r)
	}))
	t.Cleanup(server.Close)
	return server
}

// Grafana lets users rename a query to any text. The batch request keys and the JSONPath that passes the WebID to
// the data request must not depend on it: the query used to fail until its WebID was cached.
func TestRefIDWithJSONPathCharacters(t *testing.T) {
	fake := &fakePIWebAPI{attributes: map[string]fakeAttribute{`\\AF\DB\U-100\P-101|Flow`: {}}}
	server := startJSONPathFake(t, fake)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	refIDs := []string{"B", "Tank.Level", "A[0]", "it's", `say "hi"`, "Tank Level", `back\slash`, "A_Req1", "Req1"}
	raw, _ := json.Marshal(map[string]interface{}{"target": `AF\DB\U-100\P-101;Flow`})
	now := time.Now()
	queries := make([]backend.DataQuery, 0, len(refIDs))
	for _, refID := range refIDs {
		queries = append(queries, backend.DataQuery{RefID: refID, JSON: raw, MaxDataPoints: 100, Interval: time.Minute,
			TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}})
	}

	// the WebID is not cached: every query looks it up in the same batch as its data
	response := d.processBatchtoFrames(d.batchRequest(t.Context(), d.processQuery(queries, "uid")))
	for _, refID := range refIDs {
		r := response.Responses[refID]
		if r.Error != nil || len(r.Frames) != 1 {
			t.Errorf("query %q: error %v, %d frames", refID, r.Error, len(r.Frames))
			continue
		}
		if r.Frames[0].RefID != refID {
			t.Errorf("query %q: frame RefID %q", refID, r.Frames[0].RefID)
		}
	}
}

func recordedValuesQuery(maxNumber *int, enable bool) Query {
	q := Query{MaxDataPoints: 100}
	q.Pi.RecordedValues = &struct {
		Enable       *bool   `json:"enable"`
		MaxNumber    *int    `json:"maxNumber"`
		BoundaryType *string `json:"boundaryType"`
	}{Enable: &enable, MaxNumber: maxNumber}
	return q
}

// Without "Max Recorded Values", recorded values use PI Web API's default maxCount (1000, the placeholder of the
// query editor), not the panel's max data points, which silently cut the time range.
func TestRecordedValuesMaxCount(t *testing.T) {
	fifty, zero := 50, 0
	tests := []struct {
		name      string
		maxNumber *int
		want      string
	}{
		{name: "not set", want: "1000"},
		{name: "set", maxNumber: &fifty, want: "50"},
		{name: "zero", maxNumber: &zero, want: "1000"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := recordedValuesQuery(tt.maxNumber, true)
			uri := q.getQueryBaseURL()
			if !strings.HasPrefix(uri, "streamsets/recorded?") {
				t.Fatalf("not a recorded values request: %q", uri)
			}
			if got := queryParam(t, uri, "maxCount"); got != tt.want {
				t.Errorf("maxCount = %q, want %q (uri %q)", got, tt.want, uri)
			}
		})
	}

	// "Max Recorded Values" of a query whose recorded values are off does not change the plot intervals
	q := recordedValuesQuery(&fifty, false)
	if got := queryParam(t, q.getQueryBaseURL(), "intervals"); got != "100" {
		t.Errorf("plot intervals = %q, want the panel's max data points 100", got)
	}
}

// Summary durations, sample intervals and interpolation intervals are sent to PI Web API as entered (AFTimeSpan
// syntax), without replacing the ones the plugin does not know by 30s.
func TestTimeSpansAreSentAsEntered(t *testing.T) {
	enable, basis := true, "TimeWeighted"
	types := []SummaryType{{Value: SummaryTypeValue{Value: "Average"}}}
	for _, span := range []string{"30s", "1y", "1H", "1.5d", "2 hours", "1h30m", "1 hour 30 minutes", "3mo", " 1h ", "abc"} {
		t.Run(span, func(t *testing.T) {
			want := strings.TrimSpace(span)
			duration, interval := span, span
			q := Query{}
			q.Pi.Summary = &QuerySummary{Enable: &enable, Basis: &basis, Types: &types, Duration: &duration,
				SampleTypeInterval: &enable, SampleInterval: &interval}
			uri := q.getQueryBaseURL()
			if got := queryParam(t, uri, "summaryDuration"); got != want {
				t.Errorf("summaryDuration = %q, want %q (uri %q)", got, want, uri)
			}
			if got := queryParam(t, uri, "sampleInterval"); got != want {
				t.Errorf("sampleInterval = %q, want %q (uri %q)", got, want, uri)
			}

			interpolated := Query{}
			interpolated.Pi.Interpolate.Enable = true
			interpolated.Pi.Interpolate.Interval = span
			uri = interpolated.getQueryBaseURL()
			if got := queryParam(t, uri, "interval"); got != want {
				t.Errorf("interpolation interval = %q, want %q (uri %q)", got, want, uri)
			}
		})
	}
}

// The query model has fields the backend does not use: Grafana adds the panel's maxDataPoints, and dashboards saved
// by earlier Grafana versions have the datasource name as a string. Their values must not make the query invalid
// (the backend reads RefID, MaxDataPoints and the datasource from backend.DataQuery and the settings).
func TestUnusedQueryModelFieldsAreIgnored(t *testing.T) {
	d := newFakeDatasource("https://server", PIWebAPIDataSourceJsonData{})
	for _, extra := range []string{
		`"maxDataPoints":1234.5`,
		`"datasource":"PI Web API"`,
		`"datasourceId":"7"`,
		`"refId":1`,
		`"elementPath":{}`,
	} {
		t.Run(extra, func(t *testing.T) {
			processed := d.processQuery([]backend.DataQuery{{
				RefID: "A",
				JSON:  json.RawMessage(`{"target":"AF\\DB\\U-100\\P-101;Flow",` + extra + `}`),
			}}, "uid")
			if len(processed) != 1 || processed[0].Error != nil {
				t.Fatalf("expected one valid target, got %+v", processed)
			}
		})
	}
}
