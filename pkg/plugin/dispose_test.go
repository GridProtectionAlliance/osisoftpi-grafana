package plugin

import (
	"context"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// Grafana disposes a datasource instance when its settings change: its WebID cache cleanup must stop, or every
// settings change leaves a scheduler running for the life of the plugin.
func TestDisposeStopsCacheCleanup(t *testing.T) {
	instance, err := NewPIWebAPIDatasource(context.Background(), backend.DataSourceInstanceSettings{
		UID: "pi", URL: "http://pi/piwebapi", JSONData: []byte(`{}`),
	})
	if err != nil {
		t.Fatal(err)
	}
	d := instance.(*Datasource)
	if !d.scheduler.IsRunning() {
		t.Fatal("the cache cleanup is not scheduled")
	}
	d.Dispose()
	if d.scheduler.IsRunning() {
		t.Error("the cache cleanup still runs after Dispose")
	}
}
