package plugin

import "time"

type Query struct {
	RefID         string `json:"RefID"`
	QueryType     string `json:"QueryType"`
	MaxDataPoints int    `json:"MaxDataPoints"`
	Interval      int64  `json:"Interval"`
	TimeRange     struct {
		From time.Time `json:"From"`
		To   time.Time `json:"To"`
	} `json:"TimeRange"`
	Pi PIWebAPIQuery `json:"JSON"`
}

func (q *Query) getIntervalTime() int {
	intervalTime := q.Pi.IntervalMs
	if intervalTime == 0 {
		intervalTime = int(q.Interval)
	}
	return intervalTime
}

func (q *Query) getTimeRangeURIComponent() string {
	return "?startTime=" + q.TimeRange.From.UTC().Format(time.RFC3339) + "&endTime=" + q.TimeRange.To.UTC().Format(time.RFC3339)
}

func (q *Query) streamingEnabled() bool {
	return q.Pi.EnableStreaming.Enable
}

func (q *Query) isStreamable() bool {
	return !q.Pi.isExpression() && q.streamingEnabled()
}

type PIWebAPIQuery struct {
	Attributes []struct {
		Label string `json:"label"`
		Value struct {
			Expandable bool   `json:"expandable"`
			Value      string `json:"value"`
		} `json:"value"`
	} `json:"attributes"`
	Datasource struct {
		Type string `json:"type"`
		UID  string `json:"uid"`
	} `json:"datasource"`
	DatasourceID  int `json:"datasourceId"`
	DigitalStates struct {
		Enable bool `json:"enable"`
	} `json:"digitalStates"`
	EnableStreaming struct {
		Enable bool `json:"enable"`
	} `json:"EnableStreaming"`
	ElementPath string `json:"elementPath"`
	Expression  string `json:"expression"`
	Hide        bool   `json:"hide"`
	Interpolate struct {
		Enable bool `json:"enable"`
	} `json:"interpolate"`
	IntervalMs     int  `json:"intervalMs"`
	IsPiPoint      bool `json:"isPiPoint"`
	MaxDataPoints  int  `json:"maxDataPoints"`
	RecordedValues struct {
		Enable    bool `json:"enable"`
		MaxNumber int  `json:"maxNumber"`
	} `json:"recordedValues"`
	RefID string `json:"refId"`
	Regex struct {
		Enable bool `json:"enable"`
	} `json:"regex"`
	Segments []struct {
		Label string `json:"label"`
		Value struct {
			Expandable bool   `json:"expandable"`
			Value      string `json:"value"`
			WebID      string `json:"webId"`
		} `json:"value"`
	} `json:"segments"`
	Summary QuerySummary `json:"summary"`
	Target  string       `json:"target"`
}

type QuerySummary struct {
	Basis    string        `json:"basis"`
	Interval string        `json:"interval"`
	Nodata   string        `json:"nodata"`
	Types    []SummaryType `json:"types"`
}

type SummaryType struct {
	Label string           `json:"label"`
	Value SummaryTYpeValue `json:"value"`
}

type SummaryTYpeValue struct {
	Expandable bool   `json:"expandable"`
	Value      string `json:"value"`
}

type PiProcessedQuery struct {
	Label               string `json:"Label"`
	WebID               string `json:"WebID"`
	UID                 string `json:"-"`
	IntervalNanoSeconds int64  `json:"IntervalNanoSeconds"`
	IsPIPoint           bool   `json:"IsPiPoint"`
	Streamable          bool   `json:"isStreamable"`
	FullTargetPath      string `json:"FullTargetPath"`
	ResponseUnits       string
	BatchRequest        BatchSubRequest `json:"BatchRequest"`
	Response            PiBatchData     `json:"ResponseData"`
	Error               error
}

// AnnotationQueryResponse is the response from the PI Web API for an annotation query
type Links struct {
	First string `json:"First"`
	Last  string `json:"Last"`
}

// AnnotationItemSecurity is only needed for generating a new struct. In practice this can be ignored, by the frontend.
type AnnotationItemSecurity struct {
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
}

