package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func (d *Datasource) processAnnotationQuery(ctx context.Context, query backend.DataQuery) PiProcessedAnnotationQuery {
	var ProcessedQuery PiProcessedAnnotationQuery
	var PiAnnotationQuery PIAnnotationQuery

	// Unmarshal the query into a PiQuery struct, and then unmarshal the PiQuery into a PiProcessedQuery
	// if there are errors we'll set the error and return the PiProcessedQuery with an error set.
	tempJson, err := json.Marshal(query)
	if err != nil {
		log.DefaultLogger.Error("Process annotation - Error marshalling", "error", err)

		// create a processed query with the error set
		ProcessedQuery = PiProcessedAnnotationQuery{
			Error: err,
		}
		return ProcessedQuery
	}

	err = json.Unmarshal(tempJson, &PiAnnotationQuery)
	if err != nil {
		log.DefaultLogger.Error("Process annotation - Error unmarshalling", "error", err)

		// create a processed query with the error set
		ProcessedQuery = PiProcessedAnnotationQuery{
			Error: err,
		}
		return ProcessedQuery
	}

	var attributes []QueryProperties

	if PiAnnotationQuery.JSON.Attribute.Enable {
		// Splitting by comma
		rawAttributes := strings.Split(PiAnnotationQuery.JSON.Attribute.Name, ",")

		// Iterating through each name, trimming the space, and then appending it to the slice.
		// When no name is left, every attribute of the event frames is requested (see getEventFrameAttributeQueryURL).
		for _, name := range rawAttributes {
			name = strings.TrimSpace(name)
			// strip out empty attribute names
			if name == "" {
				continue
			}
			attribute := QueryProperties{
				Label: name,
				Value: QueryPropertiesValue{
					Value: name,
				},
			}
			attributes = append(attributes, attribute)
		}
	}

	//create a processed query for the annotation query
	ProcessedQuery = PiProcessedAnnotationQuery{
		RefID:             PiAnnotationQuery.RefID,
		TimeRange:         PiAnnotationQuery.TimeRange,
		Database:          PiAnnotationQuery.JSON.Database,
		Template:          PiAnnotationQuery.JSON.Template,
		CategoryName:      PiAnnotationQuery.JSON.CategoryName,
		NameFilter:        PiAnnotationQuery.JSON.NameFilter,
		Attributes:        attributes,
		AttributesEnabled: PiAnnotationQuery.JSON.Attribute.Enable,
	}

	return ProcessedQuery
}

func (q PiProcessedAnnotationQuery) getTimeRangeURIComponent() string {
	return "&startTime=" + q.TimeRange.From.UTC().Truncate(time.Second).Format(time.RFC3339) +
		"&endTime=" + q.TimeRange.To.UTC().Truncate(time.Second).Format(time.RFC3339)
}

// getEventFrameQueryURL returns the URI for the event frame query
func (q PiProcessedAnnotationQuery) getEventFrameQueryURL() string {
	//example uri:
	//http(s)://<host>/<apiendpoint>/assetdatabases/<webid of asset database>/eventframes?templateName=<template name>&startTime=<start time>&endTime=<end time>
	//optional parameters:
	// ?categoryName=<category name>
	// ?nameFilter=<name filter>

	var uri string
	uri += "/assetdatabases/" + q.Database.WebId + "/eventframes?templateName=" + queryEscape(q.Template.Name)
	uri += q.getTimeRangeURIComponent()

	//add optional parameters
	if q.CategoryName != "" {
		uri += "&categoryName=" + queryEscape(q.CategoryName)
	}
	if q.NameFilter != "" {
		uri += "&nameFilter=" + queryEscape(q.NameFilter)
	}
	return uri
}

// joinPIWebAPIURL joins the datasource URL and a PI Web API path with exactly one slash, whether or not the
// datasource URL ends with a slash.
func joinPIWebAPIURL(baseURL string, path string) string {
	return strings.TrimSuffix(baseURL, "/") + "/" + strings.TrimPrefix(path, "/")
}

