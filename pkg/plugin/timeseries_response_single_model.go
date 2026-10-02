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

type PiBatchDataWithFloatItem struct {
	Links map[string]interface{} `json:"Links"`
	Items []PiBatchContentItem   `json:"Items"`
	Error *string
}

func (p PiBatchDataWithSingleItem) getUnits(typeFilter string) string {
	if len(p.Items) == 0 {
		return ""
	}
	return p.Items[0].Value.UnitsAbbreviation
}

func (p PiBatchDataWithSingleItem) getItems(typeFilter string) *[]PiBatchContentItem {
	var items []PiBatchContentItem
	if len(p.Items) > 0 {
		items = append(items, p.Items[0].Value)
	}
	return &items
}

func (p PiBatchDataWithSingleItem) getSummaryTypes() *[]string {
	return singleSeries(len(p.Items))
}

func (p PiBatchDataWithFloatItem) getUnits(typeFilter string) string {
	if len(p.Items) == 0 {
		return ""
	}
	return p.Items[0].UnitsAbbreviation
}

func (p PiBatchDataWithFloatItem) getItems(typeFilter string) *[]PiBatchContentItem {
	return &p.Items
}

// getSummaryTypes returns no series for a calculation without values in the time range.
func (p PiBatchDataWithFloatItem) getSummaryTypes() *[]string {
	return singleSeries(len(p.Items))
}

// singleSeries returns the summary types of a response without summary: one series, or none when the response has
// no items.
func singleSeries(items int) *[]string {
	typeValues := []string{}
	if items > 0 {
		typeValues = append(typeValues, "")
	}
	return &typeValues
}
