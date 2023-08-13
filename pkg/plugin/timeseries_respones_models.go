package plugin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type ErrorResponse struct {
	Errors []string `json:"Errors"`
}

type PIBatchResponse struct {
	Status  int               `json:"Status"`
	Headers map[string]string `json:"Headers"`
	Content PiBatchData       `json:"Content"`
}

type PIBatchResponseBase struct {
	Status  int               `json:"Status"`
	Headers map[string]string `json:"Headers"`
}

type PiBatchData interface {
	getUnits() string
	getItems() *[]PiBatchContentItem
}

type PiBatchDataError struct {
	Error *ErrorResponse
}

func (p PiBatchDataError) getUnits() string {
	return ""
}

func (p PiBatchDataError) getItems() *[]PiBatchContentItem {
	var items []PiBatchContentItem
	return &items
}

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

func (p PiBatchDataWithSubItems) getUnits() string {
	return p.Items[0].UnitsAbbreviation
}

func (p PiBatchDataWithSubItems) getItems() *[]PiBatchContentItem {
	return &p.Items[0].Items
}

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

func (p PiBatchDataWithSingleItem) getUnits() string {
	return p.Items[0].Value.UnitsAbbreviation
}

func (p PiBatchDataWithSingleItem) getItems() *[]PiBatchContentItem {
	var items []PiBatchContentItem
	items = append(items, p.Items[0].Value)
	return &items
}

type PiBatchDataWithoutSubItems struct {
	Links             map[string]interface{} `json:"Links"`
	Items             []PiBatchContentItem   `json:"Items"`
	UnitsAbbreviation string                 `json:"UnitsAbbreviation"`
}

func (p PiBatchDataWithoutSubItems) getUnits() string {
	return p.UnitsAbbreviation
}

func (p PiBatchDataWithoutSubItems) getItems() *[]PiBatchContentItem {
	return &p.Items
}

// Custom unmarshaler to unmarshal PIBatchResponse to the correct struct type.
// If the first item in the Items array has a WebId, then we have a PiBatchDataWithSubItems
// If the first item in the Items array does not have a WebId, then we have a PiBatchDataWithoutSubItems
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

	items, ok := Content["Items"].([]interface{})
	if !ok {
		backend.Logger.Error("key 'Items' not found in 'Content'", "Content", Content)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	item, ok := items[0].(map[string]interface{})
	if !ok {
		backend.Logger.Error("key '0' not found in 'Items'", "Items", items)
		//Return an error Batch Data Response to the user is notified
		errMessages := &[]string{"Could not process response from PI Web API"}
		p.Content = createPiBatchDataError(errMessages)
		return nil
	}

	// Check if the response contained a WebId, if the response did contain a WebID
	// then it is a PiBatchDataWithSubItems, otherwise it is a PiBatchDataWithoutSubItems
	_, ok = item["WebId"].(string)

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

	// Check if the response contained a value or a subitems array of values
	_, ok = item["Value"].(interface{})
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

func createPiBatchDataError(errorMessage *[]string) *PiBatchDataError {
	errorResponse := &ErrorResponse{Errors: *errorMessage}
	resContent := &PiBatchDataError{Error: errorResponse}
	return resContent
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
