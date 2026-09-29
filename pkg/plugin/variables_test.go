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

func TestGetExpandedTargetsLimit(t *testing.T) {
	values := make([]string, 0, 101)
	for i := 0; i <= 100; i++ {
		values = append(values, fmt.Sprintf("E%d", i))
	}
	group := "{" + strings.Join(values, ",") + "}"
	q := newVariablesTestQuery(`\\AF\DB\`+group, group[:len(group)-len(",E100}")]+"}")

	_, err := q.getExpandedTargets()
	if !errors.Is(err, errTooManyTargets) {
		t.Fatalf("expected errTooManyTargets for 101 x 100 targets, got %v", err)
	}
}

func TestDataLabelsWithVariables(t *testing.T) {
	multi := &PiProcessedQuery{
		Label: "Temperature", FullTargetPath: `\\AF\DB\S1\U2|Temperature`, TargetPath: `\\AF\DB\S1\U2`,
		Variable: `S1\U2`, MultiVariable: true,
	}
	if got := getDataLabels(false, multi, "Float32", "", "", "")["name"]; got != `S1\U2|Temperature` {
		t.Errorf("multi-variable label = %q", got)
	}

	// a single variable keeps the existing label format
	single := &PiProcessedQuery{Label: "Temperature", FullTargetPath: `\\AF\DB\S1|Temperature`, Variable: "S1"}
	if got := getDataLabels(false, single, "Float32", "", "", "")["name"]; got != "S1|S1|Temperature" {
		t.Errorf("single-variable label = %q", got)
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
	tooManyJSON, _ := json.Marshal(map[string]interface{}{
		"target": `\\AF\DB\{` + strings.Repeat("E,", 1000) + `E}`,
		"attributes": []map[string]interface{}{
			{"value": map[string]interface{}{"value": "Temp"}},
		},
	})
	now := time.Now()
	queries := []backend.DataQuery{
		{RefID: "A", JSON: queryJSON, TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}},
		{RefID: "B", JSON: tooManyJSON, TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}},
	}

	processed := d.processQuery(queries, "uid")
	if len(processed) != 9 { // 8 targets for A + 1 error for B
		t.Fatalf("expected 9 processed queries, got %d", len(processed))
	}

	keys := map[string]bool{}
	hashes := map[string]bool{}
	for _, q := range processed[:8] {
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

	last := processed[8]
	if last.RefID != "B" || !errors.Is(last.Error, errTooManyTargets) {
		t.Errorf("expected too many targets error for B, got %+v", last)
	}
}

// The target limit must be enforced before the combinations are built: three "All" variables of 100 values
// are a million combinations, which used to be allocated in full (~150 MB) only to return the error.
func TestGetExpandedTargetsLimitWithoutExpanding(t *testing.T) {
	values := make([]string, 100)
	for i := range values {
		values[i] = fmt.Sprintf("V%d", i)
	}
	group := "{" + strings.Join(values, ",") + "}"
	q := newVariablesTestQuery(`AF\DB\`+group+`\`+group+`\`+group, "Temp")

	var before, after runtime.MemStats
	runtime.GC()
	runtime.ReadMemStats(&before)
	_, err := q.getExpandedTargets()
	runtime.ReadMemStats(&after)

	if !errors.Is(err, errTooManyTargets) {
		t.Fatalf("expected errTooManyTargets, got %v", err)
	}
	if !strings.Contains(err.Error(), "1000000 targets") {
		t.Errorf("error should report the number of targets: %v", err)
	}
	if allocated := after.TotalAlloc - before.TotalAlloc; allocated > 1<<20 {
		t.Errorf("allocated %d MB before rejecting the query", allocated>>20)
	}
}
