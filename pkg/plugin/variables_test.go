package plugin

import (
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestExpandVariables(t *testing.T) {
	tests := []struct {
		name      string
		text      string
		want      []string
		variables [][]string
	}{
		{name: "no variables", text: `\\AF\DB\Site`, want: []string{`\\AF\DB\Site`}, variables: [][]string{{}}},
		{name: "single group", text: `\\AF\DB\{A,B}`, want: []string{`\\AF\DB\A`, `\\AF\DB\B`}, variables: [][]string{{"A"}, {"B"}}},
		{
			name:      "two groups are combined",
			text:      `\\AF\DB\{S1,S2}\{U1,U2}`,
			want:      []string{`\\AF\DB\S1\U1`, `\\AF\DB\S1\U2`, `\\AF\DB\S2\U1`, `\\AF\DB\S2\U2`},
			variables: [][]string{{"S1", "U1"}, {"S1", "U2"}, {"S2", "U1"}, {"S2", "U2"}},
		},
		{name: "partial names", text: `Temp_{1,2}_C`, want: []string{"Temp_1_C", "Temp_2_C"}, variables: [][]string{{"1"}, {"2"}}},
		{
			name:      "encoded values",
			text:      `{Pump 1%2C North,50%25 %7Bmax%7D}`,
			want:      []string{"Pump 1, North", "50% {max}"},
			variables: [][]string{{"Pump 1, North"}, {"50% {max}"}},
		},
		{name: "unbalanced braces are kept", text: `Tag{1`, want: []string{"Tag{1"}, variables: [][]string{{}}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := expandVariables(tt.text)
			values := make([]string, 0, len(got))
			variables := make([][]string, 0, len(got))
			for _, g := range got {
				values = append(values, g.Value)
				variables = append(variables, g.Variables)
			}
			if !reflect.DeepEqual(values, tt.want) {
				t.Errorf("values = %q, want %q", values, tt.want)
			}
			if !reflect.DeepEqual(variables, tt.variables) {
				t.Errorf("variables = %q, want %q", variables, tt.variables)
			}
		})
	}
}

func newVariablesTestQuery(target string, attributes ...string) PIWebAPIQuery {
	q := PIWebAPIQuery{Target: &target}
	for _, a := range attributes {
		q.Attributes = append(q.Attributes, QueryProperties{Value: QueryPropertiesValue{Value: a}})
	}
	return q
}

func TestGetExpandedTargets(t *testing.T) {
	q := newVariablesTestQuery(`\\AF\DB\{S1,S2}\{U1,U2};{Temp,Flow};Pressure`, "{Temp,Flow}", "Pressure")
	targets, err := q.getExpandedTargets()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(targets) != 12 { // 4 element paths x 3 attributes
		t.Fatalf("expected 12 targets, got %d", len(targets))
	}
	first := targets[0]
	if first.BasePath != `\\AF\DB\S1\U1` || first.Attribute != "Temp" || first.Variable != `S1\U1` || !first.MultiVariable {
		t.Errorf("unexpected first target: %+v", first)
	}
	last := targets[len(targets)-1]
	if last.BasePath != `\\AF\DB\S2\U2` || last.Attribute != "Pressure" || last.Variable != `S2\U2` {
		t.Errorf("unexpected last target: %+v", last)
	}

	// PI points: variables in the point names expand into several points on the same server
	points := newVariablesTestQuery(`\\PISERVER;{SINUSOID,CDT158}`, "{SINUSOID,CDT158}")
	points.IsPiPoint = true
	targets, err = points.getExpandedTargets()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(targets) != 2 || targets[0].Attribute != "SINUSOID" || targets[1].Attribute != "CDT158" || targets[0].Variable != "" {
		t.Errorf("unexpected PI point targets: %+v", targets)
	}
}

// variableGroup returns a multi-value variable of n values ("{P0,P1,...}"), or a plain name when n is 1.
func variableGroup(prefix string, n int) string {
	if n == 1 {
		return prefix
	}
	values := make([]string, n)
	for i := range values {
		values[i] = fmt.Sprintf("%s%d", prefix, i)
	}
	return "{" + strings.Join(values, ",") + "}"
}