func (d *Datasource) buildAnnotationBatch(efURL string, attributeURLs ...string) AnnotationBatchRequest {
	batchRequest := AnnotationBatchRequest{}

	// create a batch request for the event frames
	eventFrameRequest := AnnotationRequest{
		Method:   "GET",
		Resource: joinPIWebAPIURL(d.settings.URL, efURL), // assuming efURL is already formatted with start/end times, templateName, etc.
	}
	batchRequest["1"] = eventFrameRequest

	if len(attributeURLs) == 0 {
		return batchRequest
	}

	// create a batch request for each attribute
	for i, attributeURL := range attributeURLs {
		requestTemplateResource := joinPIWebAPIURL(d.settings.URL, attributeURL)
		attributeRequest := AnnotationRequest{
			Method: "GET",
			RequestTemplate: &AnnotationRequestTemplate{
				Resource: requestTemplateResource,
			},
			Parameters: []string{"$.1.Content.Items[*].WebId"},
			ParentIds:  []string{"1"},
		}
		batchRequest[strconv.Itoa(i+2)] = attributeRequest
	}

	return batchRequest
}

// getEventFrameAttributeQueryURL returns a slice of URIs for each attribute specified in the query
// this is used for creating a batched request to the PI Web API. When attributes are enabled without a name,
// a single URI requesting every attribute of the event frames is returned.
func (q PiProcessedAnnotationQuery) getEventFrameAttributeQueryURL() ([]string, error) {
	var URIs []string
	//example uri:
	//streamsets/{0}/value?selectedFields=Items.WebId%3BItems.Value%3BItems.Name&nameFilter=<attribute name>
	const baseURI = "streamsets/{0}/value?selectedFields=Items.Value%3BItems.Name"

	if len(q.Attributes) == 0 {
		if q.AttributesEnabled {
			return []string{baseURI}, nil
		}
		err := errors.New("no attributes specified")
		return nil, err
	}

	for _, attribute := range q.Attributes {
		URIs = append(URIs, baseURI+"&nameFilter="+queryEscape(attribute.Value.Value))
	}
	return URIs, nil
}

// annotationAPIError is an error returned by PI Web API for the event frame request of an annotation query.
type annotationAPIError struct {
	status  int
	message string
}

func (e *annotationAPIError) Error() string {
	return fmt.Sprintf("api error %d - %s", e.status, e.message)
}

// batchErrorMessage returns the error messages of a failed PI Web API batch sub-request.
func batchErrorMessage(content json.RawMessage) string {
	var errorResponse ErrorResponse
	if err := json.Unmarshal(content, &errorResponse); err != nil || len(errorResponse.Errors) == 0 {
		return "unknown api error"
	}
	return strings.Join(errorResponse.Errors, "; ")
}

// annotationAttributeKeys returns the keys of the attribute sub-requests ("2", "3", ...) in request order, so the
// attribute fields and text are always built in the same order.
func annotationAttributeKeys(annotationResponse map[string]AnnotationBatchResponse) []string {
	keys := make([]string, 0, len(annotationResponse))
	for key := range annotationResponse {
		if key != "1" {
			keys = append(keys, key)
		}
	}
	sort.Slice(keys, func(i, j int) bool {
		a, errA := strconv.Atoi(keys[i])
		b, errB := strconv.Atoi(keys[j])
		if errA != nil || errB != nil {
			return keys[i] < keys[j]
		}
		return a < b
	})
	return keys
}

// annotationAttributeValue formats an event frame attribute value for the annotation text. Digital states and
// enumeration values are shown by their name.
func annotationAttributeValue(value interface{}) string {
	switch v := value.(type) {
	case nil:
		return ""
	case string:
		return v
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case map[string]interface{}:
		if name, ok := v["Name"].(string); ok {
			return name
		}
	}
	if raw, err := json.Marshal(value); err == nil {
		return string(raw)
	}
	return fmt.Sprintf("%v", value)
}

