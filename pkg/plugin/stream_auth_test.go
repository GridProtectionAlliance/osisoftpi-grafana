package plugin

import (
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
)

// The WebSocket connection authenticates like the datasource's HTTP requests: basic authentication only when it is
// enabled, and the custom HTTP headers of the datasource (e.g. an Authorization header).
func TestWebsocketAuthentication(t *testing.T) {
	basic := "Basic " + base64.StdEncoding.EncodeToString([]byte("piuser:pipass"))
	tests := []struct {
		name       string
		options    httpclient.Options
		wantHeader http.Header
	}{
		{
			name:       "basic authentication",
			options:    httpclient.Options{BasicAuth: &httpclient.BasicAuthOptions{User: "piuser", Password: "pipass"}},
			wantHeader: http.Header{"Authorization": {basic}},
		},
		{
			name:       "custom headers",
			options:    httpclient.Options{Header: http.Header{"Authorization": {basic}, "X-Site": {"north"}}},
			wantHeader: http.Header{"Authorization": {basic}, "X-Site": {"north"}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			upgrader := websocket.Upgrader{}
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				for key, values := range tt.wantHeader {
					if r.Header.Get(key) != values[0] {
						http.Error(w, key+" = "+r.Header.Get(key), http.StatusUnauthorized)
						return
					}
				}
				conn, err := upgrader.Upgrade(w, r, nil)
				if err == nil {
					conn.Close()
				}
			}))
			t.Cleanup(server.Close)

			d := newTestDatasource()
			d.settings = backend.DataSourceInstanceSettings{URL: server.URL + "/piwebapi"}
			d.websocketHeader = websocketHeader(tt.options)
			conn, err := d.createWebsocketConnection([]string{"W1"})
			if err != nil {
				t.Fatalf("connection failed: %v", err)
			}
			conn.Close()
		})
	}

	// a rejected connection reports the HTTP status
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "denied", http.StatusUnauthorized)
	}))
	t.Cleanup(server.Close)
	d := newTestDatasource()
	d.settings = backend.DataSourceInstanceSettings{URL: server.URL + "/piwebapi"}
	d.websocketHeader = websocketHeader(httpclient.Options{})
	if _, err := d.createWebsocketConnection([]string{"W1"}); err == nil || !strings.Contains(err.Error(), "401") {
		t.Errorf("error = %v, want the 401 status", err)
	}
}
