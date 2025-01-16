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
	_ backend.StreamHandler         = (*Datasource)(nil)
)

// NewDatasource creates a new PIWebAPI datasource instance.
func NewPIWebAPIDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var dataSourceOptions PIWebAPIDataSourceJsonData
	err := json.Unmarshal(settings.JSONData, &dataSourceOptions)
	if err != nil {
		return nil, fmt.Errorf("http Unmarshal: %w", err)
	}

	opts, err := settings.HTTPClientOptions(ctx)
	if err != nil {
		return nil, fmt.Errorf("http client options: %w", err)
	}

	httpClient, err := httpclient.New(opts)
	if err != nil {
		return nil, fmt.Errorf("httpclient new: %w", err)
	}

	webIDCache := newWebIDCache()
	webCache := newCache[string, PiBatchData]()

	// Create a new scheduler that will be used to clean the webIDCache every 60 minutes.
	scheduler := gocron.NewScheduler(time.UTC)
	scheduler.Every(12).Hour().Do(cleanWebIDCache, webIDCache)
	scheduler.StartAsync()

	ds := &Datasource{
		settings:                  settings,
		httpClient:                httpClient,
		webIDCache:                webIDCache,
		webCache:                  webCache,
		scheduler:                 scheduler,
		websocketConnectionsMutex: &sync.Mutex{},
		datasourceMutex:           &sync.Mutex{},
		channelConstruct:          make(map[string]StreamChannelConstruct),
		websocketConnections:      make(map[string]*websocket.Conn),
		sendersByWebID:            make(map[string]map[*backend.StreamSender]bool),
		streamChannels:            make(map[string]chan []byte),
		dataSourceOptions:         &dataSourceOptions,
		initalTime:                time.Now(),
		totalCalls:                0,
		callRate:                  0.0,
	}

	// Create a new query mux and assign it to the datasource.
	ds.queryMux = ds.newQueryMux()

	log.DefaultLogger.Info("PIWebAPI Datasource Created", "UID", settings.UID, "Name", settings.Name)

	return ds, nil
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	d.httpClient.CloseIdleConnections()
}

// update call rate - enforce max call rate of 500 req/s
func (d *Datasource) updateRate() {
	d.datasourceMutex.Lock()
	// update data
	d.totalCalls += 1
	d.callRate = float64(d.totalCalls) / float64(time.Now().Unix()-d.initalTime.Unix())

	// backpressure
	if d.callRate > 500 {
		time.Sleep(time.Duration(d.callRate) * time.Millisecond)
	}

	// reset every 10 minutes (600 s)
	if time.Since(d.initalTime).Seconds() > 600 {
		d.initalTime = time.Now()
		d.totalCalls = 1
		d.callRate = float64(d.totalCalls) / float64(time.Now().Unix()-d.initalTime.Unix())
	}
	d.datasourceMutex.Unlock()
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

// TODO: Missing functionality: Add Replace Bad Values
// QueryTSData is called by Grafana when a user executes a time series data query.
func (d *Datasource) QueryTSData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	datasourceUID := req.PluginContext.DataSourceInstanceSettings.UID

	// tracer
	ctx, span := tracing.DefaultTracer().Start(
		ctx,
		"New annotation query recieved",
	)
	defer span.End()

	// Process queries generic query objects and turn them into a suitable format for the PI Web API
	processedPIWebAPIQueries := d.processQuery(req.Queries, datasourceUID)

	// span
	span.AddEvent("Completed processing query request")

	// Send the queries to the PI Web API
	processedQueries_temp := d.batchRequest(ctx, processedPIWebAPIQueries)

	// span
	span.AddEvent("Completed processing batch request")

	// Convert the PI Web API response into Grafana frames
	response := d.processBatchtoFrames(processedQueries_temp)

	// span
	span.AddEvent("Completed processing batch to frames")

	// Update rate and do backpressure
	d.updateRate()

	return response, nil
}

