'use client'

import { useSessionState } from '@/lib/sessionStateManager'
import { Eye, EyeOff } from 'lucide-react'

interface TabStateIndicatorProps {
  showIndicator?: boolean
}

export function TabStateIndicator({ showIndicator = false }: TabStateIndicatorProps) {
  const { isTabActive, shouldPreventRedirect } = useSessionState('tab-indicator')

  if (!showIndicator) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
      <div className="flex items-center space-x-2 text-sm">
        {isTabActive ? (
          <Eye className="h-4 w-4 text-green-500" />
        ) : (
          <EyeOff className="h-4 w-4 text-gray-400" />
        )}
        <span className={isTabActive ? 'text-green-600' : 'text-gray-500'}>
          Tab {isTabActive ? 'Active' : 'Inactive'}
        </span>
        {shouldPreventRedirect() && (
          <span className="text-orange-500 text-xs">(Protected)</span>
        )}
      </div>
    </div>
  )
}