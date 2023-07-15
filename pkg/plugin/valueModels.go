package plugin

import (
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type PointDigitalState struct {
	IsSystem bool   `json:"IsSystem"`
	Name     string `json:"Name"`
	Value    int    `json:"Value"`
}

type PointSummaryValue struct {
	Timestamp         string      `json:"Timestamp"`
	Value             interface{} `json:"Value"`
	UnitsAbbreviation string      `json:"UnitsAbbreviation"`
	Good              bool        `json:"Good"`
	Questionable      bool        `json:"Questionable"`
	Substituted       bool        `json:"Substituted"`
	Annotated         bool        `json:"Annotated"`
}

func (p PiBatchContentItem) isAnnotated() bool {
	return p.Annotated
}

func (p PiBatchContentItem) isGood() bool {
	return p.Good
}

func (p PiBatchContentItem) isQuestionable() bool {
	return p.Questionable
}

func (p PiBatchContentItem) isSubstituted() bool {
	return p.Substituted
}

func (p PiBatchContentItem) getTimeStamp() time.Time {
	timeLayout := "2006-01-02T15:04:05.999999999Z07:00"
	timestamp, err := time.Parse(timeLayout, p.Timestamp)
	if err != nil {
		backend.Logger.Error("Error parsing timestamp", "error", err)
	}
	return timestamp
}
