package plugin

import (
	"net/http"
	"sync"

	"github.com/go-co-op/gocron"
	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
)

type Datasource struct {
	settings      backend.DataSourceInstanceSettings
	queryMux      *datasource.QueryTypeMux
	StreamHandler backend.StreamHandler
	httpClient    *http.Client
	webIDCache    map[string]WebIDCacheEntry
	//	channelConstruct          map[string]StreamChannelConstruct
	scheduler                 *gocron.Scheduler
	websocketConnectionsMutex *sync.Mutex
	sendersByWebIDMutex       *sync.Mutex
	websocketConnections      map[string]*websocket.Conn
	sendersByWebID            map[string]map[*backend.StreamSender]bool
	streamChannels            map[string]chan []byte
}
