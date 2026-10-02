package plugin

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/proxy"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// streamFrameCache holds the WebID metadata and datasource options of a stream, read once when the channel is
// registered so that converting each WebSocket message needs no lock.
type streamFrameCache struct {
	metadata  WebIDCacheEntry
	newFormat bool
	units     bool
}

// StreamChannelConstruct holds what is needed to stream the values of one PI tag to a Grafana channel: the query
// whose values the channel adds to, and the PI Web API WebSocket connection it streams from.
type StreamChannelConstruct struct {
	WebID         string
	ConnectionKey string // sorted WebIDs joined by "|"; key into websocketConnections
	// connectionWebIDs are the WebIDs streamed by the connection, in the order of ConnectionKey
	connectionWebIDs []string
	query            *PiProcessedQuery
	frameCache       streamFrameCache // pre-computed static WebID metadata; see buildStreamFrameCache
	state            *streamChannelState
}

// streamChannelState is the state of a channel that outlives each run of its stream by Grafana. It is shared with
// the instance that takes over the channel when the datasource settings are saved (see takeOverStreamChannels).
type streamChannelState struct {
	mu       sync.Mutex
	running  int       // runs of the stream in progress
	lastUsed time.Time // when the channel was last registered by a query, or a run of its stream ended
	// lastSent is the time of the last value sent on the channel, to fill the gap after a reconnect; zero when no
	// value was sent yet.
	lastSent time.Time
	// filledUntil is the time of the last value sent by fillStreamGap, until the live values are past it (see
	// newItems); zero when there is none.
	filledUntil time.Time
	// lastGood is the last good value of the channel, which replaces a bad value with "Replace Bad Data = Previous".
	lastGood *PiBatchContentItem
}

// registered records that a query returned the channel, with the values of the query response.
func (s *streamChannelState) registered(items []PiBatchContentItem) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.lastUsed = time.Now()
	s.updateLastGood(items)
	// The panel has the values of the response: a fill must not send them (or older values) again when the channel
	// already streamed, e.g. it was closed during a PI Web API outage and is opened again.
	if !s.lastSent.IsZero() && len(items) > 0 && items[len(items)-1].Timestamp.After(s.lastSent) {
		s.lastSent = items[len(items)-1].Timestamp
	}
}

// start records that Grafana runs the stream; end records that the run ended.
func (s *streamChannelState) start() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.running++
}

func (s *streamChannelState) end() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.running--
	s.lastUsed = time.Now()
}

// unused returns whether the stream does not run and the channel was not used since the given time.
func (s *streamChannelState) unused(since time.Time) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.running == 0 && s.lastUsed.Before(since)
}

// sent records the values sent on the channel.
func (s *streamChannelState) sent(items []PiBatchContentItem) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, item := range items {
		if item.Timestamp.After(s.lastSent) {
			s.lastSent = item.Timestamp
		}
	}
	s.updateLastGood(items)
}

// updateLastGood keeps the last good value of items, unless the channel has a later one.
func (s *streamChannelState) updateLastGood(items []PiBatchContentItem) {
	for i := len(items) - 1; i >= 0; i-- {
		if items[i].Value != nil && items[i].isGood() {
			if s.lastGood == nil || !items[i].Timestamp.Before(s.lastGood.Timestamp) {
				item := items[i]
				s.lastGood = &item
			}
			return
		}
	}
}

// lastSentTime returns the time of the last value sent on the channel, if any.
func (s *streamChannelState) lastSentTime() (time.Time, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.lastSent, !s.lastSent.IsZero()
}

// previousGood returns the last good value of the channel, or nil.
func (s *streamChannelState) previousGood() *PiBatchContentItem {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.lastGood
}

// filled records the time of the last value sent by fillStreamGap.
func (s *streamChannelState) filled(t time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.filledUntil = t
}

// newItems leaves out the live values already sent by fillStreamGap: the first messages of the new connection
// can repeat them. Once a later value arrives, all values are sent again, including values with an earlier or the
// same time (corrected past values, attributes without data reference).
func (s *streamChannelState) newItems(items []PiBatchContentItem) []PiBatchContentItem {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.filledUntil.IsZero() {
		return items
	}
	newItems := make([]PiBatchContentItem, 0, len(items))
	for _, item := range items {
		if item.Timestamp.After(s.filledUntil) {
			newItems = append(newItems, item)
		}
	}
	if len(newItems) > 0 {
		s.filledUntil = time.Time{}
	}
	return newItems
}

