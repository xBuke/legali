'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface LazyCaseDetailsProps {
  caseId: string
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

interface LazySectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  loading?: boolean
  error?: string
  onRetry?: () => void
}

/**
 * Lazy loading wrapper for case details
 * Uses Intersection Observer API to load content when it comes into view
 */
export function LazyCaseDetails({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad
}: LazyCaseDetailsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting && !hasLoaded) {
      setIsVisible(true)
      setIsLoading(true)
      setError(null)

      // Simulate loading delay
      setTimeout(() => {
        setIsLoading(false)
        setHasLoaded(true)
        onLoad?.()
      }, 500)
    }
  }, [hasLoaded, onLoad])

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      const currentElement = elementRef.current
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [handleIntersection, threshold, rootMargin])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setHasLoaded(false)
    
    setTimeout(() => {
      setIsLoading(false)
      setHasLoaded(true)
    }, 500)
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Greška pri učitavanju</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Pokušaj ponovno
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isVisible) {
    return (
      <div ref={elementRef} className="min-h-[200px]">
        {fallback || <LazyLoadingSkeleton />}
      </div>
    )
  }

  if (isLoading) {
    return <LazyLoadingSkeleton />
  }

  return <div ref={elementRef}>{children}</div>
}

/**
 * Lazy loading section with expand/collapse functionality
 */
export function LazySection({
  title,
  children,
  defaultExpanded = false,
  loading = false,
  error,
  onRetry
}: LazySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isLoading, setIsLoading] = useState(loading)

  const handleToggle = () => {
    if (!isExpanded && !isLoading) {
      setIsLoading(true)
      // Simulate loading delay
      setTimeout(() => {
        setIsLoading(false)
        setIsExpanded(true)
      }, 300)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
      >
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {error && <AlertCircle className="h-4 w-4 text-red-500" />}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-4">{error}</p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Pokušaj ponovno
                </Button>
              )}
            </div>
          ) : (
            children
          )}
        </CardContent>
      )}
    </Card>
  )
}

/**
 * Skeleton loader for lazy loading
 */
export function LazyLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Progressive image loading component
 */
interface ProgressiveImageProps {
  src: string
  alt: string
  placeholder?: string
  className?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function ProgressiveImage({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(placeholder || '')

  useEffect(() => {
    const img = new Image()
    
    img.onload = () => {
      setCurrentSrc(src)
      setIsLoading(false)
      onLoad?.()
    }
    
    img.onerror = (error) => {
      setHasError(true)
      setIsLoading(false)
      onError?.(error as Error)
    }
    
    img.src = src
  }, [src, onLoad, onError])

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <AlertCircle className="h-8 w-8 text-gray-400" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  )
}

/**
 * Virtual scrolling for large lists
 */
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length
  )

  const startIndex = Math.max(0, visibleStart - overscan)
  const endIndex = Math.min(items.length, visibleEnd + overscan)

  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Infinite scroll hook
 */
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean,
  threshold = 100
) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setHasError(false)

    try {
      await fetchMore()
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [fetchMore, isLoading, hasMore])

  useEffect(() => {
    if (!hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: `${threshold}px` }
    )

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, hasMore, threshold])

  return {
    elementRef,
    isLoading,
    hasError,
    retry: loadMore
  }
}
