'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface TabStateManager {
  isTabActive: boolean
  shouldPreventRedirect: boolean
  preserveState: () => void
  clearPreservedState: () => void
}

export function useTabStateManager(): TabStateManager {
  const [isTabActive, setIsTabActive] = useState(true)
  const [shouldPreventRedirect, setShouldPreventRedirect] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const lastActivePathRef = useRef<string>(pathname)
  const redirectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Update last active path when pathname changes
    lastActivePathRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsTabActive(isVisible)

      if (isVisible) {
        // Tab became active - prevent redirects for a short period
        setShouldPreventRedirect(true)
        
        // Clear any existing timeout
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current)
        }

        // Allow redirects again after a short delay
        redirectTimeoutRef.current = setTimeout(() => {
          setShouldPreventRedirect(false)
        }, 1000) // 1 second grace period
      } else {
        // Tab became inactive - preserve current state
        setShouldPreventRedirect(false)
      }
    }

    const handleFocus = () => {
      setIsTabActive(true)
      setShouldPreventRedirect(true)
      
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }

      redirectTimeoutRef.current = setTimeout(() => {
        setShouldPreventRedirect(false)
      }, 1000)
    }

    const handleBlur = () => {
      setIsTabActive(false)
      setShouldPreventRedirect(false)
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const preserveState = () => {
    // Store current path and form data in sessionStorage
    sessionStorage.setItem('nestie_preserved_path', pathname)
    sessionStorage.setItem('nestie_tab_state_preserved', 'true')
    
    // Preserve any form data or component state
    const formElements = document.querySelectorAll('input, textarea, select')
    const formData: Record<string, string> = {}
    
    formElements.forEach((element) => {
      const input = element as HTMLInputElement
      if (input.name || input.id) {
        const key = input.name || input.id
        formData[key] = input.value
      }
    })
    
    if (Object.keys(formData).length > 0) {
      sessionStorage.setItem('nestie_preserved_form_data', JSON.stringify(formData))
    }
  }

  const clearPreservedState = () => {
    sessionStorage.removeItem('nestie_preserved_path')
    sessionStorage.removeItem('nestie_tab_state_preserved')
    sessionStorage.removeItem('nestie_preserved_form_data')
  }

  return {
    isTabActive,
    shouldPreventRedirect,
    preserveState,
    clearPreservedState
  }
}

// Hook to restore preserved form data
export function useRestoreFormData() {
  useEffect(() => {
    const preservedFormData = sessionStorage.getItem('nestie_preserved_form_data')
    
    if (preservedFormData) {
      try {
        const formData = JSON.parse(preservedFormData)
        
        // Restore form data after a short delay to ensure DOM is ready
        setTimeout(() => {
          Object.entries(formData).forEach(([key, value]) => {
            const element = document.querySelector(`[name="${key}"], #${key}`) as HTMLInputElement
            if (element && typeof value === 'string') {
              element.value = value
              
              // Trigger change event to update React state
              const event = new Event('input', { bubbles: true })
              element.dispatchEvent(event)
            }
          })
        }, 100)
        
      } catch (error) {
        console.error('Error restoring form data:', error)
      }
    }
  }, [])
}

// Enhanced router hook that respects tab state
export function useTabAwareRouter() {
  const router = useRouter()
  const { shouldPreventRedirect, preserveState } = useTabStateManager()

  const push = (href: string, options?: any) => {
    if (shouldPreventRedirect) {
      console.log('Redirect prevented due to tab state management')
      return
    }
    
    preserveState()
    router.push(href, options)
  }

  const replace = (href: string, options?: any) => {
    if (shouldPreventRedirect) {
      console.log('Redirect prevented due to tab state management')
      return
    }
    
    preserveState()
    router.replace(href, options)
  }

  return {
    ...router,
    push,
    replace,
    shouldPreventRedirect
  }
}