package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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
		log.DefaultLogger.Error("Error marshalling query", "error", err)

		// create a processed query with the error set
		ProcessedQuery = PiProcessedAnnotationQuery{
			Error: err,
		}
		return ProcessedQuery
	}

	err = json.Unmarshal(tempJson, &PiAnnotationQuery)
	if err != nil {
		log.DefaultLogger.Error("Error unmarshalling query", "error", err)

		// create a processed query with the error set
		ProcessedQuery = PiProcessedAnnotationQuery{
			Error: err,
		}
		return ProcessedQuery
	}

	var attributes []QueryProperties

	if PiAnnotationQuery.JSON.Attribute.Name != "" && PiAnnotationQuery.JSON.Attribute.Enable {
		// Splitting by comma
		rawAttributes := strings.Split(PiAnnotationQuery.JSON.Attribute.Name, ",")

		// Iterating through each name, trimming the space, and then appending it to the slice
		for _, name := range rawAttributes {
			// strip out empty attribute names
			if name == "" {
				continue
			}
			attribute := QueryProperties{
				Label: strings.TrimSpace(name),
				Value: QueryPropertiesValue{
					Value: strings.TrimSpace(name),
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
	return "&startTime=" + q.TimeRange.From.UTC().Format(time.RFC3339) + "&endTime=" + q.TimeRange.To.UTC().Format(time.RFC3339)
}

// getEventFrameQueryURL returns the URI for the event frame query
func (q PiProcessedAnnotationQuery) getEventFrameQueryURL() string {
	//example uri:
	//http(s)://<host>/<apiendpoint>/assetdatabases/<webid of asset database>/eventframes?templateName=<template name>&startTime=<start time>&endTime=<end time>
	//optional parameters:
	// ?categoryName=<category name>
	// ?nameFilter=<name filter>

	var uri string
	uri += "/assetdatabases/" + q.Database.WebId + "/eventframes?templateName=" + q.Template.Name
	uri += q.getTimeRangeURIComponent()

	//add optional parameters
	if q.CategoryName != "" {
		uri += "&categoryName=" + q.CategoryName
	}
	if q.NameFilter != "" {
		uri += "&nameFilter=" + q.NameFilter
	}
	return uri
}

func (d *Datasource) buildAnnotationBatch(efURL string, attributeURLs ...string) AnnotationBatchRequest {
	batchRequest := AnnotationBatchRequest{}

	// create a batch request for the event frames
	eventFrameRequest := AnnotationRequest{
		Method:   "GET",
		Resource: d.settings.URL + efURL, // assuming efURL is already formatted with start/end times, templateName, etc.
	}
	batchRequest["1"] = eventFrameRequest

	if len(attributeURLs) == 0 {
		return batchRequest
	}

	// create a batch request for each attribute
	for i, attributeURL := range attributeURLs {
		requestTemplateResource := d.settings.URL + attributeURL
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
// this is used for creating a batched request to the PI Web API
func (q PiProcessedAnnotationQuery) getEventFrameAttributeQueryURL() ([]string, error) {
	var URIs []string
	//example uri:
	//streamsets/{0}/value?selectedFields=Items.WebId%3BItems.Value%3BItems.Name&nameFilter=<attribute name>

	if q.Attributes == nil {
		err := errors.New("no attributes specified")
		return nil, err
	}
	if len(q.Attributes) == 0 {
		err := errors.New("no attributes specified")
		return nil, err
	}

	for _, attribute := range q.Attributes {
		var uri string
		uri += "streamsets/{0}/value?selectedFields=Items.Value%3BItems.Name&nameFilter=" + attribute.Value.Value
		URIs = append(URIs, uri)
	}
	return URIs, nil
}

func convertAnnotationResponseToFrame(refID string, rawAnnotationResponse []byte, attributesEnabled bool) (*data.Frame, error) {
	var annotationResponse map[string]AnnotationBatchResponse
	var attributeDataItems []string

	//log attributesEnabled
	log.DefaultLogger.Info("Attributes Enabled", "attributesEnabled", attributesEnabled)

	err := json.Unmarshal(rawAnnotationResponse, &annotationResponse)
	if err != nil {
		return nil, err
	}

	var fields []*data.Field

	for key, value := range annotationResponse {
		if key == "1" {
			var startTimes []time.Time
			var endTimes []time.Time
			var titles []string
			var id []string

			var eventFrameResponse = value.Content

			var eventFrames EventFrameResponse

			err = json.Unmarshal(eventFrameResponse, &eventFrames)
			if err != nil {
				return nil, err
			}

			for _, eventFrame := range eventFrames.Items {
				startTimes = append(startTimes, eventFrame.StartTime)
				endTimes = append(endTimes, eventFrame.EndTime)
				titles = append(titles, eventFrame.Name)
				id = append(id, eventFrame.ID)
			}

			fieldStartTime := data.NewField("time", nil, startTimes)
			fieldEndTime := data.NewField("timeEnd", nil, endTimes)
			fieldTitle := data.NewField("title", nil, titles)
			fieldID := data.NewField("id", nil, id)

			fields = append(fields, fieldStartTime)
			fields = append(fields, fieldEndTime)
			fields = append(fields, fieldTitle)
			fields = append(fields, fieldID)

		} else {
			var attributeResponse = value.Content

			var attributes EventFrameAttribute

			err = json.Unmarshal(attributeResponse, &attributes)
			if err != nil {
				backend.Logger.Error("Error unmarshalling attribute response", "error", err)
				continue
			}
			var attributeName string
			var attributeValues []string

			for i, attributes := range attributes.Items {
				for j, values := range attributes.Content.Items {
					var sValue string = fmt.Sprintf("%v", values.Value.Value)

					if j == 0 {
						attributeName = values.Name
					}
					if i < len(attributeDataItems) {
						attributeDataItems[i] += "<br />" + values.Name + ": " + sValue
					} else {
						item := "<br />" + values.Name + ": " + sValue
						attributeDataItems = append(attributeDataItems, item)
					}
					attributeValues = append(attributeValues, sValue)
				}
			}
			if attributesEnabled {
				fieldAttribute := data.NewField(attributeName, nil, attributeValues)
				fields = append(fields, fieldAttribute)
			}
		}
	}

	if attributesEnabled {
		fields = append(fields, data.NewField("attributeText", nil, attributeDataItems))
	}

	frame := data.NewFrame(refID, fields...)
	frame.Meta = &data.FrameMeta{}
	return frame, nil
}