// StreamingResponse is the JSON envelope received from the PI Web API WebSocket channel
// endpoint. Each message contains one StreamData item per subscribed tag.
type StreamingResponse struct {
	Links map[string]interface{} `json:"Links"`
	Items []StreamData           `json:"Items"`
}

// StreamData holds the live values for a single PI tag within a WebSocket message.
type StreamData struct {
	WebId             string                 `json:"WebId"`
	Name              string                 `json:"Name"`
	Path              string                 `json:"Path"`
	Links             map[string]interface{} `json:"Links"`
	Items             []PiBatchContentItem   `json:"Items"`
	UnitsAbbreviation string                 `json:"UnitsAbbreviation"`
}

// buildStreamSetsWebSocketURL builds a streamsets/channel WebSocket URL for one or more
// WebIDs, converting https→wss / http→ws. Using the streamsets endpoint means all tags
// in a single query batch share one WebSocket connection rather than one per tag.
func buildStreamSetsWebSocketURL(baseURL string, webIDs []string) (string, error) {
	if len(webIDs) == 0 {
		return "", errors.New("no WebIDs provided")
	}
	uri := strings.Replace(baseURL, "https://", "wss://", 1)
	uri = strings.Replace(uri, "http://", "ws://", 1)
	if !strings.HasSuffix(uri, "/") {
		uri += "/"
	}
	params := make([]string, len(webIDs))
	for i, id := range webIDs {
		params[i] = "webId=" + id
	}
	return uri + "streamsets/channel?" + strings.Join(params, "&"), nil
}

// streamChannelTTL is how long a channel stays registered when its stream does not run: Grafana subscribes after
// the query returns the channel, runs the stream again after it failed, and runs it on the new instance when the
// datasource settings are saved. Each query result gets its own channel (see channelKeyFor), so the channels that
// are no longer used must be removed.
const streamChannelTTL = 2 * time.Minute

// registerStreamChannel registers the channel that streams the live values of the query's PI tag after the values
// of the query response, and returns its path. connectionKey and connectionWebIDs identify the WebSocket connection
// shared by the streamed tags of the request.
func (d *Datasource) registerStreamChannel(q *PiProcessedQuery, items []PiBatchContentItem, connectionKey string, connectionWebIDs []string) string {
	path := channelKeyFor(q)
	d.datasourceMutex.Lock()
	construct, exists := d.channelConstruct[path]
	d.datasourceMutex.Unlock()
	if !exists {
		// the stream converts only the new values: without the query response, which is not kept
		streamQuery := *q
		streamQuery.Response = nil
		streamQuery.Cached = false
		// buildStreamFrameCache reads the WebID cache, which locks datasourceMutex: it is called outside the lock
		construct = StreamChannelConstruct{
			WebID:            q.WebID,
			ConnectionKey:    connectionKey,
			connectionWebIDs: connectionWebIDs,
			query:            &streamQuery,
			frameCache:       buildStreamFrameCache(d, q),
			state:            &streamChannelState{lastUsed: time.Now()},
		}
		d.datasourceMutex.Lock()
		if registered, ok := d.channelConstruct[path]; ok { // registered concurrently
			construct = registered
		} else {
			d.channelConstruct[path] = construct
		}
		d.datasourceMutex.Unlock()
	}
	construct.state.registered(items)
	d.removeUnusedStreamChannels()
	return path
}

// removeUnusedStreamChannels removes the channels whose stream has not run for streamChannelTTL. It runs at most a
// few times per streamChannelTTL.
func (d *Datasource) removeUnusedStreamChannels() {
	now := time.Now()
	d.datasourceMutex.Lock()
	defer d.datasourceMutex.Unlock()
	if now.Sub(d.streamChannelsCleaned) < streamChannelTTL/4 {
		return
	}
	d.streamChannelsCleaned = now
	for path, construct := range d.channelConstruct {
		if construct.state.unused(now.Add(-streamChannelTTL)) {
			delete(d.channelConstruct, path)
		}
	}
}

// streamInstances holds the current instance of each datasource, by UID. Saving the datasource settings creates a new
// instance, and Grafana runs the streams of the subscribed panels again on it, with their channel paths: the new
// instance takes over the channels of the previous one.
var streamInstances = struct {
	sync.Mutex
	byUID map[string]*Datasource
}{byUID: map[string]*Datasource{}}