// annotationFieldNames are the names of the fields of an annotation frame; attributes with these names are only
// added to the attribute text, so they do not replace the event frame fields in the frontend.
var annotationFieldNames = map[string]bool{"time": true, "timeEnd": true, "title": true, "id": true, "attributeText": true}

// convertAnnotationResponseToFrame converts the batch response of an annotation query into a frame with one row per
// event frame. Batch sub-request "1" holds the event frames; each other sub-request holds, for one attribute name
// filter, the attribute values of every event frame in the same order (Items[i] belongs to event frame i). When
// attributes are enabled, a field is added for each attribute found, with no value for the event frames that lack
// it, and attributeText holds the attributes of each event frame.
func convertAnnotationResponseToFrame(refID string, rawAnnotationResponse []byte, attributesEnabled bool) (*data.Frame, error) {
	var annotationResponse map[string]AnnotationBatchResponse

	err := json.Unmarshal(rawAnnotationResponse, &annotationResponse)
	if err != nil {
		return nil, err
	}

	eventFrameResponse, ok := annotationResponse["1"]
	if !ok {
		return nil, errors.New("no event frames in the PI Web API response")
	}
	if eventFrameResponse.Status >= http.StatusBadRequest {
		return nil, &annotationAPIError{status: eventFrameResponse.Status, message: batchErrorMessage(eventFrameResponse.Content)}
	}

	var eventFrames EventFrameResponse
	err = json.Unmarshal(eventFrameResponse.Content, &eventFrames)
	if err != nil {
		return nil, err
	}

	count := len(eventFrames.Items)
	startTimes := make([]time.Time, count)
	endTimes := make([]time.Time, count)
	titles := make([]string, count)
	ids := make([]string, count)
	for i, eventFrame := range eventFrames.Items {
		startTimes[i] = eventFrame.StartTime
		endTimes[i] = eventFrame.EndTime
		titles[i] = eventFrame.Name
		ids[i] = eventFrame.ID
	}

	fields := []*data.Field{
		data.NewField("time", nil, startTimes),
		data.NewField("timeEnd", nil, endTimes),
		data.NewField("title", nil, titles),
		data.NewField("id", nil, ids),
	}

	if attributesEnabled {
		attributeText := make([]string, count)
		var attributeNames []string
		attributeValues := map[string][]*string{}

		for _, key := range annotationAttributeKeys(annotationResponse) {
			value := annotationResponse[key]
			if value.Status >= http.StatusBadRequest {
				backend.Logger.Warn("Annotation attribute request failed", "refID", refID, "status", value.Status, "error", batchErrorMessage(value.Content))
				continue
			}

			var attributes EventFrameAttribute
			err = json.Unmarshal(value.Content, &attributes)
			if err != nil {
				backend.Logger.Error("Error unmarshalling attribute response", "error", err)
				continue
			}

			for i, eventFrameAttributes := range attributes.Items {
				if i >= count {
					break
				}
				if eventFrameAttributes.Status >= http.StatusBadRequest {
					continue
				}
				for _, attribute := range eventFrameAttributes.Content.Items {
					values, found := attributeValues[attribute.Name]
					if !found {
						values = make([]*string, count)
						attributeValues[attribute.Name] = values
						attributeNames = append(attributeNames, attribute.Name)
					}
					// an attribute matched by several name filters is only added once
					if values[i] != nil {
						continue
					}
					sValue := annotationAttributeValue(attribute.Value.Value)
					values[i] = &sValue
					attributeText[i] += "<br />" + attribute.Name + ": " + sValue
				}
			}
		}

		for _, name := range attributeNames {
			if annotationFieldNames[name] {
				continue
			}
			fields = append(fields, data.NewField(name, nil, attributeValues[name]))
		}
		fields = append(fields, data.NewField("attributeText", nil, attributeText))
	}

	frame := data.NewFrame(refID, fields...)
	frame.Meta = &data.FrameMeta{}
	return frame, nil
}
