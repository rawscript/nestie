'use client'

import { useEffect, useCallback } from 'react'

interface FormStateManager {
  preserveFormState: (formId?: string) => void
  restoreFormState: (formId?: string) => void
  clearFormState: (formId?: string) => void
}

export function useFormStateManager(formId: string = 'default'): FormStateManager {
  const getStorageKey = (id: string) => `nestie_form_state_${id}`

  const preserveFormState = useCallback((id: string = formId) => {
    try {
      const formElements = document.querySelectorAll('input, textarea, select')
      const formData: Record<string, any> = {}

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

      if (Object.keys(formData).length > 0) {
        sessionStorage.setItem(getStorageKey(id), JSON.stringify(formData))
      }
    } catch (error) {
      console.error('Error preserving form state:', error)
    }
  }, [formId])

  const restoreFormState = useCallback((id: string = formId) => {
    try {
      const savedData = sessionStorage.getItem(getStorageKey(id))

      if (savedData) {
        const formData = JSON.parse(savedData)

        // Restore form data after a short delay to ensure DOM is ready
        setTimeout(() => {
          Object.entries(formData).forEach(([key, value]) => {
            const element = document.querySelector(`[name="${key}"], #${key}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

            if (element) {
              if (element.type === 'checkbox' || element.type === 'radio') {
                (element as HTMLInputElement).checked = Boolean(value)
              } else {
                element.value = String(value)
              }

              // Trigger change event to update React state
              const event = new Event('input', { bubbles: true })
              element.dispatchEvent(event)

              // Also trigger change event for select elements
              if (element.tagName === 'SELECT') {
                const changeEvent = new Event('change', { bubbles: true })
                element.dispatchEvent(changeEvent)
              }
            }
          })
        }, 100)
      }
    } catch (error) {
      console.error('Error restoring form state:', error)
    }
  }, [formId])

  const clearFormState = useCallback((id: string = formId) => {
    try {
      sessionStorage.removeItem(getStorageKey(id))
    } catch (error) {
      console.error('Error clearing form state:', error)
    }
  }, [formId])

  // Auto-preserve form state when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      preserveFormState()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        preserveFormState()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [preserveFormState])

  return {
    preserveFormState,
    restoreFormState,
    clearFormState
  }
}

// Hook for automatic form state management
export function useAutoFormState(formId: string = 'default', restoreOnMount: boolean = true) {
  const { preserveFormState, restoreFormState, clearFormState } = useFormStateManager(formId)

  useEffect(() => {
    if (restoreOnMount) {
      restoreFormState()
    }

    // Cleanup on unmount
    return () => {
      preserveFormState()
    }
  }, [restoreFormState, preserveFormState, restoreOnMount])

  return {
    preserveFormState,
    restoreFormState,
    clearFormState
  }
}