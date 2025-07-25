'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SessionState {
  path: string
  timestamp: number
  formData?: Record<string, any>
  scrollPosition?: number
  activeTab?: string
  searchQuery?: string
  filters?: Record<string, any>
}

class SessionStateManager {
  private static instance: SessionStateManager
  private states: Map<string, SessionState> = new Map()
  private isTabActive = true
  private preventRedirectUntil = 0

  static getInstance(): SessionStateManager {
    if (!SessionStateManager.instance) {
      SessionStateManager.instance = new SessionStateManager()
    }
    return SessionStateManager.instance
  }

  setTabActive(active: boolean) {
    this.isTabActive = active
    if (active) {
      // Prevent redirects for 2 seconds after tab becomes active
      this.preventRedirectUntil = Date.now() + 2000
    }
  }

  shouldPreventRedirect(): boolean {
    return !this.isTabActive || Date.now() < this.preventRedirectUntil
  }

  saveState(key: string, state: Partial<SessionState>) {
    const existing = this.states.get(key) || { path: '', timestamp: Date.now() }
    this.states.set(key, {
      ...existing,
      ...state,
      timestamp: Date.now()
    })
    
    // Also save to sessionStorage for persistence
    try {
      sessionStorage.setItem(`nestie_state_${key}`, JSON.stringify(this.states.get(key)))
    } catch (error) {
      console.warn('Failed to save state to sessionStorage:', error)
    }
  }

  getState(key: string): SessionState | null {
    let state = this.states.get(key)
    
    // Try to restore from sessionStorage if not in memory
    if (!state) {
      try {
        const saved = sessionStorage.getItem(`nestie_state_${key}`)
        if (saved) {
          state = JSON.parse(saved)
          if (state) {
            this.states.set(key, state)
          }
        }
      } catch (error) {
        console.warn('Failed to restore state from sessionStorage:', error)
      }
    }
    
    return state || null
  }

  clearState(key: string) {
    this.states.delete(key)
    try {
      sessionStorage.removeItem(`nestie_state_${key}`)
    } catch (error) {
      console.warn('Failed to clear state from sessionStorage:', error)
    }
  }

  clearAllStates() {
    this.states.clear()
    try {
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('nestie_state_')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear all states from sessionStorage:', error)
    }
  }
}

export function useSessionState(stateKey: string) {
  const manager = SessionStateManager.getInstance()
  const pathname = usePathname()
  const router = useRouter()
  const [isTabActive, setIsTabActive] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = !document.hidden
      setIsTabActive(active)
      manager.setTabActive(active)
      
      if (!active) {
        // Save current state when tab becomes inactive
        saveCurrentState()
      }
    }

    const handleFocus = () => {
      setIsTabActive(true)
      manager.setTabActive(true)
    }

    const handleBlur = () => {
      setIsTabActive(false)
      manager.setTabActive(false)
      saveCurrentState()
    }

    const handleBeforeUnload = () => {
      saveCurrentState()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const saveCurrentState = useCallback(() => {
    // Debounce state saving
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const formData: Record<string, any> = {}
      const formElements = document.querySelectorAll('input, textarea, select')
      
      formElements.forEach((element) => {
        const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        const key = input.name || input.id
        
        if (key) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            formData[key] = (input as HTMLInputElement).checked
          } else {
            formData[key] = input.value
          }
        }
      })

      manager.saveState(stateKey, {
        path: pathname,
        formData: Object.keys(formData).length > 0 ? formData : undefined,
        scrollPosition: window.scrollY,
      })
    }, 300)
  }, [stateKey, pathname, manager])

  const restoreState = useCallback(() => {
    const state = manager.getState(stateKey)
    
    if (state && state.formData) {
      // Restore form data after a short delay
      setTimeout(() => {
        Object.entries(state.formData!).forEach(([key, value]) => {
          const element = document.querySelector(`[name="${key}"], #${key}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          
          if (element) {
            if (element.type === 'checkbox' || element.type === 'radio') {
              (element as HTMLInputElement).checked = Boolean(value)
            } else {
              element.value = String(value)
            }
            
            // Trigger events to update React state
            const inputEvent = new Event('input', { bubbles: true })
            element.dispatchEvent(inputEvent)
            
            if (element.tagName === 'SELECT') {
              const changeEvent = new Event('change', { bubbles: true })
              element.dispatchEvent(changeEvent)
            }
          }
        })
      }, 200)
    }

    if (state && state.scrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, state.scrollPosition!)
      }, 300)
    }

    return state
  }, [stateKey, manager])

  const clearState = useCallback(() => {
    manager.clearState(stateKey)
  }, [stateKey, manager])

  const shouldPreventRedirect = useCallback(() => {
    return manager.shouldPreventRedirect()
  }, [manager])

  // Auto-save state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTabActive) {
        saveCurrentState()
      }
    }, 10000) // Save every 10 seconds

    return () => clearInterval(interval)
  }, [isTabActive, saveCurrentState])

  return {
    isTabActive,
    saveCurrentState,
    restoreState,
    clearState,
    shouldPreventRedirect
  }
}

// Enhanced router hook that respects session state
export function useStateAwareRouter() {
  const router = useRouter()
  const manager = SessionStateManager.getInstance()

  const push = useCallback((href: string, options?: any) => {
    if (manager.shouldPreventRedirect()) {
      console.log('Navigation prevented due to tab state management')
      return Promise.resolve(true)
    }
    return router.push(href, options)
  }, [router, manager])

  const replace = useCallback((href: string, options?: any) => {
    if (manager.shouldPreventRedirect()) {
      console.log('Navigation prevented due to tab state management')
      return Promise.resolve(true)
    }
    return router.replace(href, options)
  }, [router, manager])

  return {
    ...router,
    push,
    replace,
    shouldPreventRedirect: () => manager.shouldPreventRedirect()
  }
}