// takeOverStreamChannels makes d the current instance of its datasource. For streamChannelTTL, the channels of the
// previous instance are found by streamChannel.
func (d *Datasource) takeOverStreamChannels() {
	streamInstances.Lock()
	previous := streamInstances.byUID[d.settings.UID]
	streamInstances.byUID[d.settings.UID] = d
	streamInstances.Unlock()
	if previous == nil {
		return
	}
	// only the channels of the last instance are taken over, so that the instances are not kept in a chain
	previous.datasourceMutex.Lock()
	previous.previous = nil
	previous.datasourceMutex.Unlock()
	d.datasourceMutex.Lock()
	d.previous = previous
	d.previousUntil = time.Now().Add(streamChannelTTL)
	d.datasourceMutex.Unlock()
}

// releaseStreamChannels is called when the instance is disposed. It is no longer the current instance of the
// datasource when it was replaced; otherwise the datasource was removed.
func (d *Datasource) releaseStreamChannels() {
	streamInstances.Lock()
	if streamInstances.byUID[d.settings.UID] == d {
		delete(streamInstances.byUID, d.settings.UID)
	}
	streamInstances.Unlock()
	d.datasourceMutex.Lock()
	d.previous = nil
	d.datasourceMutex.Unlock()
}

// streamChannel returns the channel registered with the path by a query, on this instance or on the previous
// instance of the datasource (see takeOverStreamChannels).
func (d *Datasource) streamChannel(path string) (StreamChannelConstruct, bool) {
	d.datasourceMutex.Lock()
	construct, ok := d.channelConstruct[path]
	previous := d.previous
	if previous != nil && time.Now().After(d.previousUntil) {
		d.previous, previous = nil, nil
	}
	d.datasourceMutex.Unlock()
	if ok || previous == nil {
		return construct, ok
	}
	previous.datasourceMutex.Lock()
	construct, ok = previous.channelConstruct[path]
	previous.datasourceMutex.Unlock()
	if !ok {
		return construct, false
	}
	d.datasourceMutex.Lock()
	if registered, exists := d.channelConstruct[path]; exists {
		construct = registered
	} else {
		d.channelConstruct[path] = construct
	}
	d.datasourceMutex.Unlock()
	backend.Logger.Debug("Streaming: channel taken over from the previous datasource instance", "path", path)
	return construct, true
}

// SubscribeStream is called by Grafana when a panel subscribes to a streaming channel.
// It verifies that the requested path was registered during a prior QueryData call.
func (d *Datasource) SubscribeStream(_ context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	status := backend.SubscribeStreamStatusPermissionDenied
	if _, ok := d.streamChannel(req.Path); ok {
		status = backend.SubscribeStreamStatusOK
	}
	return &backend.SubscribeStreamResponse{Status: status}, nil
}

// PublishStream is not supported — data originates from PI Web API, not from Grafana clients.
func (d *Datasource) PublishStream(_ context.Context, _ *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return &backend.PublishStreamResponse{
		Status: backend.PublishStreamStatusPermissionDenied,
	}, nil
}

// RunStream is called by Grafana once per active channel to pump data to subscribers. It wires the StreamSender to
// the PI Web API WebSocket connection of the channel's tag: the tags of a query batch share one streamsets/channel
// connection, and readWebsocketMessages routes each StreamData item to the sender of its WebId. It blocks until the
// context is cancelled or a fatal error occurs.
func (d *Datasource) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	construct, ok := d.streamChannel(req.Path)
	if !ok {
		return fmt.Errorf("streaming: no channel construct registered for path %q", req.Path)
	}
	construct.state.start()
	defer construct.state.end()

	// Register the sender before connecting so that readWebsocketMessages can deliver
	// to it as soon as the shared connection is established.
	senderCh := d.addStreamSender(construct.ConnectionKey, construct.WebID, sender)
	if err := d.getOrCreateWebsocketConnection(ctx, construct.ConnectionKey, construct.connectionWebIDs); err != nil {
		d.teardownStream(construct, sender)
		if ctx.Err() != nil {
			return nil // the panel unsubscribed
		}
		return fmt.Errorf("streaming: WebSocket connect failed for connection %q: %w", construct.ConnectionKey, err)
	}
	return d.sendStreamData(ctx, sender, req.Path, senderCh, construct)
}

