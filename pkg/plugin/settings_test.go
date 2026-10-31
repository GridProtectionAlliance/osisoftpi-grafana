package plugin

import (
	"context"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// A Max Cache Time that is not an integer (1.5 typed in the config editor, "12" written by a provisioning file, or
// any other value) must not make the datasource unusable: before, the settings failed to unmarshal and every query,
// resource call and health check failed.
func TestMaxCacheTimeSettings(t *testing.T) {
	tests := []struct {
		jsonData string
		want     int
	}{
		{`{}`, 12},
		{`{"maxCacheTime":6}`, 6},
		{`{"maxCacheTime":1.5}`, 2},
		{`{"maxCacheTime":0.25}`, 1},
		{`{"maxCacheTime":"12"}`, 12},
		{`{"maxCacheTime":" 6 "}`, 6},
		{`{"maxCacheTime":"1.5"}`, 2},
		{`{"maxCacheTime":""}`, 12},
		{`{"maxCacheTime":null}`, 12},
		{`{"maxCacheTime":0}`, 12},
		{`{"maxCacheTime":-3}`, 12},
		{`{"maxCacheTime":"abc"}`, 12},
		{`{"maxCacheTime":true}`, 12},
		{`{"maxCacheTime":[6]}`, 12},
		{`{"maxCacheTime":1e30}`, 12},
		{`{"maxCacheTime":"NaN"}`, 12},
	}
	for _, tt := range tests {
		t.Run(tt.jsonData, func(t *testing.T) {
			instance, err := NewPIWebAPIDatasource(context.Background(), backend.DataSourceInstanceSettings{
				UID: "pi", URL: "http://pi/piwebapi", JSONData: []byte(tt.jsonData),
			})
			if err != nil {
				t.Fatalf("the datasource cannot be created: %v", err)
			}
			d := instance.(*Datasource)
			defer d.Dispose()
			if got := d.dataSourceOptions.MaxCacheTime.orDefault(); got != tt.want {
				t.Errorf("Max Cache Time = %d hours, want %d", got, tt.want)
			}
		})
	}
}
