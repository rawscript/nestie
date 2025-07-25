import React from 'react'
import { supabase } from './supabase'

export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  services: {
    supabase: boolean
    stripe: boolean
    tinympesa: boolean
    yandexMaps: boolean
    email: boolean
  }
}

export class EnvironmentValidator {
  static async validateEnvironment(): Promise<EnvValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const services = {
      supabase: false,
      stripe: false,
      tinympesa: false,
      yandexMaps: false,
      email: false
    }

    // Validate Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        errors.push('Supabase configuration missing (URL or ANON_KEY)')
      } else {
        // Test Supabase connection
        const { data, error } = await supabase.from('profiles').select('id').limit(1)
        if (error) {
          errors.push(`Supabase connection failed: ${error.message}`)
        } else {
          services.supabase = true
        }
      }
    } catch (error) {
      errors.push(`Supabase validation error: ${error}`)
    }

    // Validate Stripe
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const stripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!stripeSecret || !stripePublic) {
      warnings.push('Stripe configuration missing - payment features will not work')
    } else if (stripeSecret.startsWith('sk_test_') || stripePublic.startsWith('pk_test_')) {
      services.stripe = true
      warnings.push('Stripe is in test mode')
    } else {
      services.stripe = true
    }

    // Validate TinyMpesa
    const tinympesaKey = process.env.TINYMPESA_API_KEY
    const tinympesaSecret = process.env.TINYMPESA_API_SECRET

    if (!tinympesaKey || !tinympesaSecret) {
      warnings.push('TinyMpesa configuration missing - M-Pesa payments will not work')
    } else {
      // Test TinyMpesa connection
      try {
        const response = await fetch('https://tinympesa.com/api/v1/status', {
          headers: {
            'Authorization': `Bearer ${tinympesaKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          services.tinympesa = true
        } else {
          warnings.push('TinyMpesa API key may be invalid')
        }
      } catch (error) {
        warnings.push('Could not validate TinyMpesa connection')
      }
    }

    // Validate Yandex Maps
    const yandexKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY

    if (!yandexKey) {
      warnings.push('Yandex Maps API key missing - map features will not work')
    } else if (yandexKey === 'demo-key') {
      warnings.push('Yandex Maps using demo key - may have limitations')
    } else {
      services.yandexMaps = true
    }

    // Validate Email Service
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpUser || !smtpPass) {
      warnings.push('Email service not configured - email notifications will not work')
    } else {
      services.email = true
    }

    // Validate required environment variables
    const requiredVars = [
      'NEXT_PUBLIC_APP_URL',
      'NEXTAUTH_SECRET'
    ]

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`Required environment variable missing: ${varName}`)
      }
    }

    // Check for development vs production settings
    if (process.env.NODE_ENV === 'production') {
      if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
        errors.push('Production app should not use localhost URL')
      }
      
      if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
        errors.push('NEXTAUTH_SECRET should be a strong secret in production')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      services
    }
  }

  // Test individual services
  static async testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1)
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  static async testStripeConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/payments/stripe/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      
      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  static async testTinyMpesaConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/payments/tinympesa/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      
      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Generate environment report
  static async generateReport(): Promise<string> {
    const validation = await this.validateEnvironment()
    
    let report = '# Environment Validation Report\n\n'
    report += `**Status**: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}\n\n`
    
    report += '## Services Status\n'
    Object.entries(validation.services).forEach(([service, status]) => {
      report += `- ${service}: ${status ? '✅' : '❌'}\n`
    })
    
    if (validation.errors.length > 0) {
      report += '\n## Errors\n'
      validation.errors.forEach(error => {
        report += `- ❌ ${error}\n`
      })
    }
    
    if (validation.warnings.length > 0) {
      report += '\n## Warnings\n'
      validation.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`
      })
    }
    
    report += `\n**Generated**: ${new Date().toISOString()}\n`
    
    return report
  }
}

// React hook for environment validation
export const useEnvironmentValidation = () => {
  const [validation, setValidation] = React.useState<EnvValidationResult | null>(null)
  const [loading, setLoading] = React.useState(false)

  const validateEnvironment = async () => {
    setLoading(true)
    try {
      const result = await EnvironmentValidator.validateEnvironment()
      setValidation(result)
    } catch (error) {
      console.error('Environment validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      validateEnvironment()
    }
  }, [])

  return {
    validation,
    loading,
    validateEnvironment
  }
}