package plugin

import (
	"encoding/json"
	"time"
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
