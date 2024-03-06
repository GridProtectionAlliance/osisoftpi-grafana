package plugin

type ErrorResponse struct {
	Errors []string `json:"Errors"`
}

type PiBatchDataError struct {
	Error *ErrorResponse
}

func (p PiBatchDataError) getUnits(typeFilter string) string {
	return ""
}

func (p PiBatchDataError) getItems(typeFilter string) *[]PiBatchContentItem {
	var items []PiBatchContentItem
	return &items
}

func (p PiBatchDataError) getSummaryTypes() *[]string {
	typeValues := make([]string, 1)
	typeValues[0] = ""
	return &typeValues
}

func createPiBatchDataError(errorMessage *[]string) *PiBatchDataError {
	errorResponse := &ErrorResponse{Errors: *errorMessage}
	resContent := &PiBatchDataError{Error: errorResponse}
	return resContent
}
