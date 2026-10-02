package plugin

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// Panels showing the same PI point get their own live channel when their queries convert the values differently
// ("Digital States", "Replace Bad Data"); the channel used to be shared, with the settings of the first panel.
func TestStreamChannelPerQuerySettings(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{`\\PISRV\SINUSOID`: {}}}).start(t)
	streaming := true
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{UseStreaming: &streaming})
	d.channelConstruct = map[string]StreamChannelConstruct{}
	now := time.Now()

	channel := func(extra map[string]interface{}) string {
		query := map[string]interface{}{
			"target": `PISRV;SINUSOID`, "isPiPoint": true, "enableStreaming": map[string]interface{}{"enable": true},
		}
		for k, v := range extra {
			query[k] = v
		}
		raw, err := json.Marshal(query)
		if err != nil {
			t.Fatal(err)
		}
		processed := d.processQuery([]backend.DataQuery{{RefID: "A", JSON: raw, MaxDataPoints: 100, Interval: time.Minute,
			TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}}}, "uid")
		r := d.processBatchtoFrames(d.batchRequest(t.Context(), processed)).Responses["A"]
		if r.Error != nil || len(r.Frames) != 1 || r.Frames[0].Meta == nil || r.Frames[0].Meta.Channel == "" {
			t.Fatalf("expected one streaming frame, got %+v", r)
		}
		return r.Frames[0].Meta.Channel
	}

	plain := channel(nil)
	if again := channel(nil); again != plain {
		t.Errorf("the same query must reuse its channel: %q, then %q", plain, again)
	}
	if digital := channel(map[string]interface{}{"digitalStates": map[string]interface{}{"enable": true}}); digital == plain {
		t.Error("a query with Digital States must have its own channel")
	}
	if previous := channel(map[string]interface{}{"nodata": "Previous"}); previous == plain {
		t.Error("a query with another Replace Bad Data must have its own channel")
	}
}

// The channels whose stream has not run for streamChannelTTL are removed: each query result gets its own channel.
func TestUnusedStreamChannelsRemoved(t *testing.T) {
	d := newTestDatasource()
	old := time.Now().Add(-2 * streamChannelTTL)
	d.channelConstruct["unused"] = StreamChannelConstruct{state: &streamChannelState{lastUsed: old}}
	d.channelConstruct["running"] = StreamChannelConstruct{state: &streamChannelState{lastUsed: old, running: 1}}
	d.channelConstruct["recent"] = StreamChannelConstruct{state: &streamChannelState{lastUsed: time.Now()}}

	d.removeUnusedStreamChannels()
	for path, want := range map[string]bool{"unused": false, "running": true, "recent": true} {
		if _, ok := d.channelConstruct[path]; ok != want {
			t.Errorf("channel %q registered = %v, want %v", path, ok, want)
		}
	}
}
