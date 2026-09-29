package plugin

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"strconv"
	"testing"
)

// The frontend and the backend must convert saved queries to the same format version.
func TestQueryVersionMatchesFrontend(t *testing.T) {
	source, err := os.ReadFile(filepath.Join("..", "..", "src", "queryVersion.ts"))
	if err != nil {
		t.Fatal(err)
	}
	match := regexp.MustCompile(`export const QUERY_VERSION = (\d+);`).FindSubmatch(source)
	if match == nil {
		t.Fatal("QUERY_VERSION not found in src/queryVersion.ts")
	}
	if frontend, _ := strconv.Atoi(string(match[1])); frontend != queryVersion {
		t.Errorf("src/queryVersion.ts QUERY_VERSION = %d, pkg/plugin queryVersion = %d", frontend, queryVersion)
	}
}

func TestQueryMigrationsForEveryVersion(t *testing.T) {
	for version := 1; version <= queryVersion; version++ {
		if queryMigrations[version] == nil {
			t.Errorf("no conversion step to version %d in queryMigrations", version)
		}
	}
	for version := 0; version <= queryVersion; version++ {
		if _, err := os.Stat(queryExamplesPath(version)); err != nil {
			t.Errorf("no example of format version %d: %v", version, err)
		}
	}
}

func queryExamplesPath(version int) string {
	return filepath.Join("..", "..", "testdata", "queries", fmt.Sprintf("v%d.json", version))
}

// The examples of every format version (also converted by the frontend in src/queryVersion.test.ts) are converted
// to the current version.
func TestQueryVersionExamples(t *testing.T) {
	for version := 0; version <= queryVersion; version++ {
		raw, err := os.ReadFile(queryExamplesPath(version))
		if err != nil {
			t.Fatal(err)
		}
		var examples []struct {
			Name     string          `json:"name"`
			Saved    json.RawMessage `json:"saved"`
			Expected map[string]any  `json:"expected"`
		}
		if err := json.Unmarshal(raw, &examples); err != nil {
			t.Fatal(err)
		}
		for _, example := range examples {
			t.Run(fmt.Sprintf("v%d/%s", version, example.Name), func(t *testing.T) {
				var q PIWebAPIQuery
				if err := json.Unmarshal(example.Saved, &q); err != nil {
					t.Fatal(err)
				}
				q.migrate()
				got := toJSONMap(t, q)
				assertSubset(t, "", example.Expected, got)

				q.migrate() // converting again changes nothing
				if again := toJSONMap(t, q); !reflect.DeepEqual(again, got) {
					t.Errorf("second conversion changed the query: %v", again)
				}
			})
		}
	}
}

func toJSONMap(t *testing.T, v any) map[string]any {
	t.Helper()
	raw, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	return m
}

// assertSubset checks that every field of want has the same value in got (objects are compared field by field).
func assertSubset(t *testing.T, path string, want, got map[string]any) {
	t.Helper()
	for key, wantValue := range want {
		gotValue, ok := got[key]
		if wantObject, isObject := wantValue.(map[string]any); isObject {
			gotObject, _ := gotValue.(map[string]any)
			assertSubset(t, path+key+".", wantObject, gotObject)
			continue
		}
		if !ok || !reflect.DeepEqual(gotValue, wantValue) {
			t.Errorf("%s%s = %v, want %v", path, key, gotValue, wantValue)
		}
	}
}
