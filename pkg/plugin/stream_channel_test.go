package plugin

import (
	"testing"
)

// Panels showing the same PI point get their own live channel when their queries convert the values differently
// ("Digital States", "Replace Bad Data"); the channel used to be shared, with the settings of the first panel.
func TestStreamChannelPerQuerySettings(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{`\\PISRV\SINUSOID`: {}}}).start(t)
	streaming := true
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{UseStreaming: &streaming})
	d.channelConstruct = map[string]StreamChannelConstruct{}
	d.channelGenerations = map[string]uint32{}
	d.connectionKeyWebIDs = map[string][]string{}

	channel := func(extra map[string]interface{}) string {
		query := map[string]interface{}{
			"target": `PISRV;SINUSOID`, "isPiPoint": true, "enableStreaming": map[string]interface{}{"enable": true},
		}
		for k, v := range extra {
			query[k] = v
		}
		r := runFakeQuery(t, d, query)
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
