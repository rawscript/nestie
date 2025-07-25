import { ErrorHandler, ErrorType } from './errorHandler'
import { Database } from './database'
import React from 'react'

// Performance monitoring
export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: string
  context?: string
  metadata?: any
}

export interface UserAction {
  id: string
  userId?: string
  action: string
  page: string
  timestamp: string
  duration?: number
  metadata?: any
}

export class MonitoringService {
  private static metrics: PerformanceMetric[] = []
  private static userActions: UserAction[] = []
  private static isEnabled = process.env.ENABLE_PERFORMANCE_MONITORING === 'true'

  // Performance monitoring
  static startTimer(name: string): () => void {
    if (!this.isEnabled) return () => { }

    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        context: 'performance_timer'
      })
    }
  }

  static recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
    if (!this.isEnabled) return

    const fullMetric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...metric
    }

    this.metrics.push(fullMetric)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${metric.name} = ${metric.value}${metric.unit}`)
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendMetricToService(fullMetric)
    }
  }

  static recordUserAction(action: Omit<UserAction, 'id' | 'timestamp'>) {
    if (!this.isEnabled) return

    const fullAction: UserAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...action
    }

    this.userActions.push(fullAction)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`👤 User Action: ${action.action} on ${action.page}`)
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendActionToService(fullAction)
    }
  }

  // Database performance monitoring
  static async monitorDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const stopTimer = this.startTimer(`db_query_${queryName}`)

    try {
      const result = await queryFn()
      stopTimer()

      this.recordMetric({
        name: `db_query_success_${queryName}`,
        value: 1,
        unit: 'count',
        context: 'database'
      })

      return result
    } catch (error) {
      stopTimer()

      this.recordMetric({
        name: `db_query_error_${queryName}`,
        value: 1,
        unit: 'count',
        context: 'database'
      })

      await ErrorHandler.handleDatabaseError(error, `db_query_${queryName}`)
      throw error
    }
  }

  // API endpoint monitoring
  static async monitorApiEndpoint<T>(
    endpoint: string,
    method: string,
    apiFn: () => Promise<T>
  ): Promise<T> {
    const stopTimer = this.startTimer(`api_${method}_${endpoint}`)

    try {
      const result = await apiFn()
      stopTimer()

      this.recordMetric({
        name: `api_success_${method}_${endpoint}`,
        value: 1,
        unit: 'count',
        context: 'api'
      })

      return result
    } catch (error) {
      stopTimer()

      this.recordMetric({
        name: `api_error_${method}_${endpoint}`,
        value: 1,
        unit: 'count',
        context: 'api'
      })

      await ErrorHandler.handleNetworkError(error, `api_${method}_${endpoint}`)
      throw error
    }
  }

  // Memory usage monitoring
  static monitorMemoryUsage() {
    if (!this.isEnabled || typeof window === 'undefined') return

    // @ts-ignore - performance.memory is not in all browsers
    const memory = (performance as any).memory
    if (memory) {
      this.recordMetric({
        name: 'memory_used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        context: 'memory'
      })

      this.recordMetric({
        name: 'memory_total',
        value: memory.totalJSHeapSize,
        unit: 'bytes',
        context: 'memory'
      })

      this.recordMetric({
        name: 'memory_limit',
        value: memory.jsHeapSizeLimit,
        unit: 'bytes',
        context: 'memory'
      })
    }
  }

  // Network monitoring
  static monitorNetworkStatus() {
    if (!this.isEnabled || typeof window === 'undefined') return

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      this.recordMetric({
        name: 'network_downlink',
        value: connection.downlink || 0,
        unit: 'count',
        context: 'network',
        metadata: {
          effectiveType: connection.effectiveType,
          rtt: connection.rtt
        }
      })
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.recordUserAction({
        action: 'network_online',
        page: window.location.pathname
      })
    })

    window.addEventListener('offline', () => {
      this.recordUserAction({
        action: 'network_offline',
        page: window.location.pathname
      })
    })
  }

  // Page load monitoring
  static monitorPageLoad() {
    if (!this.isEnabled || typeof window === 'undefined') return

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigation) {
        this.recordMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms',
          context: 'page_load',
          metadata: {
            page: window.location.pathname,
            type: navigation.type
          }
        })

        this.recordMetric({
          name: 'dom_content_loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          unit: 'ms',
          context: 'page_load'
        })

        this.recordMetric({
          name: 'first_paint',
          value: navigation.responseStart - navigation.fetchStart,
          unit: 'ms',
          context: 'page_load'
        })
      }
    })
  }

  // User interaction monitoring
  static monitorUserInteractions() {
    if (!this.isEnabled || typeof window === 'undefined') return

    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      const className = target.className
      const id = target.id

      this.recordUserAction({
        action: 'click',
        page: window.location.pathname,
        metadata: {
          tagName,
          className,
          id,
          text: target.textContent?.slice(0, 50)
        }
      })
    })

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement

      this.recordUserAction({
        action: 'form_submit',
        page: window.location.pathname,
        metadata: {
          formId: form.id,
          formAction: form.action,
          formMethod: form.method
        }
      })
    })

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100

        this.recordMetric({
          name: 'scroll_depth',
          value: Math.round(scrollPercentage),
          unit: 'percentage',
          context: 'user_interaction',
          metadata: {
            page: window.location.pathname
          }
        })
      }, 1000)
    })
  }

  // Error rate monitoring
  static getErrorRate(timeWindow = 3600000): number { // 1 hour default
    const now = Date.now()
    const windowStart = now - timeWindow

    const totalActions = this.userActions.filter(
      action => new Date(action.timestamp).getTime() > windowStart
    ).length

    const errorCount = this.metrics.filter(
      metric =>
        metric.name.includes('error') &&
        new Date(metric.timestamp).getTime() > windowStart
    ).length

    return totalActions > 0 ? (errorCount / totalActions) * 100 : 0
  }

  // Performance summary
  static getPerformanceSummary(): {
    averagePageLoadTime: number
    averageApiResponseTime: number
    errorRate: number
    memoryUsage: number
    totalMetrics: number
    totalActions: number
  } {
    const pageLoadMetrics = this.metrics.filter(m => m.name === 'page_load_time')
    const apiMetrics = this.metrics.filter(m => m.name.startsWith('api_') && m.name.includes('success'))
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory_used')

    return {
      averagePageLoadTime: pageLoadMetrics.length > 0
        ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length
        : 0,
      averageApiResponseTime: apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
        : 0,
      errorRate: this.getErrorRate(),
      memoryUsage: memoryMetrics.length > 0
        ? memoryMetrics[memoryMetrics.length - 1].value
        : 0,
      totalMetrics: this.metrics.length,
      totalActions: this.userActions.length
    }
  }

  // Send data to external services
  private static async sendMetricToService(metric: PerformanceMetric) {
    try {
      // Example: Send to analytics service
      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Failed to send metric to service:', error)
    }
  }

  private static async sendActionToService(action: UserAction) {
    try {
      // Example: Send to analytics service
      await fetch('/api/analytics/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      })
    } catch (error) {
      console.error('Failed to send action to service:', error)
    }
  }

  // Initialize monitoring
  static initialize() {
    if (!this.isEnabled) return

    console.log('🔍 Monitoring service initialized')

    // Set up periodic monitoring
    setInterval(() => {
      this.monitorMemoryUsage()
    }, 30000) // Every 30 seconds

    // Set up event listeners
    this.monitorNetworkStatus()
    this.monitorPageLoad()
    this.monitorUserInteractions()

    // Clean up old data periodically
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000
      this.metrics = this.metrics.filter(
        m => new Date(m.timestamp).getTime() > oneHourAgo
      )
      this.userActions = this.userActions.filter(
        a => new Date(a.timestamp).getTime() > oneHourAgo
      )
    }, 600000) // Every 10 minutes
  }

  // Get monitoring data for admin dashboard
  static getMonitoringData() {
    return {
      metrics: this.metrics.slice(-100), // Last 100 metrics
      userActions: this.userActions.slice(-100), // Last 100 actions
      summary: this.getPerformanceSummary()
    }
  }
}

// React hooks for monitoring
export function usePerformanceMonitoring() {
  const recordMetric = (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => {
    MonitoringService.recordMetric(metric)
  }

  const recordUserAction = (action: Omit<UserAction, 'id' | 'timestamp'>) => {
    MonitoringService.recordUserAction(action)
  }

  const startTimer = (name: string) => {
    return MonitoringService.startTimer(name)
  }

  return {
    recordMetric,
    recordUserAction,
    startTimer
  }
}

// HOC for monitoring component performance
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const MonitoredComponent = (props: P) => {
    React.useEffect(() => {
      const stopTimer = MonitoringService.startTimer(`component_render_${componentName}`)

      MonitoringService.recordUserAction({
        action: 'component_mount',
        page: window.location.pathname,
        metadata: { componentName }
      })

      return () => {
        stopTimer()
        MonitoringService.recordUserAction({
          action: 'component_unmount',
          page: window.location.pathname,
          metadata: { componentName }
        })
      }
    }, [])

    return React.createElement(WrappedComponent, props)
  }

  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`
  return MonitoredComponent
}

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  MonitoringService.initialize()
}