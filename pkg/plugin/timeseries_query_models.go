package plugin

import (
	"fmt"
	"reflect"
	"time"
)

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

// isValidQuery checks if the query is valid.
// This function is called before the query is executed to handle
// edge cases where the front end sends invalid queries.
func (q *Query) isValidQuery() error {
	if !q.Pi.checkValidTargets() {
		return fmt.Errorf("no targets found in query")
	}

	if q.Pi.checkNilSegments() {
		return fmt.Errorf("no segments found in query")
	}

	return nil
}

func (q *Query) getIntervalTime() string {
	if q.Pi.Interpolate.Enable && q.Pi.Interpolate.Interval != "" {
		return q.Pi.Interpolate.Interval
	}
	return fmt.Sprintf("%dms", q.Interval/1e6)
}

func (q *Query) getWindowedTimeStampURI() string {
	// Potential Improvement: Make windowWidth a user input
	windowWidth := q.getMaxDataPoints()
	fromTime := q.TimeRange.From
	toTime := q.TimeRange.To

	diff := toTime.Sub(fromTime).Nanoseconds() / int64(windowWidth)
	timeQuery := "time=" + fromTime.Format(time.RFC3339)

	for i := 1; i < windowWidth; i++ {
		newTime := fromTime.Add(time.Duration(i * int(diff)))
		timeQuery += "&time=" + newTime.Format(time.RFC3339)
	}

	timeQuery += "&time=" + toTime.Format(time.RFC3339)

	return "/times?" + timeQuery
}

func (q *Query) getTimeRangeURIComponent() string {
	return "?startTime=" + q.TimeRange.From.UTC().Format(time.RFC3339) + "&endTime=" + q.TimeRange.To.UTC().Format(time.RFC3339)
}

func (q *Query) getTimeRangeURIToComponent() string {
	return q.TimeRange.To.UTC().Format(time.RFC3339)
}

func (q *Query) isstreamingEnabled() bool {
	if q.Pi.EnableStreaming == nil || q.Pi.EnableStreaming.Enable == nil {
		return false
	}
	var streamingEnabled = *q.Pi.EnableStreaming.Enable
	return streamingEnabled
}

func (q *Query) isStreamable() bool {
	return !q.Pi.isExpression() && q.isstreamingEnabled()
}

func (q *PiProcessedQuery) isSummary() bool {
	if q.Summary == nil {
		return false
	}
	if q.Summary.Types == nil {
		return false
	}
	return *q.Summary.Basis != "" && len(*q.Summary.Types) > 0
}

func (q *PiProcessedQuery) getSummaryNoDataReplace() string {
	if q.Summary == nil {
		return ""
	}
	if q.Summary.Nodata == nil {
		return ""
	}
	return *q.Summary.Nodata
}

type PIWebAPIQuery struct {
	Attributes []QueryProperties `json:"attributes"`
	Datasource struct {
		Type string `json:"type"`
		UID  string `json:"uid"`
	} `json:"datasource"`
	DatasourceID  int `json:"datasourceId"`
	DigitalStates *struct {
		Enable *bool `json:"enable"`
	} `json:"digitalStates"`
	UseLastValue *struct {
		Enable *bool `json:"enable"`
	} `json:"useLastValue"`
	EnableStreaming *struct {
		Enable *bool `json:"enable"`
	} `json:"EnableStreaming"`
	ElementPath string `json:"elementPath"`
	Expression  string `json:"expression"`
	Hide        bool   `json:"hide"`
	Interpolate struct {
		Enable   bool   `json:"enable"`
		Interval string `json:"interval"`
	} `json:"interpolate"`
	IsPiPoint      bool `json:"isPiPoint"`
	MaxDataPoints  *int `json:"maxDataPoints"`
	RecordedValues *struct {
		Enable    *bool `json:"enable"`
		MaxNumber *int  `json:"maxNumber"`
	} `json:"recordedValues"`
	RefID *string `json:"refId"`
	Regex *Regex  `json:"regex"`
	// Segments *[]string     `json:"segments"`
	Summary *QuerySummary `json:"summary"`
	Target  *string       `json:"target"`
	Display *string       `json:"display"`
	UseUnit *struct {
		Enable *bool `json:"enable"`
	} `json:"useUnit"`
}

type QuerySummary struct {
	Basis    *string        `json:"basis"`
	Interval *string        `json:"interval"`
	Nodata   *string        `json:"nodata"`
	Types    *[]SummaryType `json:"types"`
}

type QueryPropertiesValue struct {
	Value string `json:"value"`
}

type QueryProperties struct {
	Label string               `json:"label"`
	Value QueryPropertiesValue `json:"value"`
}

type SummaryType struct {
	Label string           `json:"label"`
	Value SummaryTypeValue `json:"value"`
}

type SummaryTypeValue struct {
	Expandable bool   `json:"expandable"`
	Value      string `json:"value"`
}

type Regex struct {
	Enable  *bool   `json:"enable"`
	Search  *string `json:"search"`
	Replace *string `json:"replace"`
}

type FrameProcessed struct {
	val        reflect.Value
	prevVal    reflect.Value
	values     any
	timestamps []time.Time
	badValues  []int
	sliceType  reflect.Type
}

type PiProcessedQuery struct {
	Label               string             `json:"Label"`
	WebID               string             `json:"WebID"`
	UID                 string             `json:"-"`
	IntervalNanoSeconds int64              `json:"IntervalNanoSeconds"`
	IsPIPoint           bool               `json:"IsPiPoint"`
	Streamable          bool               `json:"isStreamable"`
	FullTargetPath      string             `json:"FullTargetPath"`
	ResponseUnits       string             `json:"ResponseUnits"`
	BatchRequest        BatchSubRequestMap `json:"BatchRequest"`
	Response            PiBatchData        `json:"ResponseData"`
	UseUnit             bool               `json:"UseUnit"`
	DigitalStates       bool               `json:"DigitalStates"`
	Display             *string            `json:"Display"`
	Error               error
	Index               int
	Resource            string
	Elements            []string
	Regex               *Regex        `json:"Regex"`
	Summary             *QuerySummary `json:"Summary"`
}

type Links struct {
	First string `json:"First"`
	Last  string `json:"Last"`
}
