package plugin

import (
	"context"
	"encoding/json"
	"reflect"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type WebIDCacheEntry struct {
	Path         string
	WebID        string
	Type         reflect.Type
	DigitalState bool
	ExpTime      time.Time
}

type WebIDResponsePiPoint struct {
	WebID          string `json:"WebId"`
	Name           string `json:"Name"`
	Path           string `json:"Path"`
	Type           string `json:"PointType"`
	DigitalSetName string `json:"DigitalSetName"`
}

func (w *WebIDResponsePiPoint) getType() string {
	return w.Type
}

func (w *WebIDResponsePiPoint) getWebID() string {
	return w.WebID
}

func (w *WebIDResponsePiPoint) getDigitalSetName() string {
	return w.DigitalSetName
}

type WebIDResponseAttribute struct {
	WebID          string `json:"WebId"`
	Name           string `json:"Name"`
	Path           string `json:"Path"`
	Type           string `json:"Type"`
	DigitalSetName string `json:"DigitalSetName"`
}

func (w *WebIDResponseAttribute) getType() string {
	return w.Type
}

func (w *WebIDResponseAttribute) getWebID() string {
	return w.WebID
}

func (w *WebIDResponseAttribute) getDigitalSetName() string {
	return w.DigitalSetName
}

type WebIDResponse interface {
	getType() string
	getWebID() string
	getDigitalSetName() string
}

func (d *Datasource) getWebID(ctx context.Context, path string, isPiPoint bool) (WebIDCacheEntry, error) {
	WebIDCache, ok := d.webIDCache[path]

	if ok && time.Now().Before(WebIDCache.ExpTime) {
		log.DefaultLogger.Debug("WebID cache hit", "path", path)
		return WebIDCache, nil
	}
	WebIDCache = WebIDCacheEntry{}
	c, err := d.requestWebID(ctx, path, isPiPoint)
	if err != nil {
		log.DefaultLogger.Error("WebID cache error", "path", path, "error", err)
		return WebIDCache, err
	}
	log.DefaultLogger.Debug("WebID cache added", "path", path)
	d.webIDCache[path] = c
	backend.Logger.Info("WebID cache", "entry", c)
	return c, nil
}

// Fixme: missing point type
func (d *Datasource) requestWebID(ctx context.Context, path string, isPiPoint bool) (WebIDCacheEntry, error) {
	uri := ""
	if isPiPoint {
		uri = "/points?selectedFields=WebId%3BName%3BPath%3BPointType%3BDigitalSetName&path=\\\\"
		uri += strings.Replace(strings.Replace(path, "|", "\\", -1), ";", "\\", -1)
	} else {
		uri = "/attributes?selectedFields=WebId%3BName%3BPath%3BType%3BDigitalSetName&path=\\\\"
		uri += path
	}
	log.DefaultLogger.Info("WebID request", "uri", uri)

	r, e := d.apiGet(ctx, uri)
	if e != nil {
		return WebIDCacheEntry{}, e
	}

	var response WebIDResponse
	if isPiPoint {
		response = &WebIDResponsePiPoint{}
	} else {
		response = &WebIDResponseAttribute{}
	}
	json.Unmarshal(r, &response)

	dataType := getValueType(response.getType())

	return WebIDCacheEntry{
		Path:         path,
		WebID:        response.getWebID(),
		Type:         dataType,
		DigitalState: response.getDigitalSetName() != "",
		ExpTime:      time.Now().Add(5 * time.Minute),
	}, nil
}

func getValueType(Type string) reflect.Type {
	var dataType reflect.Type
	switch Type {
	case "Boolean":
		dataType = reflect.TypeOf([]bool{})
	case "Byte":
		dataType = reflect.TypeOf([]byte{})
	case "DateTime":
		dataType = reflect.TypeOf(time.Time{})
	case "Single", "Double", "Float16", "Float32", "Float64":
		dataType = reflect.TypeOf([]float64{})
	case "GUID":
		dataType = reflect.TypeOf([]string{})
	case "Int16", "Int32":
		dataType = reflect.TypeOf([]int32{})
	case "Int64":
		dataType = reflect.TypeOf([]int64{})
	case "String":
		dataType = reflect.TypeOf([]string{})
	case "Timestamp":
		dataType = reflect.TypeOf([]time.Time{})
	case "Digital":
		dataType = reflect.TypeOf([]string{})
	case "Blob":
		dataType = reflect.TypeOf([]byte{})
	default:
		dataType = reflect.TypeOf([]string{})
	}
	return dataType
}

func cleanWebIDCache(webIDCache map[string]WebIDCacheEntry) {
	now := time.Now()
	log.DefaultLogger.Debug("Scanning WebID cache...")
	for key, entry := range webIDCache {
		if now.Sub(entry.ExpTime) > 0*time.Minute {
			log.DefaultLogger.Debug("Removing aged WebID: ", entry.Path)
			delete(webIDCache, key)
		}
	}
}

func (d *Datasource) getTypeForWebID(webID string) reflect.Type {
	for _, entry := range d.webIDCache {
		if entry.WebID == webID {
			return entry.Type
		}
	}
	// If the specified webID is not found in the webIDCache, return type of string.
	return reflect.TypeOf([]string{})
}

func (d *Datasource) getDigitalStateforWebID(webID string) bool {
	for _, entry := range d.webIDCache {
		if entry.WebID == webID {
			return entry.DigitalState
		}
	}
	// If the specified webID is not found in the webIDCache, return false
	return false
}