package plugin

import (
	"net/http"
	"strings"
	"testing"
)

// Errors of the batch request itself (authentication, server unreachable) must reach the panel instead of
// an empty "No data" response.
func TestBatchRequestErrorsAreReported(t *testing.T) {
	query := map[string]interface{}{"target": `AF\DB\U-100\T-101;Level`}

	t.Run("wrong credentials (401)", func(t *testing.T) {
		server := (&fakePIWebAPI{status: http.StatusUnauthorized}).start(t)
		r := runFakeQuery(t, newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{}), query)
		if r.Error == nil || !strings.Contains(r.Error.Error(), "401") {
			t.Errorf("expected an error mentioning 401, got %v", r.Error)
		}
		if len(r.Frames) != 0 {
			t.Errorf("expected no frames, got %d", len(r.Frames))
		}
	})

	t.Run("server unreachable", func(t *testing.T) {
		server := (&fakePIWebAPI{}).start(t)
		url := server.URL
		server.Close()
		r := runFakeQuery(t, newFakeDatasource(url, PIWebAPIDataSourceJsonData{}), query)
		if r.Error == nil || !strings.Contains(r.Error.Error(), "connection refused") {
			t.Errorf("expected an error mentioning the connection failure, got %v", r.Error)
		}
	})

	t.Run("errors hidden with Ignore API Error", func(t *testing.T) {
		server := (&fakePIWebAPI{status: http.StatusUnauthorized}).start(t)
		hidden := map[string]interface{}{"target": `AF\DB\U-100\T-101;Level`, "hideError": true}
		r := runFakeQuery(t, newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{}), hidden)
		if r.Error != nil {
			t.Errorf("error should be hidden, got %v", r.Error)
		}
	})
}
