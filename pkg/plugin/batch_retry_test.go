package plugin

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// A keep-alive connection closed by the server as the next batch is sent (e.g. its idle timeout) must not fail the
// query: the batch only reads, so the HTTP client sends it again on a new connection.
func TestBatchRequestRetriedOnClosedKeepAliveConnection(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if requests.Add(1) == 2 {
			// the second request arrives on the reused connection: close it without answering
			conn, _, err := w.(http.Hijacker).Hijack()
			if err == nil {
				_ = conn.Close()
			}
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMultiStatus)
		_, _ = w.Write([]byte(`{}`))
	}))
	defer server.Close()

	d := &Datasource{
		settings:   backend.DataSourceInstanceSettings{URL: server.URL},
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
	for i := 1; i <= 2; i++ {
		if _, err := apiBatchRequest(context.Background(), d, map[string]interface{}{}); err != nil {
			t.Fatalf("batch %d: %v", i, err)
		}
	}
	if n := requests.Load(); n != 3 {
		t.Errorf("server received %d requests, want 3 (the closed one sent again)", n)
	}
}
