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
