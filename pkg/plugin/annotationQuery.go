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

type PIAnnotationQuery struct {
	RefID         string                  `json:"RefID"`
	QueryType     string                  `json:"QueryType"`
	MaxDataPoints int                     `json:"MaxDataPoints"`
	Interval      int64                   `json:"Interval"`
	TimeRange     TimeRange               `json:"TimeRange"`
	JSON          PIWebAPIAnnotationQuery `json:"JSON"`
}

type TimeRange struct {
	From time.Time `json:"From"`
	To   time.Time `json:"To"`
}

type PIWebAPIAnnotationQuery struct {
	CategoryName  string              `json:"categoryName"`
	NameFilter    string              `json:"nameFilter"`
	Attribute     AnnotationAttribute `json:"attribute"`
	Database      AFDatabase          `json:"database"`
	Datasource    Datasource          `json:"datasource"`
	DatasourceID  int                 `json:"datasourceId"`
	IntervalMs    int                 `json:"intervalMs"`
	IsAnnotation  bool                `json:"isAnnotation"`
	MaxDataPoints int                 `json:"maxDataPoints"`
	QueryType     string              `json:"queryType"`
	RefID         string              `json:"refId"`
	Template      EventFrameTemplate  `json:"template"`
}

type AnnotationAttribute struct {
	Enable bool   `json:"enable"`
	Name   string `json:"name"`
}

type AFDatabase struct {
	Description        string             `json:"Description"`
	ExtendedProperties ExtendedProperties `json:"ExtendedProperties"`
	Id                 string             `json:"Id"`
	Links              Links              `json:"Links"`
	Name               string             `json:"Name"`
	Path               string             `json:"Path"`
	WebId              string             `json:"WebId"`
}

type ExtendedProperties struct {
	DefaultPIServer   ValueContainer `json:"DefaultPIServer"`
	DefaultPIServerID ValueContainer `json:"DefaultPIServerID"`
}

type ValueContainer struct {
	Value string `json:"Value"`
}

type AssetDatabaseLinks struct {
	AnalysisCategories  string `json:"AnalysisCategories"`
	AnalysisTemplates   string `json:"AnalysisTemplates"`
	AssetServer         string `json:"AssetServer"`
	AttributeCategories string `json:"AttributeCategories"`
	ElementCategories   string `json:"ElementCategories"`
	ElementTemplates    string `json:"ElementTemplates"`
	Elements            string `json:"Elements"`
	EnumerationSets     string `json:"EnumerationSets"`
	EventFrames         string `json:"EventFrames"`
	Security            string `json:"Security"`
	SecurityEntries     string `json:"SecurityEntries"`
	Self                string `json:"Self"`
	TableCategories     string `json:"TableCategories"`
	Tables              string `json:"Tables"`
}

type GrafanaDatasource struct {
	Type string `json:"type"`
	Uid  string `json:"uid"`
}

type EventFrameTemplate struct {
	InstanceType string `json:"InstanceType"`
	Name         string `json:"Name"`
	WebId        string `json:"WebId"`
}

type PiProcessedAnnotationQuery struct {
	RefID             string             `json:"RefID"`
	TimeRange         TimeRange          `json:"TimeRange"`
	Database          AFDatabase         `json:"Database"`
	Template          EventFrameTemplate `json:"Template"`
	CategoryName      string             `json:"categoryName"`
	NameFilter        string             `json:"nameFilter"`
	Attributes        []string           `json:"attributes"`
	AttributesEnabled bool               `json:"attributesEnabled"`
	Error             error              `json:"Error"`
}

type AnnotationBatchRequest map[string]AnnotationRequest

type AnnotationRequest struct {
	Method          string                     `json:"Method"`
	Resource        string                     `json:"Resource,omitempty"`
	RequestTemplate *AnnotationRequestTemplate `json:"RequestTemplate,omitempty"`
	Parameters      []string                   `json:"Parameters,omitempty"`
	ParentIds       []string                   `json:"ParentIds,omitempty"`
}

type AnnotationRequestTemplate struct {
	Resource string `json:"Resource"`
}

type AnnotationBatchResponse struct {
	Status  int               `json:"Status"`
	Headers map[string]string `json:"Headers"`
	Content json.RawMessage   `json:"Content"`
}

