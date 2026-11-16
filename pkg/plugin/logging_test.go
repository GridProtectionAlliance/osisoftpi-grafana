package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"reflect"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// contextCaptureLogger records the log lines with the contextual attributes of the context they are logged with,
// as the SDK logger does.
type contextCaptureLogger struct {
	*captureLogger
	attributes []any
}

func (l contextCaptureLogger) with(args []any) []any {
	return append(append([]any{}, args...), l.attributes...)
}
func (l contextCaptureLogger) Debug(msg string, args ...any) { l.add("debug", msg, l.with(args)) }
func (l contextCaptureLogger) Info(msg string, args ...any)  { l.add("info", msg, l.with(args)) }
func (l contextCaptureLogger) Warn(msg string, args ...any)  { l.add("warn", msg, l.with(args)) }
func (l contextCaptureLogger) Error(msg string, args ...any) { l.add("error", msg, l.with(args)) }
func (l contextCaptureLogger) With(args ...any) log.Logger {
	return contextCaptureLogger{l.captureLogger, l.with(args)}
}
func (l contextCaptureLogger) FromContext(ctx context.Context) log.Logger {
	return l.With(log.ContextualAttributesFromContext(ctx)...)
}

func captureContextLogs(t *testing.T) *captureLogger {
	capture := &captureLogger{}
	previous := backend.Logger
	backend.Logger = contextCaptureLogger{captureLogger: capture}
	t.Cleanup(func() { backend.Logger = previous })
	return capture
}

// dashboardRequest is a query request of a dashboard panel, with the headers set by Grafana.
func dashboardRequest(t *testing.T, target string) *backend.QueryDataRequest {
	raw, err := json.Marshal(map[string]interface{}{"target": target})
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &backend.DataSourceInstanceSettings{UID: "uid"}},
		Queries: []backend.DataQuery{{RefID: "A", JSON: raw, MaxDataPoints: 100, Interval: time.Minute,
			TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}}},
	}
	req.SetHTTPHeader("X-Dashboard-Uid", "plant-1")
	req.SetHTTPHeader("X-Dashboard-Title", "Plant overview")
	req.SetHTTPHeader("X-Panel-Id", "4")
	req.SetHTTPHeader("X-Panel-Title", "Flow")
	return req
}

func targetFailures(capture *captureLogger) []logEntry {
	var failures []logEntry
	for _, e := range capture.entries {
		if e.msg == "query_target_failed" {
			failures = append(failures, e)
		}
	}
	return failures
}

// The errors of a dashboard query name the dashboard and the panel, so that the failing panel can be found.
func TestQueryErrorsLogTheDashboardAndPanel(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\E|Level`: {dataStatus: http.StatusBadRequest},
	}}).start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
	capture := captureContextLogs(t)

	if _, err := d.QueryTSData(t.Context(), dashboardRequest(t, `AF\DB\E;Level`)); err != nil {
		t.Fatal(err)
	}
	failures := targetFailures(capture)
	if len(failures) != 1 {
		t.Fatalf("expected one failing target, got %+v", capture.entries)
	}
	want := map[string]any{"dashboardUID": "plant-1", "dashboardTitle": "Plant overview", "panelID": "4", "panelTitle": "Flow"}
	for key, value := range want {
		if got := failures[0].args[key]; got != value {
			t.Errorf("%s = %v, want %v (fields %+v)", key, got, value, failures[0].args)
		}
	}
}

// Queries from Explore or alert rules have no dashboard: their errors are logged without dashboard fields.
func TestQueryErrorsWithoutDashboard(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\E|Level`: {dataStatus: http.StatusBadRequest},
	}}).start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
	capture := captureContextLogs(t)

	req := dashboardRequest(t, `AF\DB\E;Level`)
	req.Headers = nil
	if _, err := d.QueryTSData(t.Context(), req); err != nil {
		t.Fatal(err)
	}
	failures := targetFailures(capture)
	if len(failures) != 1 {
		t.Fatalf("expected one failing target, got %+v", capture.entries)
	}
	for _, key := range []string{"dashboardUID", "dashboardTitle", "panelID", "panelTitle"} {
		if _, ok := failures[0].args[key]; ok {
			t.Errorf("%s logged for a query without dashboard: %+v", key, failures[0].args)
		}
	}
}

// Grafana runs a stream without the query headers: the channel keeps the dashboard and panel of the query that
// registered it, and its stream logs them.
func TestStreamChannelKeepsTheDashboardOfItsQuery(t *testing.T) {
	d := newTestDatasource()
	ctx := withDashboardLogAttributes(t.Context(), dashboardRequest(t, `AF\DB\E;Level`))

	path := d.registerStreamChannel(ctx, makeTestQuery("W1"), nil, "W1", []string{"W1"})
	construct, ok := d.streamChannel(path)
	if !ok {
		t.Fatal("channel not registered")
	}
	want := []any{"dashboardUID", "plant-1", "dashboardTitle", "Plant overview", "panelID", "4", "panelTitle", "Flow"}
	if !reflect.DeepEqual(construct.logAttributes, want) {
		t.Errorf("channel log attributes = %v, want %v", construct.logAttributes, want)
	}
	if got := log.ContextualAttributesFromContext(withLogAttributes(t.Context(), construct.logAttributes)); !reflect.DeepEqual(got, want) {
		t.Errorf("stream context log attributes = %v, want %v", got, want)
	}
}
