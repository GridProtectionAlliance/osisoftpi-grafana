package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-co-op/gocron"
	"github.com/gorilla/websocket"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces- only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)

// _ backend.StreamHandler         = (*Datasource)(nil)
)

// NewDatasource creates a new PIWebAPI datasource instance.
func NewPIWebAPIDatasource(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var dataSourceOptions PIWebAPIDataSourceJsonData
	err := json.Unmarshal(settings.JSONData, &dataSourceOptions)
	if err != nil {
		panic(err)
	}

	opts, err := settings.HTTPClientOptions()
	if err != nil {
		return nil, fmt.Errorf("http client options: %w", err)
	}

	httpClient, err := httpclient.New(opts)
	if err != nil {
		return nil, fmt.Errorf("httpclient new: %w", err)
	}

	webIDCache := make(map[string]WebIDCacheEntry)

	scheduler := gocron.NewScheduler(time.UTC)
	scheduler.Every(5).Minute().Do(cleanWebIDCache, webIDCache)
	scheduler.StartAsync()

	ds := &Datasource{
		settings:                  settings,
		httpClient:                httpClient,
		webIDCache:                webIDCache,
		scheduler:                 scheduler,
		websocketConnectionsMutex: &sync.Mutex{},
		sendersByWebIDMutex:       &sync.Mutex{},
		websocketConnections:      make(map[string]*websocket.Conn),
		sendersByWebID:            make(map[string]map[*backend.StreamSender]bool),
		streamChannels:            make(map[string]chan []byte),
		dataSourceOptions:         &dataSourceOptions,
	}

	// Create a new query mux and assign it to the datasource.
	ds.queryMux = ds.newQueryMux()
	return ds, nil
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	d.httpClient.CloseIdleConnections()
}

// newQueryMux creates a new query mux used for routing queries to the correct handler.
func (d *Datasource) newQueryMux() *datasource.QueryTypeMux {
	mux := datasource.NewQueryTypeMux()

	// Register query handlers
	// QueryAnnotations is called by Grafana when a user creates an annotation query.
	mux.HandleFunc("Annotation", d.QueryAnnotations)

	// QueryData is called by Grafana when a user executes any other query type.
	mux.HandleFunc("", d.QueryTSData)

	return mux
}

// Main entry point for a query. Called by Grafana when a query is executed.
// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// Pass the query to the query muxer.
	return d.queryMux.QueryData(ctx, req)
}

// TODO: Add support for regex replace of frame names
// TODO: Missing functionality: Fix summaries
//
// QueryTSData is called by Grafana when a user executes a time series data query.
func (d *Datasource) QueryTSData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {

	//TODO: Remove this debug information
	jsonReq, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("error marshaling QueryDataRequest: %v", err)
	}

	backend.Logger.Info("QueryDataRequest: ", string(jsonReq))
	// end remove this debug information

	// backend.Logger.Info("Query Recieved. Processing...")
	processedPIWebAPIQueries := make(map[string][]PiProcessedQuery)
	datasourceUID := req.PluginContext.DataSourceInstanceSettings.UID

	// Process queries generic query objects and turn them into a suitable format for the PI Web API
	for _, q := range req.Queries {
		backend.Logger.Info("Processing Query", "RefID", q.RefID)
		processedPIWebAPIQueries[q.RefID] = d.processQuery(ctx, q, datasourceUID)
	}

	// Send the queries to the PI Web API
	//backend.Logger.Info("Sending Queries to PI Web API")
	processedQueries_temp := d.batchRequest(ctx, processedPIWebAPIQueries)

	// Convert the PI Web API response into Grafana frames
	backend.Logger.Info("Processing PI Web API Responses into data frames")
	response := d.processBatchtoFrames(processedQueries_temp)

	return response, nil
}

