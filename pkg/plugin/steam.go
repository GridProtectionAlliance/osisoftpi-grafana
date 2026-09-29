package plugin

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// streamFrameCache holds pre-computed, per-WebID metadata that is static for the lifetime
// of a streaming subscription. Storing it here eliminates per-message datasourceMutex
// acquisitions inside convertStreamItemsToFrame.
type streamFrameCache struct {
	sliceType    reflect.Type
	digitalState bool
	frameLabel   map[string]string
	labels       map[string]string // non-nil only when useNewFormat is true
	units        string
	description  string
}

// StreamChannelConstruct holds the metadata needed to connect a Grafana streaming channel
// to the corresponding PI Web API WebSocket for a single PI tag.
type StreamChannelConstruct struct {
	WebID         string
	ConnectionKey string // sorted WebIDs joined by "|"; key into websocketConnections
	tagLabel      string
	query         *PiProcessedQuery
	frameCache    streamFrameCache // pre-computed static WebID metadata; see buildStreamFrameCache
	// generationKey is the map key used to look up and increment channelGenerations.
	// It is the same base string passed to channelKeyFor: "webID|summaryType".
	generationKey string
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

// SubscribeStream is called by Grafana when a panel subscribes to a streaming channel.
// It verifies that the requested path was registered during a prior QueryData call.
func (d *Datasource) SubscribeStream(_ context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	status := backend.SubscribeStreamStatusPermissionDenied
	d.datasourceMutex.Lock()
	_, ok := d.channelConstruct[req.Path]
	d.datasourceMutex.Unlock()
	if ok {
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

// RunStream is called by Grafana once per active channel to pump data to subscribers.
// It blocks until the context is cancelled or a fatal error occurs.
func (d *Datasource) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	errChan := make(chan error, 1)
	go d.subscribeToWebsocketChannel(ctx, req.Path, sender, errChan)
	return <-errChan
}

// subscribeToWebsocketChannel wires a Grafana StreamSender to the PI Web API WebSocket for
// the tag identified by path. Multiple tags from the same query batch share one underlying
// streamsets/channel WebSocket connection; readWebsocketMessages routes each StreamData
// item to the correct per-tag sender channel by WebId.
func (d *Datasource) subscribeToWebsocketChannel(ctx context.Context, path string, sender *backend.StreamSender, errchan chan error) {
	d.datasourceMutex.Lock()
	construct, ok := d.channelConstruct[path]
	d.datasourceMutex.Unlock()
	if !ok {
		errchan <- fmt.Errorf("streaming: no channel construct registered for path %q", path)
		return
	}
	// Register the sender before connecting so that readWebsocketMessages can deliver
	// to it as soon as the shared connection is established.
	senderCh := d.addStreamSender(construct.WebID, sender)

	if err := d.getOrCreateWebsocketConnection(construct.ConnectionKey); err != nil {
		d.removeStreamSender(construct.WebID, sender)
		errchan <- fmt.Errorf("streaming: WebSocket connect failed for connection %q: %w", construct.ConnectionKey, err)
		return
	}

	go d.sendStreamData(ctx, sender, path, errchan, senderCh, construct)
}

// getOrCreateWebsocketConnection ensures exactly one shared WebSocket connection exists for
// the given connection key. The blocking network dial is performed outside any mutex so
// that multiple panels can attempt connection setup concurrently.
func (d *Datasource) getOrCreateWebsocketConnection(connectionKey string) error {
	// Fast path: connection already exists.
	d.websocketConnectionsMutex.Lock()
	if _, ok := d.websocketConnections[connectionKey]; ok {
		d.websocketConnectionsMutex.Unlock()
		backend.Logger.Debug("Streaming: reusing existing WebSocket connection", "connectionKey", connectionKey)
		return nil
	}
	// Read the WebID list, then release the connections mutex so the blocking dial
	// does not serialise unrelated concurrent connection attempts.
	d.datasourceMutex.Lock()
	webIDs := d.connectionKeyWebIDs[connectionKey]
	d.datasourceMutex.Unlock()
	d.websocketConnectionsMutex.Unlock()

	// Dial outside any lock — this may block for hundreds of milliseconds.
	conn, err := d.createWebsocketConnection(webIDs)
	if err != nil {
		return err
	}

	// Re-acquire and double-check: a concurrent goroutine may have connected first.
	d.websocketConnectionsMutex.Lock()
	defer d.websocketConnectionsMutex.Unlock()
	if _, ok := d.websocketConnections[connectionKey]; ok {
		// Another goroutine won the race; discard our duplicate connection.
		conn.Close()
		backend.Logger.Debug("Streaming: closing duplicate WebSocket connection (concurrent dial)", "connectionKey", connectionKey)
		return nil
	}
	d.websocketConnections[connectionKey] = conn

	// readWebsocketMessages runs for the lifetime of the connection, parsing each
	// StreamingResponse and routing individual StreamData items to per-tag sender channels.
	go d.readWebsocketMessages(conn, connectionKey)

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
		userpass := opts.BasicAuth.User + ":" + opts.BasicAuth.Password
		header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(userpass)))
	}
	return header
}

