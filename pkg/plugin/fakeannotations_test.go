package plugin

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// fakeEventFrameAttribute is an attribute of an event frame known to fakeAnnotationAPI.
type fakeEventFrameAttribute struct {
	name  string
	value interface{}
}

// fakeEventFrame is an event frame known to fakeAnnotationAPI; its attributes are returned in this order.
type fakeEventFrame struct {
	name       string
	start      time.Time
	attributes []fakeEventFrameAttribute
}

// fakeAnnotationAPI is a minimal PI Web API for annotation queries, with the response shapes of PI Web API (checked on
// the PI Web API simulator): the batch request runs sub-request "1" (assetdatabases/{webId}/eventframes) and the
// attribute sub-requests (streamsets/{0}/value with a nameFilter, one response item per event frame). It also
// answers the health check (GET /piwebapi) and the asset servers resource, and records the request headers.
type fakeAnnotationAPI struct {
	databaseWebID string
	eventFrames   []fakeEventFrame
	status        int    // when set, every request is answered with this HTTP status
	authorization string // when set, requests without this Authorization header get 401

	mu      sync.Mutex
	headers []http.Header // headers of every request received
	batches int           // number of batch requests received
}

func (f *fakeAnnotationAPI) start(t *testing.T) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(f.serve))
	t.Cleanup(server.Close)
	return server
}

func (f *fakeAnnotationAPI) receivedHeaders() []http.Header {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]http.Header(nil), f.headers...)
}

func (f *fakeAnnotationAPI) batchCount() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.batches
}