// QueryAnnotations recevies annotation queries from the frontend and returns dataframes that contain json raw messages containing the annotations.
func (d *Datasource) QueryAnnotations(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := &backend.QueryDataResponse{}
	response.Responses = make(map[string]backend.DataResponse)

	//TODO: Remove this temporary testing information
	var responses []AnnotationQueryResponse
	//fakeresponse := getFakeQueryResponse()
	//responses = append(responses, fakeresponse)

	backend.Logger.Info("Annotation query received. Processing.!..")

	//TODO: Remove this debug information
	jsonReq, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("error marshaling QueryDataRequest: %v", err)
	}

	backend.Logger.Info("QueryDataRequest: ", string(jsonReq))

	for _, q := range req.Queries {
		backend.Logger.Info("Processing Annotation Query", "RefID", q.RefID)
		// Process the annotation query request, extracting only the useful information
		ProcessedAnnotationQuery := d.processAnnotationQuery(ctx, q)
		// TODO: Create a batch request, for now create a single request
		url := ProcessedAnnotationQuery.getEventFrameQueryURL()

		var batchReq AnnotationBatchRequest

		if len(ProcessedAnnotationQuery.Attributes) > 0 {
			attributeURLs, err := ProcessedAnnotationQuery.getEventFrameAttributeQueryURL()
			if err != nil {
				backend.Logger.Error("Error getting attribute URLs", "Error", err)
			}
			batchReq = d.buildAnnotationBatch(url, attributeURLs...)
		} else {
			batchReq = d.buildAnnotationBatch(url)
		}
		backend.Logger.Info("batchReq", batchReq)

		backend.Logger.Info("Sending Query to PI Web API", "URL", url)
		r, err := d.apiGet(ctx, url)
		if err != nil {
			return nil, fmt.Errorf("error getting data from PI Web API: %w", err)
		}
		var annotationResult AnnotationQueryResponse
		err = json.Unmarshal(r, &annotationResult)
		if err != nil {
			return nil, fmt.Errorf("error unmarshaling response from PI Web API: %w", err)
		}
		// Convert the raw response into a Grafana frame
		responses = append(responses, annotationResult)
		annotationFrame, err := convertAnnotationResponsetoFrame(responses)
		if err != nil {
			backend.Logger.Error("error converting response to frame: %w", err)
			continue
		}

		// complete batch request
		var subResponse backend.DataResponse
		subResponse.Frames = append(subResponse.Frames, annotationFrame)
		response.Responses[q.RefID] = subResponse
	}

	return response, nil
}

// This function provides a way to proxy requests to the PI Web API. It is used to limit access fromt he frontend to the PI Web API.
// These endpoints are called by the front end while configuring the datasource, query, and annotations.
func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	// Create spans for this function.
	// tracing.DefaultTracer() returns the tracer initialized when calling Manage().
	// Refer to OpenTelemetry's Go SDK to know how to customize your spans.
	ctx, span := tracing.DefaultTracer().Start(
		ctx,
		"call resource processing",
		trace.WithAttributes(
			attribute.String("resource.URL", req.URL),
			attribute.String("resource.Path", req.Path),
			attribute.String("resource.Method", req.Method),
		),
	)
	defer span.End()

	var isAllowed = true
	var allowedBasePaths = []string{
		"/assetdatabases",
		"/elements",
		"/assetservers",
		"/points",
		"/attributes",
		"/dataservers",
		"/annotations",
	}
	for _, path := range allowedBasePaths {
		if strings.HasPrefix(req.Path, path) {
			isAllowed = true
			break
		}
	}

	if !isAllowed {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusForbidden,
			Body:   nil,
		})
	}

	r, err := d.apiGet(ctx, req.URL)
	if err != nil {
		return err
	}
	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   r,
	})
}

// CheckHealth performs a request to the specified data source and returns an error if the HTTP handler did not return
// a 200 OK response.
func (d *Datasource) CheckHealth(ctx context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	r, err := http.NewRequestWithContext(ctx, http.MethodGet, d.settings.URL, nil)
	if err != nil {
		return newHealthCheckErrorf("could not create request"), nil
	}
	if d.settings.BasicAuthEnabled {
		r.SetBasicAuth(d.settings.BasicAuthUser, d.settings.DecryptedSecureJSONData["basicAuthPassword"])
	}
	resp, err := d.httpClient.Do(r)
	if err != nil {
		return newHealthCheckErrorf("request error"), nil
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.DefaultLogger.Error("check health: failed to close response body", "err", err.Error())
		}
	}()
	if resp.StatusCode != http.StatusOK {
		return newHealthCheckErrorf("got response code %d", resp.StatusCode), nil
	}
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}

// newHealthCheckErrorf returns a new *backend.CheckHealthResult with its status set to backend.HealthStatusError
// and the specified message, which is formatted with Sprintf.
func newHealthCheckErrorf(format string, args ...interface{}) *backend.CheckHealthResult {
	return &backend.CheckHealthResult{Status: backend.HealthStatusError, Message: fmt.Sprintf(format, args...)}
}
