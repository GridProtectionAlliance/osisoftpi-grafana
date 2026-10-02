package plugin

import (
	"fmt"
	"reflect"
	"time"
)

type Query struct {
	RefID         string `json:"RefID"`
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

	return nil
}

func (q *Query) getIntervalTime() string {
	if q.Pi.Interpolate.Enable && q.Pi.Interpolate.Interval != "" {
		return q.Pi.Interpolate.Interval
	}
	return fmt.Sprintf("%dms", q.Interval/1e6)
}

func (q *Query) getTimeRangeURIComponent() string {
	return "?startTime=" + q.TimeRange.From.UTC().Truncate(time.Second).Format(time.RFC3339) +
		"&endTime=" + q.TimeRange.To.UTC().Truncate(time.Second).Format(time.RFC3339)
}

func (q *Query) getTimeRangeURIToComponent() string {
	return q.TimeRange.To.UTC().Truncate(time.Second).Format(time.RFC3339)
}

func (q *Query) isstreamingEnabled() bool {
	if q.Pi.EnableStreaming == nil || q.Pi.EnableStreaming.Enable == nil {
		return false
	}
	var streamingEnabled = *q.Pi.EnableStreaming.Enable
	return streamingEnabled
}

// isStreamFillGaps returns true when "Fill gaps after reconnect" is on (the default): after the stream reconnects,
// the values recorded while it was disconnected are sent to the panel.
func (q *Query) isStreamFillGaps() bool {
	return q.Pi.EnableStreaming == nil || q.Pi.EnableStreaming.FillGaps == nil || *q.Pi.EnableStreaming.FillGaps
}

// isStreamable returns true when the query can be updated with the values streamed by PI Web API channels: these
// are raw values, so calculations, summaries, last values, interpolated and recorded values are not streamed (the
// query editor hides the streaming settings when one of them is selected).
func (q *Query) isStreamable() bool {
	summaryEnabled := q.Pi.Summary != nil && q.Pi.Summary.Enable != nil && *q.Pi.Summary.Enable
	return !q.Pi.isExpression() && !q.Pi.isSummary() && !summaryEnabled && !q.Pi.isUseLastValue() &&
		!q.Pi.isInterpolated() && !q.Pi.isRecordedValues() && q.isstreamingEnabled()
}

func (q *PiProcessedQuery) getNoDataReplace() string {
	if q.Nodata == nil {
		return ""
	}
	return *q.Nodata
}

// PIWebAPIQuery is the query saved by the query editor. Only the fields read by the backend are decoded: the saved
// query also has fields such as refId, hide, datasource or maxDataPoints, which are read from backend.DataQuery or
// not used, and a field decoded here makes the whole query invalid when its value has an unexpected type.
type PIWebAPIQuery struct {
	Attributes    []QueryProperties `json:"attributes"`
	DigitalStates *struct {
		Enable *bool `json:"enable"`
	} `json:"digitalStates"`
	UseLastValue *struct {
		Enable *bool `json:"enable"`
	} `json:"useLastValue"`
	EnableStreaming *QueryStreaming `json:"EnableStreaming"`
	Expression      string          `json:"expression"`
	Interpolate     struct {
		Enable   bool   `json:"enable"`
		Interval string `json:"interval"`
	} `json:"interpolate"`
	IsPiPoint      bool `json:"isPiPoint"`
	HideError      bool `json:"hideError"`
	RecordedValues *struct {
		Enable       *bool   `json:"enable"`
		MaxNumber    *int    `json:"maxNumber"`
		BoundaryType *string `json:"boundaryType"`
	} `json:"recordedValues"`
	Regex   *Regex        `json:"regex"`
	Nodata  *string       `json:"nodata"`
	Summary *QuerySummary `json:"summary"`
	Target  *string       `json:"target"`
	Display *string       `json:"display"`
	UseUnit *struct {
		Enable *bool `json:"enable"`
	} `json:"useUnit"`
	HashCode string `json:"hashCode"`
	// QueryVersion is the format version of the saved query (see queryVersion); 0 when saved before 6.0
	QueryVersion int `json:"queryVersion"`
	// PluginVersion is the version of the plugin that last saved the query, for information only
	PluginVersion string `json:"pluginVersion"`
}

// QueryStreaming holds the streaming options of a query.
type QueryStreaming struct {
	Enable *bool `json:"enable"`
	// FillGaps is "Fill gaps after reconnect"; on when not set
	FillGaps *bool `json:"fillGaps"`
}

type QuerySummary struct {
	Enable             *bool          `json:"enable"`
	Basis              *string        `json:"basis"`
	Duration           *string        `json:"duration"`
	Types              *[]SummaryType `json:"types"`
	SampleTypeInterval *bool          `json:"sampleTypeInterval"`
	SampleInterval     *string        `json:"sampleInterval"`
	// Interval and Nodata are only in queries saved by versions 4.x and 5.0 (see migrateLegacySummary)
	Interval *string `json:"interval,omitempty"`
	Nodata   *string `json:"nodata,omitempty"`
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
	Label          string             `json:"Label"`
	WebID          string             `json:"WebID"`
	UID            string             `json:"-"`
	IsPIPoint      bool               `json:"IsPiPoint"`
	HideError      bool               `json:"HideError"`
	Streamable     bool               `json:"isStreamable"`
	FullTargetPath string             `json:"FullTargetPath"`
	BatchRequest   BatchSubRequestMap `json:"BatchRequest"`
	Response       PiBatchData        `json:"ResponseData"`
	UseUnit        bool               `json:"UseUnit"`
	DigitalStates  bool               `json:"DigitalStates"`
	Display        *string            `json:"Display"`
	Nodata         *string            `json:"Nodata"`
	Regex          *Regex             `json:"Regex"`
	HashCode       string             `json:"HashCode"`
	EndTime        time.Time          `json:"EndTime"`
	Resource       string
	TargetPath     string
	Variable       string
	MultiVariable  bool
	PluginVersion  string
	// StreamFillGaps and MaxDataPoints are used to fill the gap in the stream after a reconnect
	StreamFillGaps bool
	MaxDataPoints  int
	RefID          string
	Error          error
	Status         int
	Cached         bool
	Index          int
}

type Links struct {
	First string `json:"First"`
	Last  string `json:"Last"`
}
