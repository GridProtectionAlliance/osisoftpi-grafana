package plugin

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// fakeDataAPI is fakePIWebAPI with fixed data responses: the WebID lookups are resolved by fakePIWebAPI, and the
// data request of an attribute listed in responses (calculation, summary, error) returns that sub-response.
type fakeDataAPI struct {
	fakePIWebAPI
	responses map[string]map[string]interface{} // full path -> {"Status": ..., "Content": ...}
}

func (f *fakeDataAPI) start(t *testing.T) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
				if ready {
					responses[key] = f.resolveData(req, responses)
				}
			}
		}
		w.WriteHeader(http.StatusMultiStatus)
		_ = json.NewEncoder(w).Encode(responses)
	}))
	t.Cleanup(server.Close)
	return server
}

func (f *fakeDataAPI) resolveData(req BatchSubRequest, done map[string]map[string]interface{}) map[string]interface{} {
	resource := req.Resource
	for _, parent := range req.ParentIds {
		if content, ok := done[parent]["Content"].(map[string]interface{}); ok {
			resource = strings.ReplaceAll(resource, "{0}", content["WebId"].(string))
		}
	}
	if u, err := url.Parse(resource); err == nil {
		if webID := u.Query().Get("webId"); webID != "" {
			path, _ := base64.RawURLEncoding.DecodeString(strings.TrimPrefix(webID, "W"))
			if response, ok := f.responses[string(path)]; ok {
				return response
			}
		}
	}
	return f.resolve(req, done)
}

// runFakeQueries sends several frontend-shaped queries in one request, as a panel with several queries does.
func runFakeQueries(t *testing.T, d *Datasource, queries map[string]map[string]interface{}) map[string]backend.DataResponse {
	t.Helper()
	now := time.Now()
	dataQueries := make([]backend.DataQuery, 0, len(queries))
	for refID, query := range queries {
		raw, err := json.Marshal(query)
		if err != nil {
			t.Fatal(err)
		}
		dataQueries = append(dataQueries, backend.DataQuery{RefID: refID, JSON: raw, MaxDataPoints: 100,
			Interval: time.Minute, TimeRange: backend.TimeRange{From: now.Add(-time.Hour), To: now}})
	}
	var response *backend.QueryDataResponse
	func() {
		defer func() {
			if p := recover(); p != nil {
				t.Fatalf("query panicked: %v", p)
			}
		}()
		response = d.processBatchtoFrames(d.batchRequest(t.Context(), d.processQuery(dataQueries, "uid")))
	}()
	return response.Responses
}

func calcItem(i int, value interface{}, good bool) map[string]interface{} {
	return map[string]interface{}{"Timestamp": time.Date(2026, 9, 1, 0, i, 0, 0, time.UTC).Format(time.RFC3339),
		"Value": value, "UnitsAbbreviation": "", "Good": good, "Questionable": false, "Substituted": false, "Annotated": false}
}

func okContent(content map[string]interface{}) map[string]interface{} {
	return map[string]interface{}{"Status": http.StatusOK, "Headers": map[string]interface{}{}, "Content": content}
}

// A calculation without values in the time range returns {"Items":[]}: the query has no frame and no error, and
// the other queries of the request are not affected (the whole request used to fail on an index out of range).
func TestCalculationWithoutValues(t *testing.T) {
	fake := &fakeDataAPI{
		fakePIWebAPI: fakePIWebAPI{attributes: map[string]fakeAttribute{
			`\\AF\DB\T-101|Level`:  {},
			`\\AF\DB\T-101|Volume`: {},
		}},
		responses: map[string]map[string]interface{}{
			`\\AF\DB\T-101|Level`: okContent(map[string]interface{}{"Items": []interface{}{}, "UnitsAbbreviation": "", "Links": map[string]interface{}{}}),
		},
	}
	server := fake.start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
	responses := runFakeQueries(t, d, map[string]map[string]interface{}{
		"A": {"target": `AF\DB\T-101;Level`, "expression": "'Level'*2"},
		"B": {"target": `AF\DB\T-101;Volume`},
	})
	if a := responses["A"]; a.Error != nil || len(a.Frames) != 0 {
		t.Errorf("A: error %v, %d frames; want no error and no frame", a.Error, len(a.Frames))
	}
	if b := responses["B"]; b.Error != nil || len(b.Frames) != 1 || b.Frames[0].Fields[1].Len() != 2 {
		t.Errorf("B: error %v, %d frames; want 1 frame with 2 values", b.Error, len(b.Frames))
	}
}

