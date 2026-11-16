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

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// packetRecorder is a stream packet sender that keeps the values sent to the panel.
type packetRecorder struct {
	mu     sync.Mutex
	values []float64
}

func (p *packetRecorder) Send(packet *backend.StreamPacket) error {
	var frame struct {
		Data struct {
			Values [][]interface{} `json:"values"`
		} `json:"data"`
	}
	if err := json.Unmarshal(packet.Data, &frame); err != nil {
		return err
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, v := range frame.Data.Values[1] {
		p.values = append(p.values, v.(float64))
	}
	return nil
}

func (p *packetRecorder) sent() []float64 {
	p.mu.Lock()
	defer p.mu.Unlock()
	return append([]float64(nil), p.values...)
}

// After a reconnect, the values PI recorded since the last streamed value are sent before the live values.
func TestFillStreamGap(t *testing.T) {
	last := time.Date(2026, 9, 29, 10, 1, 0, 0, time.UTC)
	var requests []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests = append(requests, r.URL.String())
		items := []map[string]interface{}{
			{"Timestamp": last.Format(time.RFC3339), "Value": 1.0, "Good": true}, // already streamed
			{"Timestamp": last.Add(10 * time.Second).Format(time.RFC3339), "Value": 2.0, "Good": true},
			{"Timestamp": last.Add(20 * time.Second).Format(time.RFC3339), "Value": 3.0, "Good": true},
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"Items": items, "UnitsAbbreviation": "%"})
	}))
	t.Cleanup(server.Close)

	newStream := func(fillGaps bool) (*Datasource, StreamChannelConstruct, *packetRecorder, *backend.StreamSender) {
		d := newTestDatasource()
		d.settings = backend.DataSourceInstanceSettings{URL: server.URL + "/piwebapi"}
		d.httpClient = server.Client()
		query := makeTestQuery("W1")
		query.StreamFillGaps = fillGaps
		query.MaxDataPoints = 500
		recorder := &packetRecorder{}
		return d, StreamChannelConstruct{WebID: "W1", query: query, state: &streamChannelState{}}, recorder, backend.NewStreamSender(recorder)
	}

	d, construct, recorder, sender := newStream(true)
	d.fillStreamGap(context.Background(), "path", construct, sender) // first run: nothing streamed yet
	if len(requests) != 0 {
		t.Fatalf("no values were streamed yet, but the gap was requested: %v", requests)
	}

	construct.state.sent([]PiBatchContentItem{{Timestamp: last}})
	d.fillStreamGap(context.Background(), "path", construct, sender)
	if got := recorder.sent(); len(got) != 2 || got[0] != 2 || got[1] != 3 {
		t.Errorf("values sent = %v, want [2 3]", got)
	}
	if len(requests) != 1 || !strings.Contains(requests[0], "/piwebapi/streams/W1/recorded?") ||
		!strings.Contains(requests[0], "startTime=2026-09-29T10%3A01%3A00Z") || !strings.Contains(requests[0], "maxCount=500") {
		t.Errorf("unexpected request %v", requests)
	}
	if got, _ := construct.state.lastSentTime(); !got.Equal(last.Add(20 * time.Second)) {
		t.Errorf("last streamed time = %v, want the last filled value", got)
	}

	// live values up to the last value already sent are not sent again
	if items := construct.state.newItems([]PiBatchContentItem{{Timestamp: last.Add(20 * time.Second)}, {Timestamp: last.Add(30 * time.Second)}}); len(items) != 1 {
		t.Errorf("expected only the value after the filled ones, got %v", items)
	}

	requests = nil
	d, construct, _, sender = newStream(false)
	construct.state.sent([]PiBatchContentItem{{Timestamp: last}})
	d.fillStreamGap(context.Background(), "path", construct, sender)
	if len(requests) != 0 {
		t.Errorf("filling gaps is off, but the gap was requested: %v", requests)
	}
}

// "Fill gaps after reconnect" is on unless turned off in the query.
func TestStreamFillGapsDefault(t *testing.T) {
	on, off := true, false
	for _, tt := range []struct {
		value *bool
		want  bool
	}{{nil, true}, {&on, true}, {&off, false}} {
		q := Query{Pi: PIWebAPIQuery{EnableStreaming: &QueryStreaming{Enable: &on, FillGaps: tt.value}}}
		if got := q.isStreamFillGaps(); got != tt.want {
			t.Errorf("fillGaps %v: isStreamFillGaps() = %v, want %v", tt.value, got, tt.want)
		}
	}
}

// Without a filled gap, live values are never dropped, even when their time is not newer: a static attribute always
// has the same timestamp, and PI Web API sends corrected past values with their original time.
func TestNewStreamItemsOnlyAfterFill(t *testing.T) {
	state := &streamChannelState{}
	static := time.Unix(0, 0).UTC()
	state.sent([]PiBatchContentItem{{Timestamp: static}})
	if items := state.newItems([]PiBatchContentItem{{Timestamp: static, Value: 3.0}}); len(items) != 1 {
		t.Errorf("a new value of a static attribute was dropped")
	}

	// after a fill, the values it sent are not repeated, then filtering stops
	filled := time.Date(2026, 9, 29, 10, 1, 20, 0, time.UTC)
	state.filled(filled)
	if items := state.newItems([]PiBatchContentItem{{Timestamp: filled}, {Timestamp: filled.Add(10 * time.Second)}}); len(items) != 1 {
		t.Errorf("expected only the value after the filled ones, got %v", items)
	}
	if items := state.newItems([]PiBatchContentItem{{Timestamp: filled.Add(-time.Hour)}}); len(items) != 1 {
		t.Errorf("filtering must stop once the stream is past the filled values, got %v", items)
	}
}
