package plugin

import (
	"encoding/json"
	"testing"
	"time"
)

// Calculation responses list the values directly (Items[].Timestamp/Value), whatever the type of the first value:
// text results and failed calculations ("Calc Failed" system state) must keep their timestamps.
func TestCalculationResponseItems(t *testing.T) {
	ts := "2026-09-29T06:44:11.05973Z"
	want, _ := time.Parse(time.RFC3339Nano, ts)
	tests := []struct {
		name      string
		value     string
		wantValue interface{}
		wantGood  bool
	}{
		{name: "number", value: `50.372`, wantValue: 50.372, wantGood: true},
		{name: "text", value: `"Normal operation"`, wantValue: "Normal operation", wantGood: true},
		{name: "failed calculation", value: `{"Name":"Calc Failed","Value":249,"IsSystem":true}`, wantGood: false},
		{name: "boolean", value: `true`, wantValue: true, wantGood: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			raw := `{"Status":200,"Headers":{},"Content":{"Items":[{"Timestamp":"` + ts + `","Value":` + tt.value +
				`,"UnitsAbbreviation":"","Good":` + map[bool]string{true: "true", false: "false"}[tt.wantGood] +
				`,"Questionable":false,"Substituted":false,"Annotated":false}],"UnitsAbbreviation":"","Links":{}}}`
			var r PIBatchResponse
			if err := json.Unmarshal([]byte(raw), &r); err != nil {
				t.Fatal(err)
			}
			items := *r.Content.(PiBatchData).getItems("")
			if len(items) != 1 {
				t.Fatalf("got %d items, want 1", len(items))
			}
			if !items[0].Timestamp.Equal(want) {
				t.Errorf("timestamp = %v, want %v", items[0].Timestamp, want)
			}
			if items[0].Good != tt.wantGood {
				t.Errorf("good = %v, want %v", items[0].Good, tt.wantGood)
			}
			if tt.wantValue != nil && items[0].Value != tt.wantValue {
				t.Errorf("value = %#v, want %#v", items[0].Value, tt.wantValue)
			}
		})
	}
}

// Last values of stream sets (Items[].Value is a value object) are still read from the nested value.
func TestStreamSetValueResponseItems(t *testing.T) {
	raw := `{"Status":200,"Headers":{},"Content":{"Items":[{"WebId":"W1","Name":"Operator Note","Path":"p","Links":{},
		"Value":{"Timestamp":"1970-01-01T00:00:00Z","Value":"Normal operation","UnitsAbbreviation":"","Good":true}}],"Links":{}}}`
	var r PIBatchResponse
	if err := json.Unmarshal([]byte(raw), &r); err != nil {
		t.Fatal(err)
	}
	items := *r.Content.(PiBatchData).getItems("")
	if len(items) != 1 || items[0].Value != "Normal operation" || items[0].Timestamp.Unix() != 0 {
		t.Errorf("unexpected items %+v", items)
	}
}