// getOrCreateWebsocketConnection ensures exactly one shared WebSocket connection exists for
// the given connection key. The blocking network dial is performed outside any mutex so
// that multiple panels can attempt connection setup concurrently.
func (d *Datasource) getOrCreateWebsocketConnection(ctx context.Context, connectionKey string, webIDs []string) error {
	// Fast path: connection already exists.
	d.websocketConnectionsMutex.Lock()
	_, ok := d.websocketConnections[connectionKey]
	d.websocketConnectionsMutex.Unlock()
	if ok {
		backend.Logger.Debug("Streaming: reusing existing WebSocket connection", "connectionKey", connectionKey)
		return nil
	}

	// Dial outside any lock — this may block for hundreds of milliseconds.
	conn, err := d.createWebsocketConnection(ctx, webIDs)
	if err != nil {
		return err
	}

	// Re-acquire and double-check: a concurrent goroutine may have connected first.
	d.websocketConnectionsMutex.Lock()
	defer d.websocketConnectionsMutex.Unlock()
	if _, ok := d.websocketConnections[connectionKey]; ok {
		// Another goroutine won the race; discard our duplicate connection.
		_ = conn.Close()
		backend.Logger.Debug("Streaming: closing duplicate WebSocket connection (concurrent dial)", "connectionKey", connectionKey)
		return nil
	}
	d.websocketConnections[connectionKey] = conn

	// readWebsocketMessages runs for the lifetime of the connection, parsing each
	// StreamingResponse and routing individual StreamData items to per-tag sender channels.
	go d.readWebsocketMessages(conn, connectionKey, webIDs)

	backend.Logger.Info("Streaming: WebSocket connection opened", "connectionKey", connectionKey, "tags", len(webIDs))
	return nil
}

// websocketHeader returns the headers of the WebSocket requests to PI Web API: the same authentication and custom
// headers as the datasource's HTTP requests.
func websocketHeader(opts httpclient.Options) http.Header {
	header := opts.Header.Clone()
	if header == nil {
		header = http.Header{}
	}
	if opts.BasicAuth != nil && header.Get("Authorization") == "" {
		header.Set("Authorization", basicAuthorization(opts.BasicAuth.User, opts.BasicAuth.Password))
	}
	return header
}

func basicAuthorization(user, password string) string {
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(user+":"+password))
}

// defaultWebsocketTimeout is the WebSocket handshake timeout when the datasource has no HTTP timeout.
const defaultWebsocketTimeout = 30 * time.Second

// websocketTimeout returns the WebSocket handshake timeout: the datasource's HTTP timeout ("Timeout" in the
// advanced HTTP settings), or defaultWebsocketTimeout.
func websocketTimeout(opts httpclient.Options) time.Duration {
	if opts.Timeouts != nil && opts.Timeouts.Timeout > 0 {
		return opts.Timeouts.Timeout
	}
	return defaultWebsocketTimeout
}

// websocketDialContext dials the network connection of a WebSocket connection.
type websocketDialContext func(ctx context.Context, network, addr string) (net.Conn, error)

// websocketTransport returns the TLS configuration and the network dialer of the WebSocket connections to PI Web
// API, built like the transport of the datasource's HTTP client: the CA certificate, client certificate, server
// name, TLS versions and skip verification of the datasource, and Grafana's secure SOCKS proxy when the datasource
// uses it. The dialer is nil for a direct connection.
func websocketTransport(opts httpclient.Options) (*tls.Config, websocketDialContext, error) {
	tlsConfig, err := httpclient.GetTLSConfig(opts)
	if err != nil {
		return nil, nil, err
	}
	if opts.ConfigureTLSConfig != nil {
		opts.ConfigureTLSConfig(opts, tlsConfig)
	}
	socksProxy := proxy.New(opts.ProxyOptions)
	if !socksProxy.SecureSocksProxyEnabled() {
		return tlsConfig, nil, nil
	}
	dialer, err := socksProxy.NewSecureSocksProxyContextDialer()
	if err != nil {
		return nil, nil, err
	}
	contextDialer, ok := dialer.(interface {
		DialContext(ctx context.Context, network, addr string) (net.Conn, error)
	})
	if !ok {
		return nil, nil, errors.New("the secure socks proxy dialer does not support contexts")
	}
	return tlsConfig, contextDialer.DialContext, nil
}