// The response models do not index an empty Items list.
func TestEmptyResponseModels(t *testing.T) {
	models := map[string]PiBatchData{
		"float":     PiBatchDataWithFloatItem{},
		"single":    PiBatchDataWithSingleItem{},
		"sub items": PiBatchDataWithSubItems{},
		"summary":   PiBatchDataSummaryItems{},
	}
	for name, model := range models {
		t.Run(name, func(t *testing.T) {
			defer func() {
				if p := recover(); p != nil {
					t.Fatalf("panicked: %v", p)
				}
			}()
			if units := model.getUnits("Average"); units != "" {
				t.Errorf("units = %q", units)
			}
			if items := *model.getItems(""); len(items) != 0 {
				t.Errorf("%d items", len(items))
			}
			if types := *model.getSummaryTypes(); len(types) != 0 {
				t.Errorf("summary types = %q, want none (no frame)", types)
			}
		})
	}
}

// A plain error message as the Content of a failed sub-response is reported to the user.
func TestStringErrorContent(t *testing.T) {
	var r PIBatchResponse
	if err := json.Unmarshal([]byte(`{"Status":500,"Headers":{},"Content":"Internal server error: something"}`), &r); err != nil {
		t.Fatal(err)
	}
	content, ok := r.Content.(*PiBatchDataError)
	if !ok || content.Error == nil || !reflect.DeepEqual(content.Error.Errors, []string{"Internal server error: something"}) {
		t.Fatalf("content = %#v", r.Content)
	}

	fake := &fakeDataAPI{
		fakePIWebAPI: fakePIWebAPI{attributes: map[string]fakeAttribute{`\\AF\DB\T-101|Level`: {}}},
		responses: map[string]map[string]interface{}{
			`\\AF\DB\T-101|Level`: {"Status": http.StatusInternalServerError, "Content": "Internal server error: something"},
		},
	}
	server := fake.start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
	a := runFakeQueries(t, d, map[string]map[string]interface{}{"A": {"target": `AF\DB\T-101;Level`}})["A"]
	if a.Error == nil || !strings.Contains(a.Error.Error(), "Internal server error: something") {
		t.Errorf("error = %v, want the PI Web API message", a.Error)
	}
}

func summaryContent(types ...string) map[string]interface{} {
	items := []interface{}{}
	for i, summaryType := range types {
		items = append(items, map[string]interface{}{"Type": summaryType, "Value": calcItem(i, 100.5+float64(i), true)})
	}
	return map[string]interface{}{"Items": items, "Links": map[string]interface{}{}}
}

