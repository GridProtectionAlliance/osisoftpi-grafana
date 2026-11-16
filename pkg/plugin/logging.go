package plugin

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

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
