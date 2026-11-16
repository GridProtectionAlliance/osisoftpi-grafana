package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// Error types of the errors and warnings logged by the plugin (the errorType field), see docs/logging.md.
const (
	errInvalidQuery     = "invalid_query"        // the saved query cannot be read, or its target is empty or invalid
	errTemplateVariable = "template_variable"    // the template variables cannot be expanded
	errNotFound         = "not_found"            // PI Web API returned 404: the PI point or AF path does not exist
	errBadRequest       = "piwebapi_bad_request" // PI Web API returned 400 (e.g. invalid time range or expression)
	errAuth             = "auth"                 // PI Web API returned 401 or 403
	errPIWebAPI         = "piwebapi_error"       // PI Web API returned another error status
	errUnreachable      = "piwebapi_unreachable" // no response from PI Web API (connection, DNS, TLS, timeout)
	errResponseDecode   = "response_decode"      // PI Web API answered, but the plugin cannot read the response
	errValueConversion  = "value_conversion"     // a value returned by PI Web API does not fit the series type
	errPathNotAllowed   = "path_not_allowed"     // the resource proxy refused a path
	errInvalidSetting   = "invalid_setting"      // a datasource setting is invalid and its default is used
	errStreamConnect    = "stream_connect"       // the WebSocket connection failed or was lost
	errStreamFill       = "stream_fill"          // filling the gap of a stream after a reconnect failed
	errStreamSend       = "stream_send"          // sending values to Grafana failed
	errInternal         = "internal"             // an unexpected error in the plugin
)

// errorTypeForStatus returns the error type of an HTTP error status returned by PI Web API.
func errorTypeForStatus(status int) string {
	switch status {
	case http.StatusBadRequest:
		return errBadRequest
	case http.StatusUnauthorized, http.StatusForbidden:
		return errAuth
	case http.StatusNotFound:
		return errNotFound
	default:
		return errPIWebAPI
	}
}

// errorSourceOf returns the source of an error type, as Grafana counts errors: the plugin's own failures, or
// downstream for PI Web API and for problems of the query or the configuration.
func errorSourceOf(errorType string) backend.ErrorSource {
	switch errorType {
	case errResponseDecode, errValueConversion, errStreamSend, errInternal:
		return backend.ErrorSourcePlugin
	default:
		return backend.ErrorSourceDownstream
	}
}

// logError logs msg with its errorType and errorSource: at warn level for problems of a query, its targets, its
// values or the configuration, and at error level for failures of PI Web API, the connection or the plugin.
func logError(logger log.Logger, msg string, errorType string, args ...any) {
	args = append([]any{"errorType", errorType, "errorSource", string(errorSourceOf(errorType))}, args...)
	switch errorType {
	case errInvalidQuery, errTemplateVariable, errNotFound, errBadRequest, errValueConversion, errPathNotAllowed,
		errInvalidSetting, errStreamFill:
		logger.Warn(msg, args...)
	default:
		logger.Error(msg, args...)
	}
}

// logWarning logs msg at warn level with its errorType and errorSource, whatever the level of the type: for failures
// that are retried, such as a reconnect attempt, and whose final outcome is logged at the level of the type.
func logWarning(logger log.Logger, msg string, errorType string, args ...any) {
	logger.Warn(msg, append([]any{"errorType", errorType, "errorSource", string(errorSourceOf(errorType))}, args...)...)
}

// requestError is an error of a request to PI Web API, with its error type and the HTTP status PI Web API
// returned (0 when there was no response).
type requestError struct {
	errorType string
	status    int
	err       error
}

func (e *requestError) Error() string { return e.err.Error() }
func (e *requestError) Unwrap() error { return e.err }

// requestErrorType returns the error type and HTTP status of err, or fallback and 0 when err is not a requestError.
func requestErrorType(err error, fallback string) (string, int) {
	var reqErr *requestError
	if errors.As(err, &reqErr) {
		return reqErr.errorType, reqErr.status
	}
	return fallback, 0
}

// statusError returns the error of an HTTP error status returned by PI Web API, with the error message of its body.
func statusError(resp *http.Response, body []byte) error {
	message := "request failed, status: " + resp.Status
	if text := piWebAPIErrorText(body); text != "" {
		message += " - " + text
	}
	return &requestError{errorType: errorTypeForStatus(resp.StatusCode), status: resp.StatusCode, err: errors.New(message)}
}