// calculation/summary lists {Type, Value} items: each summary type is its own series with all its intervals,
// labelled like the stream set summaries.
func TestCalculationSummary(t *testing.T) {
	fake := &fakeDataAPI{
		fakePIWebAPI: fakePIWebAPI{attributes: map[string]fakeAttribute{`\\AF\DB\T-101|Level`: {}}},
		responses: map[string]map[string]interface{}{
			`\\AF\DB\T-101|Level`: okContent(summaryContent("Average", "Average", "Average", "Maximum", "Maximum", "Maximum")),
		},
	}
	server := fake.start(t)
	enable, basis := true, "TimeWeighted"
	summary := map[string]interface{}{"enable": &enable, "basis": &basis, "duration": "10m", "types": []interface{}{
		map[string]interface{}{"label": "Average", "value": map[string]interface{}{"value": "Average"}},
		map[string]interface{}{"label": "Maximum", "value": map[string]interface{}{"value": "Maximum"}},
	}}

	for _, newFormat := range []bool{false, true} {
		d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{NewFormat: &newFormat})
		a := runFakeQueries(t, d, map[string]map[string]interface{}{
			"A": {"target": `AF\DB\T-101;Level`, "expression": "'Level'*2", "summary": summary},
		})["A"]
		if a.Error != nil || len(a.Frames) != 2 {
			t.Fatalf("new format %v: error %v, %d frames; want 2 frames", newFormat, a.Error, len(a.Frames))
		}
		for i, summaryType := range []string{"Average", "Maximum"} {
			field := a.Frames[i].Fields[1]
			if want := []interface{}{100.5 + float64(3*i), 101.5 + float64(3*i), 102.5 + float64(3*i)}; !reflect.DeepEqual(fieldValues(field), want) {
				t.Errorf("%s values = %v, want %v", summaryType, fieldValues(field), want)
			}
			if newFormat && field.Labels["summaryType"] != summaryType {
				t.Errorf("summaryType label = %q, want %q", field.Labels["summaryType"], summaryType)
			}
			if !newFormat && field.Name != "T-101|Level["+summaryType+"]" {
				t.Errorf("name = %q, want %q", field.Name, "T-101|Level["+summaryType+"]")
			}
		}
	}
}

// The type of a calculation result comes from its values, not from the point or attribute it runs on.
func TestCalculationValueType(t *testing.T) {
	running := map[string]interface{}{"Name": "Running", "Value": 1, "IsSystem": false}
	calcFailed := map[string]interface{}{"Name": "Calc Failed", "Value": 249, "IsSystem": true}
	values := func(values ...interface{}) map[string]interface{} {
		items := []interface{}{}
		for i, value := range values {
			_, isState := value.(map[string]interface{})
			items = append(items, calcItem(i, value, !isState || value.(map[string]interface{})["IsSystem"] != true))
		}
		return okContent(map[string]interface{}{"Items": items, "UnitsAbbreviation": "", "Links": map[string]interface{}{}})
	}
	fake := &fakeDataAPI{
		fakePIWebAPI: fakePIWebAPI{attributes: map[string]fakeAttribute{
			`\\AF\DB\T-101|Text`:    {valueType: strPtr("Double")},
			`\\AF\DB\T-101|Counter`: {valueType: strPtr("Int32")},
			`\\AF\DB\T-101|Status`:  {valueType: strPtr("Digital")},
			`\\AF\DB\T-101|State`:   {valueType: strPtr("Double")},
			`\\AF\DB\T-101|Bool`:    {valueType: strPtr("Int32")},
		}},
		responses: map[string]map[string]interface{}{
			`\\AF\DB\T-101|Text`:    values("Low", "High", calcFailed),
			`\\AF\DB\T-101|Counter`: values(12.5, 0.4),
			`\\AF\DB\T-101|Status`:  values(16.384, 22.75),
			`\\AF\DB\T-101|State`:   values(running),
			`\\AF\DB\T-101|Bool`:    values(true, false),
		},
	}
	server := fake.start(t)

	tests := []struct {
		attribute     string
		digitalStates bool
		wantType      data.FieldType
		want          []interface{}
	}{
		{attribute: "Text", wantType: data.FieldTypeNullableString, want: []interface{}{"Low", "High", nil}},
		{attribute: "Counter", wantType: data.FieldTypeNullableFloat64, want: []interface{}{12.5, 0.4}},
		{attribute: "Status", digitalStates: true, wantType: data.FieldTypeNullableFloat64, want: []interface{}{16.384, 22.75}},
		{attribute: "State", digitalStates: true, wantType: data.FieldTypeNullableString, want: []interface{}{"Running"}},
		{attribute: "Bool", wantType: data.FieldTypeNullableBool, want: []interface{}{true, false}},
	}
	for _, tt := range tests {
		t.Run(tt.attribute, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
			a := runFakeQueries(t, d, map[string]map[string]interface{}{"A": {
				"target": `AF\DB\T-101;` + tt.attribute, "expression": "'.'", "nodata": "Null",
				"digitalStates": map[string]interface{}{"enable": tt.digitalStates},
			}})["A"]
			if a.Error != nil || len(a.Frames) != 1 {
				t.Fatalf("query failed: %v (%d frames)", a.Error, len(a.Frames))
			}
			field := a.Frames[0].Fields[1]
			if field.Type() != tt.wantType {
				t.Errorf("field type = %s, want %s", field.Type(), tt.wantType)
			}
			if got := fieldValues(field); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("values = %#v, want %#v", got, tt.want)
			}
		})
	}
}

