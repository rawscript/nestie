'use client'

import { useState, useEffect } from 'react'
import { PerformanceMonitor, APICache } from '@/lib/performance'

interface PerformanceMetrics {
  [key: string]: {
    average: number
    count: number
  }
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [cacheStats, setCacheStats] = useState({ size: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const monitor = PerformanceMonitor.getInstance()
        setMetrics(monitor.getAllMetrics())
        setCacheStats({ size: APICache.size() })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 hover:bg-blue-700"
        title="Performance Dashboard"
      >
        📊
      </button>

      {/* Performance Dashboard */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Cache Stats */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Cache Statistics</h4>
            <div className="text-sm text-blue-700">
              <p>Cached Items: {cacheStats.size}</p>
              <button
                onClick={() => {
                  APICache.clear()
                  setCacheStats({ size: 0 })
                }}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Database Operations</h4>
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="p-2 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {key.replace('db_', '').replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {value.count} calls
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Avg: {value.average.toFixed(2)}ms
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      value.average < 100 ? 'bg-green-500' :
                      value.average < 500 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (value.average / 1000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Memory Usage (if available) */}
          {typeof window !== 'undefined' && 'memory' in performance && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Memory Usage</h4>
              <MemoryUsage />
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => {
                const monitor = PerformanceMonitor.getInstance()
                monitor.logMetrics()
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
            >
              Log to Console
            </button>
            <button
              onClick={() => {
                APICache.cleanup()
                setCacheStats({ size: APICache.size() })
              }}
              className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
            >
              Cleanup Cache
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function MemoryUsage() {
  const [memory, setMemory] = useState<any>(null)

  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        setMemory((performance as any).memory)
      }
    }

    updateMemory()
    const interval = setInterval(updateMemory, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!memory) return null

  const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
  const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)
  const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

  return (
    <div className="text-sm text-green-700">
      <p>Used: {usedMB} MB</p>
      <p>Total: {totalMB} MB</p>
      <p>Limit: {limitMB} MB</p>
      <div className="w-full bg-green-200 rounded-full h-2 mt-2">
        <div
          className="h-2 rounded-full bg-green-600"
          style={{ width: `${(usedMB / limitMB) * 100}%` }}
        />
      </div>
    </div>
  )
}