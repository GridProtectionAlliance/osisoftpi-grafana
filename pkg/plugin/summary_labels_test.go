package plugin

import "testing"

// With the new data format, a summary series has a clean "type" label and a "summaryType" label; the summary type
// used to be pasted into the "type" label (`Double" summaryType="Average`).
func TestSummaryLabelsNewFormat(t *testing.T) {
	af := &PiProcessedQuery{Label: "Level", FullTargetPath: `\\AF\DB\U-100\T-101|Level`, TargetPath: `\\AF\DB\U-100\T-101`}
	point := &PiProcessedQuery{Label: "SINUSOID", FullTargetPath: `PISRV\SINUSOID`, IsPIPoint: true}
	for _, q := range []*PiProcessedQuery{af, point} {
		labels := getDataLabels(true, q, "Double", "", "%", "Average")
		if labels["type"] != "Double" || labels["summaryType"] != "Average" {
			t.Errorf("%s: type=%q summaryType=%q, want Double and Average", q.Label, labels["type"], labels["summaryType"])
		}
		if _, ok := getDataLabels(true, q, "Double", "", "%", "")["summaryType"]; ok {
			t.Errorf("%s: summaryType label without a summary", q.Label)
		}
	}
	// the legacy format keeps the summary type in the name
	if name := getDataLabels(false, point, "Double", "", "", "Average")["name"]; name != "SINUSOID[Average]" {
		t.Errorf("legacy name = %q", name)
	}
}
