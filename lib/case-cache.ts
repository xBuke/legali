/**
 * Case Data Caching Strategy
 * Implements intelligent caching for case data, search results, and related information
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  key: string
}

interface CaseCacheConfig {
  defaultTTL: number
  maxSize: number
  enablePersistentCache: boolean
}

class CaseCache {
  private cache = new Map<string, CacheItem<any>>()
  private config: CaseCacheConfig

  constructor(config: CaseCacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enablePersistentCache: true
  }) {
    this.config = config
    this.loadFromLocalStorage()
  }

  /**
   * Set cache item with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    }

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, item)
    
    if (this.config.enablePersistentCache) {
      this.saveToLocalStorage()
    }
  }

  /**
   * Get cache item if not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * Check if cache item exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Remove specific cache item
   */
  delete(key: string): void {
    this.cache.delete(key)
    if (this.config.enablePersistentCache) {
      this.saveToLocalStorage()
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    if (this.config.enablePersistentCache) {
      localStorage.removeItem('case-cache')
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validItems = 0
    let expiredItems = 0

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expiredItems++
      } else {
        validItems++
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      hitRate: this.calculateHitRate()
    }
  }

  /**
   * Clean expired items
   */
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Generate cache key for case data
   */
  static generateCaseKey(caseId: string): string {
    return `case:${caseId}`
  }

  /**
   * Generate cache key for search results
   */
  static generateSearchKey(query: string, filters: any): string {
    const filterString = JSON.stringify(filters)
    return `search:${btoa(query + filterString)}`
  }

  /**
   * Generate cache key for case list
   */
  static generateListKey(page: number, limit: number, filters: any): string {
    const filterString = JSON.stringify(filters)
    return `list:${page}:${limit}:${btoa(filterString)}`
  }

  /**
   * Generate cache key for case timeline
   */
  static generateTimelineKey(caseId: string): string {
    return `timeline:${caseId}`
  }

  /**
   * Generate cache key for case documents
   */
  static generateDocumentsKey(caseId: string): string {
    return `documents:${caseId}`
  }

  private saveToLocalStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries())
      localStorage.setItem('case-cache', JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error)
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const cacheData = localStorage.getItem('case-cache')
      if (cacheData) {
        const entries = JSON.parse(cacheData)
        for (const [key, item] of entries) {
          // Only load items that are not expired
          if (Date.now() - item.timestamp <= item.ttl) {
            this.cache.set(key, item)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error)
    }
  }

  private hitRate = 0
  private totalRequests = 0
  private cacheHits = 0

  private calculateHitRate(): number {
    return this.totalRequests > 0 ? (this.cacheHits / this.totalRequests) * 100 : 0
  }

  private recordHit(): void {
    this.totalRequests++
    this.cacheHits++
  }

  private recordMiss(): void {
    this.totalRequests++
  }
}

// Cache strategies for different data types
export const cacheStrategies = {
  // Case data - cache for 10 minutes
  caseData: (caseId: string) => ({
    key: CaseCache.generateCaseKey(caseId),
    ttl: 10 * 60 * 1000
  }),

  // Search results - cache for 5 minutes
  searchResults: (query: string, filters: any) => ({
    key: CaseCache.generateSearchKey(query, filters),
    ttl: 5 * 60 * 1000
  }),

  // Case list - cache for 2 minutes
  caseList: (page: number, limit: number, filters: any) => ({
    key: CaseCache.generateListKey(page, limit, filters),
    ttl: 2 * 60 * 1000
  }),

  // Timeline data - cache for 15 minutes
  timeline: (caseId: string) => ({
    key: CaseCache.generateTimelineKey(caseId),
    ttl: 15 * 60 * 1000
  }),

  // Documents - cache for 30 minutes
  documents: (caseId: string) => ({
    key: CaseCache.generateDocumentsKey(caseId),
    ttl: 30 * 60 * 1000
  }),

  // User data - cache for 1 hour
  userData: (userId: string) => ({
    key: `user:${userId}`,
    ttl: 60 * 60 * 1000
  })
}

// Global cache instance
export const caseCache = new CaseCache()

// Cache middleware for API calls
export function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = caseCache.get<T>(cacheKey)
  if (cached) {
    return Promise.resolve(cached)
  }

  // Fetch data and cache it
  return fetcher().then(data => {
    caseCache.set(cacheKey, data, ttl)
    return data
  })
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate all case-related cache
  invalidateCase: (caseId: string) => {
    caseCache.delete(CaseCache.generateCaseKey(caseId))
    caseCache.delete(CaseCache.generateTimelineKey(caseId))
    caseCache.delete(CaseCache.generateDocumentsKey(caseId))
  },

  // Invalidate search results
  invalidateSearch: () => {
    for (const key of caseCache['cache'].keys()) {
      if (key.startsWith('search:')) {
        caseCache.delete(key)
      }
    }
  },

  // Invalidate case list
  invalidateList: () => {
    for (const key of caseCache['cache'].keys()) {
      if (key.startsWith('list:')) {
        caseCache.delete(key)
      }
    }
  },

  // Invalidate all cache
  invalidateAll: () => {
    caseCache.clear()
  }
}

export default CaseCache
