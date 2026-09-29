package plugin

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// After an outage longer than the reconnect attempts, sendStreamData returns an error so that Grafana runs the
// stream again (every 5 s). The channel must stay registered so that one of those runs reconnects once PI Web API
// is back; it used to be removed, so every run failed with "no channel construct registered" until the dashboard
// was reloaded.
func TestStreamRecoversAfterLongOutage(t *testing.T) {
	attempts, delay := streamReconnectAttempts, streamReconnectBaseDelay
	streamReconnectAttempts, streamReconnectBaseDelay = 2, time.Millisecond
	t.Cleanup(func() { streamReconnectAttempts, streamReconnectBaseDelay = attempts, delay })

	// PI Web API is down: nothing listens on the address yet
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := listener.Addr().String()
	listener.Close()

	d := newTestDatasource()
	d.settings = backend.DataSourceInstanceSettings{URL: "http://" + addr + "/piwebapi"}
	const path, webID = "channel", "W1"
	construct := StreamChannelConstruct{WebID: webID, ConnectionKey: webID, generationKey: webID + "|"}
	d.channelConstruct[path] = construct
	d.connectionKeyWebIDs[webID] = []string{webID}
	sender := &backend.StreamSender{}

	// the connection was lost: the subscriber's channel is closed
	lost := make(chan StreamData)
	close(lost)
	errchan := make(chan error, 1)
	d.sendStreamData(context.Background(), sender, path, errchan, lost, construct)
	if err := <-errchan; err == nil {
		t.Fatal("expected an error after the reconnect attempts")
	}
	if _, ok := d.channelConstruct[path]; !ok {
		t.Fatal("the channel is no longer registered: Grafana cannot run the stream again")
	}
	if d.channelGenerations[construct.generationKey] != 0 {
		t.Error("the channel key changed: the panel's subscription no longer matches")
	}

	// PI Web API is back: the next run of the stream by Grafana connects
	upgrader := websocket.Upgrader{}
	connected := make(chan struct{}, 1)
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()
		connected <- struct{}{}
		_, _, _ = conn.ReadMessage() // until the client closes
	}))
	server.Listener, err = net.Listen("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	server.Start()
	t.Cleanup(server.Close)

	ctx, cancel := context.WithCancel(context.Background())
	errchan = make(chan error, 1)
	d.subscribeToWebsocketChannel(ctx, path, sender, errchan)
	select {
	case <-connected:
	case err := <-errchan:
		t.Fatalf("stream did not reconnect: %v", err)
	case <-time.After(5 * time.Second):
		t.Fatal("stream did not reconnect")
	}
	cancel()
	if err := <-errchan; err != nil {
		t.Errorf("unexpected error when the panel unsubscribes: %v", err)
	}
}
