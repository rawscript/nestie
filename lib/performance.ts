// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    const start = performance.now()
    return () => {
      const end = performance.now()
      const duration = end - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(value)

    // Keep only last 100 measurements
    const values = this.metrics.get(label)!
    if (values.length > 100) {
      values.shift()
    }
  }

  getAverageMetric(label: string): number {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  getAllMetrics(): Record<string, { average: number, count: number }> {
    const result: Record<string, { average: number, count: number }> = {}
    this.metrics.forEach((values, label) => {
      result[label] = {
        average: this.getAverageMetric(label),
        count: values.length
      }
    })
    return result
  }

  logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.table(this.getAllMetrics())
    }
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(label: string) {
  const monitor = PerformanceMonitor.getInstance()

  return {
    startTimer: () => monitor.startTimer(label),
    recordMetric: (value: number) => monitor.recordMetric(label, value),
    getAverage: () => monitor.getAverageMetric(label)
  }
}

// API response caching utility
export class APICache {
  private static cache = new Map<string, { data: any, timestamp: number, ttl: number }>()

  static set(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  static clear(): void {
    this.cache.clear()
  }

  static size(): number {
    return this.cache.size
  }

  static cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Debounce utility for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for API calls
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Image optimization utility
export function optimizeImageUrl(url: string, width?: number, height?: number, quality: number = 80): string {
  if (!url) return ''

  // If it's a Supabase storage URL, add optimization parameters
  if (url.includes('supabase')) {
    const params = new URLSearchParams()
    if (width) params.append('width', width.toString())
    if (height) params.append('height', height.toString())
    params.append('quality', quality.toString())
    params.append('format', 'webp')

    return `${url}?${params.toString()}`
  }

  return url
}

// Memory usage monitoring
export function logMemoryUsage(): void {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    console.log('Memory Usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
    })
  }
}