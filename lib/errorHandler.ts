import toast from 'react-hot-toast'

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  PAYMENT = 'PAYMENT',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorLog {
  id: string
  type: ErrorType
  message: string
  stack?: string
  context?: string
  userId?: string
  timestamp: string
  metadata?: any
}

// Centralized error handler
export class ErrorHandler {
  private static logs: ErrorLog[] = []

  // Log error to console and external service
  static async logError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: string,
    metadata?: any
  ): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
      metadata
    }

    // Store locally for debugging
    this.logs.push(errorLog)

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${type} Error`)
      console.error('Message:', errorMessage)
      if (context) console.log('Context:', context)
      if (errorStack) console.log('Stack:', errorStack)
      if (metadata) console.log('Metadata:', metadata)
      console.groupEnd()
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      try {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorLog)
        })
      } catch (logError) {
        console.error('Failed to log error to service:', logError)
      }
    }
  }

  // Handle different types of errors with appropriate user feedback
  static async handleError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: string,
    showToast: boolean = true
  ): Promise<void> {
    await this.logError(error, type, context)

    if (!showToast) return

    const errorMessage = typeof error === 'string' ? error : error.message

    switch (type) {
      case ErrorType.NETWORK:
        toast.error('Network error. Please check your connection and try again.')
        break
      
      case ErrorType.DATABASE:
        toast.error('Data error. Please try again or contact support.')
        break
      
      case ErrorType.AUTHENTICATION:
        toast.error('Authentication error. Please sign in again.')
        break
      
      case ErrorType.VALIDATION:
        toast.error(errorMessage || 'Please check your input and try again.')
        break
      
      case ErrorType.PAYMENT:
        toast.error('Payment error. Please try again or use a different payment method.')
        break
      
      default:
        toast.error('Something went wrong. Please try again.')
        break
    }
  }

  // Database-specific error handler
  static async handleDatabaseError(error: any, context?: string): Promise<void> {
    let errorType = ErrorType.DATABASE
    let message = 'Database error occurred'

    // Parse common database errors
    if (error?.code === 'PGRST116') {
      message = 'No data found'
      errorType = ErrorType.VALIDATION
    } else if (error?.code === '23505') {
      message = 'Record already exists'
      errorType = ErrorType.VALIDATION
    } else if (error?.code === '23503') {
      message = 'Referenced record not found'
      errorType = ErrorType.VALIDATION
    } else if (error?.message?.includes('JWT')) {
      message = 'Authentication expired'
      errorType = ErrorType.AUTHENTICATION
    }

    await this.handleError(new Error(message), errorType, context)
  }

  // Network-specific error handler
  static async handleNetworkError(error: any, context?: string): Promise<void> {
    let message = 'Network error occurred'

    if (error?.name === 'AbortError') {
      message = 'Request was cancelled'
    } else if (error?.message?.includes('fetch')) {
      message = 'Failed to connect to server'
    } else if (error?.status >= 500) {
      message = 'Server error occurred'
    } else if (error?.status >= 400) {
      message = 'Request error occurred'
    }

    await this.handleError(new Error(message), ErrorType.NETWORK, context)
  }

  // Payment-specific error handler
  static async handlePaymentError(error: any, context?: string): Promise<void> {
    let message = 'Payment processing failed'

    if (error?.message?.includes('card')) {
      message = 'Card payment failed. Please check your card details.'
    } else if (error?.message?.includes('mpesa')) {
      message = 'M-Pesa payment failed. Please try again.'
    } else if (error?.message?.includes('insufficient')) {
      message = 'Insufficient funds. Please check your balance.'
    }

    await this.handleError(new Error(message), ErrorType.PAYMENT, context)
  }

  // Get recent error logs (for debugging)
  static getRecentLogs(limit: number = 10): ErrorLog[] {
    return this.logs.slice(-limit)
  }

  // Clear error logs
  static clearLogs(): void {
    this.logs = []
  }
}

// Async wrapper with error handling
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context?: string,
  errorType: ErrorType = ErrorType.UNKNOWN
): Promise<T | null> {
  try {
    return await asyncFn()
  } catch (error) {
    await ErrorHandler.handleError(error as Error, errorType, context)
    return null
  }
}

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = async (
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: string,
    showToast: boolean = true
  ) => {
    await ErrorHandler.handleError(error, type, context, showToast)
  }

  const handleDatabaseError = async (error: any, context?: string) => {
    await ErrorHandler.handleDatabaseError(error, context)
  }

  const handleNetworkError = async (error: any, context?: string) => {
    await ErrorHandler.handleNetworkError(error, context)
  }

  const handlePaymentError = async (error: any, context?: string) => {
    await ErrorHandler.handlePaymentError(error, context)
  }

  return {
    handleError,
    handleDatabaseError,
    handleNetworkError,
    handlePaymentError
  }
}