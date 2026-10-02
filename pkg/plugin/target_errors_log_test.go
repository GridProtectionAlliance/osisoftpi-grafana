package plugin

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type logEntry struct {
	level string
	msg   string
	args  map[string]any
}

type captureLogger struct {
	mu      sync.Mutex
	entries []logEntry
}

func (l *captureLogger) add(level, msg string, args []any) {
	l.mu.Lock()
	defer l.mu.Unlock()
	fields := map[string]any{}
	for i := 0; i+1 < len(args); i += 2 {
		fields[args[i].(string)] = args[i+1]
	}
	l.entries = append(l.entries, logEntry{level, msg, fields})
}

func (l *captureLogger) Debug(msg string, args ...any)          { l.add("debug", msg, args) }
func (l *captureLogger) Info(msg string, args ...any)           { l.add("info", msg, args) }
func (l *captureLogger) Warn(msg string, args ...any)           { l.add("warn", msg, args) }
func (l *captureLogger) Error(msg string, args ...any)          { l.add("error", msg, args) }
func (l *captureLogger) With(...any) log.Logger                 { return l }
func (l *captureLogger) Level() log.Level                       { return log.Debug }
func (l *captureLogger) FromContext(context.Context) log.Logger { return l }

func captureBackendLogs(t *testing.T) *captureLogger {
	logger := &captureLogger{}
	previous := backend.Logger
	backend.Logger = logger
	t.Cleanup(func() { backend.Logger = previous })
	return logger
}

// A failing target is logged once at error level with the requests sent for it, not as a dump of the query.
func TestFailingTargetIsLoggedWithRequests(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\E|Level`: {dataStatus: http.StatusBadRequest},
	}}).start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
	logger := captureBackendLogs(t)

	runFakeQuery(t, d, map[string]interface{}{"target": `AF\DB\E;Level;Missing`})

	var errors []logEntry
	for _, e := range logger.entries {
		if e.level == "error" {
			errors = append(errors, e)
		}
		for key, value := range e.args {
			if _, ok := value.(PiProcessedQuery); ok {
				t.Errorf("%q logs the whole query as %q", e.msg, key)
			}
		}
	}
	if len(errors) != 2 {
		t.Fatalf("expected one error per failing target, got %+v", errors)
	}
	for _, e := range errors {
		if e.args["RefID"] != "A" || e.args["error"] == nil || e.args["status"] == nil {
			t.Errorf("missing fields in %+v", e.args)
		}
		request, _ := e.args["request"].(string)
		switch e.args["target"] {
		case `AF\DB\E|Level`:
			if e.args["webId"] == nil || strings.Contains(request, "{0}") || !strings.Contains(request, "streamsets/plot") {
				t.Errorf("data request not logged: %+v", e.args)
			}
		case `AF\DB\E|Missing`:
			if lookup, _ := e.args["webIdRequest"].(string); !strings.Contains(lookup, "attributes?") {
				t.Errorf("WebID request not logged: %+v", e.args)
			}
		default:
			t.Errorf("unexpected target %v", e.args["target"])
		}
	}
}

// Queries that are all invalid do not send an empty batch to PI Web API.
func TestNoBatchRequestWithoutTargets(t *testing.T) {
	fake := &fakePIWebAPI{}
	server := fake.start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	r := runFakeQuery(t, d, map[string]interface{}{"target": ";"})
	if r.Error == nil {
		t.Errorf("expected the invalid query error")
	}
	if n := fake.requests.Load(); n != 0 {
		t.Errorf("sent %d requests to PI Web API", n)
	}
}
