package plugin

import (
	"net/http"
	"strings"
	"testing"
)

// A failing data request reports its own status, whether the WebID was looked up in the same batch or cached.
func TestDataErrorReportsDataStatus(t *testing.T) {
	server := (&fakePIWebAPI{attributes: map[string]fakeAttribute{
		`\\AF\DB\E|Level`: {dataStatus: http.StatusBadRequest},
	}}).start(t)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})
	query := map[string]interface{}{"target": `AF\DB\E;Level`}

	for _, run := range []string{"WebID looked up", "WebID cached"} {
		r := runFakeQuery(t, d, query)
		if r.Error == nil || !strings.HasPrefix(r.Error.Error(), "api error 400 - The requested time range is not valid.") {
			t.Errorf("%s: error = %v, want api error 400", run, r.Error)
		}
	}
}
