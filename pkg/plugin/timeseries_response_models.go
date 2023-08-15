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
	Content PiBatchData       `json:"Content"`
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
// If the first item is a Value then we have a PiBatchDataWithSingleItem
// If the first item in the Items array has a Type property, then we have a PiBatchDataSummaryItems
// All other formations will return an PiBatchDataError
func (p *PIBatchResponse) UnmarshalJSON(data []byte) error {
	var PIBatchResponseBase PIBatchResponseBase
	json.Unmarshal(data, &PIBatchResponseBase)
	p.Status = PIBatchResponseBase.Status
	p.Headers = PIBatchResponseBase.Headers

	// // Unmarshal into a generic map to get the "Items" key
	// // Determine if Items[0].WebId is valid. If it is,
	// // then we have a PiBatchDataWithSubItems
	var rawData map[string]interface{}
	err := json.Unmarshal(data, &rawData)
	if err != nil {
		backend.Logger.Error("Error unmarshalling batch response", err)
		return err
	}

	Content, ok := rawData["Content"].(map[string]interface{})
	if !ok {
		backend.Logger.Error("key 'Content' not found in raw JSON", "rawData", rawData)
		return fmt.Errorf("key 'Content' not found in raw JSON")
	}

	rawContent, _ := json.Marshal(Content)

	if p.Status != http.StatusOK {
		temp_error := &ErrorResponse{}
		err = json.Unmarshal(rawContent, temp_error)
		if err != nil {
			backend.Logger.Error("Error Batch Error Response", "Error", err)
			return err
		}
		p.Content = createPiBatchDataError(&temp_error.Errors)
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

	parentItem, ok := parentItems[0].(map[string]interface{})
	if !ok {
		backend.Logger.Error("key '0' not found in 'Items'", "Items", parentItems)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	// Check if the response contained a value or a subitems array of values
	_, ok = parentItem["Value"]
	if ok {
		ResContent := PiBatchDataWithSingleItem{}
		err = json.Unmarshal(rawContent, &ResContent)
		if err != nil {
			backend.Logger.Error("Error unmarshalling batch response", err)
			//Return an error Batch Data Response to the user is notified
			errMessages := &[]string{"Could not process response from PI Web API"}
			p.Content = createPiBatchDataError(errMessages)
			return nil
		}
		p.Content = ResContent
		return nil
	}

	// Check if the 'Items' key exists and is a slice.
	itemsSlice, ok := parentItem["Items"].([]interface{})
	if !ok {
		backend.Logger.Error("key 'Items' not found in 'Items'", "Items", parentItem)
		backend.Logger.Error("Error unmarshalling batch response", err)
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
				backend.Logger.Error("Error unmarshalling batch response", err)
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
			backend.Logger.Error("Error unmarshalling batch response", err)
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
		backend.Logger.Error("Error unmarshalling batch response", err)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}
	p.Content = ResContent
	return nil
}
