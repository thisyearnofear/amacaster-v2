type CacheItem<T> = {
  value: T
  timestamp: number
}

class Cache {
  private memoryCache: Map<string, CacheItem<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes default TTL

  // Try to get from memory first, then localStorage
  get<T>(key: string, ttl: number = this.DEFAULT_TTL): T | null {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && Date.now() - memoryItem.timestamp < ttl) {
      return memoryItem.value
    }

    // Try localStorage if memory cache missed
    try {
      const item = localStorage.getItem(key)
      if (item) {
        const parsed: CacheItem<T> = JSON.parse(item)
        if (Date.now() - parsed.timestamp < ttl) {
          // Update memory cache
          this.memoryCache.set(key, parsed)
          return parsed.value
        }
        // Remove expired item
        this.remove(key)
      }
    } catch (error) {
      console.warn('Cache read error:', error)
    }

    return null
  }

  set<T>(key: string, value: T): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
    }

    // Set in memory
    this.memoryCache.set(key, item)

    // Set in localStorage
    try {
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('Cache write error:', error)
    }
  }

  remove(key: string): void {
    this.memoryCache.delete(key)
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Cache remove error:', error)
    }
  }

  // Clear all caches
  clear(): void {
    this.memoryCache.clear()
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Cache clear error:', error)
    }
  }
}

export const cache = new Cache()
