package plugin

import "testing"

func TestAllowedResourceURL(t *testing.T) {
	allowed := []struct {
		url  string
		want string
	}{
		// every request made by the frontend (src/datasource.ts), with and without the leading slash
		{"dataservers", "dataservers"},
		{"/dataservers?name=PISERVER", "dataservers?name=PISERVER"},
		{"dataservers/F1DS/points?maxCount=100&nameFilter=SIN%2A", "dataservers/F1DS/points?maxCount=100&nameFilter=SIN%2A"},
		{"assetservers", "assetservers"},
		{"//assetservers?path=%5C%5CAFSERVER", "assetservers?path=%5C%5CAFSERVER"},
		{"assetservers/F1RS/assetdatabases", "assetservers/F1RS/assetdatabases"},
		{"assetdatabases?path=%5C%5CAF%5CDB", "assetdatabases?path=%5C%5CAF%5CDB"},
		{"assetdatabases/F1RD/elements?selectedFields=Items.WebId%3BItems.Name", "assetdatabases/F1RD/elements?selectedFields=Items.WebId%3BItems.Name"},
		{"assetdatabases/F1RD/elementtemplates?selectedFields=Items.Name", "assetdatabases/F1RD/elementtemplates?selectedFields=Items.Name"},
		{"elements?path=%5C%5CAF%5CDB%5CMachine%231", "elements?path=%5C%5CAF%5CDB%5CMachine%231"},
		{"/elements/F1EM-_x/attributes?searchFullHierarchy=true", "elements/F1EM-_x/attributes?searchFullHierarchy=true"},
		{"elements/F1EM/elements", "elements/F1EM/elements"},
		{"points?path=%5C%5CPI%5CSINUSOID", "points?path=%5C%5CPI%5CSINUSOID"},
		{"attributes?path=%5C%5CAF%7CLevel", "attributes?path=%5C%5CAF%7CLevel"},
		// PI Web API paths are case-insensitive
		{"Elements/F1EM/Attributes", "Elements/F1EM/Attributes"},
	}
	for _, tt := range allowed {
		got, ok := allowedResourceURL(tt.url)
		if !ok || got != tt.want {
			t.Errorf("allowedResourceURL(%q) = %q, %v; want %q, true", tt.url, got, ok, tt.want)
		}
	}

	denied := []string{
		"",
		"/",
		"batch",
		"/batch",
		"system",
		"streams/F1AbE/value",
		"streamsets/value?webId=x",
		"elementsX",
		"elementsX/F1EM",
		"assetserversfoo",
		"xelements",
		"elements/../batch",
		"elements/./attributes",
		"elements/F1EM/..",
		"elements//attributes",
		`elements\..\batch`,
		"elements/%2e%2e/batch",
		"elements/F1EM#fragment",
		"?path=elements",
	}
	for _, url := range denied {
		if got, ok := allowedResourceURL(url); ok {
			t.Errorf("allowedResourceURL(%q) = %q, true; want denied", url, got)
		}
	}
}