// QueryAnnotations recevies annotation queries from the frontend and returns dataframes that contain json raw messages containing the annotations.
func (d *Datasource) QueryAnnotations(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := &backend.QueryDataResponse{}
	response.Responses = make(map[string]backend.DataResponse)

	ctx, span := tracing.DefaultTracer().Start(
		ctx,
		"New annotation query recieved",
	)
	defer span.End()

	for _, q := range req.Queries {
		span.AddEvent("Processing annotation query request",
			trace.WithAttributes(
				attribute.String("query.ref_id", q.RefID),
				attribute.String("query.type", q.QueryType),
				attribute.Int64("query.time_range.from", q.TimeRange.From.Truncate(time.Second).Unix()),
				attribute.Int64("query.time_range.to", q.TimeRange.To.Truncate(time.Second).Unix()),
			),
		)

		// Process the annotation query request, extracting only the useful information
		ProcessedAnnotationQuery := d.processAnnotationQuery(ctx, q)
		span.AddEvent("Completed processing annotation query request")

		url := ProcessedAnnotationQuery.getEventFrameQueryURL()

		var batchReq AnnotationBatchRequest

		if len(ProcessedAnnotationQuery.Attributes) > 0 {
			attributeURLs, err := ProcessedAnnotationQuery.getEventFrameAttributeQueryURL()
			if err != nil {
				return nil, fmt.Errorf("error getting attribute URLs: %w", err)
			}
			batchReq = d.buildAnnotationBatch(url, attributeURLs...)
		} else {
			batchReq = d.buildAnnotationBatch(url)
		}

		span.AddEvent("Generated PI API URL for annotation query")

		r, err := apiBatchRequest(ctx, d, batchReq)
		if err != nil {
			return nil, fmt.Errorf("error getting data from PI Web API: %w", err)
		}

		span.AddEvent("Recieved response from PI Web API")

		annotationFrame, err := convertAnnotationResponseToFrame(ProcessedAnnotationQuery.RefID, r, ProcessedAnnotationQuery.AttributesEnabled)
		if err != nil {
			return nil, fmt.Errorf("error converting response to frame: %w", err)
		}

		span.AddEvent("Converted response to Grafana frame")

		// complete batch request
		var subResponse backend.DataResponse
		subResponse.Frames = append(subResponse.Frames, annotationFrame)
		response.Responses[q.RefID] = subResponse
	}

	return response, nil
}

// This function provides a way to proxy requests to the PI Web API. It is used to limit access from the frontend to the PI Web API.
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

	r, err := apiGet(ctx, d, req.URL)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte(`{}`),
		})
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
	resp, err := d.httpClient.Do(r)
	if err != nil {
		return newHealthCheckErrorf("request error"), nil
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.DefaultLogger.Error("PiWebAPI Check health: failed to close response body", "err", err.Error())
		}
	}()
	if resp.StatusCode != http.StatusOK {
		return newHealthCheckErrorf("got response code %d", resp.StatusCode), nil
	}
	// return good status
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

// isUsingNewFormat checks whether the datasource is configured to use a new format.
// This is determined by the NewFormat option in dataSourceOptions.
// Returns true if NewFormat is set and enabled; otherwise, false.
func (d *Datasource) isUsingNewFormat() bool {
	return d.dataSourceOptions.NewFormat != nil && *d.dataSourceOptions.NewFormat
}

// isUsingStreaming checks whether the datasource has streaming enabled in experimental mode.
// This requires both the UseExperimental and UseStreaming options to be set and enabled.
// Returns true if both options are enabled; otherwise, false.
func (d *Datasource) isUsingStreaming() bool {
	return d.dataSourceOptions.UseExperimental != nil && *d.dataSourceOptions.UseExperimental &&
		d.dataSourceOptions.UseStreaming != nil && *d.dataSourceOptions.UseStreaming
}

// isUsingResponseCache checks if response caching is enabled in experimental mode for the datasource.
// This requires both the UseExperimental and UseResponseCache options to be set and enabled.
// Returns true if both options are enabled; otherwise, false.
func (d *Datasource) isUsingResponseCache() bool {
	return d.dataSourceOptions.UseExperimental != nil && *d.dataSourceOptions.UseExperimental &&
		d.dataSourceOptions.UseResponseCache != nil && *d.dataSourceOptions.UseResponseCache
}