// A query expands into at most maxExpandedTargets (1000) element/attribute combinations, counting the values of every
// attribute. The limit is enforced before the combinations are built: three "All" variables of 100 values are a
// million combinations, which used to be allocated in full (~150 MB) only to return the error.
func TestGetExpandedTargetsLimit(t *testing.T) {
	tests := []struct {
		name       string
		target     string
		attributes []string
		want       int
	}{
		{name: "10 elements x 100 attributes", target: `\\AF\DB\` + variableGroup("E", 10), attributes: []string{variableGroup("A", 100)}, want: 1000},
		{name: "1000 elements", target: `\\AF\DB\` + variableGroup("E", 1000), attributes: []string{"Temp"}, want: 1000},
		{name: "1000 attributes in two groups", target: `\\AF\DB\E`, attributes: []string{variableGroup("A", 500), variableGroup("B", 500)}, want: 1000},
		{name: "1001 elements", target: `\\AF\DB\` + variableGroup("E", 1001), attributes: []string{"Temp"}, want: 1001},
		{name: "7 elements x 143 attributes", target: `\\AF\DB\` + variableGroup("E", 7), attributes: []string{variableGroup("A", 143)}, want: 1001},
		{name: "1001 attributes in three groups", target: `\\AF\DB\E`, attributes: []string{variableGroup("A", 500), variableGroup("B", 500), "Temp"}, want: 1001},
		{name: "100^3 element paths", target: `AF\DB\` + variableGroup("V", 100) + `\` + variableGroup("V", 100) + `\` + variableGroup("V", 100), attributes: []string{"Temp"}, want: 1000000},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := newVariablesTestQuery(tt.target, tt.attributes...)

			var before, after runtime.MemStats
			runtime.GC()
			runtime.ReadMemStats(&before)
			targets, err := q.getExpandedTargets()
			runtime.ReadMemStats(&after)

			if tt.want <= 1000 { // the documented limit
				if err != nil || len(targets) != tt.want {
					t.Fatalf("expected %d targets, got %d (error %v)", tt.want, len(targets), err)
				}
				return
			}
			if !errors.Is(err, errTooManyTargets) {
				t.Fatalf("expected errTooManyTargets, got %d targets (error %v)", len(targets), err)
			}
			if !strings.Contains(err.Error(), fmt.Sprintf(" %d targets", tt.want)) {
				t.Errorf("error should report the number of targets: %v", err)
			}
			if allocated := after.TotalAlloc - before.TotalAlloc; allocated > 1<<20 {
				t.Errorf("allocated %d MB before rejecting the query", allocated>>20)
			}
		})
	}
}

func TestProcessQueryExpandsVariables(t *testing.T) {
	d := &Datasource{
		settings:          backend.DataSourceInstanceSettings{URL: "https://server/piwebapi"},
		webIDCache:        newWebIDCache(1),
		datasourceMutex:   &sync.Mutex{},
		dataSourceOptions: &PIWebAPIDataSourceJsonData{},
	}

	queryJSON, _ := json.Marshal(map[string]interface{}{
		"target": `\\AF\DB\{S1,S2}\{U1,U2};{Temp,Flow}`,
		"attributes": []map[string]interface{}{
			{"value": map[string]interface{}{"value": "{Temp,Flow}"}},
		},
		"hashCode": "h",
	})
	now := time.Now()
	queries := []backend.DataQuery{
		{RefID: "A", JSON: queryJSON, TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}},
	}

	processed := d.processQuery(queries, "uid")
	if len(processed) != 8 { // 4 element paths x 2 attributes
		t.Fatalf("expected 8 processed queries, got %d", len(processed))
	}

	keys := map[string]bool{}
	hashes := map[string]bool{}
	for _, q := range processed {
		if q.Error != nil || q.RefID != "A" {
			t.Fatalf("unexpected query: %+v", q)
		}
		for key := range q.BatchRequest {
			if keys[key] {
				t.Errorf("duplicate batch request key %q", key)
			}
			keys[key] = true
		}
		if hashes[q.HashCode] {
			t.Errorf("duplicate response cache key %q", q.HashCode)
		}
		hashes[q.HashCode] = true
		if strings.ContainsAny(q.FullTargetPath, "{}") {
			t.Errorf("target path was not expanded: %q", q.FullTargetPath)
		}
	}
	if processed[0].FullTargetPath != `\\AF\DB\S1\U1|Temp` {
		t.Errorf("first target path = %q", processed[0].FullTargetPath)
	}
}

func TestProcessQueryResolvesDisplayPerTarget(t *testing.T) {
	d := &Datasource{
		settings:          backend.DataSourceInstanceSettings{URL: "https://server/piwebapi"},
		webIDCache:        newWebIDCache(1),
		datasourceMutex:   &sync.Mutex{},
		dataSourceOptions: &PIWebAPIDataSourceJsonData{},
	}

	queryJSON, _ := json.Marshal(map[string]interface{}{
		"target": `\\AF\DB\U-100\{T-101,T-102}`,
		"attributes": []map[string]interface{}{
			{"value": map[string]interface{}{"value": "{Level,Volume}"}},
		},
		// {A,B} matches no variable of the query and stays as typed
		"display":  "{T-101,T-102} {Level,Volume} {A,B}",
		"hashCode": "h",
	})
	now := time.Now()
	queries := []backend.DataQuery{
		{RefID: "A", JSON: queryJSON, TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}},
	}

	processed := d.processQuery(queries, "uid")
	got := make([]string, 0, len(processed))
	for _, q := range processed {
		got = append(got, *q.Display)
	}
	want := []string{"T-101 Level {A,B}", "T-101 Volume {A,B}", "T-102 Level {A,B}", "T-102 Volume {A,B}"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("display names = %q, want %q", got, want)
	}
}

func TestResolveDisplay(t *testing.T) {
	target := expandedTarget{Choices: []variableChoice{{Options: []string{"a,1", "b"}, Value: "a,1"}}}
	tests := map[string]string{
		"plain name":         "plain name",
		"{a%2C1,b} value":    "a,1 value",
		"unbalanced {a%2C1,": "unbalanced {a%2C1,",
		"{x}{a%2C1,b}{y,z}!": "{x}a,1{y,z}!",
	}
	for display, want := range tests {
		if got := *target.resolveDisplay(&display); got != want {
			t.Errorf("resolveDisplay(%q) = %q, want %q", display, got, want)
		}
	}
	if target.resolveDisplay(nil) != nil {
		t.Error("resolveDisplay(nil) should be nil")
	}
}