// AnnotationItemLinks is only needed for generating a new struct. In practice this can be ignored, by the frontend.
type AnnotationItemLinks struct {
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
}

type AnnotationItem struct {
	WebID              string                 `json:"WebId"`
	ID                 string                 `json:"Id"`
	Name               string                 `json:"Name"`
	Description        string                 `json:"Description"`
	Path               string                 `json:"Path"`
	TemplateName       string                 `json:"TemplateName"`
	HasChildren        bool                   `json:"HasChildren"`
	CategoryNames      []string               `json:"CategoryNames"`
	ExtendedProperties struct{}               `json:"ExtendedProperties"`
	StartTime          string                 `json:"StartTime"`
	EndTime            string                 `json:"EndTime"`
	Severity           string                 `json:"Severity"`
	AcknowledgedBy     string                 `json:"AcknowledgedBy"`
	AcknowledgedDate   string                 `json:"AcknowledgedDate"`
	CanBeAcknowledged  bool                   `json:"CanBeAcknowledged"`
	IsAcknowledged     bool                   `json:"IsAcknowledged"`
	IsAnnotated        bool                   `json:"IsAnnotated"`
	IsLocked           bool                   `json:"IsLocked"`
	AreValuesCaptured  bool                   `json:"AreValuesCaptured"`
	RefElementWebIds   []string               `json:"RefElementWebIds"`
	Security           AnnotationItemSecurity `json:"Security"`
	Links              AnnotationItemLinks    `json:"Links"`
}

type AnnotationQueryResponse struct {
	Links Links            `json:"Links"`
	Items []AnnotationItem `json:"Items"`
}

func getFakeQueryResponse() AnnotationQueryResponse {
	fiveMinAgo := time.Now().Add(-5 * time.Minute).Format(time.RFC3339)
	threeMinAgo := time.Now().Add(-3 * time.Minute).Format(time.RFC3339)

	return AnnotationQueryResponse{
		Links: Links{
			First: "https://piapi.complacentsee.com/piwebapi/assetdatabases/F1RDBy9ucRRb8ESE6SOe4ZuJsQYi78vFbGkU6ZIT2mvbKH4gV0lOLVY3SjRCMjYxMjFBXFRFU1RBRg/eventframes?templateName=TestAlert1&startTime=" + fiveMinAgo + "&endTime=" + threeMinAgo + "&startIndex=0",
			Last:  "https://piapi.complacentsee.com/piwebapi/assetdatabases/F1RDBy9ucRRb8ESE6SOe4ZuJsQYi78vFbGkU6ZIT2mvbKH4gV0lOLVY3SjRCMjYxMjFBXFRFU1RBRg/eventframes?templateName=TestAlert1&startTime=" + fiveMinAgo + "&endTime=" + threeMinAgo + "&startIndex=0",
		},
		Items: []AnnotationItem{
			{
				WebID:             "F1FmBy9ucRRb8ESE6SOe4ZuJsQfD80tSQj7hGlv_84a1Sq4AV0lOLVY3SjRCMjYxMjFBXFRFU1RBRlxFVkVOVEZSQU1FU1tURVNUQUxFUlQxXzIwMjMwNzE1LTAwMV0",
				ID:                "b5343f7c-2324-11ee-a5bf-ff386b54aae0",
				Name:              "TestAlert1_20230715-001",
				StartTime:         fiveMinAgo,
				EndTime:           threeMinAgo,
				Description:       "",
				Path:              "\\\\WIN-V7J4B26121A\\TestAF\\EventFrames[TestAlert1_20230715-001]",
				TemplateName:      "TestAlert1",
				HasChildren:       false,
				CategoryNames:     []string{"Fake1", "Alert"},
				Severity:          "None",
				AcknowledgedBy:    "",
				AcknowledgedDate:  "1970-01-01T00:00:00Z",
				CanBeAcknowledged: false,
				IsAcknowledged:    false,
				IsAnnotated:       false,
				IsLocked:          false,
				AreValuesCaptured: false,
			},
		},
	}
}