// createWebsocketConnection opens a new authenticated streamsets/channel WebSocket connection
// to PI Web API for the given set of WebIDs. All tags in a query batch share one connection.
func (d *Datasource) createWebsocketConnection(ctx context.Context, webIDs []string) (*websocket.Conn, error) {
	uri, err := buildStreamSetsWebSocketURL(d.settings.URL, webIDs)
	if err != nil {
		return nil, err
	}
	header := d.websocketHeader.Clone()
	if header == nil {
		header = http.Header{}
	}
	// Credentials in the datasource URL authenticate like the datasource's HTTP requests. The WebSocket library
	// rejects a URL with credentials, and they must not be logged.
	u, err := url.Parse(uri)
	if err != nil {
		return nil, err
	}
	if u.User != nil {
		password, _ := u.User.Password()
		if header.Get("Authorization") == "" {
			header.Set("Authorization", basicAuthorization(u.User.Username(), password))
		}
		u.User = nil
		uri = u.String()
	}

	// the handshake times out like the datasource's HTTP requests, so an unresponsive server cannot block the stream
	timeout := d.websocketTimeout
	if timeout <= 0 {
		timeout = defaultWebsocketTimeout
	}
	dial := d.websocketDial
	if dial == nil {
		dial = (&net.Dialer{}).DialContext
	}
	// the connection is shared by the subscribers of the channel: the subscriber's context only cancels the
	// handshake (the WebSocket library does not stop the handshake when the context is cancelled)
	var stopCancel func() bool
	dialer := websocket.Dialer{
		TLSClientConfig:  d.websocketTLS.Clone(),
		Proxy:            http.ProxyFromEnvironment, // like the datasource's HTTP client
		HandshakeTimeout: timeout,
		NetDialContext: func(dialCtx context.Context, network, addr string) (net.Conn, error) {
			netConn, err := dial(dialCtx, network, addr)
			if err == nil {
				stopCancel = context.AfterFunc(ctx, func() { _ = netConn.Close() })
			}
			return netConn, err
		},
	}

	conn, resp, err := dialer.DialContext(ctx, uri, header)
	if stopCancel != nil {
		stopCancel()
	}
	if err != nil {
		if resp != nil {
			err = fmt.Errorf("%w: %s", err, resp.Status)
		}
		backend.Logger.Error("Streaming: WebSocket dial failed", "uri", uri, "error", err)
		return nil, err
	}
	return conn, nil
}

// senderKey returns the key of the senders of a WebID's values received on a connection in senderChannels. A tag is
// streamed by every connection opened for a query batch with this tag; its senders only get its values from the
// connection they subscribed through, or each value would be sent once per connection.
func senderKey(connectionKey, webID string) string {
	return connectionKey + "\n" + webID
}

// readWebsocketMessages continuously reads raw messages from the shared WebSocket connection
// and routes each StreamData item to the appropriate per-tag sender channel by WebId. When
// the connection closes or errors, the dead connection is removed so the next subscriber
// triggers a fresh dial.
func (d *Datasource) readWebsocketMessages(conn *websocket.Conn, connectionKey string, webIDs []string) {
	defer func() { _ = conn.Close() }()
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			d.websocketConnectionLost(conn, connectionKey, webIDs, err)
			return
		}

		var streamResp StreamingResponse
		if err := json.Unmarshal(message, &streamResp); err != nil {
			backend.Logger.Error("Streaming: failed to unmarshal WebSocket message",
				"connectionKey", connectionKey, "error", err)
			continue
		}

		backend.Logger.Debug("Streaming: WebSocket message received",
			"connectionKey", connectionKey, "items", len(streamResp.Items))

		// Route each StreamData item to the sender channels for its specific WebId.
		d.datasourceMutex.Lock()
		for _, item := range streamResp.Items {
			for _, ch := range d.senderChannels[senderKey(connectionKey, item.WebId)] {
				select {
				case ch <- item:
				default:
					backend.Logger.Warn("Streaming: sender channel full, dropping message", "webID", item.WebId)
				}
			}
		}
		d.datasourceMutex.Unlock()
	}
}

