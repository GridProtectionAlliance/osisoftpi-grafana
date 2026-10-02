package plugin

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// fakeAttribute is an AF attribute (or PI point) known to fakePIWebAPI.
type fakeAttribute struct {
	units        string        // DefaultUnitsName / EngineeringUnits returned by the WebID lookup
	abbreviation string        // UnitsAbbreviation returned with the values
	valueType    *string       // Type returned by the WebID lookup; nil means "Double"
	values       []interface{} // values returned for the stream; nil means 1.5 and 2.5
	dataStatus   int           // when set, the data request (not the WebID lookup) fails with this status
}

// fakePIWebAPI is a minimal PI Web API batch endpoint for backend tests. It resolves WebIDs by path,
// returns 404 for unknown paths, runs dependent (ParentIds) requests and returns each attribute's values.
type fakePIWebAPI struct {
	attributes map[string]fakeAttribute // full path (\\server\...|attribute) -> attribute
	status     int                      // when set, every request is answered with this HTTP status
	requests   atomic.Int32             // number of HTTP requests received
}

func (f *fakePIWebAPI) start(t *testing.T) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(f.serve))
	t.Cleanup(server.Close)
	return server
}

func (f *fakePIWebAPI) serve(w http.ResponseWriter, r *http.Request) {
	f.requests.Add(1)
	if f.status != 0 {
		w.WriteHeader(f.status)
		_, _ = w.Write([]byte(`{"Errors":["Authorization has been denied for this request."]}`))
		return
	}
	if r.Method != http.MethodPost || !strings.HasSuffix(r.URL.Path, "/batch") {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{}`))
		return
	}

	var requests map[string]BatchSubRequest
	if err := json.NewDecoder(r.Body).Decode(&requests); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	responses := map[string]map[string]interface{}{}
	for len(responses) < len(requests) {
		for key, req := range requests {
			if _, done := responses[key]; done {
				continue
			}
			ready := true
			for _, parent := range req.ParentIds {
				if _, ok := responses[parent]; !ok {
					ready = false
				}
			}
			if !ready {
				continue
			}
			responses[key] = f.resolve(req, responses)
		}
	}
	w.WriteHeader(http.StatusMultiStatus)
	_ = json.NewEncoder(w).Encode(responses)
}

func (f *fakePIWebAPI) resolve(req BatchSubRequest, done map[string]map[string]interface{}) map[string]interface{} {
	resource := req.Resource
	for _, parent := range req.ParentIds {
		if done[parent]["Status"] != http.StatusOK {
			return map[string]interface{}{"Status": http.StatusConflict, "Content": map[string]interface{}{
				"Errors": []string{"The following ParentIds did not complete successfully: " + parent}}}
		}
		content := done[parent]["Content"].(map[string]interface{})
		resource = strings.ReplaceAll(resource, "{0}", content["WebId"].(string))
	}

	u, err := url.Parse(resource)
	if err != nil {
		return map[string]interface{}{"Status": http.StatusBadRequest, "Content": map[string]interface{}{"Errors": []string{err.Error()}}}
	}
	query := u.Query()
	if path := query.Get("path"); path != "" {
		attribute, ok := f.attributes[path]
		if !ok {
			return map[string]interface{}{"Status": http.StatusNotFound, "Content": map[string]interface{}{
				"Errors": []string{"The specified object was not found (path '" + path + "')."}}}
		}
		name := path[strings.LastIndexAny(path, `\|`)+1:]
		valueType := "Double"
		if attribute.valueType != nil {
			valueType = *attribute.valueType
		}
		return map[string]interface{}{"Status": http.StatusOK, "Content": map[string]interface{}{
			"WebId": "W" + base64.RawURLEncoding.EncodeToString([]byte(path)), "Name": name, "Path": path,
			"Type": valueType, "PointType": "Float64", "DefaultUnitsName": attribute.units,
			"EngineeringUnits": attribute.units, "Description": name}}
	}

	webID := query.Get("webId")
	raw, err := base64.RawURLEncoding.DecodeString(strings.TrimPrefix(webID, "W"))
	if err != nil {
		return map[string]interface{}{"Status": http.StatusBadRequest, "Content": map[string]interface{}{"Errors": []string{"bad webId"}}}
	}
	path := string(raw)
	if status := f.attributes[path].dataStatus; status != 0 {
		return map[string]interface{}{"Status": status, "Content": map[string]interface{}{
			"Errors": []string{"The requested time range is not valid."}}}
	}
	now := time.Now().UTC().Truncate(time.Second)
	values := f.attributes[path].values
	if values == nil {
		values = []interface{}{1.5, 2.5}
	}
	items := make([]map[string]interface{}, 0, len(values))
	for i, value := range values {
		// system digital states (e.g. "Bad Input") are returned with Good=false, as by PI Web API
		state, isState := value.(map[string]interface{})
		good := !isState || state["IsSystem"] != true
		items = append(items, map[string]interface{}{
			"Timestamp": now.Add(time.Duration(i-len(values)) * time.Minute).Format(time.RFC3339), "Value": value,
			"Good": good, "UnitsAbbreviation": f.attributes[path].abbreviation})
	}
	return map[string]interface{}{"Status": http.StatusOK, "Content": map[string]interface{}{"Links": map[string]interface{}{},
		"Items": []map[string]interface{}{{"WebId": webID, "Name": path, "Path": path, "Links": map[string]interface{}{},
			"Items": items, "UnitsAbbreviation": f.attributes[path].abbreviation}}}}
}

// newFakeDatasource returns a datasource that talks to the fake PI Web API server.
func newFakeDatasource(serverURL string, options PIWebAPIDataSourceJsonData) *Datasource {
	return &Datasource{
		settings:          backend.DataSourceInstanceSettings{URL: serverURL + "/piwebapi"},
		httpClient:        &http.Client{Timeout: 10 * time.Second},
		webIDCache:        newWebIDCache(1),
		webCache:          newCache[string, PiBatchData](),
		datasourceMutex:   &sync.Mutex{},
		dataSourceOptions: &options,
	}
}

// runFakeQuery sends one frontend-shaped query through processQuery, batchRequest and processBatchtoFrames.
func runFakeQuery(t *testing.T, d *Datasource, query map[string]interface{}) backend.DataResponse {
	t.Helper()
	raw, err := json.Marshal(query)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	processed := d.processQuery([]backend.DataQuery{{
		RefID:         "A",
		JSON:          raw,
		MaxDataPoints: 100,
		Interval:      time.Minute,
		TimeRange:     backend.TimeRange{From: now.Add(-time.Hour), To: now},
	}}, "uid")
	response := d.processBatchtoFrames(d.batchRequest(t.Context(), processed))
	return response.Responses["A"]
}

func fakeFrameNames(r backend.DataResponse) []string {
	names := make([]string, 0, len(r.Frames))
	for _, frame := range r.Frames {
		names = append(names, frame.Fields[1].Name)
	}
	return names
}