// Summary values are numbers whatever the type of the stream: they are not converted to the stream's type.
func TestSummaryValueType(t *testing.T) {
	summary := func(values ...float64) map[string]interface{} {
		items := []interface{}{}
		for i, value := range values {
			items = append(items, map[string]interface{}{"Type": "Average", "Value": calcItem(i, value, true)})
		}
		return okContent(map[string]interface{}{"Items": []interface{}{map[string]interface{}{
			"WebId": "W", "Name": "n", "Path": "p", "Links": map[string]interface{}{}, "Items": items}},
			"Links": map[string]interface{}{}})
	}
	fake := &fakeDataAPI{
		fakePIWebAPI: fakePIWebAPI{attributes: map[string]fakeAttribute{
			`\\AF\DB\E|Int32`:   {valueType: strPtr("Int32")},
			`\\AF\DB\E|Digital`: {valueType: strPtr("Digital")},
			`\\AF\DB\E|String`:  {valueType: strPtr("String")},
			`\\AF\DB\E|Time`:    {valueType: strPtr("DateTime")},
		}},
		responses: map[string]map[string]interface{}{
			`\\AF\DB\E|Int32`:   summary(5.5, 0.47),
			`\\AF\DB\E|Digital`: summary(60, 53),
			`\\AF\DB\E|String`:  summary(6, 4),
			`\\AF\DB\E|Time`:    summary(2, 1),
		},
	}
	server := fake.start(t)
	enable, basis := true, "TimeWeighted"
	tests := []struct {
		attribute string
		want      []interface{}
	}{
		{attribute: "Int32", want: []interface{}{5.5, 0.47}},
		{attribute: "Digital", want: []interface{}{60.0, 53.0}},
		{attribute: "String", want: []interface{}{6.0, 4.0}},
		{attribute: "Time", want: []interface{}{2.0, 1.0}},
	}
	for _, tt := range tests {
		t.Run(tt.attribute, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
			a := runFakeQueries(t, d, map[string]map[string]interface{}{"A": {
				"target": `AF\DB\E;` + tt.attribute, "nodata": "Null",
				"digitalStates": map[string]interface{}{"enable": true},
				"summary": map[string]interface{}{"enable": &enable, "basis": &basis, "duration": "10m", "types": []interface{}{
					map[string]interface{}{"label": "Average", "value": map[string]interface{}{"value": "Average"}}}},
			}})["A"]
			if a.Error != nil || len(a.Frames) != 1 {
				t.Fatalf("query failed: %v (%d frames)", a.Error, len(a.Frames))
			}
			field := a.Frames[0].Fields[1]
			if field.Type() != data.FieldTypeNullableFloat64 {
				t.Errorf("field type = %s, want %s", field.Type(), data.FieldTypeNullableFloat64)
			}
			if got := fieldValues(field); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("values = %#v, want %#v", got, tt.want)
			}
		})
	}
}