// websocketConnectionLost removes a connection that closed or failed, and closes the sender channels of its
// subscribers so that they reconnect: without this they block indefinitely on their sender channels while Grafana
// keeps showing a green dot with no data flowing. A connection closed because it had no subscribers left (see
// checkForOrphanedWebSocket) is no longer registered: the subscribers that arrived since use a new connection.
func (d *Datasource) websocketConnectionLost(conn *websocket.Conn, connectionKey string, webIDs []string, err error) {
	d.websocketConnectionsMutex.Lock()
	defer d.websocketConnectionsMutex.Unlock()
	if d.websocketConnections[connectionKey] != conn {
		backend.Logger.Debug("Streaming: WebSocket connection closed cleanly", "connectionKey", connectionKey)
		return
	}
	delete(d.websocketConnections, connectionKey)
	backend.Logger.Error("Streaming: WebSocket read error, connection removed", "connectionKey", connectionKey, "error", err)

	d.datasourceMutex.Lock()
	defer d.datasourceMutex.Unlock()
	for _, webID := range webIDs {
		key := senderKey(connectionKey, webID)
		for _, ch := range d.senderChannels[key] {
			close(ch)
		}
		delete(d.senderChannels, key)
	}
}

// teardownStream removes the sender and closes the stream's WebSocket connection when it has no subscribers left.
// The channel stays registered: Grafana runs the stream again after a failure, and the channel is removed once
// unused (see removeUnusedStreamChannels).
func (d *Datasource) teardownStream(construct StreamChannelConstruct, sender *backend.StreamSender) {
	d.removeStreamSender(construct.ConnectionKey, construct.WebID, sender)
	d.checkForOrphanedWebSocket(construct.ConnectionKey, construct.connectionWebIDs)
}

// convertStreamValues converts the values of a channel message or of a gap fill. With "Replace Bad Data =
// Previous", the last good value of the channel is converted first and left out of the frame, so that a bad value
// at the start of the values is replaced by it: PI Web API channels usually send one value per message. With
// Previous, each value gives one row of the frame.
func convertStreamValues(construct StreamChannelConstruct, stream StreamData) *data.Frame {
	previous := construct.state.previousGood()
	if previous == nil || construct.query.getNoDataReplace() != "Previous" {
		return convertStreamItemsToFrame(construct.query, stream, construct.frameCache)
	}
	withPrevious := stream
	withPrevious.Items = append([]PiBatchContentItem{*previous}, stream.Items...)
	frame := convertStreamItemsToFrame(construct.query, withPrevious, construct.frameCache)
	frame.DeleteRow(0)
	return frame
}

// fillStreamGap sends the values recorded since the last value sent on the channel ("Fill gaps after reconnect"):
// PI Web API channels only send the values that change after the connection is opened, so the values recorded
// while the stream was disconnected would otherwise only appear at the next refresh of the panel. At most the
// query's maximum data points are sent; a failure is logged and leaves the gap until the next refresh.
func (d *Datasource) fillStreamGap(ctx context.Context, path string, construct StreamChannelConstruct, sender *backend.StreamSender) {
	if construct.query == nil || !construct.query.StreamFillGaps {
		return
	}
	last, ok := construct.state.lastSentTime()
	if !ok {
		return // nothing sent yet: the query returned the values up to now
	}
	maxCount := construct.query.MaxDataPoints
	if maxCount <= 0 {
		maxCount = 1000
	}
	uri := fmt.Sprintf("streams/%s/recorded?startTime=%s&endTime=*&maxCount=%d",
		construct.WebID, queryEscape(last.UTC().Format(time.RFC3339Nano)), maxCount)
	body, err := apiGet(ctx, d, uri)
	if err != nil {
		backend.Logger.Warn("Streaming: could not fill the gap after reconnect", "path", path, "webID", construct.WebID, "error", err)
		return
	}
	var recorded StreamData
	if err := json.Unmarshal(body, &recorded); err != nil {
		backend.Logger.Warn("Streaming: could not read the values to fill the gap", "path", path, "webID", construct.WebID, "error", err)
		return
	}
	newItems := recorded.Items[:0]
	for _, item := range recorded.Items {
		if item.Timestamp.After(last) { // the recorded values start with the last value sent
			newItems = append(newItems, item)
		}
	}
	if recorded.Items = newItems; len(recorded.Items) == 0 {
		return
	}
	frame := convertStreamValues(construct, recorded)
	if err := sender.SendFrame(frame, data.IncludeDataOnly); err != nil {
		backend.Logger.Warn("Streaming: could not send the values filling the gap", "path", path, "webID", construct.WebID, "error", err)
		return
	}
	construct.state.sent(recorded.Items)
	construct.state.filled(recorded.Items[len(recorded.Items)-1].Timestamp)
	backend.Logger.Info("Streaming: filled the gap after reconnect", "path", path, "webID", construct.WebID, "values", len(recorded.Items))
}

