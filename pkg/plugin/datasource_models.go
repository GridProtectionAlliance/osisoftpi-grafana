package plugin

import (
	"crypto/tls"
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-co-op/gocron"
	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type Datasource struct {
	settings         backend.DataSourceInstanceSettings
	queryMux         *datasource.QueryTypeMux
	httpClient       *http.Client
	webIDCache       WebIDCache
	webCache         *Cache[string, PiBatchData]
	channelConstruct map[string]StreamChannelConstruct
	// datasourceMutex guards the maps and the streaming state of the instance, except websocketConnections, which
	// websocketConnectionsMutex guards (acquired first when both are needed).
	datasourceMutex           *sync.Mutex
	scheduler                 *gocron.Scheduler
	websocketConnectionsMutex *sync.Mutex
	websocketConnections      map[string]*websocket.Conn
	// senderChannels holds a private buffered channel for each active subscriber per connection and WebID (see
	// senderKey). Each RunStream goroutine reads exclusively from its own channel; readWebsocketMessages
	// dispatches pre-parsed StreamData items by WebId so each sender only sees its own tag.
	senderChannels map[string]map[*backend.StreamSender]chan StreamData
	// previous is the previous instance of the datasource until previousUntil, whose streaming channels this
	// instance takes over (see takeOverStreamChannels).
	previous          *Datasource
	previousUntil     time.Time
	dataSourceOptions *PIWebAPIDataSourceJsonData
	// websocketTLS and websocketDial are the TLS configuration and the network dialer of the WebSocket connections
	// (see websocketTransport); websocketDial is nil for a direct connection.
	websocketTLS  *tls.Config
	websocketDial websocketDialContext
	// websocketHeader holds the authentication and custom headers sent when opening a WebSocket connection.
	websocketHeader http.Header
	// streamChannelsCleaned is when removeUnusedStreamChannels last ran.
	streamChannelsCleaned time.Time
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
	MaxCacheTime     *hours  `json:"maxCacheTime,omitempty"`
	UseUnit          *bool   `json:"useUnit,omitempty"`
	UseExperimental  *bool   `json:"useExperimental,omitempty"`
	UseStreaming     *bool   `json:"useStreaming,omitempty"`
	UseResponseCache *bool   `json:"useResponseCache,omitempty"`
}

// defaultMaxCacheTime is the Max Cache Time in hours used when the setting is empty, zero, negative or not a number.
const defaultMaxCacheTime = 12

// maxCacheTimeLimit is the largest Max Cache Time accepted, in hours (about 10 years), so the value fits in an int.
const maxCacheTimeLimit = 87600

// hours is the Max Cache Time setting, in hours. It accepts a JSON number or a numeric string (as written by a
// provisioning file), rounded up to whole hours. Any other value is replaced by defaultMaxCacheTime with a warning
// instead of failing the datasource settings.
type hours int

func (h *hours) UnmarshalJSON(raw []byte) error {
	var value interface{}
	if err := json.Unmarshal(raw, &value); err != nil {
		return err
	}

	*h = 0
	var n float64
	switch v := value.(type) {
	case nil:
		return nil
	case float64:
		n = v
	case string:
		if strings.TrimSpace(v) == "" {
			return nil
		}
		parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
		if err != nil {
			log.DefaultLogger.Warn("Max Cache Time is not a number, using the default", "maxCacheTime", string(raw), "default", defaultMaxCacheTime)
			return nil
		}
		n = parsed
	default:
		log.DefaultLogger.Warn("Max Cache Time is not a number, using the default", "maxCacheTime", string(raw), "default", defaultMaxCacheTime)
		return nil
	}

	if math.IsNaN(n) || n > maxCacheTimeLimit {
		log.DefaultLogger.Warn("Max Cache Time is out of range, using the default", "maxCacheTime", string(raw), "default", defaultMaxCacheTime)
		return nil
	}
	if n > 0 {
		*h = hours(math.Ceil(n))
	}
	return nil
}

// orDefault returns the Max Cache Time in hours, or defaultMaxCacheTime when it is not set or not positive.
func (h *hours) orDefault() int {
	if h == nil || *h <= 0 {
		return defaultMaxCacheTime
	}
	return int(*h)
}
