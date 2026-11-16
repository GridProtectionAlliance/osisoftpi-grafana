package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// The error type, source and log level of each HTTP error status of PI Web API.
func TestErrorTypes(t *testing.T) {
	tests := []struct {
		status    int
		errorType string
		source    backend.ErrorSource
		level     string
	}{
		{http.StatusBadRequest, errBadRequest, backend.ErrorSourceDownstream, "warn"},
		{http.StatusUnauthorized, errAuth, backend.ErrorSourceDownstream, "error"},
		{http.StatusForbidden, errAuth, backend.ErrorSourceDownstream, "error"},
		{http.StatusNotFound, errNotFound, backend.ErrorSourceDownstream, "warn"},
		{http.StatusConflict, errPIWebAPI, backend.ErrorSourceDownstream, "error"},
		{http.StatusServiceUnavailable, errPIWebAPI, backend.ErrorSourceDownstream, "error"},
	}
	for _, tt := range tests {
		errorType := errorTypeForStatus(tt.status)
		if errorType != tt.errorType || errorSourceOf(errorType) != tt.source {
			t.Errorf("status %d: %s (%s), want %s (%s)", tt.status, errorType, errorSourceOf(errorType), tt.errorType, tt.source)
		}
		capture := &captureLogger{}
		logError(capture, "test", errorType)
		if capture.entries[0].level != tt.level {
			t.Errorf("%s logged at %s, want %s", errorType, capture.entries[0].level, tt.level)
		}
	}
	for _, errorType := range []string{errResponseDecode, errValueConversion, errStreamSend, errInternal} {
		if errorSourceOf(errorType) != backend.ErrorSourcePlugin {
			t.Errorf("%s is not a plugin error", errorType)
		}
	}
}

// fakeQueryEntries runs a query with captured logs and returns its response and the log lines with the message msg.
func fakeQueryEntries(t *testing.T, d *Datasource, target string, msg string) (backend.DataResponse, []logEntry) {
	capture := captureBackendLogs(t)
	r := runFakeQuery(t, d, map[string]interface{}{"target": target})
	var entries []logEntry
	for _, e := range capture.entries {
		if e.msg == msg {
			entries = append(entries, e)
		}
	}
	return r, entries
}

// A batch request rejected by PI Web API (e.g. 401) is logged with its status and the PI Web API message, while the
// query still returns 502 to Grafana (see PiProcessedQuery.RequestStatus).
func TestBatchRequestRejectedIsLoggedAsAuth(t *testing.T) {
	server := (&fakePIWebAPI{status: http.StatusUnauthorized}).start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	r, failures := fakeQueryEntries(t, d, `AF\DB\E;Level`, "query_target_failed")
	if len(failures) != 1 {
		t.Fatalf("expected one failing target, got %+v", failures)
	}
	f := failures[0].args
	if failures[0].level != "error" || f["errorType"] != errAuth || f["status"] != http.StatusUnauthorized {
		t.Errorf("%s %v (status %v), want error auth (401)", failures[0].level, f["errorType"], f["status"])
	}
	if !strings.Contains(f["error"].(string), "Authorization has been denied") {
		t.Errorf("the PI Web API message is not logged: %v", f["error"])
	}
	if r.Status != backend.StatusBadGateway || r.ErrorSource != backend.ErrorSourceDownstream {
		t.Errorf("response status %d, source %q, want 502 downstream", r.Status, r.ErrorSource)
	}
}

// A PI Web API that does not answer is logged as piwebapi_unreachable.
func TestUnreachablePIWebAPI(t *testing.T) {
	server := (&fakePIWebAPI{}).start(t)
	server.Close()
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	_, failures := fakeQueryEntries(t, d, `AF\DB\E;Level`, "query_target_failed")
	if len(failures) != 1 || failures[0].args["errorType"] != errUnreachable || failures[0].level != "error" {
		t.Fatalf("expected one piwebapi_unreachable error, got %+v", failures)
	}
}