type EventFrameResponse struct {
	Links struct {
		First string `json:"First"`
		Last  string `json:"Last"`
	} `json:"Links"`
	Items []struct {
		WebID              string `json:"WebId"`
		ID                 string `json:"Id"`
		Name               string `json:"Name"`
		Description        string `json:"Description"`
		Path               string `json:"Path"`
		TemplateName       string `json:"TemplateName"`
		HasChildren        bool   `json:"HasChildren"`
		CategoryNames      []any  `json:"CategoryNames"`
		ExtendedProperties struct {
		} `json:"ExtendedProperties"`
		StartTime         time.Time `json:"StartTime"`
		EndTime           time.Time `json:"EndTime"`
		Severity          string    `json:"Severity"`
		AcknowledgedBy    string    `json:"AcknowledgedBy"`
		AcknowledgedDate  time.Time `json:"AcknowledgedDate"`
		CanBeAcknowledged bool      `json:"CanBeAcknowledged"`
		IsAcknowledged    bool      `json:"IsAcknowledged"`
		IsAnnotated       bool      `json:"IsAnnotated"`
		IsLocked          bool      `json:"IsLocked"`
		AreValuesCaptured bool      `json:"AreValuesCaptured"`
		RefElementWebIds  []any     `json:"RefElementWebIds"`
		Security          struct {
			CanAnnotate        bool     `json:"CanAnnotate"`
			CanDelete          bool     `json:"CanDelete"`
			CanExecute         bool     `json:"CanExecute"`
			CanRead            bool     `json:"CanRead"`
			CanReadData        bool     `json:"CanReadData"`
			CanSubscribe       bool     `json:"CanSubscribe"`
			CanSubscribeOthers bool     `json:"CanSubscribeOthers"`
			CanWrite           bool     `json:"CanWrite"`
			CanWriteData       bool     `json:"CanWriteData"`
			HasAdmin           bool     `json:"HasAdmin"`
			Rights             []string `json:"Rights"`
		} `json:"Security"`
		Links struct {
			Self               string `json:"Self"`
			Attributes         string `json:"Attributes"`
			EventFrames        string `json:"EventFrames"`
			Database           string `json:"Database"`
			ReferencedElements string `json:"ReferencedElements"`
			Template           string `json:"Template"`
			Categories         string `json:"Categories"`
			InterpolatedData   string `json:"InterpolatedData"`
			RecordedData       string `json:"RecordedData"`
			PlotData           string `json:"PlotData"`
			SummaryData        string `json:"SummaryData"`
			Value              string `json:"Value"`
			EndValue           string `json:"EndValue"`
			Security           string `json:"Security"`
			SecurityEntries    string `json:"SecurityEntries"`
		} `json:"Links"`
	} `json:"Items"`
}

type EventFrameAttribute struct {
	Total int `json:"Total"`
	Items []struct {
		Status  int `json:"Status"`
		Headers struct {
			ContentType string `json:"Content-Type"`
		} `json:"Headers"`
		Content struct {
			Items []struct {
				WebID string `json:"WebId"`
				Name  string `json:"Name"`
				Value struct {
					Timestamp         time.Time   `json:"Timestamp"`
					Value             interface{} `json:"Value"`
					UnitsAbbreviation string      `json:"UnitsAbbreviation"`
					Good              bool        `json:"Good"`
					Questionable      bool        `json:"Questionable"`
					Substituted       bool        `json:"Substituted"`
					Annotated         bool        `json:"Annotated"`
				} `json:"Value"`
			} `json:"Items"`
		} `json:"Content"`
	} `json:"Items"`
}

func (d Datasource) processAnnotationQuery(ctx context.Context, query backend.DataQuery) PiProcessedAnnotationQuery {
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

	var attributes []string

	if PiAnnotationQuery.JSON.Attribute.Name != "" && PiAnnotationQuery.JSON.Attribute.Enable {
		// Splitting by comma
		rawAttributes := strings.Split(PiAnnotationQuery.JSON.Attribute.Name, ",")

		// Iterating through each name, trimming the space, and then appending it to the slice
		for _, name := range rawAttributes {
			// strip out empty attribute names
			if name == "" {
				continue
			}
			attributes = append(attributes, strings.TrimSpace(name))
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

func (q *PiProcessedAnnotationQuery) getTimeRangeURIComponent() string {
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
		uri += "streamsets/{0}/value?selectedFields=Items.Value%3BItems.Name&nameFilter=" + attribute
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
