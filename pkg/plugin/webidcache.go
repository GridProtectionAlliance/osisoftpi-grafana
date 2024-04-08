package plugin

import (
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
	duration   time.Duration
}

// newWebIDCache creates a new WebIDCache with initialized maps.
func newWebIDCache() WebIDCache {
	return WebIDCache{
		webIDPaths: make(map[string]string),
		webIDCache: make(map[string]WebIDCacheEntry),
		duration:   1 * time.Hour,
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

func (d *Datasource) getCachedWebID(path string) *WebIDCacheEntry {
	d.datasourceMutex.Lock()
	value := d._getCachedWebID(path)
	d.datasourceMutex.Unlock()
	return value
}

func (d *Datasource) _getCachedWebID(path string) *WebIDCacheEntry {
	entry, ok := d.webIDCache.webIDCache[path]

	if ok && time.Now().Before(entry.ExpTime) {
		log.DefaultLogger.Debug("WebID cache hit", "path", path)
		d.webIDCache.webIDPaths[entry.WebID] = path
		return &entry
	}
	return nil
}

func (d *Datasource) getRequestWebId(path string, isPiPoint bool) string {
	uri := ""
	if isPiPoint {
		uri = `points?selectedFields=WebId;Name;Path;PointType;DigitalSetName;Descriptor;EngineeringUnits&path=\\`
		uri += strings.Replace(strings.Replace(path, "|", `\`, -1), ";", `\`, -1)
	} else {
		uri = `attributes?selectedFields=WebId;Name;Path;Type;DigitalSetName;Description;DefaultUnitsName&path=\\`
		uri += path
	}
	return uri
}
func (d *Datasource) saveWebID(data interface{}, path string, isPiPoint bool) string {
	d.datasourceMutex.Lock()
	savedWebID := d._saveWebID(data, path, isPiPoint)
	d.datasourceMutex.Unlock()
	return savedWebID
}

func (d *Datasource) _saveWebID(data interface{}, path string, isPiPoint bool) string {
	r, err := json.Marshal(data)
	if err != nil {
		backend.Logger.Warn("Error saving web id", "data", data)
		return ""
	}

	var response WebIDResponse
	if isPiPoint {
		response = &WebIDResponsePiPoint{}
	} else {
		response = &WebIDResponseAttribute{}
	}
	err = json.Unmarshal(r, &response)
	if err != nil {
		// Handle unmarshaling error
		backend.Logger.Error("Error unmarshaling JSON response", "error", err)
		return ""
	}

	entry := WebIDCacheEntry{
		Path:         path,
		WebID:        response.getWebID(),
		Type:         getValueType(response.getType()),
		DigitalState: response.getDigitalSetName() != "",
		ExpTime:      time.Now().Add(d.webIDCache.duration),
		PointType:    response.getType(),
		Units:        response.getUnits(),
	}

	d.webIDCache.webIDCache[path] = entry
	d.webIDCache.webIDPaths[entry.WebID] = path

	return entry.WebID
}

func getValueType(Type string) reflect.Type {
	var dataType reflect.Type
	switch Type {
	case "Boolean":
		dataType = reflect.TypeOf([]bool{})
	case "Byte":
		dataType = reflect.TypeOf([]byte{})
	case "DateTime":
		dataType = reflect.TypeOf([]time.Time{})
	case "Single", "Double", "Float16", "Float32", "Float64":
		dataType = reflect.TypeOf([]float64{})
	case "GUID":
		dataType = reflect.TypeOf([]string{})
	case "Int16", "Int32", "EnumerationValue":
		dataType = reflect.TypeOf([]int32{})
	case "Int64":
		dataType = reflect.TypeOf([]int64{})
	case "String":
		dataType = reflect.TypeOf([]string{})
	case "Timestamp":
		dataType = reflect.TypeOf([]time.Time{})
	case "Digital":
		dataType = reflect.TypeOf([]int32{})
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
	d.datasourceMutex.Lock()
	webIdType := d._getTypeForWebID(webID)
	d.datasourceMutex.Unlock()
	return webIdType
}

func (d *Datasource) _getTypeForWebID(webID string) reflect.Type {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(d.webIDCache.duration)
			d.webIDCache.webIDCache[path] = entry
			return entry.Type
		}
	}
	// If the specified webID is not found in the webIDCache, return type of string.
	return reflect.TypeOf([]string{})
}

func (d *Datasource) getDigitalStateForWebID(webID string) bool {
	d.datasourceMutex.Lock()
	webIdState := d._getDigitalStateForWebID(webID)
	d.datasourceMutex.Unlock()
	return webIdState
}

func (d *Datasource) _getDigitalStateForWebID(webID string) bool {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(d.webIDCache.duration)
			d.webIDCache.webIDCache[path] = entry
			return entry.DigitalState
		}
	}
	// If the specified webID is not found in the webIDCache, return false
	return false
}

func (d *Datasource) getPointTypeForWebID(webID string) string {
	d.datasourceMutex.Lock()
	webIdPointType := d._getPointTypeForWebID(webID)
	d.datasourceMutex.Unlock()
	return webIdPointType
}

func (d *Datasource) _getPointTypeForWebID(webID string) string {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(d.webIDCache.duration)
			d.webIDCache.webIDCache[path] = entry
			return entry.PointType
		}
	}
	// If the specified webID is not found in the webIDCache, return empty string
	return ""
}

func (d *Datasource) getUnitsForWebID(webID string) string {
	d.datasourceMutex.Lock()
	webIdUnits := d._getUnitsForWebID(webID)
	d.datasourceMutex.Unlock()
	return webIdUnits
}

func (d *Datasource) _getUnitsForWebID(webID string) string {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(d.webIDCache.duration)
			d.webIDCache.webIDCache[path] = entry
			return entry.Units
		}
	}
	// If the specified webID is not found in the webIDCache, return empty string
	return ""
}

func (d *Datasource) getDescriptionForWebID(webID string) string {
	d.datasourceMutex.Lock()
	webIdDescription := d._getDescriptionForWebID(webID)
	d.datasourceMutex.Unlock()
	return webIdDescription
}

func (d *Datasource) _getDescriptionForWebID(webID string) string {
	path, exists := d.webIDCache.webIDPaths[webID]
	if exists {
		entry, exists := d.webIDCache.webIDCache[path]
		if exists {
			entry.ExpTime = time.Now().Add(d.webIDCache.duration)
			d.webIDCache.webIDCache[path] = entry
			return entry.Description
		}
	}
	// If the specified webID is not found in the webIDCache, return empty string
	return ""
}
