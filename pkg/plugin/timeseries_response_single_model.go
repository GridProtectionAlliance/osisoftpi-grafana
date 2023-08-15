package plugin

type PiBatchDataWithSingleItem struct {
	Links map[string]interface{} `json:"Links"`
	Items []struct {
		WebId string              `json:"WebId"`
		Name  string              `json:"Name"`
		Path  string              `json:"Path"`
		Links PiBatchContentLinks `json:"Links"`
		Value PiBatchContentItem  `json:"Value"`
	} `json:"Items"`
	Error *string
}

func (p PiBatchDataWithSingleItem) getUnits(typeFilter string) string {
	return p.Items[0].Value.UnitsAbbreviation
}

func (p PiBatchDataWithSingleItem) getItems(typeFilter string) *[]PiBatchContentItem {
	var items []PiBatchContentItem
	items = append(items, p.Items[0].Value)
	return &items
}

func (p PiBatchDataWithSingleItem) getSummaryTypes() *[]string {
	typeValues := make([]string, 1)
	typeValues[0] = ""
	return &typeValues
}
