package plugin

import (
	"context"
	"net"
	"net/http"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/genproto/pluginv2"
	"github.com/prometheus/client_golang/prometheus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// With "Forward OAuth Identity" or "Allowed cookies", Grafana sends the user's Authorization and Cookie headers with
// each request to the plugin; the SDK middleware adds them to the outgoing requests of the datasource HTTP client,
// but only when the client is created with ForwardHTTPHeaders. Before, PI Web API never received them, and answered
// 401 to queries, resource calls (editor dropdowns) and the health check (Save & test).
//
// The test runs the plugin behind the SDK's gRPC server with its default middlewares, as Grafana runs it.
func TestForwardHTTPHeaders(t *testing.T) {
	const authorization = "Bearer userA"
	api := &fakeAnnotationAPI{databaseWebID: fakeDatabaseWebID, eventFrames: pumpTrips(), authorization: authorization}
	server := api.start(t)

	settings := &pluginv2.DataSourceInstanceSettings{
		Uid: "pi", Name: "PI", Url: server.URL + "/piwebapi",
		JsonData: []byte(`{"oauthPassThru":true,"keepCookies":["sess"]}`), LastUpdatedMS: time.Now().UnixMilli(),
	}
	instance, err := NewPIWebAPIDatasource(context.Background(), backend.DataSourceInstanceSettings{
		UID: settings.Uid, Name: settings.Name, URL: settings.Url, JSONData: settings.JsonData,
	})
	if err != nil {
		t.Fatal(err)
	}
	d := instance.(*Datasource)
	t.Cleanup(d.Dispose)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	address := listener.Addr().String()
	_ = listener.Close()
	// the SDK metrics middleware registers its metrics: use a new registry so the test can run more than once
	registerer := prometheus.DefaultRegisterer
	prometheus.DefaultRegisterer = prometheus.NewRegistry()
	t.Cleanup(func() { prometheus.DefaultRegisterer = registerer })
	grpcServer, err := backend.TestStandaloneServe(backend.ServeOpts{
		QueryDataHandler: d, CallResourceHandler: d, CheckHealthHandler: d,
	}, address)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(grpcServer.Stop)
	conn, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = conn.Close() })

	pluginContext := &pluginv2.PluginContext{OrgId: 1, PluginId: "gridprotectionalliance-osisoftpi-datasource",
		DataSourceInstanceSettings: settings}
	headers := map[string]string{"Authorization": authorization, "Cookie": "sess=1"}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	checkForwarded := func(t *testing.T, path string) {
		t.Helper()
		received := api.receivedHeaders()
		if len(received) == 0 {
			t.Fatalf("PI Web API received no request for %s", path)
		}
		last := received[len(received)-1]
		if last.Get("Authorization") != authorization || last.Get("Cookie") != "sess=1" {
			t.Errorf("%s: PI Web API received Authorization=%q Cookie=%q", path, last.Get("Authorization"), last.Get("Cookie"))
		}
	}

	t.Run("QueryData", func(t *testing.T) {
		query := annotationQuery("A", fakeDatabaseWebID, map[string]interface{}{"enable": true, "name": "Duration"})
		response, err := pluginv2.NewDataClient(conn).QueryData(ctx, &pluginv2.QueryDataRequest{
			PluginContext: pluginContext, Headers: headers,
			Queries: []*pluginv2.DataQuery{{RefId: "A", QueryType: "Annotation", Json: query.JSON,
				TimeRange: &pluginv2.TimeRange{FromEpochMS: query.TimeRange.From.UnixMilli(), ToEpochMS: query.TimeRange.To.UnixMilli()}}},
		})
		if err != nil {
			t.Fatal(err)
		}
		if r := response.Responses["A"]; r.Error != "" || len(r.Frames) != 1 {
			t.Errorf("annotation query: error %q, %d frames", r.Error, len(r.Frames))
		}
		checkForwarded(t, "QueryData")
	})

	t.Run("CallResource", func(t *testing.T) {
		stream, err := pluginv2.NewResourceClient(conn).CallResource(ctx, &pluginv2.CallResourceRequest{
			PluginContext: pluginContext, Path: "assetservers", Method: http.MethodGet, Url: "assetservers",
			Headers: map[string]*pluginv2.StringList{
				"Authorization": {Values: []string{authorization}}, "Cookie": {Values: []string{"sess=1"}}},
		})
		if err != nil {
			t.Fatal(err)
		}
		response, err := stream.Recv()
		if err != nil {
			t.Fatal(err)
		}
		if response.Code != http.StatusOK {
			t.Errorf("resource status = %d", response.Code)
		}
		checkForwarded(t, "CallResource")
	})

	t.Run("CheckHealth", func(t *testing.T) {
		result, err := pluginv2.NewDiagnosticsClient(conn).CheckHealth(ctx, &pluginv2.CheckHealthRequest{
			PluginContext: pluginContext, Headers: headers,
		})
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != pluginv2.CheckHealthResponse_OK {
			t.Errorf("health check: %v %q", result.Status, result.Message)
		}
		checkForwarded(t, "CheckHealth")
	})
}