// piWebAPIErrorText returns the error message of a PI Web API error body ({"Errors": [...]} or {"Message": ...}),
// or "" when the body has none (e.g. an HTML error page of IIS).
func piWebAPIErrorText(body []byte) string {
	var content struct {
		Errors  []string `json:"Errors"`
		Message string   `json:"Message"`
	}
	if json.Unmarshal(body, &content) != nil {
		return ""
	}
	if len(content.Errors) > 0 {
		return excerpt(strings.Join(content.Errors, "; "), maxLoggedErrorText)
	}
	return excerpt(content.Message, maxLoggedErrorText)
}

// Lengths of the excerpts of logged texts: lines stay a few KB, far below the line size limits of log collectors
// (e.g. 256 KB in Loki, 16 KB with the Docker log driver).
const (
	maxLoggedErrorText = 300
	maxLoggedBody      = 512
	maxLoggedValue     = 200
)

// excerpt returns the first max bytes of s, cut at a character boundary and followed by "…" when s is longer.
func excerpt(s string, max int) string {
	if len(s) <= max {
		return s
	}
	cut := max
	for cut > 0 && !utf8.RuneStart(s[cut]) {
		cut--
	}
	return s[:cut] + "…"
}

// bodyExcerpt returns the start of a response or request body on one line, with its whitespace collapsed.
func bodyExcerpt(body []byte) string {
	return excerpt(strings.Join(strings.Fields(string(body)), " "), maxLoggedBody)
}

// valueExcerpt returns a value returned by PI Web API as logged text: the name of a digital state, or the value.
func valueExcerpt(value any) string {
	if state, ok := value.(map[string]interface{}); ok {
		if name, ok := state["Name"].(string); ok {
			return name
		}
	}
	return excerpt(fmt.Sprint(value), maxLoggedValue)
}

// valueKind returns the kind of a value returned by PI Web API: number, string, bool, state (digital state), null
// or other.
func valueKind(value any) string {
	switch value.(type) {
	case nil:
		return "null"
	case float64, float32, int, int32, int64:
		return "number"
	case string:
		return "string"
	case bool:
		return "bool"
	case map[string]interface{}:
		return "state"
	default:
		return "other"
	}
}

// dashboardLogHeaders are the headers Grafana sets on the queries of a dashboard panel, and the log keys of their
// values. Queries from Explore or alert rules have no dashboard, and older Grafana versions may only send the UID
// and the panel ID.
var dashboardLogHeaders = []struct{ header, key string }{
	{"X-Dashboard-Uid", "dashboardUID"},
	{"X-Dashboard-Title", "dashboardTitle"},
	{"X-Panel-Id", "panelID"},
	{"X-Panel-Title", "panelTitle"},
}

type dashboardLogKey struct{}

// withDashboardLogAttributes adds the dashboard and panel of a query request to the log attributes of ctx, next to
// the datasource and user added by the SDK, so that the errors logged for the query name the panel.
func withDashboardLogAttributes(ctx context.Context, req *backend.QueryDataRequest) context.Context {
	var attributes []any
	for _, h := range dashboardLogHeaders {
		if value := req.GetHTTPHeader(h.header); value != "" {
			attributes = append(attributes, h.key, value)
		}
	}
	if len(attributes) == 0 {
		return ctx
	}
	ctx = context.WithValue(ctx, dashboardLogKey{}, attributes)
	return log.WithContextualAttributes(ctx, attributes)
}

// dashboardLogAttributes returns the dashboard and panel log attributes added to ctx by withDashboardLogAttributes.
func dashboardLogAttributes(ctx context.Context) []any {
	attributes, _ := ctx.Value(dashboardLogKey{}).([]any)
	return attributes
}

// contextLogger returns the logger of a request: its lines have the datasource, the user and, for the queries of a
// dashboard panel, the dashboard and the panel.
func contextLogger(ctx context.Context) log.Logger {
	return backend.Logger.FromContext(ctx)
}

// orDefaultLogger returns logger, or the default logger when it is nil.
func orDefaultLogger(logger log.Logger) log.Logger {
	if logger == nil {
		return backend.Logger
	}
	return logger
}

// withLogAttributes returns ctx with the given key/value log attributes added.
func withLogAttributes(ctx context.Context, attributes []any) context.Context {
	if len(attributes) == 0 {
		return ctx
	}
	return log.WithContextualAttributes(ctx, attributes)
}
