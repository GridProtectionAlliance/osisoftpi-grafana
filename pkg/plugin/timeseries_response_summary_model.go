package plugin

type PiBatchDataSummaryItems struct {
	Links map[string]interface{} `json:"Links"`
	Items []struct {
		WebId string               `json:"WebId"`
		Name  string               `json:"Name"`
		Path  string               `json:"Path"`
		Links PiBatchContentLinks  `json:"Links"`
		Items []PiBatchSummaryItem `json:"Items"`
	} `json:"Items"`
	Error *string
}

type PiBatchSummaryItem struct {
	Type  string             `json:"Type"`
	Value PiBatchContentItem `json:"Value"`
}

// PiBatchDataCalculationSummaryItems is the response of calculation/summary: the values of every summary type are
// listed directly, not inside a stream as in the stream set summaries.
type PiBatchDataCalculationSummaryItems struct {
	Links map[string]interface{} `json:"Links"`
	Items []PiBatchSummaryItem   `json:"Items"`
}

// summaryItems returns the values of the stream (the only one of the request).
func (p PiBatchDataSummaryItems) summaryItems() []PiBatchSummaryItem {
	if len(p.Items) == 0 {
		return nil
	}
	return p.Items[0].Items
}

func (p PiBatchDataSummaryItems) getUnits(typeFilter string) string {
	return summaryUnits(p.summaryItems(), typeFilter)
}

func (p PiBatchDataSummaryItems) getItems(typeFilter string) *[]PiBatchContentItem {
	return summaryValues(p.summaryItems(), typeFilter)
}

func (p PiBatchDataSummaryItems) getSummaryTypes() *[]string {
	return summaryTypes(p.summaryItems())
}

func (p PiBatchDataCalculationSummaryItems) getUnits(typeFilter string) string {
	return summaryUnits(p.Items, typeFilter)
}

func (p PiBatchDataCalculationSummaryItems) getItems(typeFilter string) *[]PiBatchContentItem {
	return summaryValues(p.Items, typeFilter)
}

func (p PiBatchDataCalculationSummaryItems) getSummaryTypes() *[]string {
	return summaryTypes(p.Items)
}

// summaryUnits returns the units of the values of one summary type.
func summaryUnits(summaryItems []PiBatchSummaryItem, typeFilter string) string {
	if len(typeFilter) == 0 {
		return ""
	}
	for _, item := range summaryItems {
		if item.Type == typeFilter {
			return item.Value.UnitsAbbreviation
		}
	}
	return ""
}

// summaryValues returns the values of one summary type.
func summaryValues(summaryItems []PiBatchSummaryItem, typeFilter string) *[]PiBatchContentItem {
	var items []PiBatchContentItem
	for _, item := range summaryItems {
		if item.Type == typeFilter {
			items = append(items, item.Value)
		}
	}
	return &items
}

// summaryTypes returns the summary types in the order of the response, one series each.
func summaryTypes(summaryItems []PiBatchSummaryItem) *[]string {
	types := []string{}
	seenTypes := make(map[string]bool)
	for _, item := range summaryItems {
		if !seenTypes[item.Type] {
			types = append(types, item.Type)
			seenTypes[item.Type] = true
		}
	}
	return &types
}