// createWebsocketConnection opens a new authenticated streamsets/channel WebSocket connection
// to PI Web API for the given set of WebIDs. All tags in a query batch share one connection.
func (d *Datasource) createWebsocketConnection(webIDs []string) (*websocket.Conn, error) {
	uri, err := buildStreamSetsWebSocketURL(d.settings.URL, webIDs)
	if err != nil {
		return nil, err
	}

	header := d.websocketHeader.Clone()

	// Honour the datasource-level tlsSkipVerify setting so that self-signed
	// or internally-signed PI Web API certificates are accepted when configured.
	tlsCfg := &tls.Config{}
	if d.tlsInsecureSkipVerify {
		tlsCfg.InsecureSkipVerify = true //nolint:gosec // user-configured opt-in
	}

	dialer := websocket.Dialer{
		TLSClientConfig: tlsCfg,
	}

	conn, resp, err := dialer.Dial(uri, header)
	if err != nil {
		if resp != nil {
			err = fmt.Errorf("%w: %s", err, resp.Status)
		}
		backend.Logger.Error("Streaming: WebSocket dial failed", "uri", uri, "error", err)
		return nil, err
	}
	return conn, nil
}

// readWebsocketMessages continuously reads raw messages from the shared WebSocket connection
// and routes each StreamData item to the appropriate per-tag sender channel by WebId. When
// the connection closes or errors, the dead connection is removed so the next subscriber
// triggers a fresh dial.
func (d *Datasource) readWebsocketMessages(conn *websocket.Conn, connectionKey string) {
	defer conn.Close()
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			d.websocketConnectionsMutex.Lock()
			_, stillRegistered := d.websocketConnections[connectionKey]
			if stillRegistered {
				delete(d.websocketConnections, connectionKey)
				backend.Logger.Error("Streaming: WebSocket read error, connection removed",
					"connectionKey", connectionKey, "error", err)
			} else {
				backend.Logger.Debug("Streaming: WebSocket connection closed cleanly", "connectionKey", connectionKey)
			}
			d.websocketConnectionsMutex.Unlock()

			// Signal all sendStreamData goroutines that were reading from this connection
			// to exit. Without this they block indefinitely on their sender channels while
			// Grafana keeps showing a green dot with no data flowing.
			d.datasourceMutex.Lock()
			if webIDs, ok := d.connectionKeyWebIDs[connectionKey]; ok {
				for _, wid := range webIDs {
					for _, ch := range d.senderChannels[wid] {
						close(ch)
					}
					delete(d.senderChannels, wid)
				}
			}
			d.datasourceMutex.Unlock()
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
			for _, ch := range d.senderChannels[item.WebId] {
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

// teardownStream removes the sender, checks for an orphaned WebSocket, and increments the
// channel generation so the next QueryData call produces a fresh channel URI. This prevents
// the "streaming channel error: expired" from being replayed indefinitely by ReplaySubject(1).
func (d *Datasource) teardownStream(webID, path string, construct StreamChannelConstruct, sender *backend.StreamSender) {
	d.removeStreamSender(webID, sender)
	d.checkForOrphanedWebSocket(webID, construct.ConnectionKey)
	d.datasourceMutex.Lock()
	d.channelGenerations[construct.generationKey]++
	delete(d.channelConstruct, path)
	d.datasourceMutex.Unlock()
}

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
	errchan chan error,
	senderCh <-chan StreamData,
	construct StreamChannelConstruct,
) {
	webID := construct.WebID

	// Keepalive: if no data arrives within this interval, re-send the last known
	// frame to prevent Grafana's centrifuge from expiring the idle channel.
	const keepaliveInterval = 30 * time.Second
	keepalive := time.NewTimer(keepaliveInterval)
	defer keepalive.Stop()
	var lastFrame *data.Frame

	for {
		select {
		case <-ctx.Done():
			backend.Logger.Info("Streaming: subscriber context done", "path", path, "webID", webID)
			d.teardownStream(webID, path, construct, sender)
			errchan <- nil
			return

		case <-keepalive.C:
			// No data received within the keepalive window — re-send the last frame
			// to keep the Grafana streaming channel alive.
			if lastFrame != nil {
				if err := sender.SendFrame(lastFrame, data.IncludeDataOnly); err != nil {
					backend.Logger.Error("Streaming: keepalive send failed",
						"webID", webID, "error", err)
					d.teardownStream(webID, path, construct, sender)
					errchan <- fmt.Errorf("streaming: keepalive send failed: %w", err)
					return
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
							d.removeStreamSender(webID, sender)
							errchan <- nil
							return
						case <-t.C:
						}
					}
					backend.Logger.Info("Streaming: connection lost, attempting reconnect",
						"path", path, "webID", webID, "attempt", attempt)
					newSenderCh = d.addStreamSender(webID, sender)
					if err := d.getOrCreateWebsocketConnection(construct.ConnectionKey); err != nil {
						backend.Logger.Warn("Streaming: reconnect attempt failed",
							"path", path, "webID", webID, "attempt", attempt, "error", err)
						d.removeStreamSender(webID, sender)
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
					errchan <- errors.New("streaming: connection lost and reconnect failed")
					return
				}
				senderCh = newSenderCh
				continue
			}

			frame, err := convertStreamItemsToFrame(construct.query, item.Items, construct.frameCache)
			if err != nil {
				backend.Logger.Error("Streaming: failed to convert stream items to frame",
					"webID", webID, "error", err)
				continue
			}

			if err := sender.SendFrame(frame, data.IncludeDataOnly); err != nil {
				backend.Logger.Error("Streaming: failed to send frame to subscriber",
					"webID", webID, "error", err)
				d.teardownStream(webID, path, construct, sender)
				errchan <- fmt.Errorf("streaming: send frame failed: %w", err)
				return
			}
			lastFrame = frame
			keepalive.Reset(keepaliveInterval)

			backend.Logger.Debug("Streaming: frame sent to subscriber",
				"webID", webID, "items", len(item.Items))
		}
	}
}

