package plugin

import (
	"encoding/json"
	"fmt"
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
	if q.Pi.EnableStreaming == nil || q.Pi.EnableStreaming.Enable == nil {
		return false
	}
	var streamingEnabled = *q.Pi.EnableStreaming.Enable
	return streamingEnabled
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
	EnableStreaming *struct {
		Enable *bool `json:"enable"`
	} `json:"EnableStreaming"`
	ElementPath string `json:"elementPath"`
	Expression  string `json:"expression"`
	Hide        bool   `json:"hide"`
	Interpolate struct {
		Enable bool `json:"enable"`
	} `json:"interpolate"`
	IntervalMs     int  `json:"intervalMs"`
	IsPiPoint      bool `json:"isPiPoint"`
	MaxDataPoints  *int `json:"maxDataPoints"`
	RecordedValues *struct {
		Enable    *bool `json:"enable"`
		MaxNumber *int  `json:"maxNumber"`
	} `json:"recordedValues"`
	RefID    *string `json:"refId"`
	Regex    *Regex  `json:"regex"`
	Segments *[]struct {
		Label *string `json:"label"`
		Value *struct {
			Expandable *bool   `json:"expandable"`
			Value      *string `json:"value"`
			WebID      *string `json:"webId"`
		} `json:"value"`
	} `json:"segments"`
	Summary *QuerySummary `json:"summary"`
	Target  *string       `json:"target"`
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

type SummaryType struct {
	Label string           `json:"label"`
	Value SummaryTYpeValue `json:"value"`
}

type SummaryTYpeValue struct {
	Expandable bool   `json:"expandable"`
	Value      string `json:"value"`
}

type Regex struct {
	Enable  *bool   `json:"enable"`
	Search  *string `json:"search"`
	Replace *string `json:"replace"`
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
	UseUnit             bool            `json:"UseUnit"`
	Error               error
	Regex               *Regex `json:"Regex"`
}

type Links struct {
	First string `json:"First"`
	Last  string `json:"Last"`
}

type EventFrameQueryResponse struct {
	Links Links           `json:"Links"`
	Items json.RawMessage `json:"Items"`
}