func (f *fakeAnnotationAPI) serve(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	f.headers = append(f.headers, r.Header.Clone())
	if r.URL.Path == "/piwebapi/batch" {
		f.batches++
	}
	f.mu.Unlock()

	status := f.status
	if f.authorization != "" && r.Header.Get("Authorization") != f.authorization {
		status = http.StatusUnauthorized
	}
	if status != 0 {
		w.WriteHeader(status)
		_, _ = w.Write([]byte(`{"Errors":["Authorization has been denied for this request."]}`))
		return
	}

	switch {
	case r.Method == http.MethodGet && r.URL.Path == "/piwebapi":
		_, _ = w.Write([]byte(`{"Links":{}}`))
	case r.Method == http.MethodGet && r.URL.Path == "/piwebapi/assetservers":
		_, _ = w.Write([]byte(`{"Items":[]}`))
	case r.Method == http.MethodPost && r.URL.Path == "/piwebapi/batch":
		var requests map[string]AnnotationRequest
		if err := json.NewDecoder(r.Body).Decode(&requests); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		base := "http://" + r.Host + "/piwebapi/"
		responses := map[string]interface{}{}
		eventFrames, parent := f.eventFramesResponse(base, requests["1"])
		responses["1"] = parent
		for key, request := range requests {
			if key != "1" {
				responses[key] = f.attributesResponse(base, request, eventFrames)
			}
		}
		w.WriteHeader(http.StatusMultiStatus)
		_ = json.NewEncoder(w).Encode(responses)
	default:
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"Errors":["Not found"]}`))
	}
}

func batchError(status int, message string) map[string]interface{} {
	return map[string]interface{}{"Status": status, "Headers": map[string]string{},
		"Content": map[string]interface{}{"Errors": []string{message}}}
}

// eventFramesResponse answers sub-request "1"; it returns nil event frames when the request failed.
func (f *fakeAnnotationAPI) eventFramesResponse(base string, request AnnotationRequest) ([]fakeEventFrame, map[string]interface{}) {
	resource, err := url.Parse(request.Resource)
	if err != nil || !strings.HasPrefix(request.Resource, base+"assetdatabases/") ||
		!strings.HasSuffix(resource.Path, "/eventframes") {
		return nil, batchError(http.StatusNotFound, "No HTTP resource was found that matches the request URI '"+request.Resource+"'.")
	}
	webID := strings.TrimSuffix(strings.TrimPrefix(resource.Path, "/piwebapi/assetdatabases/"), "/eventframes")
	if webID != f.databaseWebID {
		return nil, batchError(http.StatusBadRequest, "Unknown or invalid WebID format: '"+webID+"'.")
	}
	items := make([]map[string]interface{}, 0, len(f.eventFrames))
	for i, eventFrame := range f.eventFrames {
		items = append(items, map[string]interface{}{
			"WebId": "F1Fm" + eventFrame.name, "Id": "id-" + eventFrame.name, "Name": eventFrame.name,
			"TemplateName": "Pump Trip", "StartTime": eventFrame.start.Format(time.RFC3339),
			"EndTime": eventFrame.start.Add(time.Duration(i+1) * time.Minute).Format(time.RFC3339),
			"Links":   map[string]interface{}{}})
	}
	return f.eventFrames, map[string]interface{}{"Status": http.StatusOK,
		"Headers": map[string]string{"Content-Type": "application/json; charset=utf-8"},
		"Content": map[string]interface{}{"Items": items, "Links": map[string]interface{}{}}}
}

// attributesResponse answers an attribute sub-request: one item per event frame of the parent request, holding the
// attributes of that event frame that match the nameFilter (all of them without a nameFilter).
func (f *fakeAnnotationAPI) attributesResponse(base string, request AnnotationRequest, eventFrames []fakeEventFrame) map[string]interface{} {
	if eventFrames == nil {
		return batchError(http.StatusConflict, "Not executed because parent request(s) 1 failed.")
	}
	if request.RequestTemplate == nil || !strings.HasPrefix(request.RequestTemplate.Resource, base+"streamsets/{0}/value?") {
		return batchError(http.StatusNotFound, "No HTTP resource was found that matches the request URI.")
	}
	_, rawQuery, _ := strings.Cut(request.RequestTemplate.Resource, "?")
	query, err := url.ParseQuery(rawQuery)
	if err != nil {
		return batchError(http.StatusBadRequest, err.Error())
	}
	nameFilter := strings.ToLower(query.Get("nameFilter"))

	items := make([]map[string]interface{}, 0, len(eventFrames))
	for _, eventFrame := range eventFrames {
		values := []map[string]interface{}{}
		for _, attribute := range eventFrame.attributes {
			if matched, _ := path.Match(nameFilter, strings.ToLower(attribute.name)); nameFilter != "" && !matched {
				continue
			}
			values = append(values, map[string]interface{}{"Name": attribute.name, "Value": map[string]interface{}{
				"Timestamp": "1970-01-01T00:00:00Z", "Value": attribute.value, "UnitsAbbreviation": "", "Good": true}})
		}
		items = append(items, map[string]interface{}{"Status": http.StatusOK,
			"Headers": map[string]string{"Content-Type": "application/json; charset=utf-8"},
			"Content": map[string]interface{}{"Items": values}})
	}
	return map[string]interface{}{"Status": http.StatusMultiStatus,
		"Headers": map[string]string{"Content-Type": "application/json; charset=utf-8"},
		"Content": map[string]interface{}{"Total": len(items), "Items": items}}
}

// annotationQuery returns a frontend-shaped annotation query (src/datasource.ts annotations).
func annotationQuery(refID string, databaseWebID string, attribute map[string]interface{}) backend.DataQuery {
	query := map[string]interface{}{
		"refId":        refID,
		"queryType":    "Annotation",
		"isAnnotation": true,
		"database":     map[string]interface{}{"WebId": databaseWebID, "Name": "TankControlSim"},
		"template":     map[string]interface{}{"Name": "Pump Trip"},
	}
	if attribute != nil {
		query["attribute"] = attribute
	}
	raw, _ := json.Marshal(query)
	now := time.Now()
	return backend.DataQuery{RefID: refID, QueryType: "Annotation", JSON: raw,
		TimeRange: backend.TimeRange{From: now.Add(-24 * time.Hour), To: now}}
}

// runAnnotationQueries sends annotation queries through QueryData, as Grafana does.
func runAnnotationQueries(t *testing.T, d *Datasource, queries ...backend.DataQuery) *backend.QueryDataResponse {
	t.Helper()
	if d.queryMux == nil {
		d.queryMux = d.newQueryMux()
	}
	response, err := d.QueryData(t.Context(), &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &d.settings},
		Queries:       queries,
	})
	if err != nil {
		t.Fatalf("QueryData returned an error instead of an error per query: %v", err)
	}
	return response
}
