import { size } from 'lodash'
import React, { useState, useCallback, createContext, useContext, ReactNode, useMemo } from 'react'

// Loading state types
export interface LoadingState {
    loading: boolean
    error: string | null
    success: boolean
}

export interface AsyncState<T> extends LoadingState {
    data: T | null
}

// Generic loading state hook
export function useLoadingState(initialLoading = false): [
    LoadingState,
    {
        setLoading: (loading: boolean) => void
        setError: (error: string | null) => void
        setSuccess: (success: boolean) => void
        reset: () => void
    }
] {
    const [state, setState] = useState<LoadingState>({
        loading: initialLoading,
        error: null,
        success: false
    })

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }))
    }, [])

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error, loading: false, success: false }))
    }, [])

    const setSuccess = useCallback((success: boolean) => {
        setState(prev => ({ ...prev, success, loading: false, error: success ? null : prev.error }))
    }, [])

    const reset = useCallback(() => {
        setState({ loading: false, error: null, success: false })
    }, [])

    return [state, { setLoading, setError, setSuccess, reset }]
}

// Async data hook with loading states
export function useAsyncData<T>(
    initialData: T | null = null
): [
        AsyncState<T>,
        {
            setData: (data: T | null) => void
            setLoading: (loading: boolean) => void
            setError: (error: string | null) => void
            setSuccess: (success: boolean) => void
            reset: () => void
        }
    ] {
    const [state, setState] = useState<AsyncState<T>>({
        data: initialData,
        loading: false,
        error: null,
        success: false
    })

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data, loading: false, error: null, success: true }))
    }, [])

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }))
    }, [])

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error, loading: false, success: false }))
    }, [])

    const setSuccess = useCallback((success: boolean) => {
        setState(prev => ({ ...prev, success, loading: false, error: success ? null : prev.error }))
    }, [])

    const reset = useCallback(() => {
        setState({ data: initialData, loading: false, error: null, success: false })
    }, [initialData])

    return [state, { setData, setLoading, setError, setSuccess, reset }]
}

// Async operation wrapper with loading states
export async function withLoadingState<T>(
    asyncFn: () => Promise<T>,
    loadingHandlers: {
        setLoading: (loading: boolean) => void
        setError: (error: string | null) => void
        setSuccess?: (success: boolean) => void
    }
): Promise<T | null> {
    const { setLoading, setError, setSuccess } = loadingHandlers

    try {
        setLoading(true)
        setError(null)

        const result = await asyncFn()

        setSuccess?.(true)
        return result
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        setError(errorMessage)
        return null
    } finally {
        setLoading(false)
    }
}

// Multiple async operations with combined loading state
export function useCombinedLoadingState(operations: string[]): {
    states: Record<string, LoadingState>
    isAnyLoading: boolean
    hasAnyError: boolean
    allSuccessful: boolean
    getState: (operation: string) => LoadingState
    setLoading: (operation: string, loading: boolean) => void
    setError: (operation: string, error: string | null) => void
    setSuccess: (operation: string, success: boolean) => void
    reset: (operation?: string) => void
} {
    const [states, setStates] = useState<Record<string, LoadingState>>(() =>
        operations.reduce((acc, op) => ({
            ...acc,
            [op]: { loading: false, error: null, success: false }
        }), {})
    )

    const isAnyLoading = Object.values(states).some(state => state.loading)
    const hasAnyError = Object.values(states).some(state => state.error !== null)
    const allSuccessful = Object.values(states).every(state => state.success)

    const getState = useCallback((operation: string): LoadingState => {
        return states[operation] || { loading: false, error: null, success: false }
    }, [states])

    const setLoading = useCallback((operation: string, loading: boolean) => {
        setStates(prev => ({
            ...prev,
            [operation]: {
                ...prev[operation],
                loading,
                error: loading ? null : prev[operation]?.error || null
            }
        }))
    }, [])

    const setError = useCallback((operation: string, error: string | null) => {
        setStates(prev => ({
            ...prev,
            [operation]: {
                ...prev[operation],
                error,
                loading: false,
                success: false
            }
        }))
    }, [])

    const setSuccess = useCallback((operation: string, success: boolean) => {
        setStates(prev => ({
            ...prev,
            [operation]: {
                ...prev[operation],
                success,
                loading: false,
                error: success ? null : prev[operation]?.error || null
            }
        }))
    }, [])

    const reset = useCallback((operation?: string) => {
        if (operation) {
            setStates(prev => ({
                ...prev,
                [operation]: { loading: false, error: null, success: false }
            }))
        } else {
            setStates(operations.reduce((acc, op) => ({
                ...acc,
                [op]: { loading: false, error: null, success: false }
            }), {}))
        }
    }, [operations])

    return {
        states,
        isAnyLoading,
        hasAnyError,
        allSuccessful,
        getState,
        setLoading,
        setError,
        setSuccess,
        reset
    }
}

