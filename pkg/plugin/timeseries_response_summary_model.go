package plugin

import "github.com/grafana/grafana-plugin-sdk-go/backend"

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

func (p PiBatchDataSummaryItems) getUnits(typeFilter string) string {
	var units string
	if len(typeFilter) == 0 {
		return ""
	}

	for _, item := range p.Items[0].Items {
		if item.Type == typeFilter {
			units = item.Value.UnitsAbbreviation
			break
		}
	}
	return units
}

func (p PiBatchDataSummaryItems) getItems(typeFilter string) *[]PiBatchContentItem {
	var items []PiBatchContentItem
	backend.Logger.Info("summary, getItems", "typeFilter", typeFilter)
	for _, item := range p.Items[0].Items {
		if item.Type == typeFilter {
			items = append(items, item.Value)
		}
	}
	return &items
}

func (p PiBatchDataSummaryItems) getSummaryTypes() *[]string {
	var types []string
	seenTypes := make(map[string]bool)
	for _, item := range p.Items[0].Items {
		if _, exists := seenTypes[item.Type]; !exists {
			types = append(types, item.Type)
			seenTypes[item.Type] = true
		}
	}
	return &types
}
