package plugin

import (
	"fmt"
	"sync"
	"testing"
	"time"
)

// The hourly cache cleanup runs while queries read and save WebIDs: it must hold the lock the queries use, or Go
// stops the plugin with "concurrent map writes" (run with -race to detect it).
func TestCleanWebIDCacheConcurrentWithQueries(t *testing.T) {
	d := newTestDatasource()
	var wg sync.WaitGroup
	stop := make(chan struct{})
	for w := 0; w < 4; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			for i := 0; ; i++ {
				select {
				case <-stop:
					return
				default:
				}
				path := fmt.Sprintf(`\\AF\DB\E%d|A%d`, w, i%50)
				d.saveWebID(map[string]interface{}{"WebId": "W" + path, "Type": "Double"}, path, false)
				d.getWebIDEntry("W" + path)
			}
		}(w)
	}
	for i := 0; i < 200; i++ {
		d.cleanWebIDCache()
	}
	close(stop)
	wg.Wait()
}

// An expired WebID is removed from both cache maps: the path -> entry map and the WebID -> path map.
func TestCleanWebIDCacheRemovesExpiredWebIDs(t *testing.T) {
	d := newTestDatasource()
	d.saveWebID(map[string]interface{}{"WebId": "W-old", "Type": "Double"}, `\\AF\DB\E|Old`, false)
	d.saveWebID(map[string]interface{}{"WebId": "W-new", "Type": "Double"}, `\\AF\DB\E|New`, false)
	old := d.webIDCache.webIDCache[`\\AF\DB\E|Old`]
	old.ExpTime = old.ExpTime.Add(-24 * time.Hour)
	d.webIDCache.webIDCache[`\\AF\DB\E|Old`] = old

	d.cleanWebIDCache()

	if _, ok := d.webIDCache.webIDCache[`\\AF\DB\E|Old`]; ok {
		t.Error("the expired entry is still cached")
	}
	if _, ok := d.webIDCache.webIDPaths["W-old"]; ok {
		t.Error("the expired WebID is still in the WebID -> path map")
	}
	if _, ok := d.webIDCache.webIDPaths["W-new"]; !ok {
		t.Error("a valid WebID was removed")
	}
}
