package plugin

import (
	"net/http"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

const fakeDatabaseWebID = "F1RDTankControlSim"

// pumpTrips are event frames like those of the PI Web API simulator's "Pump Trip" template. The second one has no
// Source attribute, and the third has a digital state (enumeration) attribute.
func pumpTrips() []fakeEventFrame {
	start := time.Date(2026, 10, 1, 13, 0, 0, 0, time.UTC)
	return []fakeEventFrame{
		{name: "P-101 Trip 1", start: start, attributes: []fakeEventFrameAttribute{
			{"Duration", 40.0}, {"Source", "Scheduled disturbance"}, {"Level at Start", 49.5}, {"Level at End", 38.8}}},
		{name: "P-101 Trip 2", start: start.Add(time.Hour), attributes: []fakeEventFrameAttribute{
			{"Duration", 67.0}, {"Level at Start", 49.25}, {"Level at End", 25.3}}},
		{name: "P-101 Trip 3", start: start.Add(2 * time.Hour), attributes: []fakeEventFrameAttribute{
			{"Duration", 12345678.0}, {"State", map[string]interface{}{"Name": "Tripped", "Value": 2, "IsSystem": false}}}},
	}
}

func fieldNames(frame *data.Frame) []string {
	names := make([]string, 0, len(frame.Fields))
	for _, field := range frame.Fields {
		names = append(names, field.Name)
	}
	return names
}

func stringValues(t *testing.T, frame *data.Frame, name string) []string {
	t.Helper()
	field, _ := frame.FieldByName(name)
	if field == nil {
		t.Fatalf("no field %q in %v", name, fieldNames(frame))
	}
	values := make([]string, field.Len())
	for i := range values {
		switch v := field.At(i).(type) {
		case string:
			values[i] = v
		case *string:
			if v == nil {
				values[i] = "<nil>"
			} else {
				values[i] = *v
			}
		}
	}
	return values
}

// Event frames with "Enable Attribute Usage" must be returned whatever attributes the name matches: an attribute
// missing on some event frames, a name matching no attribute or several attributes (wildcard), a trailing comma or
// no name at all (every attribute). Before, the attribute fields had another length than the event frame fields, and
// the whole annotation query failed with HTTP 500 ("frame has different field lengths").
func TestAnnotationAttributes(t *testing.T) {
	api := &fakeAnnotationAPI{databaseWebID: fakeDatabaseWebID, eventFrames: pumpTrips()}
	server := api.start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	tests := []struct {
		name       string
		attribute  string
		wantFields []string            // after time, timeEnd, title, id
		wantValues map[string][]string // field -> values, "<nil>" for no value
		wantText   []string
	}{
		{
			name: "attribute on every event frame", attribute: "Duration",
			wantFields: []string{"Duration", "attributeText"},
			wantValues: map[string][]string{"Duration": {"40", "67", "12345678"}},
			wantText:   []string{"<br />Duration: 40", "<br />Duration: 67", "<br />Duration: 12345678"},
		},
		{
			name: "attribute missing on some event frames", attribute: "Source",
			wantFields: []string{"Source", "attributeText"},
			wantValues: map[string][]string{"Source": {"Scheduled disturbance", "<nil>", "<nil>"}},
			wantText:   []string{"<br />Source: Scheduled disturbance", "", ""},
		},
		{
			name: "no attribute matches", attribute: "Foo",
			wantFields: []string{"attributeText"},
			wantText:   []string{"", "", ""},
		},
		{
			name: "wildcard matching several attributes", attribute: "Level*",
			wantFields: []string{"Level at Start", "Level at End", "attributeText"},
			wantValues: map[string][]string{"Level at Start": {"49.5", "49.25", "<nil>"}, "Level at End": {"38.8", "25.3", "<nil>"}},
			wantText:   []string{"<br />Level at Start: 49.5<br />Level at End: 38.8", "<br />Level at Start: 49.25<br />Level at End: 25.3", ""},
		},
		{
			name: "trailing comma and space", attribute: "Duration, ",
			wantFields: []string{"Duration", "attributeText"},
			wantText:   []string{"<br />Duration: 40", "<br />Duration: 67", "<br />Duration: 12345678"},
		},
		{
			name: "existing and missing attribute", attribute: "Duration,Foo",
			wantFields: []string{"Duration", "attributeText"},
			wantText:   []string{"<br />Duration: 40", "<br />Duration: 67", "<br />Duration: 12345678"},
		},
		{
			name: "digital state shown by its name", attribute: "State",
			wantFields: []string{"State", "attributeText"},
			wantValues: map[string][]string{"State": {"<nil>", "<nil>", "Tripped"}},
			wantText:   []string{"", "", "<br />State: Tripped"},
		},
		{
			name: "no name: every attribute", attribute: "",
			wantFields: []string{"Duration", "Source", "Level at Start", "Level at End", "State", "attributeText"},
			wantText: []string{
				"<br />Duration: 40<br />Source: Scheduled disturbance<br />Level at Start: 49.5<br />Level at End: 38.8",
				"<br />Duration: 67<br />Level at Start: 49.25<br />Level at End: 25.3",
				"<br />Duration: 12345678<br />State: Tripped",
			},
		},
		{
			name: "attributes in the order of the names", attribute: "Source,Level*,Duration",
			wantFields: []string{"Source", "Level at Start", "Level at End", "Duration", "attributeText"},
			wantText: []string{
				"<br />Source: Scheduled disturbance<br />Level at Start: 49.5<br />Level at End: 38.8<br />Duration: 40",
				"<br />Level at Start: 49.25<br />Level at End: 25.3<br />Duration: 67",
				"<br />Duration: 12345678",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// the order of the fields and of the attribute text must not change between refreshes
			for run := 0; run < 10; run++ {
				query := annotationQuery("Anno", fakeDatabaseWebID, map[string]interface{}{"enable": true, "name": tt.attribute})
				r := runAnnotationQueries(t, d, query).Responses["Anno"]
				if r.Error != nil {
					t.Fatalf("unexpected error: %v", r.Error)
				}
				if len(r.Frames) != 1 {
					t.Fatalf("got %d frames, want 1", len(r.Frames))
				}
				frame := r.Frames[0]
				if _, err := frame.MarshalArrow(); err != nil {
					t.Fatalf("the frame cannot be sent to Grafana: %v", err)
				}
				if rows, err := frame.RowLen(); err != nil || rows != 3 {
					t.Fatalf("frame has %d rows (%v), want one per event frame", rows, err)
				}
				wantFields := append([]string{"time", "timeEnd", "title", "id"}, tt.wantFields...)
				if got := fieldNames(frame); !reflect.DeepEqual(got, wantFields) {
					t.Fatalf("run %d: fields = %q, want %q", run, got, wantFields)
				}
				if got := stringValues(t, frame, "title"); !reflect.DeepEqual(got, []string{"P-101 Trip 1", "P-101 Trip 2", "P-101 Trip 3"}) {
					t.Errorf("titles = %q", got)
				}
				for name, want := range tt.wantValues {
					if got := stringValues(t, frame, name); !reflect.DeepEqual(got, want) {
						t.Errorf("%s = %q, want %q", name, got, want)
					}
				}
				if got := stringValues(t, frame, "attributeText"); !reflect.DeepEqual(got, tt.wantText) {
					t.Fatalf("run %d: attributeText = %q, want %q", run, got, tt.wantText)
				}
			}
		})
	}

	t.Run("attributes disabled", func(t *testing.T) {
		query := annotationQuery("Anno", fakeDatabaseWebID, map[string]interface{}{"enable": false, "name": "Duration"})
		r := runAnnotationQueries(t, d, query).Responses["Anno"]
		if r.Error != nil || len(r.Frames) != 1 {
			t.Fatalf("error %v, %d frames", r.Error, len(r.Frames))
		}
		if got := fieldNames(r.Frames[0]); !reflect.DeepEqual(got, []string{"time", "timeEnd", "title", "id"}) {
			t.Errorf("fields = %q", got)
		}
	})
}

// The batch resources must be valid PI Web API URLs whether or not the datasource URL ends with a slash: without a
// slash, the attribute requests went to ".../piwebapistreamsets/...".
func TestAnnotationBatchURLs(t *testing.T) {
	q := PiProcessedAnnotationQuery{Database: AFDatabase{WebId: "F1RD"}, Template: EventFrameTemplate{Name: "Pump Trip"},
		Attributes: []QueryProperties{{Value: QueryPropertiesValue{Value: "Duration"}}}, AttributesEnabled: true}
	attributeURLs, err := q.getEventFrameAttributeQueryURL()
	if err != nil {
		t.Fatal(err)
	}
	for _, baseURL := range []string{"https://pi/piwebapi", "https://pi/piwebapi/"} {
		d := &Datasource{settings: backend.DataSourceInstanceSettings{URL: baseURL}}
		batch := d.buildAnnotationBatch(q.getEventFrameQueryURL(), attributeURLs...)
		if got := batch["1"].Resource; !strings.HasPrefix(got, "https://pi/piwebapi/assetdatabases/F1RD/eventframes?") {
			t.Errorf("URL %q: event frame resource = %q", baseURL, got)
		}
		if got := batch["2"].RequestTemplate.Resource; !strings.HasPrefix(got, "https://pi/piwebapi/streamsets/{0}/value?") {
			t.Errorf("URL %q: attribute resource = %q", baseURL, got)
		}
	}
}

// Annotation errors must be returned in the response of the query, with the PI Web API message, and must not fail
// the other annotation queries. Before, a PI Web API error for the event frames gave an empty annotation, a failed
// batch request failed the whole request with a generic error, and a malformed query ran against an empty database.
func TestAnnotationErrors(t *testing.T) {
	t.Run("invalid database WebID", func(t *testing.T) {
		api := &fakeAnnotationAPI{databaseWebID: fakeDatabaseWebID, eventFrames: pumpTrips()}
		d := newFakeDatasource(api.start(t).URL, PIWebAPIDataSourceJsonData{})
		response := runAnnotationQueries(t, d,
			annotationQuery("A", "F1RDbogus", map[string]interface{}{"enable": true, "name": "Duration"}),
			annotationQuery("B", fakeDatabaseWebID, nil))
		a := response.Responses["A"]
		if a.Error == nil || !strings.Contains(a.Error.Error(), "Unknown or invalid WebID format: 'F1RDbogus'") {
			t.Errorf("A: expected the PI Web API error, got %v (%d frames)", a.Error, len(a.Frames))
		}
		if a.Status != backend.StatusBadRequest {
			t.Errorf("A: status = %d, want 400", a.Status)
		}
		b := response.Responses["B"]
		if b.Error != nil || len(b.Frames) != 1 {
			t.Fatalf("B: error %v, %d frames", b.Error, len(b.Frames))
		}
		if rows, _ := b.Frames[0].RowLen(); rows != 3 {
			t.Errorf("B: %d event frames, want 3", rows)
		}
	})

	t.Run("batch request failed (401)", func(t *testing.T) {
		api := &fakeAnnotationAPI{databaseWebID: fakeDatabaseWebID, status: http.StatusUnauthorized}
		d := newFakeDatasource(api.start(t).URL, PIWebAPIDataSourceJsonData{})
		r := runAnnotationQueries(t, d, annotationQuery("A", fakeDatabaseWebID, nil)).Responses["A"]
		if r.Error == nil || !strings.Contains(r.Error.Error(), "401") {
			t.Errorf("expected an error mentioning 401, got %v", r.Error)
		}
		if r.Status != backend.StatusBadGateway || r.ErrorSource != backend.ErrorSourceDownstream {
			t.Errorf("status = %d, source = %q", r.Status, r.ErrorSource)
		}
	})

	t.Run("malformed query", func(t *testing.T) {
		api := &fakeAnnotationAPI{databaseWebID: fakeDatabaseWebID, eventFrames: pumpTrips()}
		d := newFakeDatasource(api.start(t).URL, PIWebAPIDataSourceJsonData{})
		query := annotationQuery("A", fakeDatabaseWebID, nil)
		query.JSON = []byte(`{"database":{"WebId":"` + fakeDatabaseWebID + `"},"template":{"Name":"Pump Trip"},"nameFilter":123}`)
		r := runAnnotationQueries(t, d, query).Responses["A"]
		if r.Error == nil || !strings.Contains(r.Error.Error(), "invalid annotation query") {
			t.Errorf("expected an invalid query error, got %v (%d frames)", r.Error, len(r.Frames))
		}
		if r.Status != backend.StatusBadRequest {
			t.Errorf("status = %d, want 400", r.Status)
		}
		if n := api.batchCount(); n != 0 {
			t.Errorf("%d requests sent to PI Web API for an invalid query", n)
		}
	})

	t.Run("no database", func(t *testing.T) {
		api := &fakeAnnotationAPI{databaseWebID: fakeDatabaseWebID, eventFrames: pumpTrips()}
		d := newFakeDatasource(api.start(t).URL, PIWebAPIDataSourceJsonData{})
		r := runAnnotationQueries(t, d, annotationQuery("A", "", nil)).Responses["A"]
		if r.Error == nil || !strings.Contains(r.Error.Error(), "select an AF database") {
			t.Errorf("expected a missing database error, got %v (%d frames)", r.Error, len(r.Frames))
		}
		if n := api.batchCount(); n != 0 {
			t.Errorf("%d requests sent to PI Web API without a database", n)
		}
	})
}