// buildStreamFrameCache snapshots all WebID-derived metadata for a query so the streaming
// hot path never needs to re-acquire datasourceMutex for these static values.
func buildStreamFrameCache(d *Datasource, q *PiProcessedQuery) streamFrameCache {
	webID := q.WebID
	pointType := d.getPointTypeForWebID(webID)
	desc := d.getDescriptionForWebID(webID)
	units := d.getUnitsForWebID(webID)
	sliceType := d.getTypeForWebID(webID)
	digitalState := d.getDigitalStateForWebID(webID)
	usingNewFormat := d.isUsingNewFormat()
	frameLabel := getDataLabels(usingNewFormat, q, pointType, desc, units, "")
	var labels map[string]string
	if usingNewFormat {
		labels = frameLabel
	}
	return streamFrameCache{
		sliceType:    sliceType,
		digitalState: digitalState,
		frameLabel:   frameLabel,
		labels:       labels,
		units:        units,
		description:  desc,
	}
}

// checkForOrphanedWebSocket closes the shared WebSocket connection for connectionKey when
// no subscribers remain across all WebIDs that share that connection.
// Lock ordering: websocketConnectionsMutex is always acquired before datasourceMutex to
// eliminate the TOCTOU window between the subscriber-count check and the connection close.
func (d *Datasource) checkForOrphanedWebSocket(webID, connectionKey string) {
	d.websocketConnectionsMutex.Lock()
	defer d.websocketConnectionsMutex.Unlock()

	// Re-check under both locks: a subscriber may have been added after the caller's
	// removeStreamSender but before we acquired websocketConnectionsMutex.
	d.datasourceMutex.Lock()
	webIDs := d.connectionKeyWebIDs[connectionKey]
	for _, wid := range webIDs {
		if len(d.senderChannels[wid]) > 0 {
			d.datasourceMutex.Unlock()
			return
		}
	}
	// No subscribers remain; clean up connectionKeyWebIDs while datasourceMutex is held.
	delete(d.connectionKeyWebIDs, connectionKey)
	d.datasourceMutex.Unlock()

	ws, connExists := d.websocketConnections[connectionKey]
	if connExists {
		delete(d.websocketConnections, connectionKey)
	}

	if connExists {
		ws.Close()
		backend.Logger.Info("Streaming: closed orphaned WebSocket connection",
			"connectionKey", connectionKey, "lastWebID", webID)
	}
}

// addStreamSender registers a new subscriber for webID and returns its private buffered
// StreamData channel.
func (d *Datasource) addStreamSender(webID string, sender *backend.StreamSender) chan StreamData {
	ch := make(chan StreamData, 100)
	d.datasourceMutex.Lock()
	if d.senderChannels[webID] == nil {
		d.senderChannels[webID] = make(map[*backend.StreamSender]chan StreamData)
	}
	d.senderChannels[webID][sender] = ch
	d.datasourceMutex.Unlock()
	backend.Logger.Debug("Streaming: sender registered", "webID", webID)
	return ch
}

// removeStreamSender deregisters a subscriber and closes its private StreamData channel.
// The outer webID key is deleted when the last subscriber for that tag unsubscribes.
func (d *Datasource) removeStreamSender(webID string, sender *backend.StreamSender) {
	d.datasourceMutex.Lock()
	if chans, ok := d.senderChannels[webID]; ok {
		if ch, ok := chans[sender]; ok {
			close(ch)
			delete(chans, sender)
			if len(chans) == 0 {
				delete(d.senderChannels, webID)
			}
		}
	}
	d.datasourceMutex.Unlock()
	backend.Logger.Debug("Streaming: sender deregistered", "webID", webID)
}
