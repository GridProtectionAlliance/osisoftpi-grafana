package plugin

import (
	"reflect"
	"sort"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func seriesOf(frames data.Frames) (names []string, labels []data.Labels) {
	for _, frame := range frames {
		names = append(names, frame.Fields[1].Name)
		labels = append(labels, frame.Fields[1].Labels)
	}
	return names, labels
}

// Series expanded from template variables must be distinguishable: the new data format adds the database and the
// element path (without server and database) as labels, and the legacy name of a multi-variable path is the
// element path and the attribute.
func TestSeriesNamesOfExpandedQueries(t *testing.T) {
	fake := &fakePIWebAPI{attributes: map[string]fakeAttribute{}}
	for _, p := range []string{`SiteA\Unit1\Pump`, `SiteB\Unit1\Pump`, `S1\U1\Pump`, `S1\U2\Pump`, `S1`, `S2`} {
		fake.attributes[`\\AF\DB\`+p+`|Flow`] = fakeAttribute{}
	}
	fake.attributes[`\\PI\SINUSOID`] = fakeAttribute{}
	server := fake.start(t)
	newFormat, legacy := true, false

	t.Run("new format: database and path labels", func(t *testing.T) {
		d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{NewFormat: &newFormat})
		r := runFakeQuery(t, d, map[string]interface{}{"target": `AF\DB\{SiteA,SiteB}\Unit1\Pump;Flow`})
		names, labels := seriesOf(r.Frames)
		if !reflect.DeepEqual(names, []string{"Flow", "Flow"}) {
			t.Fatalf("names = %q", names)
		}
		for i, path := range []string{`SiteA\Unit1\Pump`, `SiteB\Unit1\Pump`} {
			if labels[i]["database"] != "DB" || labels[i]["path"] != path || labels[i]["element"] != "Pump" {
				t.Errorf("labels[%d] = %v, want database=DB path=%s element=Pump", i, labels[i], path)
			}
		}
	})

	t.Run("new format: PI points unchanged", func(t *testing.T) {
		d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{NewFormat: &newFormat})
		r := runFakeQuery(t, d, map[string]interface{}{"target": `PI;SINUSOID`, "isPiPoint": true})
		_, labels := seriesOf(r.Frames)
		if len(labels) != 1 || labels[0]["database"] != "" || labels[0]["path"] != "" {
			t.Errorf("labels = %v", labels)
		}
	})

	tests := []struct {
		name   string
		target string
		want   []string
	}{
		{name: "legacy: several variables keep the whole element path", target: `AF\DB\{S1}\{U1,U2}\Pump;Flow`,
			want: []string{`S1\U1\Pump|Flow`, `S1\U2\Pump|Flow`}},
		{name: "legacy: one variable unchanged", target: `AF\DB\{S1,S2};Flow`, want: []string{`S1|S1|Flow`, `S2|S2|Flow`}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{NewFormat: &legacy})
			names, _ := seriesOf(runFakeQuery(t, d, map[string]interface{}{"target": tt.target}).Frames)
			sort.Strings(names)
			if !reflect.DeepEqual(names, tt.want) {
				t.Errorf("names = %q, want %q", names, tt.want)
			}
		})
	}
}
