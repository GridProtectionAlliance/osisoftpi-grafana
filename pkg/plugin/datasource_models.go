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
	settings                  backend.DataSourceInstanceSettings
	queryMux                  *datasource.QueryTypeMux
	StreamHandler             backend.StreamHandler
	httpClient                *http.Client
	webIDCache                WebIDCache
	channelConstruct          map[string]StreamChannelConstruct
	scheduler                 *gocron.Scheduler
	websocketConnectionsMutex *sync.Mutex
	sendersByWebIDMutex       *sync.Mutex
	websocketConnections      map[string]*websocket.Conn
	sendersByWebID            map[string]map[*backend.StreamSender]bool
	streamChannels            map[string]chan []byte
	dataSourceOptions         *PIWebAPIDataSourceJsonData
}

type PIWebAPIDataSourceJsonData struct {
	URL             *string `json:"url,omitempty"`
	Access          *string `json:"access,omitempty"`
	PIServer        *string `json:"piserver,omitempty"`
	AFServer        *string `json:"afserver,omitempty"`
	AFDatabase      *string `json:"afdatabase,omitempty"`
	PIPoint         *bool   `json:"pipoint,omitempty"`
	NewFormat       *bool   `json:"newFormat,omitempty"`
	UseUnit         *bool   `json:"useUnit,omitempty"`
	UseExperimental *bool   `json:"useExperimental,omitempty"`
	UseStreaming    *bool   `json:"useStreaming,omitempty"`
}
