package plugin

import (
	"context"
	"encoding/base64"
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

// fakeStreamingPIWebAPI is a PI Web API for the streaming tests: the batch endpoint of fakePIWebAPI, the recorded
// values of a stream (used to fill gaps) and the streamsets/channel WebSocket endpoint.
type fakeStreamingPIWebAPI struct {
	api    fakePIWebAPI
	server *httptest.Server

	mu       sync.Mutex
	conns    map[*websocket.Conn][]string // open channel connections and their WebIDs
	reject   int                          // when set, channel connections are rejected with this HTTP status
	onOpen   func(webIDs []string) []fakeChannelMessage
	recorded []map[string]interface{} // values returned by the recorded-values requests
	fills    []string                 // recorded-values requests received
}

// fakeChannelMessage is one channel message: the values of one WebID.
type fakeChannelMessage struct {
	webID string
	items []map[string]interface{}
}

func newFakeStreamingPIWebAPI(t *testing.T, points ...string) *fakeStreamingPIWebAPI {
	t.Helper()
	f := &fakeStreamingPIWebAPI{conns: map[*websocket.Conn][]string{}}
	f.api.attributes = map[string]fakeAttribute{}
	for _, point := range points {
		f.api.attributes[`\\PISRV\`+point] = fakeAttribute{}
	}
	f.server = httptest.NewServer(http.HandlerFunc(f.serve))
	t.Cleanup(f.server.Close)
	return f
}

// fakeWebID returns the WebID fakePIWebAPI gives to a PI point of PISRV.
func fakeWebID(point string) string {
	return "W" + base64.RawURLEncoding.EncodeToString([]byte(`\\PISRV\`+point))
}

func (f *fakeStreamingPIWebAPI) serve(w http.ResponseWriter, r *http.Request) {
	switch {
	case strings.HasSuffix(r.URL.Path, "/streamsets/channel"):
		f.serveChannel(w, r)
	case strings.Contains(r.URL.Path, "/streams/") && strings.HasSuffix(r.URL.Path, "/recorded"):
		f.mu.Lock()
		f.fills = append(f.fills, r.URL.String())
		items := f.recorded
		f.mu.Unlock()
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"Items": items})
	default:
		f.api.serve(w, r)
	}
}

func (f *fakeStreamingPIWebAPI) serveChannel(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	reject := f.reject
	f.mu.Unlock()
	if reject != 0 {
		http.Error(w, "unavailable", reject)
		return
	}
	upgrader := websocket.Upgrader{}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	webIDs := r.URL.Query()["webId"]
	f.mu.Lock()
	f.conns[conn] = webIDs
	if f.onOpen != nil {
		for _, message := range f.onOpen(webIDs) {
			writeChannelMessage(conn, message)
		}
	}
	f.mu.Unlock()
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
	f.mu.Lock()
	delete(f.conns, conn)
	f.mu.Unlock()
	_ = conn.Close()
}

func writeChannelMessage(conn *websocket.Conn, message fakeChannelMessage) {
	_ = conn.WriteJSON(map[string]interface{}{"Items": []map[string]interface{}{
		{"WebId": message.webID, "Items": message.items},
	}})
}

// push sends a value of the WebID on every open connection streaming it, and returns the number of connections.
func (f *fakeStreamingPIWebAPI) push(webID string, value interface{}, at time.Time) int {
	f.mu.Lock()
	defer f.mu.Unlock()
	n := 0
	for conn, webIDs := range f.conns {
		for _, id := range webIDs {
			if id == webID {
				writeChannelMessage(conn, fakeChannelMessage{webID, []map[string]interface{}{fakeValue(value, at)}})
				n++
			}
		}
	}
	return n
}

// dropConnections closes the open channel connections, as when PI Web API stops.
func (f *fakeStreamingPIWebAPI) dropConnections() {
	f.mu.Lock()
	defer f.mu.Unlock()
	for conn := range f.conns {
		_ = conn.Close()
	}
}

func (f *fakeStreamingPIWebAPI) openConnections() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.conns)
}

func (f *fakeStreamingPIWebAPI) setReject(status int) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.reject = status
}

// waitConnections waits until n channel connections are open.
func (f *fakeStreamingPIWebAPI) waitConnections(t *testing.T, n int) {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for f.openConnections() != n {
		if time.Now().After(deadline) {
			t.Fatalf("open channel connections = %d, want %d", f.openConnections(), n)
		}
		time.Sleep(5 * time.Millisecond)
	}
}

// fakeValue is a value as returned by PI Web API; a map value is a bad value (a system digital state).
func fakeValue(value interface{}, at time.Time) map[string]interface{} {
	_, bad := value.(map[string]interface{})
	return map[string]interface{}{"Timestamp": at.UTC().Format(time.RFC3339Nano), "Value": value, "Good": !bad}
}

// newLiveDatasource returns a datasource instance with streaming enabled, created as Grafana does.
func newLiveDatasource(t *testing.T, uid, url string, extraJSON string) *Datasource {
	t.Helper()
	instance, err := NewPIWebAPIDatasource(context.Background(), backend.DataSourceInstanceSettings{
		UID: uid, URL: url + "/piwebapi", JSONData: []byte(`{"useStreaming":true` + extraJSON + `}`),
	})
	if err != nil {
		t.Fatal(err)
	}
	d := instance.(*Datasource)
	t.Cleanup(d.Dispose)
	return d
}

// liveQuery is one streamed query of a panel.
type liveQuery struct {
	point  string
	nodata string
}

// queryChannels runs the queries of one panel request and returns the channel path of each PI point.
func queryChannels(t *testing.T, d *Datasource, from, to time.Time, maxDataPoints int64, queries ...liveQuery) map[string]string {
	t.Helper()
	var dataQueries []backend.DataQuery
	for _, q := range queries {
		query := map[string]interface{}{
			"target": "PISRV;" + q.point, "isPiPoint": true, "enableStreaming": map[string]interface{}{"enable": true},
		}
		if q.nodata != "" {
			query["nodata"] = q.nodata
		}
		raw, err := json.Marshal(query)
		if err != nil {
			t.Fatal(err)
		}
		dataQueries = append(dataQueries, backend.DataQuery{RefID: q.point, JSON: raw, MaxDataPoints: maxDataPoints,
			Interval: time.Minute, TimeRange: backend.TimeRange{From: from, To: to}})
	}
	response := d.processBatchtoFrames(d.batchRequest(t.Context(), d.processQuery(dataQueries, d.settings.UID)))
	channels := map[string]string{}
	for refID, r := range response.Responses {
		if r.Error != nil {
			t.Fatalf("query %s failed: %v", refID, r.Error)
		}
		for _, frame := range r.Frames {
			if frame.Meta != nil && frame.Meta.Channel != "" {
				channels[refID] = frame.Meta.Channel[strings.LastIndex(frame.Meta.Channel, "/")+1:]
			}
		}
	}
	return channels
}

// liveValues keeps the values a stream sends to the panel; nil is a null value.
type liveValues struct {
	mu     sync.Mutex
	values []*float64
}

func (l *liveValues) Send(packet *backend.StreamPacket) error {
	var frame struct {
		Data struct {
			Values [][]*float64 `json:"values"`
		} `json:"data"`
	}
	if err := json.Unmarshal(packet.Data, &frame); err != nil {
		return err
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	if len(frame.Data.Values) > 1 {
		l.values = append(l.values, frame.Data.Values[1]...)
	}
	return nil
}

func (l *liveValues) sent() []*float64 {
	l.mu.Lock()
	defer l.mu.Unlock()
	return append([]*float64(nil), l.values...)
}

// waitValues waits until the stream sent n values.
func (l *liveValues) waitValues(t *testing.T, n int) []*float64 {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for len(l.sent()) < n {
		if time.Now().After(deadline) {
			t.Fatalf("values sent = %s, want %d values", formatValues(l.sent()), n)
		}
		time.Sleep(5 * time.Millisecond)
	}
	return l.sent()
}

func formatValues(values []*float64) string {
	parts := make([]string, len(values))
	for i, v := range values {
		if v == nil {
			parts[i] = "null"
		} else {
			raw, _ := json.Marshal(*v)
			parts[i] = string(raw)
		}
	}
	return "[" + strings.Join(parts, " ") + "]"
}

// waitSenders waits until the streams of n panels are registered to receive values.
func waitSenders(t *testing.T, d *Datasource, n int) {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for {
		d.datasourceMutex.Lock()
		senders := 0
		for _, chans := range d.senderChannels {
			senders += len(chans)
		}
		d.datasourceMutex.Unlock()
		if senders == n {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("registered senders = %d, want %d", senders, n)
		}
		time.Sleep(5 * time.Millisecond)
	}
}

// liveStream is a stream run by Grafana for a subscribed panel.
type liveStream struct {
	values *liveValues
	cancel context.CancelFunc
	done   chan error
}

func runLiveStream(t *testing.T, d *Datasource, path string) *liveStream {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	s := &liveStream{values: &liveValues{}, cancel: cancel, done: make(chan error, 1)}
	go func() {
		s.done <- d.RunStream(ctx, &backend.RunStreamRequest{Path: path}, backend.NewStreamSender(s.values))
	}()
	t.Cleanup(func() {
		cancel()
		select {
		case <-s.done:
		case <-time.After(5 * time.Second):
			t.Error("the stream did not stop")
		}
	})
	return s
}

// stop unsubscribes the panel and waits until the stream returns.
func (s *liveStream) stop(t *testing.T) {
	t.Helper()
	s.cancel()
	_ = s.wait(t, "the stream did not stop")
}

// wait waits until the stream returns, and returns its error.
func (s *liveStream) wait(t *testing.T, timeoutMessage string) error {
	t.Helper()
	select {
	case err := <-s.done:
		s.done <- err // for the cleanup
		return err
	case <-time.After(5 * time.Second):
		t.Fatal(timeoutMessage)
		return nil
	}
}

// Two panels stream the same tag, each with other tags, so two WebSocket connections carry it. Each value must
// reach the tag's stream once: it was sent once per connection.
func TestStreamValueSentOnceWithTwoConnections(t *testing.T) {
	pi := newFakeStreamingPIWebAPI(t, "A", "B", "C")
	d := newLiveDatasource(t, t.Name(), pi.server.URL, "")
	now := time.Now()
	panel1 := queryChannels(t, d, now.Add(-time.Hour), now, 100, liveQuery{point: "A"}, liveQuery{point: "B"})
	panel2 := queryChannels(t, d, now.Add(-time.Hour), now, 100, liveQuery{point: "A"}, liveQuery{point: "C"})

	streamA1 := runLiveStream(t, d, panel1["A"])
	runLiveStream(t, d, panel1["B"])
	streams := 3
	var streamA2 *liveStream
	if panel2["A"] != panel1["A"] {
		streamA2 = runLiveStream(t, d, panel2["A"])
		streams++
	}
	runLiveStream(t, d, panel2["C"])
	pi.waitConnections(t, 2)
	waitSenders(t, d, streams)

	if n := pi.push(fakeWebID("A"), 42.0, time.Now()); n != 2 {
		t.Fatalf("the value was pushed on %d connections, want 2", n)
	}
	time.Sleep(200 * time.Millisecond)
	for name, s := range map[string]*liveStream{"panel 1": streamA1, "panel 2": streamA2} {
		if s == nil {
			continue
		}
		if got := s.values.sent(); len(got) != 1 {
			t.Errorf("%s: values sent for one value change = %s, want [42]", name, formatValues(got))
		}
	}
}

// A connection opened for a panel's tags is closed when they are unsubscribed, even when one of them is still
// streamed through another connection at that time.
func TestStreamConnectionsClosedWhenUnsubscribed(t *testing.T) {
	pi := newFakeStreamingPIWebAPI(t, "A", "B", "C")
	d := newLiveDatasource(t, t.Name(), pi.server.URL, "")
	now := time.Now()
	panel1 := queryChannels(t, d, now.Add(-time.Hour), now, 100, liveQuery{point: "A"}, liveQuery{point: "B"})
	panel2 := queryChannels(t, d, now.Add(-time.Hour), now, 100, liveQuery{point: "A"}, liveQuery{point: "C"})

	streams := []*liveStream{runLiveStream(t, d, panel1["A"]), runLiveStream(t, d, panel1["B"])}
	if panel2["A"] != panel1["A"] {
		streams = append(streams, runLiveStream(t, d, panel2["A"]))
	}
	streamC := runLiveStream(t, d, panel2["C"])
	pi.waitConnections(t, 2)

	streamC.stop(t) // panel 2 closes first, then panel 1
	for _, s := range streams {
		s.stop(t)
	}
	pi.waitConnections(t, 0)
}

// A panel closed while PI Web API is down and opened again later must not get old values: the gap was filled from
// the last value streamed before the outage, which the query response already has (or which is out of its range).
func TestStreamNoOldValuesAfterOutage(t *testing.T) {
	attempts, delay := streamReconnectAttempts, streamReconnectBaseDelay
	streamReconnectAttempts, streamReconnectBaseDelay = 2, time.Millisecond
	t.Cleanup(func() { streamReconnectAttempts, streamReconnectBaseDelay = attempts, delay })

	pi := newFakeStreamingPIWebAPI(t, "A")
	old := time.Now().Add(-3 * time.Hour)
	pi.onOpen = func(webIDs []string) []fakeChannelMessage {
		return []fakeChannelMessage{{fakeWebID("A"), []map[string]interface{}{fakeValue(1.0, old)}}}
	}
	pi.recorded = []map[string]interface{}{fakeValue(99.0, old.Add(10*time.Second))}
	d := newLiveDatasource(t, t.Name(), pi.server.URL, "")

	now := time.Now()
	path := queryChannels(t, d, now.Add(-time.Hour), now, 100, liveQuery{point: "A"})["A"]
	stream := runLiveStream(t, d, path)
	stream.values.waitValues(t, 1)

	// PI Web API stops: the stream fails, Grafana runs it again, then the panel is closed
	pi.mu.Lock()
	pi.onOpen = nil
	pi.mu.Unlock()
	pi.setReject(http.StatusServiceUnavailable)
	pi.dropConnections()
	if err := stream.wait(t, "the stream did not fail"); err == nil {
		t.Fatal("expected an error after the reconnect attempts")
	}
	if err := runLiveStream(t, d, path).wait(t, "the stream did not fail"); err == nil {
		t.Fatal("expected an error while PI Web API is down")
	}

	// PI Web API is back and the dashboard is opened again
	pi.setReject(0)
	now = time.Now()
	path = queryChannels(t, d, now.Add(-time.Hour), now, 100, liveQuery{point: "A"})["A"]
	reopened := runLiveStream(t, d, path)
	pi.waitConnections(t, 1)
	time.Sleep(200 * time.Millisecond)
	if got := reopened.values.sent(); len(got) != 0 {
		t.Errorf("the reopened panel got old values %s", formatValues(got))
	}
}

// With "Replace Bad Data = Previous", a bad value is replaced by the last good value, also when it arrives in its
// own channel message (PI Web API usually sends one value per message), and the first one by the last good value of
// the query response.
func TestStreamReplaceBadDataPrevious(t *testing.T) {
	pi := newFakeStreamingPIWebAPI(t, "A")
	bad := map[string]interface{}{"Name": "Shutdown", "Value": 254, "IsSystem": true}
	start := time.Now()
	pi.onOpen = func(webIDs []string) []fakeChannelMessage {
		return []fakeChannelMessage{
			{fakeWebID("A"), []map[string]interface{}{fakeValue(bad, start)}},
			{fakeWebID("A"), []map[string]interface{}{fakeValue(7.0, start.Add(time.Second))}},
			{fakeWebID("A"), []map[string]interface{}{fakeValue(bad, start.Add(2*time.Second))}},
		}
	}
	d := newLiveDatasource(t, t.Name(), pi.server.URL, "")
	now := time.Now()
	path := queryChannels(t, d, now.Add(-time.Hour), now, 100, liveQuery{point: "A", nodata: "Previous"})["A"]

	got := runLiveStream(t, d, path).values.waitValues(t, 3)
	// the query response's values are 1.5 and 2.5 (see fakePIWebAPI)
	if formatValues(got) != "[2.5 7 7]" {
		t.Errorf("values sent = %s, want [2.5 7 7]", formatValues(got))
	}
}

// A new query result (another time range, another maximum of data points, or a refresh) gets a new channel: Grafana
// keeps the buffer of a channel it already streams and ignores the new frame, and panels on the same channel share
// that buffer.
func TestStreamChannelPerQueryResult(t *testing.T) {
	pi := newFakeStreamingPIWebAPI(t, "A")
	d := newLiveDatasource(t, t.Name(), pi.server.URL, "")
	now := time.Now()
	channel := func(from, to time.Time, maxDataPoints int64) string {
		return queryChannels(t, d, from, to, maxDataPoints, liveQuery{point: "A"})["A"]
	}
	last15m := channel(now.Add(-15*time.Minute), now, 100)
	if channel(now.Add(-6*time.Hour), now, 100) == last15m {
		t.Error("another time range must get another channel")
	}
	if channel(now.Add(-15*time.Minute), now, 1000) == last15m {
		t.Error("another maximum of data points must get another channel")
	}
	if channel(now.Add(-15*time.Minute).Add(5*time.Second), now.Add(5*time.Second), 100) == last15m {
		t.Error("a refresh must get another channel")
	}
}

// Only a time range ending now is streamed: the live values of a past range would be added after its end.
func TestStreamOnlyRangesEndingNow(t *testing.T) {
	pi := newFakeStreamingPIWebAPI(t, "A")
	d := newLiveDatasource(t, t.Name(), pi.server.URL, "")
	now := time.Now()
	for _, tt := range []struct {
		name   string
		to     time.Time
		stream bool
	}{
		{"now", now, true},
		{"ending in the future (today)", now.Add(10 * time.Hour), true},
		{"ending 30 minutes ago", now.Add(-30 * time.Minute), false},
		{"yesterday", now.Add(-24 * time.Hour), false},
	} {
		channels := queryChannels(t, d, tt.to.Add(-time.Hour), tt.to, 100, liveQuery{point: "A"})
		if _, streamed := channels["A"]; streamed != tt.stream {
			t.Errorf("%s: streamed = %v, want %v", tt.name, streamed, tt.stream)
		}
	}
}

// Saving the datasource settings creates a new instance: Grafana runs the panels' streams again on it, with the
// channels of the previous instance. They used to fail every 5 s until each panel was refreshed.
func TestStreamChannelsAfterSettingsSaved(t *testing.T) {
	pi := newFakeStreamingPIWebAPI(t, "A")
	before := newLiveDatasource(t, t.Name(), pi.server.URL, "")
	now := time.Now()
	path := queryChannels(t, before, now.Add(-time.Hour), now, 100, liveQuery{point: "A"})["A"]
	stream := runLiveStream(t, before, path)
	pi.waitConnections(t, 1)

	after := newLiveDatasource(t, t.Name(), pi.server.URL, "")
	stream.stop(t)
	pi.waitConnections(t, 0)
	if resp, err := after.SubscribeStream(context.Background(), &backend.SubscribeStreamRequest{Path: path}); err != nil ||
		resp.Status != backend.SubscribeStreamStatusOK {
		t.Errorf("subscribing on the new instance: %v %v", resp, err)
	}
	restarted := runLiveStream(t, after, path)
	pi.waitConnections(t, 1)
	if n := pi.push(fakeWebID("A"), 42.0, time.Now()); n != 1 {
		t.Fatalf("the value was pushed on %d connections, want 1", n)
	}
	restarted.values.waitValues(t, 1)
}
