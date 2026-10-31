package plugin

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// The frontend URL-encodes the names it sends through the resource proxy; they reach PI Web API unchanged.
func TestCallResourceForwardsEncodedNames(t *testing.T) {
	var got struct{ path, nameFilter string }
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got.path, got.nameFilter = r.URL.Query().Get("path"), r.URL.Query().Get("nameFilter")
		_, _ = w.Write([]byte(`{"Items":[]}`))
	}))
	t.Cleanup(server.Close)
	d := newFakeDatasource(server.URL, PIWebAPIDataSourceJsonData{})

	var status int
	err := d.CallResource(context.Background(), &backend.CallResourceRequest{
		Method: http.MethodGet,
		URL:    "elements?path=%5C%5CAF%5CEsta%C3%A7%C3%A3o&nameFilter=Bomba%20(N%C2%BA%201)%7CPress%C3%A3o",
	}, backend.CallResourceResponseSenderFunc(func(r *backend.CallResourceResponse) error {
		status = r.Status
		return nil
	}))
	if err != nil || status != http.StatusOK {
		t.Fatalf("status %d, error %v", status, err)
	}
	if got.path != `\\AF\Estação` || got.nameFilter != "Bomba (Nº 1)|Pressão" {
		t.Errorf("PI Web API received path=%q nameFilter=%q", got.path, got.nameFilter)
	}
}
