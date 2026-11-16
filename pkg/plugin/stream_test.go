package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// newTestDatasource returns a minimal Datasource suitable for unit-testing streaming logic.
// It does NOT set up an HTTP client or scheduler; those are unnecessary for these tests.
func newTestDatasource() *Datasource {
	return &Datasource{
		datasourceMutex:           &sync.Mutex{},
		websocketConnectionsMutex: &sync.Mutex{},
		channelConstruct:          make(map[string]StreamChannelConstruct),
		websocketConnections:      make(map[string]*websocket.Conn),
		senderChannels:            make(map[string]map[*backend.StreamSender]chan StreamData),
		webIDCache:                newWebIDCache(12),
		dataSourceOptions:         &PIWebAPIDataSourceJsonData{},
	}
}

// ---------------------------------------------------------------------------
// buildStreamSetsWebSocketURL
// ---------------------------------------------------------------------------

func TestBuildStreamSetsWebSocketURL_HTTPS(t *testing.T) {
	got, err := buildStreamSetsWebSocketURL("https://piwebapi.example.com/piwebapi", []string{"ABC123"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := "wss://piwebapi.example.com/piwebapi/streamsets/channel?webId=ABC123"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestBuildStreamSetsWebSocketURL_HTTP(t *testing.T) {
	got, err := buildStreamSetsWebSocketURL("http://piwebapi.example.com/piwebapi", []string{"DEF456"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := "ws://piwebapi.example.com/piwebapi/streamsets/channel?webId=DEF456"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestBuildStreamSetsWebSocketURL_MultipleWebIDs(t *testing.T) {
	got, err := buildStreamSetsWebSocketURL("https://pi.host/piwebapi", []string{"W1", "W2", "W3"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := "wss://pi.host/piwebapi/streamsets/channel?webId=W1&webId=W2&webId=W3"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestBuildStreamSetsWebSocketURL_EmptyWebIDs(t *testing.T) {
	_, err := buildStreamSetsWebSocketURL("https://piwebapi.example.com/piwebapi", nil)
	if err == nil {
		t.Fatal("expected error for empty WebIDs, got nil")
	}
}

// ---------------------------------------------------------------------------
// SubscribeStream
// ---------------------------------------------------------------------------

func TestSubscribeStream_PermissionDenied(t *testing.T) {
	ds := newTestDatasource()
	resp, err := ds.SubscribeStream(context.Background(), &backend.SubscribeStreamRequest{
		Path: "unknown-uuid",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != backend.SubscribeStreamStatusPermissionDenied {
		t.Errorf("got status %v, want PermissionDenied", resp.Status)
	}
}

func TestSubscribeStream_OK(t *testing.T) {
	ds := newTestDatasource()
	ds.channelConstruct["test-uuid"] = StreamChannelConstruct{WebID: "WEBID1", state: &streamChannelState{}}

	resp, err := ds.SubscribeStream(context.Background(), &backend.SubscribeStreamRequest{
		Path: "test-uuid",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != backend.SubscribeStreamStatusOK {
		t.Errorf("got status %v, want OK", resp.Status)
	}
}

// ---------------------------------------------------------------------------
// PublishStream
// ---------------------------------------------------------------------------

func TestPublishStream_AlwaysDenied(t *testing.T) {
	ds := newTestDatasource()
	resp, err := ds.PublishStream(context.Background(), &backend.PublishStreamRequest{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != backend.PublishStreamStatusPermissionDenied {
		t.Errorf("got status %v, want PermissionDenied", resp.Status)
	}
}

// ---------------------------------------------------------------------------
// addStreamSender / removeStreamSender
// ---------------------------------------------------------------------------

func TestAddStreamSender_CreatesChannel(t *testing.T) {
	ds := newTestDatasource()
	sender := &backend.StreamSender{}
	ch := ds.addStreamSender("K", "WEBID1", sender)
	if ch == nil {
		t.Fatal("expected non-nil channel")
	}

	ds.datasourceMutex.Lock()
	defer ds.datasourceMutex.Unlock()
	if _, ok := ds.senderChannels[senderKey("K", "WEBID1")][sender]; !ok {
		t.Error("sender not registered in senderChannels")
	}
}

func TestRemoveStreamSender_ClosesChannel(t *testing.T) {
	ds := newTestDatasource()
	sender := &backend.StreamSender{}
	ch := ds.addStreamSender("K", "WEBID1", sender)

	ds.removeStreamSender("K", "WEBID1", sender)

	// The channel must be closed — reading from it must return immediately with ok==false.
	select {
	case _, ok := <-ch:
		if ok {
			t.Error("expected channel to be closed, got value instead")
		}
	default:
		t.Error("expected closed channel read to complete, but it would block")
	}

	// The sender must be removed from the map.
	ds.datasourceMutex.Lock()
	defer ds.datasourceMutex.Unlock()
	if _, ok := ds.senderChannels[senderKey("K", "WEBID1")]; ok {
		t.Error("sender still present in senderChannels after removal")
	}
}

func TestRemoveStreamSender_Idempotent(t *testing.T) {
	ds := newTestDatasource()
	sender := &backend.StreamSender{}
	ds.addStreamSender("K", "WEBID1", sender)
	ds.removeStreamSender("K", "WEBID1", sender)

	// A second call must not panic (channel is already closed / deleted).
	ds.removeStreamSender("K", "WEBID1", sender)
}

// ---------------------------------------------------------------------------
// readWebsocketMessages / checkForOrphanedWebSocket
// ---------------------------------------------------------------------------

// testWebsocket is a WebSocket connection to a test server.
type testWebsocket struct {
	client *websocket.Conn
	server *websocket.Conn
	closed chan struct{} // closed when the server sees the connection close
}

func newTestWebsocket(t *testing.T) *testWebsocket {
	t.Helper()
	ws := &testWebsocket{closed: make(chan struct{})}
	accepted := make(chan *websocket.Conn, 1)
	upgrader := websocket.Upgrader{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		accepted <- conn
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				close(ws.closed)
				return
			}
		}
	}))
	t.Cleanup(server.Close)
	client, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(server.URL, "http"), nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = client.Close() })
	ws.client, ws.server = client, <-accepted
	return ws
}

// receive returns the next item sent to a subscriber, and false when its channel is closed.
func receive(t *testing.T, ch <-chan StreamData) (StreamData, bool) {
	t.Helper()
	select {
	case item, ok := <-ch:
		return item, ok
	case <-time.After(5 * time.Second):
		t.Fatal("nothing received")
		return StreamData{}, false
	}
}

// Each item of a channel message goes to the subscribers of its WebId on that connection; when the connection is
// lost, their channels are closed so that they reconnect.
func TestReadWebsocketMessagesRoutesItems(t *testing.T) {
	ds := newTestDatasource()
	ws := newTestWebsocket(t)
	const key = "W1|W2"
	w1a := ds.addStreamSender(key, "W1", &backend.StreamSender{})
	w1b := ds.addStreamSender(key, "W1", &backend.StreamSender{})
	w2 := ds.addStreamSender(key, "W2", &backend.StreamSender{})
	otherConnection := ds.addStreamSender("W1|W3", "W1", &backend.StreamSender{})
	ds.websocketConnections[key] = ws.client
	go ds.readWebsocketMessages(ws.client, key, []string{"W1", "W2"})

	items := func(webIDs ...string) map[string]interface{} {
		var streams []map[string]interface{}
		for _, webID := range webIDs {
			streams = append(streams, map[string]interface{}{"WebId": webID, "Items": []interface{}{}})
		}
		return map[string]interface{}{"Items": streams}
	}
	if err := ws.server.WriteJSON(items("W1", "W2", "UNKNOWN")); err != nil {
		t.Fatal(err)
	}
	for name, ch := range map[string]chan StreamData{"W1 subscriber 1": w1a, "W1 subscriber 2": w1b, "W2 subscriber": w2} {
		want := name[:2]
		if item, _ := receive(t, ch); item.WebId != want {
			t.Errorf("%s got %q, want %q", name, item.WebId, want)
		}
	}
	// a message that cannot be read is skipped
	if err := ws.server.WriteMessage(websocket.TextMessage, []byte("not json")); err != nil {
		t.Fatal(err)
	}
	if err := ws.server.WriteJSON(items("W2")); err != nil {
		t.Fatal(err)
	}
	if item, _ := receive(t, w2); item.WebId != "W2" {
		t.Errorf("W2 subscriber got %q after an unreadable message", item.WebId)
	}

	// the connection is lost
	_ = ws.server.Close()
	for name, ch := range map[string]chan StreamData{"W1 subscriber 1": w1a, "W1 subscriber 2": w1b, "W2 subscriber": w2} {
		if _, ok := receive(t, ch); ok {
			t.Errorf("%s: unexpected value after the connection was lost", name)
		}
	}
	ds.websocketConnectionsMutex.Lock()
	_, registered := ds.websocketConnections[key]
	ds.websocketConnectionsMutex.Unlock()
	if registered {
		t.Error("the lost connection is still registered")
	}
	select {
	case item, ok := <-otherConnection:
		t.Errorf("the subscriber of another connection got %v (open %v)", item, ok)
	default:
	}
}

func TestCheckForOrphanedWebSocket_NoSubscribers_ClosesConn(t *testing.T) {
	ds := newTestDatasource()
	ws := newTestWebsocket(t)
	ds.websocketConnections["W1|W2"] = ws.client
	// a subscriber of W1 on another connection does not keep this one open
	ds.addStreamSender("W1", "W1", &backend.StreamSender{})

	ds.checkForOrphanedWebSocket("W1|W2", []string{"W1", "W2"})

	select {
	case <-ws.closed:
	case <-time.After(5 * time.Second):
		t.Fatal("the connection was not closed")
	}
	if _, ok := ds.websocketConnections["W1|W2"]; ok {
		t.Error("websocket connection should have been removed from the map")
	}
}

func TestCheckForOrphanedWebSocket_WithSubscribers_KeepsConn(t *testing.T) {
	ds := newTestDatasource()
	ws := newTestWebsocket(t)
	ds.websocketConnections["W1|W2"] = ws.client
	ds.addStreamSender("W1|W2", "W2", &backend.StreamSender{})

	ds.checkForOrphanedWebSocket("W1|W2", []string{"W1", "W2"})

	if _, ok := ds.websocketConnections["W1|W2"]; !ok {
		t.Error("websocket connection should NOT have been removed while subscribers remain")
	}
	select {
	case <-ws.closed:
		t.Error("the connection was closed while subscribers remain")
	case <-time.After(50 * time.Millisecond):
	}
}

// ---------------------------------------------------------------------------
// Channel key
// ---------------------------------------------------------------------------

// Different PI tags get different channels for the same query settings and time range.
func TestChannelKey_DifferentWebIDs(t *testing.T) {
	key1 := channelKeyFor(&PiProcessedQuery{WebID: "PI_WEBID_ABC"})
	key2 := channelKeyFor(&PiProcessedQuery{WebID: "PI_WEBID_XYZ"})
	if key1 == key2 {
		t.Errorf("expected different keys for different WebIDs, both got %q", key1)
	}
}

// "Enable Streaming Support" is no longer an experimental feature: the configuration page shows it on its own.
func TestIsUsingStreaming_WithoutExperimentalFeatures(t *testing.T) {
	on, off := true, false
	tests := []struct {
		name         string
		experimental *bool
		streaming    *bool
		want         bool
	}{
		{"streaming only", nil, &on, true},
		{"streaming with experimental features off", &off, &on, true},
		{"streaming and experimental features", &on, &on, true},
		{"streaming off", &on, &off, false},
		{"not configured", nil, nil, false},
	}
	for _, tt := range tests {
		d := newTestDatasource()
		d.dataSourceOptions = &PIWebAPIDataSourceJsonData{UseExperimental: tt.experimental, UseStreaming: tt.streaming}
		if got := d.isUsingStreaming(); got != tt.want {
			t.Errorf("%s: isUsingStreaming() = %v, want %v", tt.name, got, tt.want)
		}
	}
}

// Streaming sends raw values, so the query options returning other values are not streamed. The query editor hides
// the streaming settings when one of them is selected.
func TestIsStreamable_NotForOtherValueTypes(t *testing.T) {
	tests := map[string]string{
		"calculation":     `"expression":"'.'*2"`,
		"last value":      `"useLastValue":{"enable":true}`,
		"interpolated":    `"interpolate":{"enable":true}`,
		"recorded values": `"recordedValues":{"enable":true}`,
		"summary":         `"summary":{"enable":true,"basis":"EventWeighted","types":[]}`,
		"summary average": `"summary":{"enable":true,"basis":"TimeWeighted","types":[{"value":{"value":"Average"}}]}`,
	}
	for name, option := range tests {
		t.Run(name, func(t *testing.T) {
			var q Query
			if err := json.Unmarshal([]byte(`{"EnableStreaming":{"enable":true},`+option+`}`), &q.Pi); err != nil {
				t.Fatal(err)
			}
			if q.isStreamable() {
				t.Errorf("a query with %s must not be streamable", name)
			}
		})
	}
	var q Query
	if err := json.Unmarshal([]byte(`{"EnableStreaming":{"enable":true},"useLastValue":{"enable":false},
		"interpolate":{"enable":false},"recordedValues":{"enable":false},
		"summary":{"enable":false,"basis":"TimeWeighted","types":[{"value":{"value":"Average"}}]}}`), &q.Pi); err != nil {
		t.Fatal(err)
	}
	if !q.isStreamable() {
		t.Error("a query with the other options disabled must be streamable")
	}
}
