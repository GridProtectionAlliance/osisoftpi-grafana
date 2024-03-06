package plugin

type PointDigitalState struct {
	IsSystem bool   `json:"IsSystem"`
	Name     string `json:"Name"`
	Value    int    `json:"Value"`
}

func (p PiBatchContentItem) isGood() bool {
	return p.Good
}
