package plugin

import (
	"net/url"
	"strings"
	"testing"
)

// queryParam parses a resource URI the way the PI Web API server does and returns one query parameter.
func queryParam(t *testing.T, uri string, name string) string {
	t.Helper()
	u, err := url.Parse("https://server/piwebapi/" + uri)
	if err != nil {
		t.Fatalf("invalid URI %q: %v", uri, err)
	}
	if u.Fragment != "" {
		t.Fatalf("URI %q has a fragment %q: part of the value was cut off", uri, u.Fragment)
	}
	return u.Query().Get(name)
}

func TestGetRequestWebIdEscapesPath(t *testing.T) {
	d := &Datasource{}
	tests := []struct {
		name      string
		path      string
		isPiPoint bool
		want      string
	}{
		{name: "hash in element name (issue 186)", path: `PIServer\AFName\Location\Machine#1|Level`, want: `\\PIServer\AFName\Location\Machine#1|Level`},
		{name: "reserved characters", path: `AF\DB\A&B + C 50%|Flow?`, want: `\\AF\DB\A&B + C 50%|Flow?`},
		{name: "accents", path: `AF\DB\Estação|Pressão`, want: `\\AF\DB\Estação|Pressão`},
		{name: "PI point", path: `PISERVER|Tag#1;x`, isPiPoint: true, want: `\\PISERVER\Tag#1\x`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uri := d.getRequestWebId(tt.path, tt.isPiPoint)
			if got := queryParam(t, uri, "path"); got != tt.want {
				t.Errorf("path = %q, want %q (uri %q)", got, tt.want, uri)
			}
			if !strings.Contains(uri, "selectedFields=WebId;") {
				t.Errorf("selectedFields changed: %q", uri)
			}
		})
	}
}

func TestExpressionIsEscaped(t *testing.T) {
	q := Query{}
	q.Pi.Expression = `'.'+10 & 'Tag#1'`
	uri := q.getQueryBaseURL()
	if got := queryParam(t, uri, "expression"); got != q.Pi.Expression {
		t.Errorf("expression = %q, want %q (uri %q)", got, q.Pi.Expression, uri)
	}
}

func TestAnnotationURLsAreEscaped(t *testing.T) {
	q := PiProcessedAnnotationQuery{
		Template:     EventFrameTemplate{Name: "Downtime #1 & Stops"},
		CategoryName: "A+B",
		NameFilter:   "Line 1*",
		Attributes:   []QueryProperties{{Value: QueryPropertiesValue{Value: "Reason #1"}}},
	}
	uri := q.getEventFrameQueryURL()
	if got := queryParam(t, uri, "templateName"); got != "Downtime #1 & Stops" {
		t.Errorf("templateName = %q (uri %q)", got, uri)
	}
	if got := queryParam(t, uri, "categoryName"); got != "A+B" {
		t.Errorf("categoryName = %q (uri %q)", got, uri)
	}
	if got := queryParam(t, uri, "nameFilter"); got != "Line 1*" {
		t.Errorf("nameFilter = %q (uri %q)", got, uri)
	}

	attributeURIs, err := q.getEventFrameAttributeQueryURL()
	if err != nil {
		t.Fatal(err)
	}
	if got := queryParam(t, attributeURIs[0], "nameFilter"); got != "Reason #1" {
		t.Errorf("attribute nameFilter = %q (uri %q)", got, attributeURIs[0])
	}
}
