package plugin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type PIBatchResponse struct {
	Status  int               `json:"Status"`
	Headers map[string]string `json:"Headers"`
	Content interface{}       `json:"Content"`
}

type PIBatchResponseBase struct {
	Status  int               `json:"Status"`
	Headers map[string]string `json:"Headers"`
}

type PiBatchContentLinks struct {
	Source string `json:"Source"`
}

type PiBatchContentItem struct {
	Timestamp         time.Time   `json:"Timestamp"`
	Value             interface{} `json:"Value"`
	UnitsAbbreviation string      `json:"UnitsAbbreviation"`
	Good              bool        `json:"Good"`
	Questionable      bool        `json:"Questionable"`
	Substituted       bool        `json:"Substituted"`
	Annotated         bool        `json:"Annotated"`
}

type PiBatchData interface {
	getUnits(typeFilter string) string
	getSummaryTypes() *[]string
	getItems(typeFilter string) *[]PiBatchContentItem
}

// Custom unmarshaler to unmarshal PIBatchResponse to the correct struct type.
// If the first item in the Items array has a WebId, then we have a PiBatchDataWithSubItems
// If the first item in the Items array does not have a WebId, then we have a PiBatchDataWithoutSubItems
// If the first item is a Value then we have a PiBatchDataWithSingleItem, or a PiBatchDataWithFloatItem for calculations
// If the first item has a Type and a Value, then we have a PiBatchDataCalculationSummaryItems
// If the first item in the Items array has a Type property, then we have a PiBatchDataSummaryItems
// An empty Items array (a calculation without values) is a PiBatchDataWithFloatItem without items
// All other formations will return an PiBatchDataError
func (p *PIBatchResponse) UnmarshalJSON(data []byte) error {
	var PIBatchResponseBase PIBatchResponseBase
	// Status and Headers are optional: an error here is reported by the unmarshal of the items below.
	_ = json.Unmarshal(data, &PIBatchResponseBase)
	p.Status = PIBatchResponseBase.Status
	p.Headers = PIBatchResponseBase.Headers

	// // Unmarshal into a generic map to get the "Items" key
	// // Determine if Items[0].WebId is valid. If it is,
	// // then we have a PiBatchDataWithSubItems
	var rawData map[string]interface{}
	err := json.Unmarshal(data, &rawData)
	if err != nil {
		backend.Logger.Error("Error unmarshalling raw data", "error", err.Error())
		return err
	}

	Content, ok := rawData["Content"].(map[string]interface{})

	if p.Status != http.StatusOK {
		var errors *[]string
		if message, ok := rawData["Content"].(string); ok { // error is a string inside content
			errors = &[]string{message}
		} else {
			_, ok := Content["Message"].(string)
			if ok {
				// error is a string inside Message object
				errors = &[]string{Content["Message"].(string)}
			} else {
				// error is a string inside Error object
				errors, err = convertError(Content)
				if err != nil {
					return err
				}
			}
		}
		p.Content = createPiBatchDataError(errors)
		return nil
	}

	if !ok {
		backend.Logger.Error("key 'Content' not found in raw JSON", "rawData", rawData)
		return fmt.Errorf("key 'Content' not found in raw JSON")
	}

	rawContent, _ := json.Marshal(Content)

	_, ok = Content["WebId"]
	if ok {
		p.Content = Content
		return nil
	}

	parentItems, ok := Content["Items"].([]interface{})
	if !ok {
		backend.Logger.Error("key 'Items' not found in 'Content'", "Content", Content)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	// A calculation without values in the time range returns no items: no series, and no error
	if len(parentItems) == 0 {
		p.Content = PiBatchDataWithFloatItem{}
		return nil
	}

	parentItem, ok := parentItems[0].(map[string]interface{})
	if !ok {
		backend.Logger.Error("key '0' not found in 'Items'", "Items", parentItems)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	// Summaries of a calculation list the values of every summary type directly (Items[].Type and Items[].Value)
	value, exists := parentItem["Value"]
	if _, isSummary := parentItem["Type"]; isSummary && exists {
		ResContent := PiBatchDataCalculationSummaryItems{}
		err = json.Unmarshal(rawContent, &ResContent)
		if err != nil {
			backend.Logger.Error("Error unmarshalling batch response 2", "error", err.Error())
			//Return an error Batch Data Response to the user is notified
			errMessages := &[]string{"Could not process response from PI Web API"}
			p.Content = createPiBatchDataError(errMessages)
			return nil
		}
		p.Content = ResContent
		return nil
	}

	// Check if the response contained a value or a subitems array of values
	if exists {
		_, isFloat := value.(float64)
		// Calculations list the values directly (Items[].Timestamp), whatever their type: text, boolean or a
		// system state such as "Calc Failed". Last values of stream sets nest them (Items[].Value.Timestamp).
		_, isValue := parentItem["Timestamp"]
		if isFloat || isValue {
			ResContent := PiBatchDataWithFloatItem{}
			err = json.Unmarshal(rawContent, &ResContent)
			if err != nil {
				backend.Logger.Error("Error unmarshalling batch response 3", "error", err.Error(), "data", parentItem["Value"])
				//Return an error Batch Data Response to the user is notified
				errMessages := &[]string{"Could not process response from PI Web API"}
				p.Content = createPiBatchDataError(errMessages)
				return nil
			}
			p.Content = ResContent
		} else {
			ResContent := PiBatchDataWithSingleItem{}
			err = json.Unmarshal(rawContent, &ResContent)
			if err != nil {
				backend.Logger.Error("Error unmarshalling batch response 3", "error", err.Error(), "data", parentItem["Value"])
				//Return an error Batch Data Response to the user is notified
				errMessages := &[]string{"Could not process response from PI Web API"}
				p.Content = createPiBatchDataError(errMessages)
				return nil
			}
			p.Content = ResContent
		}
		return nil
	}

	// Check if the 'Items' key exists and is a slice.
	itemsSlice, ok := parentItem["Items"].([]interface{})
	if !ok {
		backend.Logger.Error("key 'Items' not found in 'Items'", "Items", parentItem)
		backend.Logger.Error("Error unmarshalling batch response 4")
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	// If there's at least one item in the slice, check its type.
	if len(itemsSlice) > 0 {
		firstItem, ok := itemsSlice[0].(map[string]interface{})
		if !ok {
			backend.Logger.Error("First item in 'Items' is not a map[string]interface{}", "FirstItem", itemsSlice[0])
			//Return an error Batch Data Response to the user is notified
			errMessages := &[]string{"First item in 'Items' is not a map[string]interface{}"}
			p.Content = createPiBatchDataError(errMessages)
			return nil
		}

		// Now check for the "Type" key.
		if _, ok := firstItem["Type"]; ok {
			// This is a summary response
			ResContent := PiBatchDataSummaryItems{}
			err = json.Unmarshal(rawContent, &ResContent)
			if err != nil {
				backend.Logger.Error("Error unmarshalling batch response 5", "error", err.Error())
				//Return an error Batch Data Response to the user is notified
				errMessages := &[]string{"Could not process response from PI Web API"}
				p.Content = createPiBatchDataError(errMessages)
				return nil
			}
			p.Content = ResContent
			return nil
		}
	}

	// Check if the response contained a WebId, if the response did contain a WebID
	// then it is a PiBatchDataWithSubItems, otherwise it is a PiBatchDataWithoutSubItems
	_, ok = parentItem["WebId"].(string)

	if !ok {
		ResContent := PiBatchDataWithoutSubItems{}
		err = json.Unmarshal(rawContent, &ResContent)
		if err != nil {
			backend.Logger.Error("Error unmarshalling batch response 6", "error", err.Error())
			//Return an error Batch Data Response so the user is notified
			errMessages := &[]string{"Could not process response from PI Web API"}
			p.Content = createPiBatchDataError(errMessages)
			return nil
		}
		p.Content = ResContent
		return nil
	}

	// The default response is a PiBatchDataWithSubItems, this works
	ResContent := PiBatchDataWithSubItems{}
	err = json.Unmarshal(rawContent, &ResContent)
	if err != nil {
		backend.Logger.Error("Error unmarshalling batch response 7", "error", err.Error())
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}
	p.Content = ResContent
	return nil
}
