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
	settings                  backend.DataSourceInstanceSettings
	queryMux                  *datasource.QueryTypeMux
	StreamHandler             backend.StreamHandler
	httpClient                *http.Client
	webIDCache                WebIDCache
	webCache                  *Cache[string, PiBatchData]
	channelConstruct          map[string]StreamChannelConstruct
	datasourceMutex           *sync.Mutex
	scheduler                 *gocron.Scheduler
	websocketConnectionsMutex *sync.Mutex
	websocketConnections      map[string]*websocket.Conn
	sendersByWebID            map[string]map[*backend.StreamSender]bool
	streamChannels            map[string]chan []byte
	dataSourceOptions         *PIWebAPIDataSourceJsonData
	initalTime                time.Time
	totalCalls                int
	callRate                  float64
}

type PIWebAPIDataSourceJsonData struct {
	URL              *string `json:"url,omitempty"`
	Access           *string `json:"access,omitempty"`
	PIServer         *string `json:"piserver,omitempty"`
	AFServer         *string `json:"afserver,omitempty"`
	AFDatabase       *string `json:"afdatabase,omitempty"`
	PIPoint          *bool   `json:"pipoint,omitempty"`
	NewFormat        *bool   `json:"newFormat,omitempty"`
	UseUnit          *bool   `json:"useUnit,omitempty"`
	UseExperimental  *bool   `json:"useExperimental,omitempty"`
	UseStreaming     *bool   `json:"useStreaming,omitempty"`
	UseResponseCache *bool   `json:"useResponseCache,omitempty"`
}
