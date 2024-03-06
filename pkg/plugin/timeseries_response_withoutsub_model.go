package plugin

type PiBatchDataWithoutSubItems struct {
	Links             map[string]interface{} `json:"Links"`
	Items             []PiBatchContentItem   `json:"Items"`
	UnitsAbbreviation string                 `json:"UnitsAbbreviation"`
}

func (p PiBatchDataWithoutSubItems) getUnits(typeFilter string) string {
	return p.UnitsAbbreviation
}

func (p PiBatchDataWithoutSubItems) getItems(typeFilter string) *[]PiBatchContentItem {
	return &p.Items
}

func (p PiBatchDataWithoutSubItems) getSummaryTypes() *[]string {
	typeValues := make([]string, 1)
	typeValues[0] = ""
	return &typeValues
}
