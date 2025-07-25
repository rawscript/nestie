'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
    hasError: boolean
    error?: Error
    errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
            this.logErrorToService(error, errorInfo)
        }

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo)

        this.setState({ errorInfo })
    }

    private logErrorToService(error: Error, errorInfo: ErrorInfo) {
        // Example: Send to error tracking service
        fetch('/api/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                errorInfo,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(console.error)
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-nestie-black mb-4">
                            Something went wrong
                        </h1>

                        <p className="text-nestie-grey-600 mb-6">
                            We're sorry, but something unexpected happened. Our team has been notified.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm text-nestie-grey-500 mb-2">
                                    Error Details (Development)
                                </summary>
                                <pre className="text-xs bg-nestie-grey-100 p-3 rounded overflow-auto max-h-32">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 transition-colors flex items-center justify-center"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </button>

                            <Link
                                href="/"
                                className="flex-1 bg-nestie-grey-100 text-nestie-black px-4 py-2 rounded-lg hover:bg-nestie-grey-200 transition-colors flex items-center justify-center"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
    const handleError = (error: Error, context?: string) => {
        console.error(`Error in ${context || 'component'}:`, error)

        // Log to service in production
        if (process.env.NODE_ENV === 'production') {
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    },
                    context,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            }).catch(console.error)
        }
    }

    const handleErrorBoundaryError = (error: Error, errorInfo: ErrorInfo) => {
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        // Log to service in production
        if (process.env.NODE_ENV === 'production') {
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    },
                    errorInfo,
                    context: 'ErrorBoundary',
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            }).catch(console.error)
        }
    }

    return { handleError, handleErrorBoundaryError }
}

// Async error boundary for handling promise rejections
export const AsyncErrorBoundary: React.FC<{
    children: ReactNode
    fallback?: ReactNode
}> = ({ children, fallback }) => {
    const { handleError, handleErrorBoundaryError } = useErrorHandler()

    React.useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            handleError(new Error(event.reason), 'Unhandled Promise Rejection')
        }

        window.addEventListener('unhandledrejection', handleUnhandledRejection)

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        }
    }, [handleError])

    return (
        <ErrorBoundary fallback={fallback} onError={handleErrorBoundaryError}>
            {children}
        </ErrorBoundary>
    )
}