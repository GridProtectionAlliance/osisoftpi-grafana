package plugin

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"

	"github.com/gorilla/websocket"
)

type StreamChannelConstruct struct {
	WebID               string
	IntervalNanoSeconds int64
	tagLabel            string
}

type StreamingResponse struct {
	Links map[string]interface{} `json:"Links"`
	Items []StreamData           `json:"Items"`
}

func (sr *StreamingResponse) getItems() *[]PiBatchContentItem {
	return &sr.Items[0].Items
}

type StreamData struct {
	WebId             string                 `json:"WebId"`
	Name              string                 `json:"Name"`
	Path              string                 `json:"Path"`
	Links             map[string]interface{} `json:"Links"`
	Items             []PiBatchContentItem   `json:"Items"`
	UnitsAbbreviation string                 `json:"UnitsAbbreviation"`
}

// TODO: Improvement: Should the user have the option to limit the streaming rate?
// to impliment the setting should be added to the StreamChannelConstruct. This
// would let each query have a different streaming rate, while still using a single stream
// connection for a given WebID.
// func (d *Datasource) getStreamInterval(path string) (int64, error) {
// 	config, ok := d.streamConfigCache[path]
// 	if ok {
// 		return config.Interval, nil
// 	}
// 	return 20000, fmt.Errorf("stream interval not found")
// }

func (d *Datasource) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	status := backend.SubscribeStreamStatusPermissionDenied
	_, ok := d.channelConstruct[req.Path]
	if ok {
		status = backend.SubscribeStreamStatusOK
	}

	return &backend.SubscribeStreamResponse{
		Status: status,
	}, nil
}

func (d *Datasource) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return &backend.PublishStreamResponse{
		Status: backend.PublishStreamStatusPermissionDenied,
	}, nil
}

func (d *Datasource) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	errChan := make(chan error)
	backend.Logger.Info("Streaming: RunStream called", "Path", req.Path)
	// run each channel subscription in a goroutine.
	go d.subscribeToWebsocketChannel(ctx, req.Path, sender, errChan)
	return <-errChan
}

func (d *Datasource) subscribeToWebsocketChannel(ctx context.Context, Path string, sender *backend.StreamSender, errchan chan error) {
	// Get the WebID for the channel construct associated with the given path
	// and the tag label for the channel construct
	// if the channel construct doesn't exist, return an error
	_, ok := d.channelConstruct[Path]
	if !ok {
		errchan <- fmt.Errorf("error getting channel construct for path: %v", Path)
		return
	}
	WebID := d.channelConstruct[Path].WebID
	TagLabel := d.channelConstruct[Path].tagLabel

	// Get or create a websocket connection for the given WebID
	// try to reuse an existing connection if one exists, and create a new one if it doesn't
	// if there is an error, return the error
	err := d.getOrCreateWebsocketConnection(ctx, WebID)
	if err != nil {
		errchan <- fmt.Errorf("error connecting to WebSocket: %v", err)
		return
	}

	// Add the sender to the list of senders for the given WebID
	d.addStreamSender(WebID, sender)

	// run the send stream messages as a routine, use the context so that the routine
	// will be cancelled when the context is cancelled
	go d.sendStreamMessagesToSender(ctx, WebID, sender, Path, errchan, d.streamChannels[WebID], TagLabel)
}

func (d *Datasource) getOrCreateWebsocketConnection(ctx context.Context, WebID string) error {
	// Lock the mutex for the websocket connections by WebID map
	d.websocketConnectionsMutex.Lock()
	defer d.websocketConnectionsMutex.Unlock()

	// Check if a websocket connection already exists for the given WebID
	_, ok := d.websocketConnections[WebID]
	if !ok {
		// If a connection doesn't exist, create a new one
		var err error
		conn, err := d.createWebsocketConnection(WebID)
		if err != nil {
			return err
		}
		d.websocketConnections[WebID] = conn
		// Start reading and sending messages for the given WebID
		streamChannel := make(chan []byte, 100)
		d.streamChannels[WebID] = streamChannel
		// run the read websocket messages as a routine, ignore context so that one websocket
		// connection can be used for multiple channels provided their WebIDs are the same
		go d.readWebsocketMessages(conn, WebID, streamChannel)

	} else {
		backend.Logger.Info("Streaming: Reusing existing websocket connection", "WebID", WebID)
	}
	return nil
}

func (d *Datasource) createWebsocketConnection(WebID string) (*websocket.Conn, error) {
	backend.Logger.Info("Streaming: Creating new websocket connection", "WebID", WebID)
	if WebID == "" {
		backend.Logger.Error("Streaming: WebID is empty")
		return nil, errors.New("WebID is empty")
	}

	// Construct the URI for the websocket connection
	uri := strings.Replace(d.settings.URL, "https://", "wss://", 1)
	uri = uri + "/streams/" + WebID + "/channel?includeInitialValues=true"

	// Set the headers for the websocket connection
	header := http.Header{}
	userpass := d.settings.BasicAuthUser + ":" + d.settings.DecryptedSecureJSONData["basicAuthPassword"]
	header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(userpass)))

	// Dial the websocket connection
	conn, _, err := websocket.DefaultDialer.Dial(uri, header)
	if err != nil {
		return nil, err
	}
	return conn, nil
}