// Debounced loading state for search operations
export function useDebouncedLoadingState(delay = 300): [
    LoadingState & { isDebouncing: boolean },
    {
        setLoading: (loading: boolean) => void
        setError: (error: string | null) => void
        setSuccess: (success: boolean) => void
        reset: () => void
    }
] {
    const [state, setState] = useState<LoadingState & { isDebouncing: boolean }>({
        loading: false,
        error: null,
        success: false,
        isDebouncing: false
    })

    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

    const setLoading = useCallback((loading: boolean) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }

        if (loading) {
            setState(prev => ({ ...prev, isDebouncing: true, error: null }))

            const timer = setTimeout(() => {
                setState(prev => ({ ...prev, loading: true, isDebouncing: false }))
            }, delay)

            setDebounceTimer(timer)
        } else {
            setState(prev => ({ ...prev, loading: false, isDebouncing: false }))
            setDebounceTimer(null)
        }
    }, [delay, debounceTimer])

    const setError = useCallback((error: string | null) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer)
            setDebounceTimer(null)
        }
        setState(prev => ({ ...prev, error, loading: false, success: false, isDebouncing: false }))
    }, [debounceTimer])

    const setSuccess = useCallback((success: boolean) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer)
            setDebounceTimer(null)
        }
        setState(prev => ({
            ...prev,
            success,
            loading: false,
            error: success ? null : prev.error,
            isDebouncing: false
        }))
    }, [debounceTimer])

    const reset = useCallback(() => {
        if (debounceTimer) {
            clearTimeout(debounceTimer)
            setDebounceTimer(null)
        }
        setState({ loading: false, error: null, success: false, isDebouncing: false })
    }, [debounceTimer])

    return [state, { setLoading, setError, setSuccess, reset }]
}

// Loading state context for global loading management
interface GlobalLoadingContextType {
    globalLoading: boolean
    setGlobalLoading: (loading: boolean) => void
    addLoadingOperation: (id: string) => void
    removeLoadingOperation: (id: string) => void
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined)

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
    const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set())

    const globalLoading = loadingOperations.size > 0

    const setGlobalLoading = useCallback((loading: boolean) => {
        setLoadingOperations(prev => {
            const updated = new Set(prev)
            loading ? updated.add('global') : updated.delete('global')
            return updated
        })
    }, [])

    const addLoadingOperation = useCallback((id: string) => {
        setLoadingOperations(prev => {
            const updated = new Set(prev)
            updated.add(id)
            return updated
        })
    }, [])

    const removeLoadingOperation = useCallback((id: string) => {
        setLoadingOperations(prev => {
            const updated = new Set(prev)
            updated.delete(id)
            return updated
        })
    }, [])

    const contextValue = useMemo(() => ({
        globalLoading,
        setGlobalLoading,
        addLoadingOperation,
        removeLoadingOperation
    }), [globalLoading, setGlobalLoading, addLoadingOperation, removeLoadingOperation])

    return (
        <GlobalLoadingContext.Provider value={contextValue}>
            {children}
        </GlobalLoadingContext.Provider>
    )
}

export function useGlobalLoading() {
    const context = useContext(GlobalLoadingContext)
    if (!context) {
        throw new Error('useGlobalLoading must be used within GlobalLoadingProvider')
    }
    return context
}

// Loading component variants
export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    color?: string
    className?: string
}

export function LoadingSpinner({ size = 'md', color = 'text-nestie-black', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    }

    return (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${color} ${className}`} />
    )
}

export interface LoadingOverlayProps {
    loading: boolean
    children: ReactNode
    message?: string
    className?: string
}

export function LoadingOverlay({ loading, children, message, className = '' }: LoadingOverlayProps) {
    return (
        <div className={`relative ${className}`}>
            {children}
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        {message && (
                            <p className="mt-2 text-sm text-nestie-grey-600">{message}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export interface LoadingButtonProps {
    loading: boolean
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
    loadingText?: string
}

export function LoadingButton({
    loading,
    children,
    onClick,
    disabled,
    className = '',
    loadingText = 'Loading...'
}: LoadingButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center justify-center ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? (
                <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </button>
    )
}

// Skeleton loading components
export function SkeletonLoader({ className = '', lines = 3 }: { className?: string; lines?: number }) {
    return (
        <div className={`animate-pulse ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`bg-nestie-grey-200 rounded h-4 mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    )
}

export function PropertyCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-nestie-grey-200 overflow-hidden animate-pulse">
            <div className="h-48 bg-nestie-grey-200" />
            <div className="p-4">
                <div className="h-6 bg-nestie-grey-200 rounded mb-2" />
                <div className="h-4 bg-nestie-grey-200 rounded w-3/4 mb-3" />
                <div className="flex justify-between items-center">
                    <div className="h-4 bg-nestie-grey-200 rounded w-1/4" />
                    <div className="h-6 bg-nestie-grey-200 rounded w-1/3" />
                </div>
            </div>
        </div>
    )
}