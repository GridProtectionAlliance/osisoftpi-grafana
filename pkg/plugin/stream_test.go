package plugin

import (
	"context"
	"sync"
	"testing"

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
		channelGenerations:        make(map[string]uint32),
		websocketConnections:      make(map[string]*websocket.Conn),
		senderChannels:            make(map[string]map[*backend.StreamSender]chan StreamData),
		connectionKeyWebIDs:       make(map[string][]string),
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
	ds.channelConstruct["test-uuid"] = StreamChannelConstruct{WebID: "WEBID1"}

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
// addStreamSender / removeStreamSender / fan-out
// ---------------------------------------------------------------------------

func TestAddStreamSender_CreatesChannel(t *testing.T) {
	ds := newTestDatasource()
	sender := &backend.StreamSender{}
	ch := ds.addStreamSender("WEBID1", sender)
	if ch == nil {
		t.Fatal("expected non-nil channel")
	}

	ds.datasourceMutex.Lock()
	defer ds.datasourceMutex.Unlock()
	if _, ok := ds.senderChannels["WEBID1"][sender]; !ok {
		t.Error("sender not registered in senderChannels")
	}
}

func TestAddStreamSender_FanOut(t *testing.T) {
	ds := newTestDatasource()
	s1 := &backend.StreamSender{}
	s2 := &backend.StreamSender{}

	ch1 := ds.addStreamSender("WEBID1", s1)
	ch2 := ds.addStreamSender("WEBID1", s2)

	item := StreamData{WebId: "WEBID1", Name: "TestTag"}

	// Simulate what readWebsocketMessages does: deliver StreamData to all sender channels.
	ds.datasourceMutex.Lock()
	for _, ch := range ds.senderChannels["WEBID1"] {
		select {
		case ch <- item:
		default:
		}
	}
	ds.datasourceMutex.Unlock()

	// Both subscribers must receive the item independently.
	got1 := <-ch1
	got2 := <-ch2

	if got1.WebId != item.WebId {
		t.Errorf("subscriber 1 got WebId %q, want %q", got1.WebId, item.WebId)
	}
	if got2.WebId != item.WebId {
		t.Errorf("subscriber 2 got WebId %q, want %q", got2.WebId, item.WebId)
	}
}

func TestRemoveStreamSender_ClosesChannel(t *testing.T) {
	ds := newTestDatasource()
	sender := &backend.StreamSender{}
	ch := ds.addStreamSender("WEBID1", sender)

	ds.removeStreamSender("WEBID1", sender)

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
	if _, ok := ds.senderChannels["WEBID1"][sender]; ok {
		t.Error("sender still present in senderChannels after removal")
	}
}

func TestRemoveStreamSender_Idempotent(t *testing.T) {
	ds := newTestDatasource()
	sender := &backend.StreamSender{}
	ds.addStreamSender("WEBID1", sender)
	ds.removeStreamSender("WEBID1", sender)

	// A second call must not panic (channel is already closed / deleted).
	ds.removeStreamSender("WEBID1", sender)
}

// ---------------------------------------------------------------------------
// checkForOrphanedWebSocket
// ---------------------------------------------------------------------------

func TestCheckForOrphanedWebSocket_NoSubscribers_ClosesConn(t *testing.T) {
	// Set up a pair of connected WebSocket pipes using gorilla's test helpers.
	// We need an actual net.Conn to verify Close() is called.  Using a simple
	// channel-backed mock would require a custom type; instead we assert that
	// after the call the connection is removed from the map.
	ds := newTestDatasource()
	webID := "WEBID_ORPHAN"
	connectionKey := webID

	// Register the connection key mapping.
	ds.connectionKeyWebIDs[connectionKey] = []string{webID}

	// Register a fake (nil) websocket conn — checkForOrphanedWebSocket only calls
	// conn.Close() and deletes the entry; it does not read/write, so nil is fine here.
	ds.websocketConnections[connectionKey] = (*websocket.Conn)(nil)

	// No subscribers registered — orphan check should remove the connection.
	// (We cannot call ws.Close() on nil, so we just verify the map entry is removed
	// without the function panicking on a real nil close.  In production the conn is
	// always non-nil; this test guards the map-cleanup path.)
	func() {
		defer func() {
			if r := recover(); r != nil {
				// nil.Close() panics — that is expected for this mock. The important
				// assertion is that the entry was deleted before Close() was called.
			}
		}()
		ds.checkForOrphanedWebSocket(webID, connectionKey)
	}()

	ds.websocketConnectionsMutex.Lock()
	defer ds.websocketConnectionsMutex.Unlock()
	if _, ok := ds.websocketConnections[connectionKey]; ok {
		t.Error("websocket connection should have been removed from the map")
	}
}

func TestCheckForOrphanedWebSocket_WithSubscribers_KeepsConn(t *testing.T) {
	ds := newTestDatasource()
	webID := "WEBID_KEEP"
	connectionKey := webID
	sender := &backend.StreamSender{}

	ds.connectionKeyWebIDs[connectionKey] = []string{webID}
	ds.addStreamSender(webID, sender)

	ds.websocketConnections[connectionKey] = (*websocket.Conn)(nil)

	ds.checkForOrphanedWebSocket(webID, connectionKey)

	ds.websocketConnectionsMutex.Lock()
	defer ds.websocketConnectionsMutex.Unlock()
	if _, ok := ds.websocketConnections[connectionKey]; !ok {
		t.Error("websocket connection should NOT have been removed while subscribers remain")
	}
}

// ---------------------------------------------------------------------------
// Deterministic channel key (stable across repeated queries)
// ---------------------------------------------------------------------------

// TestStableChannelKey_SameInputSameKey verifies that the same WebID + SummaryType
// always produces the same channel key, so repeated queries reuse the same
// centrifuge subscription instead of creating a new one each time.
func TestStableChannelKey_SameInputSameKey(t *testing.T) {
	key1 := channelKeyFor("PI_WEBID_ABC", "", 0)
	key2 := channelKeyFor("PI_WEBID_ABC", "", 0)
	if key1 != key2 {
		t.Errorf("expected same key for same input, got %q and %q", key1, key2)
	}
}

// TestStableChannelKey_DifferentSettings verifies that the same WebID with
// different query settings produces distinct channel keys.
func TestStableChannelKey_DifferentSettings(t *testing.T) {
	keyNull := channelKeyFor("PI_WEBID_ABC", "digitalStates=false|nodata=Null", 0)
	keyPrevious := channelKeyFor("PI_WEBID_ABC", "digitalStates=false|nodata=Previous", 0)
	if keyNull == keyPrevious {
		t.Errorf("expected different keys for different settings, both got %q", keyNull)
	}
}

// TestStableChannelKey_DifferentWebIDs verifies that different WebIDs produce
// distinct channel keys even when the settings are the same.
func TestStableChannelKey_DifferentWebIDs(t *testing.T) {
	key1 := channelKeyFor("PI_WEBID_ABC", "", 0)
	key2 := channelKeyFor("PI_WEBID_XYZ", "", 0)
	if key1 == key2 {
		t.Errorf("expected different keys for different WebIDs, both got %q", key1)
	}
}

// TestStableChannelKey_GenerationChangesKey verifies that incrementing the generation
// produces a different key, ensuring panels get a fresh LiveDataStream after expiry.
func TestStableChannelKey_GenerationChangesKey(t *testing.T) {
	key0 := channelKeyFor("PI_WEBID_ABC", "", 0)
	key1 := channelKeyFor("PI_WEBID_ABC", "", 1)
	if key0 == key1 {
		t.Errorf("expected different keys for different generations, both got %q", key0)
	}
}

func TestSubscribeStream_StableKeyFound(t *testing.T) {
	ds := newTestDatasource()
	key := channelKeyFor("PI_WEBID_ABC", "", 0)
	ds.channelConstruct[key] = StreamChannelConstruct{WebID: "PI_WEBID_ABC"}

	resp, err := ds.SubscribeStream(context.Background(), &backend.SubscribeStreamRequest{Path: key})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != backend.SubscribeStreamStatusOK {
		t.Errorf("expected OK, got %v", resp.Status)
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

// A summary series (e.g. 1 min averages) must not stream: PI Web API channels send the raw values, which would be
// appended to the averages.
func TestIsStreamable_NotForSummaries(t *testing.T) {
	on, off := true, false
	basis := "TimeWeighted"
	types := []SummaryType{{Label: "Average", Value: SummaryTypeValue{Value: "Average"}}}
	streaming := &QueryStreaming{Enable: &on}

	plain := Query{Pi: PIWebAPIQuery{EnableStreaming: streaming}}
	if !plain.isStreamable() {
		t.Error("a query with streaming enabled must be streamable")
	}
	summary := Query{Pi: PIWebAPIQuery{EnableStreaming: streaming, Summary: &QuerySummary{Enable: &on, Basis: &basis, Types: &types}}}
	if summary.isStreamable() {
		t.Error("a summary query must not be streamable")
	}
	disabled := Query{Pi: PIWebAPIQuery{EnableStreaming: streaming, Summary: &QuerySummary{Enable: &off, Basis: &basis, Types: &types}}}
	if !disabled.isStreamable() {
		t.Error("a query with the summary disabled must be streamable")
	}
}
