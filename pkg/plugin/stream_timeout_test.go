package plugin

import (
	"context"
	"net"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
)

// silentServer accepts TCP connections and never answers, like an unresponsive PI Web API.
func silentServer(t *testing.T) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { listener.Close() })
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			t.Cleanup(func() { conn.Close() })
		}
	}()
	return "http://" + listener.Addr().String() + "/piwebapi"
}

// Opening the WebSocket connection gives up after the datasource timeout instead of waiting forever.
func TestWebsocketConnectionTimeout(t *testing.T) {
	d := newTestDatasource()
	d.settings = backend.DataSourceInstanceSettings{URL: silentServer(t)}
	d.websocketTimeout = 200 * time.Millisecond

	start := time.Now()
	_, err := d.createWebsocketConnection(context.Background(), []string{"W1"})
	if err == nil {
		t.Fatal("expected a timeout error")
	}
	if elapsed := time.Since(start); elapsed > 3*time.Second {
		t.Errorf("gave up after %v, want about 200ms", elapsed)
	}
}

// Unsubscribing cancels a connection attempt in progress.
func TestWebsocketConnectionCancelled(t *testing.T) {
	d := newTestDatasource()
	d.settings = backend.DataSourceInstanceSettings{URL: silentServer(t)}
	d.websocketTimeout = time.Minute

	ctx, cancel := context.WithCancel(context.Background())
	time.AfterFunc(200*time.Millisecond, cancel)
	start := time.Now()
	if _, err := d.createWebsocketConnection(ctx, []string{"W1"}); err == nil {
		t.Fatal("expected an error")
	}
	if elapsed := time.Since(start); elapsed > 3*time.Second {
		t.Errorf("gave up after %v, want about 200ms", elapsed)
	}
}

// The timeout is the datasource's HTTP timeout ("Timeout" in the advanced HTTP settings), 30 s when not set.
func TestWebsocketTimeoutSetting(t *testing.T) {
	if got := websocketTimeout(httpclient.Options{Timeouts: &httpclient.TimeoutOptions{Timeout: 10 * time.Second}}); got != 10*time.Second {
		t.Errorf("configured timeout = %v, want 10s", got)
	}
	if got := websocketTimeout(httpclient.Options{}); got != 30*time.Second {
		t.Errorf("default timeout = %v, want 30s", got)
	}
}