func (d *Datasource) readWebsocketMessages(conn *websocket.Conn, WebID string, streamChannel chan []byte) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			_, ok := d.websocketConnections[WebID]
			if !ok {
				return
			}
			backend.Logger.Info("Error reading websocket message, closing all associated streams:", "err", err)
			d.sendersByWebIDMutex.Lock()
			delete(d.websocketConnections, WebID)
			for s := range d.sendersByWebID[WebID] {
				delete(d.sendersByWebID[WebID], s)
			}
			d.sendersByWebIDMutex.Unlock()
			conn.Close()
			return
		}
		streamChannel <- message
	}
}

// FIXME there is a bug here that causes the stream sender to not pick up all events
func (d *Datasource) sendStreamMessagesToSender(ctx context.Context, WebID string, senders *backend.StreamSender,
	Path string, errchan chan error, streamChannel chan []byte, TagLabel string) {
	for {
		select {
		case <-ctx.Done():
			backend.Logger.Info("Streaming: sendStreamMessagesToSenders: Context done, checking for orphaned web sockets", "Path", Path)
			d.removeStreamSender(WebID, senders)
			d.checkForOrphanedWebSockets(WebID)
			// FIXME: this needs to be re-added. Removed for testing other bug fixes.
			delete(d.channelConstruct, Path)
			errchan <- errors.New("context done")
			return
		case message, ok := <-streamChannel:
			if !ok {
				backend.Logger.Info("Streaming: Channel closed, checking for orphaned web sockets")
				errchan <- errors.New("streaming: Channel closed")
				d.removeStreamSender(WebID, senders)
				d.checkForOrphanedWebSockets(WebID)
				return
			}
			frame := StreamingResponse{}
			err := json.Unmarshal(message, &frame)
			if err != nil {
				backend.Logger.Info("Error unmarshalling message:", err)
				continue
			}
			items := frame.getItems()

			framedata, _ := convertItemsToDataFrame(TagLabel, *items, d, WebID, false)
			d.sendersByWebIDMutex.Lock()
			specsender := d.sendersByWebID[WebID]
			for s := range specsender {
				err := s.SendFrame(framedata, data.IncludeDataOnly)
				if err != nil {
					backend.Logger.Info("Error sending frame:", err)
					backend.Logger.Info("Streaming: Removing sender for closed channel")
					d.removeStreamSender(WebID, senders)
					remainingSenders := d.hasSendersForWebID(WebID)
					backend.Logger.Info("Streaming: Checking if there are additional senders for WebID", "WebID", WebID, "remainingSenders", remainingSenders)
					if !remainingSenders {
						backend.Logger.Info("Streaming: Closing websocket connection for WebID", "WebID", WebID)
						d.checkForOrphanedWebSockets(WebID)
					}
					errchan <- errors.New("streaming: Channel closed")
					return
				}
			}
			d.sendersByWebIDMutex.Unlock()
		}
	}
}

func (d *Datasource) checkForOrphanedWebSockets(WebID string) {
	d.sendersByWebIDMutex.Lock()
	d.websocketConnectionsMutex.Lock()
	// Check if the WebID has any senders
	if len(d.sendersByWebID[WebID]) == 0 {
		backend.Logger.Info("Streaming: Closing orphaned web socket for WebID", "WebID", WebID)
		// we remove the websocket connection and then close it
		// this allows us to gracefully handle the error in the readWebsocketMessages function
		ws := d.websocketConnections[WebID]
		delete(d.websocketConnections, WebID)
		delete(d.streamChannels, WebID)
		ws.Close()
	}
	d.sendersByWebIDMutex.Unlock()
	d.websocketConnectionsMutex.Unlock()
}

func (d *Datasource) addStreamSender(WebID string, sender *backend.StreamSender) {
	d.sendersByWebIDMutex.Lock()
	if _, ok := d.sendersByWebID[WebID]; !ok {
		d.sendersByWebID[WebID] = make(map[*backend.StreamSender]bool)
	}
	d.sendersByWebID[WebID][sender] = true
	d.sendersByWebIDMutex.Unlock()
}

func (d *Datasource) removeStreamSender(WebID string, sender *backend.StreamSender) {
	d.sendersByWebIDMutex.Lock()
	delete(d.sendersByWebID[WebID], sender)
	d.sendersByWebIDMutex.Unlock()
}

func (d *Datasource) hasSendersForWebID(WebID string) bool {
	_, ok := d.sendersByWebID[WebID]
	return ok && len(d.sendersByWebID[WebID]) > 0
}
