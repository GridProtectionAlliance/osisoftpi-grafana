package plugin

import (
	"sync"
)

// Cache is a basic in-memory key-value cache implementation.
type Cache[K comparable, V any] struct {
	items map[K]V    // The map storing key-value pairs.
	mu    sync.Mutex // Mutex for controlling concurrent access to the cache.
}

// New creates a new Cache instance.
func newCache[K comparable, V any]() *Cache[K, V] {
	return &Cache[K, V]{
		items: make(map[K]V),
	}
}

// Set adds or updates a key-value pair in the cache.
func (c *Cache[K, V]) Set(key K, value V) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = value
}

// Get retrieves the value associated with the given key from the cache. The bool
// return value will be false if no matching key is found, and true otherwise.
func (c *Cache[K, V]) Get(key K) (V, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	value, found := c.items[key]
	return value, found
}

// Remove deletes the key-value pair with the specified key from the cache.
func (c *Cache[K, V]) Remove(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// Pop removes and returns the value associated with the specified key from the cache.
func (c *Cache[K, V]) Pop(key K) (V, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	value, found := c.items[key]

	// If the key is found, delete the key-value pair from the cache.
	if found {
		delete(c.items, key)
	}

	return value, found
}