// streamKeepaliveInterval is how long a stream waits for a new value before sending a keepalive to the panel.
var streamKeepaliveInterval = 30 * time.Second

// streamReconnectAttempts and streamReconnectBaseDelay control how sendStreamData reconnects a lost connection:
// the first attempt is immediate, then the delay doubles (1 s, 2 s, 4 s, 8 s).
var (
	streamReconnectAttempts  = 5
	streamReconnectBaseDelay = time.Second
)

// sendStreamData is the per-subscriber send loop. It reads pre-parsed StreamData items
// from the subscriber's private channel, converts them into a data.Frame, and pushes it
// to Grafana. On context cancellation or send failure it deregisters the sender and
// triggers orphan detection. When the underlying WebSocket connection is lost (e.g. due
// to auth token expiry causing a Forbidden), it attempts to reconnect with exponential
// backoff rather than permanently killing the stream.
func (d *Datasource) sendStreamData(
	ctx context.Context,
	sender *backend.StreamSender,
	path string,
	senderCh <-chan StreamData,
	construct StreamChannelConstruct,
) error {
	webID := construct.WebID

	// Keepalive: if no data arrives within this interval, re-send the last known
	// frame to prevent Grafana's centrifuge from expiring the idle channel.
	keepaliveInterval := streamKeepaliveInterval
	keepalive := time.NewTimer(keepaliveInterval)
	defer keepalive.Stop()
	var lastFrame *data.Frame

	// when Grafana runs the stream again after it failed, fill the gap before the new values
	d.fillStreamGap(ctx, path, construct, sender)

	for {
		select {
		case <-ctx.Done():
			backend.Logger.Info("Streaming: subscriber context done", "path", path, "webID", webID)
			d.teardownStream(construct, sender)
			return nil

		case <-keepalive.C:
			// No data received within the keepalive window: send the last frame without its values, to keep the
			// Grafana streaming channel alive without adding the last values to the panel again.
			if lastFrame != nil {
				if err := sender.SendFrame(lastFrame.EmptyCopy(), data.IncludeDataOnly); err != nil {
					backend.Logger.Error("Streaming: keepalive send failed",
						"webID", webID, "error", err)
					d.teardownStream(construct, sender)
					return fmt.Errorf("streaming: keepalive send failed: %w", err)
				}
				backend.Logger.Debug("Streaming: keepalive frame sent", "webID", webID)
			}
			keepalive.Reset(keepaliveInterval)

		case item, ok := <-senderCh:
			if !ok {
				// Channel closed — WebSocket connection lost (auth expiry / Forbidden).
				// Try to reconnect with exponential backoff; first attempt is immediate.
				var newSenderCh chan StreamData
				for attempt := 1; attempt <= streamReconnectAttempts; attempt++ {
					if attempt > 1 {
						delay := streamReconnectBaseDelay * time.Duration(1<<uint(attempt-2))
						t := time.NewTimer(delay)
						select {
						case <-ctx.Done():
							t.Stop()
							backend.Logger.Info("Streaming: context cancelled during reconnect", "path", path, "webID", webID)
							d.teardownStream(construct, sender)
							return nil
						case <-t.C:
						}
					}
					backend.Logger.Info("Streaming: connection lost, attempting reconnect",
						"path", path, "webID", webID, "attempt", attempt)
					newSenderCh = d.addStreamSender(construct.ConnectionKey, webID, sender)
					if err := d.getOrCreateWebsocketConnection(ctx, construct.ConnectionKey, construct.connectionWebIDs); err != nil {
						backend.Logger.Warn("Streaming: reconnect attempt failed",
							"path", path, "webID", webID, "attempt", attempt, "error", err)
						d.removeStreamSender(construct.ConnectionKey, webID, sender)
						newSenderCh = nil
						continue
					}
					backend.Logger.Info("Streaming: reconnected successfully", "path", path, "webID", webID, "attempt", attempt)
					break
				}

				if newSenderCh == nil {
					// Grafana runs the stream again every 5 s while the panel is subscribed, so the channel stays
					// registered (same key) and one of those runs reconnects once PI Web API is back.
					backend.Logger.Error("Streaming: all reconnect attempts exhausted", "path", path, "webID", webID)
					d.teardownStream(construct, sender)
					return errors.New("streaming: connection lost and reconnect failed")
				}
				senderCh = newSenderCh
				d.fillStreamGap(ctx, path, construct, sender)
				continue
			}

			if construct.query != nil && construct.query.StreamFillGaps {
				if item.Items = construct.state.newItems(item.Items); len(item.Items) == 0 {
					continue
				}
			}
			frame := convertStreamValues(construct, item)

			if err := sender.SendFrame(frame, data.IncludeDataOnly); err != nil {
				backend.Logger.Error("Streaming: failed to send frame to subscriber",
					"webID", webID, "error", err)
				d.teardownStream(construct, sender)
				return fmt.Errorf("streaming: send frame failed: %w", err)
			}
			lastFrame = frame
			keepalive.Reset(keepaliveInterval)
			construct.state.sent(item.Items)

			backend.Logger.Debug("Streaming: frame sent to subscriber",
				"webID", webID, "items", len(item.Items))
		}
	}
}

