package plugin

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// countingSender counts the stream packets sent to the panel and the values they hold.
type countingSender struct {
	packetRecorder
	mu      sync.Mutex
	packets int
}

func (c *countingSender) Send(packet *backend.StreamPacket) error {
	c.mu.Lock()
	c.packets++
	c.mu.Unlock()
	return c.packetRecorder.Send(packet)
}

// When no new value arrives, the keepalive keeps the channel active without adding the last value again: it used
// to re-send the last frame, which the panel appended as a duplicate row every 30 s.
func TestStreamKeepaliveAddsNoValues(t *testing.T) {
	interval := streamKeepaliveInterval
	streamKeepaliveInterval = 50 * time.Millisecond
	t.Cleanup(func() { streamKeepaliveInterval = interval })

	d := newTestDatasource()
	query := makeTestQuery("W1")
	recorder := &countingSender{}
	sender := backend.NewStreamSender(recorder)
	construct := StreamChannelConstruct{WebID: "W1", query: query, frameCache: buildStreamFrameCache(d, query),
		state: &streamChannelState{}}

	values := make(chan StreamData, 1)
	values <- StreamData{WebId: "W1", Items: []PiBatchContentItem{{Timestamp: time.Now(), Value: 1.0, Good: true}}}
	ctx, cancel := context.WithCancel(context.Background())
	errchan := make(chan error, 1)
	go func() { errchan <- d.sendStreamData(ctx, sender, "path", values, construct) }()

	time.Sleep(300 * time.Millisecond) // several keepalive intervals
	cancel()
	<-errchan

	recorder.mu.Lock()
	packets := recorder.packets
	recorder.mu.Unlock()
	if packets < 3 {
		t.Fatalf("expected the value and keepalive packets, got %d packets", packets)
	}
	if got := recorder.sent(); len(got) != 1 {
		t.Errorf("values added to the panel = %v, want the one value only", got)
	}
}