// A PI Web API response the plugin cannot read fails the target (it returned an empty series before), and the
// start of the response is logged, not the decoded response.
func TestUnreadableResponseFailsTheTarget(t *testing.T) {
	unreadable := `{"Links": {}, "Unexpected": "` + strings.Repeat("x", 2000) + `"}`
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var requests map[string]BatchSubRequest
		_ = json.NewDecoder(r.Body).Decode(&requests)
		responses := map[string]json.RawMessage{}
		for key := range requests {
			if strings.HasSuffix(key, "_Data") {
				responses[key] = json.RawMessage(`{"Status": 200, "Content": ` + unreadable + `}`)
			} else {
				responses[key] = json.RawMessage(`{"Status": 200, "Content": {"WebId": "W1", "Name": "Level", "Type": "Double"}}`)
			}
		}
		w.WriteHeader(http.StatusMultiStatus)
		_ = json.NewEncoder(w).Encode(responses)
	}))
	t.Cleanup(server.Close)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	capture := captureBackendLogs(t)
	r := runFakeQuery(t, d, map[string]interface{}{"target": `AF\DB\E;Level`})
	if r.Error == nil || r.ErrorSource != backend.ErrorSourcePlugin {
		t.Fatalf("the target did not fail with a plugin error: %v (%q)", r.Error, r.ErrorSource)
	}
	var failed, detail bool
	for _, e := range capture.entries {
		switch e.msg {
		case "query_target_failed":
			failed = e.args["errorType"] == errResponseDecode
		case "piwebapi_response_unreadable":
			body, _ := e.args["body"].(string)
			detail = e.args["reason"] == "no Items in Content" && len(body) <= maxLoggedBody+len("…") &&
				strings.HasSuffix(body, "…") && e.args["bodySize"].(int) > maxLoggedBody
		}
	}
	if !failed || !detail {
		t.Errorf("response_decode failure (%v) or detail with a body excerpt (%v) not logged: %+v", failed, detail, capture.entries)
	}
}

// A value that does not fit the series type (a number for a DateTime attribute) is logged with the value, its kind,
// quality and the declared type, at warn level.
func TestValueConversionIsLoggedWithTheValue(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\E|Started`: {valueType: strPtr("DateTime"), values: []interface{}{"2026-11-15T10:00:00Z", 0}},
	}}).start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	_, failures := fakeQueryEntries(t, d, `AF\DB\E;Started`, "value_conversion_failed")
	if len(failures) != 1 {
		t.Fatalf("expected one value_conversion_failed line, got %+v", failures)
	}
	f := failures[0].args
	want := map[string]any{"errorType": errValueConversion, "errorSource": "plugin", "valueType": "DateTime", "value": "0",
		"valueKind": "number", "good": true, "target": `AF\DB\E|Started`, "refId": "A"}
	for key, value := range want {
		if f[key] != value {
			t.Errorf("%s = %v, want %v", key, f[key], value)
		}
	}
	if failures[0].level != "warn" {
		t.Errorf("logged at %s, want warn", failures[0].level)
	}
}

// A query cancelled by Grafana (the panel was refreshed or closed) is not logged as a failure of PI Web API.
func TestCancelledQueryIsNotAFailure(t *testing.T) {
	server := (&fakePIWebAPI{}).start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
	capture := captureBackendLogs(t)

	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	raw, _ := json.Marshal(map[string]interface{}{"target": `AF\DB\E;Level`})
	now := time.Now()
	processed := d.processQuery(ctx, []backend.DataQuery{{RefID: "A", JSON: raw, MaxDataPoints: 100, Interval: time.Minute,
		TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}}}, "uid")
	d.processBatchtoFrames(ctx, d.batchRequest(ctx, processed))

	for _, e := range capture.entries {
		if e.level == "error" || e.level == "warn" {
			t.Errorf("cancelled query logged as %s: %s %+v", e.level, e.msg, e.args)
		}
	}
}

// Excerpts are cut at a character boundary, and body excerpts are on one line.
func TestExcerpts(t *testing.T) {
	if got := excerpt("ação", 2); got != "a…" {
		t.Errorf("excerpt cut inside a character: %q", got)
	}
	if got := excerpt("short", 10); got != "short" {
		t.Errorf("short text changed: %q", got)
	}
	if got := bodyExcerpt([]byte("{\n  \"Errors\":\t[\"x\"]\n}")); got != `{ "Errors": ["x"] }` {
		t.Errorf("body excerpt = %q", got)
	}
	if got := piWebAPIErrorText([]byte(`{"Errors": ["a", "b"]}`)); got != "a; b" {
		t.Errorf("PI Web API errors = %q", got)
	}
	if got := piWebAPIErrorText([]byte(`<html>401</html>`)); got != "" {
		t.Errorf("HTML error page = %q", got)
	}
}
