package plugin

import (
	"time"
)

type PointDigitalState struct {
	IsSystem bool   `json:"IsSystem"`
	Name     string `json:"Name"`
	Value    int    `json:"Value"`
}

type PointSummaryValue struct {
	Timestamp         time.Time   `json:"Timestamp"`
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