// buildStreamFrameCache reads the WebID metadata and datasource options used to convert the stream's values.
func buildStreamFrameCache(d *Datasource, q *PiProcessedQuery) streamFrameCache {
	metadata, _ := d.getWebIDEntry(q.WebID)
	return streamFrameCache{metadata: metadata, newFormat: d.isUsingNewFormat(), units: d.isUsingUnits()}
}

// checkForOrphanedWebSocket closes the shared WebSocket connection for connectionKey when
// no subscribers remain across all WebIDs that share that connection.
// Lock ordering: websocketConnectionsMutex is always acquired before datasourceMutex to
// eliminate the TOCTOU window between the subscriber-count check and the connection close.
func (d *Datasource) checkForOrphanedWebSocket(connectionKey string, webIDs []string) {
	d.websocketConnectionsMutex.Lock()
	defer d.websocketConnectionsMutex.Unlock()

	// Re-check under both locks: a subscriber may have been added after the caller's
	// removeStreamSender but before we acquired websocketConnectionsMutex.
	d.datasourceMutex.Lock()
	for _, webID := range webIDs {
		if len(d.senderChannels[senderKey(connectionKey, webID)]) > 0 {
			d.datasourceMutex.Unlock()
			return
		}
	}
	d.datasourceMutex.Unlock()

	if ws, ok := d.websocketConnections[connectionKey]; ok {
		delete(d.websocketConnections, connectionKey)
		_ = ws.Close()
		backend.Logger.Info("Streaming: closed orphaned WebSocket connection", "connectionKey", connectionKey)
	}
}

// addStreamSender registers a new subscriber for the values of webID received on the connection, and returns its
// private buffered StreamData channel.
func (d *Datasource) addStreamSender(connectionKey, webID string, sender *backend.StreamSender) chan StreamData {
	ch := make(chan StreamData, 100)
	key := senderKey(connectionKey, webID)
	d.datasourceMutex.Lock()
	if d.senderChannels[key] == nil {
		d.senderChannels[key] = make(map[*backend.StreamSender]chan StreamData)
	}
	d.senderChannels[key][sender] = ch
	d.datasourceMutex.Unlock()
	backend.Logger.Debug("Streaming: sender registered", "webID", webID)
	return ch
}

// removeStreamSender deregisters a subscriber and closes its private StreamData channel.
// The key is deleted when the last subscriber for that tag on the connection unsubscribes.
func (d *Datasource) removeStreamSender(connectionKey, webID string, sender *backend.StreamSender) {
	key := senderKey(connectionKey, webID)
	d.datasourceMutex.Lock()
	if chans, ok := d.senderChannels[key]; ok {
		if ch, ok := chans[sender]; ok {
			close(ch)
			delete(chans, sender)
			if len(chans) == 0 {
				delete(d.senderChannels, key)
			}
		}
	}
	d.datasourceMutex.Unlock()
	backend.Logger.Debug("Streaming: sender deregistered", "webID", webID)
}

// streamRangeEndTolerance is how long before now a query's time range may end and still be streamed: the end of a
// range ending "now" is a little in the past when the query is processed.
const streamRangeEndTolerance = time.Minute

// rangeEndsNow returns whether a time range ending at to is streamed: it ends now, or later (e.g. "Today"). The
// live values would otherwise be added after the end of the range.
func rangeEndsNow(to time.Time) bool {
	return !to.Before(time.Now().Add(-streamRangeEndTolerance))
}
