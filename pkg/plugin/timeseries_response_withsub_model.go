package plugin

type PiBatchDataWithSubItems struct {
	Links map[string]interface{} `json:"Links"`
	Items []struct {
		WebId             string               `json:"WebId"`
		Name              string               `json:"Name"`
		Path              string               `json:"Path"`
		Links             PiBatchContentLinks  `json:"Links"`
		Items             []PiBatchContentItem `json:"Items"`
		UnitsAbbreviation string               `json:"UnitsAbbreviation"`
	} `json:"Items"`
	Error *string
}

func (p PiBatchDataWithSubItems) getUnits(typeFilter string) string {
	if len(p.Items) == 0 {
		return ""
	}
	return p.Items[0].UnitsAbbreviation
}

func (p PiBatchDataWithSubItems) getItems(typeFilter string) *[]PiBatchContentItem {
	if len(p.Items) == 0 {
		return &[]PiBatchContentItem{}
	}
	return &p.Items[0].Items
}

func (p PiBatchDataWithSubItems) getSummaryTypes() *[]string {
	return singleSeries(len(p.Items))
}
