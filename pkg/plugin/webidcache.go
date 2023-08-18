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

// WebIDCache is a cache for WebIDs. It is used to reduce the number of requests to the PI Web API.
// It contains two maps. The first map has the path as a key, and the WebID as the value.
// The second map has the WebID as the key, and the cache entry as the value.
type WebIDCache struct {
	webIDPaths map[string]string
	webIDCache map[string]WebIDCacheEntry
}

// newWebIDCache creates a new WebIDCache with initialized maps.
func newWebIDCache() WebIDCache {
	return WebIDCache{
		webIDPaths: make(map[string]string),
		webIDCache: make(map[string]WebIDCacheEntry),
	}
}

type WebIDCacheEntry struct {
	Path         string
	WebID        string
	Type         reflect.Type
	DigitalState bool
	ExpTime      time.Time
	PointType    string
	Units        string
	Description  string
}

// WebIDResponsePiPoint is the response from the PI Web API when requesting a PI Point.
type WebIDResponsePiPoint struct {
	WebID           string `json:"WebId"`
	Name            string `json:"Name"`
	Path            string `json:"Path"`
	Type            string `json:"PointType"`
	DigitalSetName  string `json:"DigitalSetName"`
	EngieeringUnits string `json:"EngineeringUnits"`
	Description     string `json:"Descriptor"`
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

func (w *WebIDResponsePiPoint) getUnits() string {
	return w.EngieeringUnits
}

// WebIDResponseAttribute is the response from the PI Web API when requesting an attribute.
type WebIDResponseAttribute struct {
	WebID            string `json:"WebId"`
	Name             string `json:"Name"`
	Path             string `json:"Path"`
	Type             string `json:"Type"`
	DigitalSetName   string `json:"DigitalSetName"`
	DefaultUnitsName string `json:"DefaultUnitsName"`
	Description      string `json:"Description"`
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

func (w *WebIDResponseAttribute) getUnits() string {
	return w.DefaultUnitsName
}

// WebIDResponse is an interface for the WebID responses.
type WebIDResponse interface {
	getType() string
	getWebID() string
	getDigitalSetName() string
	getUnits() string
}

func (d *Datasource) getWebID(ctx context.Context, path string, isPiPoint bool) (WebIDCacheEntry, error) {
	entry, ok := d.webIDCache.webIDCache[path]

	if ok && time.Now().Before(entry.ExpTime) {
		log.DefaultLogger.Debug("WebID cache hit", "path", path)
		d.webIDCache.webIDPaths[entry.WebID] = path
		return entry, nil
	}
	entry = WebIDCacheEntry{}
	c, err := d.requestWebID(ctx, path, isPiPoint)
	if err != nil {
		log.DefaultLogger.Error("WebID cache error", "path", path, "error", err)
		return entry, err
	}
	log.DefaultLogger.Debug("WebID cache added", "path", path)
	d.webIDCache.webIDCache[path] = c
	d.webIDCache.webIDPaths[c.WebID] = path
	backend.Logger.Info("WebID cache", "entry", c)
	return c, nil
}

func (d *Datasource) requestWebID(ctx context.Context, path string, isPiPoint bool) (WebIDCacheEntry, error) {
	uri := ""
	if isPiPoint {
		uri = "/points?selectedFields=WebId%3BName%3BPath%3BPointType%3BDigitalSetName%3BDescriptor%3BEngineeringUnits&path=\\\\"
		uri += strings.Replace(strings.Replace(path, "|", "\\", -1), ";", "\\", -1)
	} else {
		uri = "/attributes?selectedFields=WebId%3BName%3BPath%3BType%3BDigitalSetName%3BDescription%3BDefaultUnitsName&path=\\\\"
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

	return WebIDCacheEntry{
		Path:         path,
		WebID:        response.getWebID(),
		Type:         getValueType(response.getType()),
		DigitalState: response.getDigitalSetName() != "",
		ExpTime:      time.Now().Add(5 * time.Minute),
		PointType:    response.getType(),
		Units:        response.getUnits(),
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

func cleanWebIDCache(cache WebIDCache) {
	now := time.Now()
	for key, entry := range cache.webIDCache {
		if now.After(entry.ExpTime) {
			log.DefaultLogger.Info("Removing aged WebID path: ", entry.Path)
			delete(cache.webIDCache, key)
			delete(cache.webIDPaths, entry.Path)
		}
	}
}

func (d *Datasource) getTypeForWebID(webID string) reflect.Type {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(5 * time.Minute)
			d.webIDCache.webIDCache[path] = entry
			return entry.Type
		}
	}
	// If the specified webID is not found in the webIDCache, return type of string.
	return reflect.TypeOf([]string{})
}

func (d *Datasource) getDigitalStateForWebID(webID string) bool {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(5 * time.Minute)
			d.webIDCache.webIDCache[path] = entry
			return entry.DigitalState
		}
	}
	// If the specified webID is not found in the webIDCache, return false
	return false
}

func (d *Datasource) getPointTypeForWebID(webID string) string {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(5 * time.Minute)
			d.webIDCache.webIDCache[path] = entry
			return entry.PointType
		}
	}
	// If the specified webID is not found in the webIDCache, return empty string
	return ""
}

func (d *Datasource) getUnitsForWebID(webID string) string {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(5 * time.Minute)
			d.webIDCache.webIDCache[path] = entry
			return entry.Units
		}
	}
	// If the specified webID is not found in the webIDCache, return empty string
	return ""
}

func (d *Datasource) getDescriptionForWebID(webID string) string {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(5 * time.Minute)
			d.webIDCache.webIDCache[path] = entry
			return entry.Description
		}
	}
	// If the specified webID is not found in the webIDCache, return empty string
	return ""
}
