package plugin

import (
	"sync"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// newTestDatasourceWithWebID returns a Datasource with a pre-populated WebID cache entry
// for the given webID and PI point type string (e.g. "Float32", "Int32", "Digital").
func newTestDatasourceWithWebID(webID, pointType string) *Datasource {
	ds := &Datasource{
		datasourceMutex:           &sync.Mutex{},
		websocketConnectionsMutex: &sync.Mutex{},
		channelConstruct:          make(map[string]StreamChannelConstruct),
		websocketConnections:      make(map[string]*websocket.Conn),
		senderChannels:            make(map[string]map[*backend.StreamSender]chan StreamData),
		webIDCache:                newWebIDCache(12),
		dataSourceOptions:         &PIWebAPIDataSourceJsonData{},
	}

	// Directly seed the WebID cache so the datasource methods return deterministic values.
	entry := WebIDCacheEntry{
		Path:         `PISERVER\TestTag`,
		WebID:        webID,
		Type:         getValueType(pointType),
		DigitalState: pointType == "Digital",
		PointType:    pointType,
		Units:        "rpm",
		Description:  "Test tag",
		ExpTime:      time.Now().Add(12 * time.Hour),
	}
	ds.webIDCache.webIDCache[entry.Path] = entry
	ds.webIDCache.webIDPaths[webID] = entry.Path

	return ds
}

// makeTestQuery returns a minimal PiProcessedQuery for the given webID.
func makeTestQuery(webID string) *PiProcessedQuery {
	nodata := "Null"
	return &PiProcessedQuery{
		WebID:          webID,
		Label:          "TestTag",
		FullTargetPath: `PISERVER\TestTag`,
		IsPIPoint:      true,
		Nodata:         &nodata,
		RefID:          "A",
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – happy path
// ---------------------------------------------------------------------------

func TestConvertStreamItemsToFrame_Float64(t *testing.T) {
	webID := "webid-float"
	ds := newTestDatasourceWithWebID(webID, "Float32")
	query := makeTestQuery(webID)

	ts := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	items := []PiBatchContentItem{
		{Timestamp: ts, Value: float64(3.14), Good: true},
		{Timestamp: ts.Add(time.Second), Value: float64(2.72), Good: true},
	}

	frame := convertStreamItemsToFrame(query, StreamData{Items: items}, buildStreamFrameCache(ds, query))
	if frame == nil {
		t.Fatal("expected non-nil frame")
	}
	if len(frame.Fields) != 2 {
		t.Fatalf("expected 2 fields, got %d", len(frame.Fields))
	}

	timeField := frame.Fields[0]
	valueField := frame.Fields[1]

	if timeField.Name != data.TimeSeriesTimeFieldName {
		t.Errorf("time field name: got %q, want %q", timeField.Name, data.TimeSeriesTimeFieldName)
	}
	if timeField.Len() != 2 {
		t.Errorf("time field length: got %d, want 2", timeField.Len())
	}
	if valueField.Len() != 2 {
		t.Errorf("value field length: got %d, want 2", valueField.Len())
	}

	// Values must be non-nil pointers to float64.
	v0, ok := frame.Fields[1].ConcreteAt(0)
	if !ok {
		t.Fatal("expected non-nil value at index 0")
	}
	f0, ok := v0.(float64)
	if !ok {
		t.Fatalf("expected float64 value, got %T", v0)
	}
	if f0 < 3.139 || f0 > 3.141 {
		t.Errorf("value[0]: got %v, want ~3.14", f0)
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – empty items
// ---------------------------------------------------------------------------

func TestConvertStreamItemsToFrame_EmptyItems(t *testing.T) {
	webID := "webid-empty"
	ds := newTestDatasourceWithWebID(webID, "Float32")
	query := makeTestQuery(webID)

	frame := convertStreamItemsToFrame(query, StreamData{Items: []PiBatchContentItem{}}, buildStreamFrameCache(ds, query))
	if frame == nil {
		t.Fatal("expected non-nil frame")
	}
	// An empty set of items produces a frame with 2 fields but zero rows.
	if len(frame.Fields) != 2 {
		t.Fatalf("expected 2 fields, got %d", len(frame.Fields))
	}
	if frame.Fields[0].Len() != 0 {
		t.Errorf("expected 0 rows, got %d", frame.Fields[0].Len())
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – nil value (nodata=Null → nullable pointer)
// ---------------------------------------------------------------------------

func TestConvertStreamItemsToFrame_NilValue(t *testing.T) {
	webID := "webid-nil"
	ds := newTestDatasourceWithWebID(webID, "Float32")
	query := makeTestQuery(webID)

	ts := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	items := []PiBatchContentItem{
		{Timestamp: ts, Value: nil, Good: false},
	}

	frame := convertStreamItemsToFrame(query, StreamData{Items: items}, buildStreamFrameCache(ds, query))
	if frame.Fields[0].Len() != 1 {
		t.Fatalf("expected 1 row (timestamp retained), got %d", frame.Fields[0].Len())
	}
	// nodata=Null means the value slot exists but holds a nil pointer.
	_, ok := frame.Fields[1].ConcreteAt(0)
	if ok {
		t.Error("expected nil (bad) value at index 0 to produce ok=false from ConcreteAt")
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – nodata=Drop
// ---------------------------------------------------------------------------

func TestConvertStreamItemsToFrame_NodataDrop(t *testing.T) {
	webID := "webid-drop"
	ds := newTestDatasourceWithWebID(webID, "Float32")

	nodata := "Drop"
	query := &PiProcessedQuery{
		WebID:          webID,
		Label:          "TestTag",
		FullTargetPath: `PISERVER\TestTag`,
		IsPIPoint:      true,
		Nodata:         &nodata,
		RefID:          "A",
	}

	ts := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	items := []PiBatchContentItem{
		{Timestamp: ts, Value: float64(1.0), Good: true},
		{Timestamp: ts.Add(time.Second), Value: nil, Good: false}, // dropped
		{Timestamp: ts.Add(2 * time.Second), Value: float64(3.0), Good: true},
	}

	frame := convertStreamItemsToFrame(query, StreamData{Items: items}, buildStreamFrameCache(ds, query))
	// The nil/bad value is dropped, so only 2 rows remain.
	if frame.Fields[0].Len() != 2 {
		t.Errorf("expected 2 rows after drop, got %d", frame.Fields[0].Len())
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – nodata=Previous
// ---------------------------------------------------------------------------

func TestConvertStreamItemsToFrame_NodataPrevious(t *testing.T) {
	webID := "webid-prev"
	ds := newTestDatasourceWithWebID(webID, "Float32")

	nodata := "Previous"
	query := &PiProcessedQuery{
		WebID:          webID,
		Label:          "TestTag",
		FullTargetPath: `PISERVER\TestTag`,
		IsPIPoint:      true,
		Nodata:         &nodata,
		RefID:          "A",
	}

	ts := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	items := []PiBatchContentItem{
		{Timestamp: ts, Value: float64(7.0), Good: true},
		{Timestamp: ts.Add(time.Second), Value: nil, Good: false}, // replaced by previous
	}

	frame := convertStreamItemsToFrame(query, StreamData{Items: items}, buildStreamFrameCache(ds, query))
	if frame.Fields[0].Len() != 2 {
		t.Errorf("expected 2 rows, got %d", frame.Fields[0].Len())
	}

	// Both values must be non-nil; second should equal the first (previous).
	v0, ok0 := frame.Fields[1].ConcreteAt(0)
	v1, ok1 := frame.Fields[1].ConcreteAt(1)
	if !ok0 || !ok1 {
		t.Fatal("expected non-nil values for both rows with nodata=Previous")
	}
	if v0 != v1 {
		t.Errorf("nodata=Previous: value[1]=%v should equal value[0]=%v", v1, v0)
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – digital state
// ---------------------------------------------------------------------------

func TestConvertStreamItemsToFrame_DigitalState(t *testing.T) {
	webID := "webid-digital"
	ds := newTestDatasourceWithWebID(webID, "Digital")

	nodata := "Null"
	query := &PiProcessedQuery{
		WebID:          webID,
		Label:          "TestTag",
		FullTargetPath: `PISERVER\TestTag`,
		IsPIPoint:      true,
		Nodata:         &nodata,
		DigitalStates:  true,
		RefID:          "A",
	}

	ts := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	// PI Web API encodes digital state values as JSON objects.
	items := []PiBatchContentItem{
		{
			Timestamp: ts,
			Value:     map[string]interface{}{"IsSystem": false, "Name": "Active", "Value": float64(1)},
			Good:      true,
		},
		{
			Timestamp: ts.Add(time.Second),
			Value:     map[string]interface{}{"IsSystem": false, "Name": "Inactive", "Value": float64(0)},
			Good:      true,
		},
	}

	frame := convertStreamItemsToFrame(query, StreamData{Items: items}, buildStreamFrameCache(ds, query))
	if len(frame.Fields) != 2 {
		t.Fatalf("expected 2 fields, got %d", len(frame.Fields))
	}
	if frame.Fields[0].Len() != 2 {
		t.Fatalf("expected 2 rows, got %d", frame.Fields[0].Len())
	}

	// Value field for digital states is a []string of state names.
	v0, _ := frame.Fields[1].ConcreteAt(0)
	name, ok := v0.(string)
	if !ok {
		t.Fatalf("expected string value for digital state, got %T", v0)
	}
	if name != "Active" {
		t.Errorf("digital state name: got %q, want %q", name, "Active")
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – frame metadata
// ---------------------------------------------------------------------------

func TestConvertStreamItemsToFrame_MetaNotNil(t *testing.T) {
	webID := "webid-meta"
	ds := newTestDatasourceWithWebID(webID, "Float32")
	query := makeTestQuery(webID)

	frame := convertStreamItemsToFrame(query, StreamData{Items: []PiBatchContentItem{}}, buildStreamFrameCache(ds, query))
	if frame.Meta == nil {
		t.Error("frame.Meta must not be nil (Grafana requires it for streaming frames)")
	}
}

// ---------------------------------------------------------------------------
// convertStreamItemsToFrame – <Anything> value type
// ---------------------------------------------------------------------------

// An attribute of type <Anything> has no type in the WebID cache: the stream takes it from the values, as the query
// responses do (issue GridProtectionAlliance/osisoftpi-grafana#173).
func TestConvertStreamItemsToFrame_AnythingType(t *testing.T) {
	webID := "webid-anything"
	ds := newTestDatasourceWithWebID(webID, "")
	query := makeTestQuery(webID)

	ts := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	frame := convertStreamItemsToFrame(query, StreamData{Items: []PiBatchContentItem{{Timestamp: ts, Value: float64(2), Good: true}}},
		buildStreamFrameCache(ds, query))
	if v, ok := frame.Fields[1].ConcreteAt(0); !ok || v != float64(2) {
		t.Errorf("value = %v (%v), want 2", v, ok)
	}
}
