package plugin

type PointDigitalState struct {
	IsSystem bool   `json:"IsSystem"`
	Name     string `json:"Name"`
	Value    int    `json:"Value"`
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
