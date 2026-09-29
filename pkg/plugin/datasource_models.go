package plugin

import (
	"net/http"
	"sync"
	"time"

	"github.com/go-co-op/gocron"
	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
)

type Datasource struct {
	settings         backend.DataSourceInstanceSettings
	queryMux         *datasource.QueryTypeMux
	httpClient       *http.Client
	webIDCache       WebIDCache
	webCache         *Cache[string, PiBatchData]
	channelConstruct map[string]StreamChannelConstruct
	// channelGenerations tracks a per-(webID,summaryType) counter that is incremented
	// each time a subscription ends. channelKeyFor embeds the generation so that after
	// expiry the next QueryData call produces a new channel URI, forcing Grafana to
	// create a fresh LiveDataStream and recover from the "streaming channel error: expired"
	// state that would otherwise be replayed indefinitely by ReplaySubject(1).
	channelGenerations        map[string]uint32
	datasourceMutex           *sync.Mutex
	scheduler                 *gocron.Scheduler
	websocketConnectionsMutex *sync.Mutex
	websocketConnections      map[string]*websocket.Conn
	// senderChannels holds a private buffered channel for each active subscriber per WebID.
	// Each RunStream goroutine reads exclusively from its own channel; readWebsocketMessages
	// dispatches pre-parsed StreamData items by WebId so each sender only sees its own tag.
	senderChannels map[string]map[*backend.StreamSender]chan StreamData
	// connectionKeyWebIDs maps a connection key (sorted WebIDs joined by "|") to the
	// ordered WebID slice used to build the streamsets/channel WebSocket URL.
	connectionKeyWebIDs map[string][]string
	dataSourceOptions   *PIWebAPIDataSourceJsonData
	// tlsInsecureSkipVerify mirrors the datasource's TLS skip-verify setting so the
	// WebSocket dialer can skip certificate verification for self-signed PI Web API certs.
	tlsInsecureSkipVerify bool
	// websocketHeader holds the authentication and custom headers sent when opening a WebSocket connection.
	websocketHeader http.Header
	// streamLastTimes holds the time of the last value sent on each streaming channel (by channel path), to fill the
	// gap after a reconnect. It survives the stream being run again by Grafana; guarded by datasourceMutex.
	streamLastTimes map[string]time.Time
	// streamFilledUntil holds, by channel path, the time of the last value sent by fillStreamGap until the live values
	// are past it (see newStreamItems); guarded by datasourceMutex.
	streamFilledUntil map[string]time.Time
	// websocketTimeout is the timeout for opening a WebSocket connection (see websocketTimeout).
	websocketTimeout time.Duration
	initalTime       time.Time
	totalCalls       int
	callRate         float64
}

type PIWebAPIDataSourceJsonData struct {
	URL              *string `json:"url,omitempty"`
	Access           *string `json:"access,omitempty"`
	PIServer         *string `json:"piserver,omitempty"`
	AFServer         *string `json:"afserver,omitempty"`
	AFDatabase       *string `json:"afdatabase,omitempty"`
	PIPoint          *bool   `json:"pipoint,omitempty"`
	NewFormat        *bool   `json:"newFormat,omitempty"`
	MaxCacheTime     *int    `json:"maxCacheTime,omitempty"`
	UseUnit          *bool   `json:"useUnit,omitempty"`
	UseExperimental  *bool   `json:"useExperimental,omitempty"`
	UseStreaming     *bool   `json:"useStreaming,omitempty"`
	UseResponseCache *bool   `json:"useResponseCache,omitempty"`
}
