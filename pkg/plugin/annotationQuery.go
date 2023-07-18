package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
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

//{\"attribute\":{\"name\":\"attribute, take\"},

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
	Name string `json:"name"`
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
	RefID        string    `json:"RefID"`
	TimeRange    TimeRange `json:"TimeRange"`
	Database     AFDatabase
	Template     EventFrameTemplate
	CategoryName string `json:"categoryName"`
	NameFilter   string `json:"nameFilter"`
	Attributes   []string
	Error        error
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

	if PiAnnotationQuery.JSON.Attribute.Name != "" {
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
		RefID:        PiAnnotationQuery.RefID,
		TimeRange:    PiAnnotationQuery.TimeRange,
		Database:     PiAnnotationQuery.JSON.Database,
		Template:     PiAnnotationQuery.JSON.Template,
		CategoryName: PiAnnotationQuery.JSON.CategoryName,
		NameFilter:   PiAnnotationQuery.JSON.NameFilter,
		Attributes:   attributes,
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
		uri += "streamsets/{0}/value?selectedFields=Items.WebId%3BItems.Value%3BItems.Name&nameFilter=" + attribute
		URIs = append(URIs, uri)
	}
	return URIs, nil
}
