package plugin

import (
	"reflect"
	"strings"
	"testing"
)

// One target of a query failing (e.g. an element of a multi-value variable without the attribute) must not
// drop the series of the other targets, whatever their order.
func TestFailingTargetDoesNotDropOtherSeries(t *testing.T) {
	fake := &fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\U-100\P-101|Flow`:  {},
		`\\AF\DB\U-100\LV-101|Flow`: {},
	}}
	server := fake.start(t)

	tests := []struct {
		name      string
		elements  string
		hideError bool
	}{
		{name: "failing target first", elements: "{LIC-101,P-101,LV-101}"},
		{name: "failing target in the middle", elements: "{P-101,LIC-101,LV-101}"},
		{name: "failing target last", elements: "{P-101,LV-101,LIC-101}"},
		{name: "failing target first, errors hidden", elements: "{LIC-101,P-101,LV-101}", hideError: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
			r := runFakeQuery(t, d, map[string]interface{}{
				"target":    `AF\DB\U-100\` + tt.elements + ";Flow",
				"hideError": tt.hideError,
			})

			names := fakeFrameNames(r)
			want := []string{"P-101|P-101|Flow", "LV-101|LV-101|Flow"}
			if !reflect.DeepEqual(names, want) {
				t.Errorf("frames = %q, want %q", names, want)
			}
			if tt.hideError {
				if r.Error != nil {
					t.Errorf("error should be hidden, got %v", r.Error)
				}
			} else if r.Error == nil || !strings.Contains(r.Error.Error(), "LIC-101") {
				t.Errorf("expected the error of the failing target, got %v", r.Error)
			}
		})
	}
}
