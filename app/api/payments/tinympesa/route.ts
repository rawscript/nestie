import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/database'
import { ErrorHandler, ErrorType } from '@/lib/errorHandler'

export async function POST(request: NextRequest) {
  try {
    const { amount, phone, reference, description, userId, propertyId } = await request.json()

    // Validate input
    if (!amount || !phone) {
      await ErrorHandler.logError(
        'Missing required fields for TinyMpesa payment',
        ErrorType.VALIDATION,
        'tinympesa-payment'
      )
      return NextResponse.json(
        { error: 'Missing required fields: amount and phone are required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    const apiKey = process.env.TINYMPESA_API_KEY
    const apiSecret = process.env.TINYMPESA_API_SECRET
    if (!apiKey || !apiSecret) {
      await ErrorHandler.logError(
        'TinyMpesa credentials not configured',
        ErrorType.VALIDATION,
        'tinympesa-payment'
      )
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    // Format phone number (ensure it starts with 254)
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    // Validate phone number format
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      await ErrorHandler.logError(
        `Invalid phone number format: ${formattedPhone}`,
        ErrorType.VALIDATION,
        'tinympesa-payment'
      )
      return NextResponse.json(
        { error: 'Invalid phone number format. Use format: 254XXXXXXXXX' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount < 1 || amount > 300000) {
      await ErrorHandler.logError(
        `Invalid amount: ${amount}`,
        ErrorType.VALIDATION,
        'tinympesa-payment'
      )
      return NextResponse.json(
        { error: 'Amount must be between KSh 1 and KSh 300,000' },
        { status: 400 }
      )
    }

    const paymentReference = reference || `NESTIE-${Date.now()}`

    // TinyMpesa API integration
    const mpesaResponse = await fetch('https://tinypesa.com/api/v1/express', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Apikey': apiKey,
        'Apisecret': apiSecret
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        msisdn: formattedPhone,
        account_no: paymentReference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/tinympesa/callback`
      })
    })

    const mpesaData = await mpesaResponse.json()

    if (!mpesaResponse.ok) {
      const errorMessage = mpesaData.message || 'M-Pesa payment failed'
      await ErrorHandler.logError(
        `TinyMpesa API error: ${errorMessage}`,
        ErrorType.PAYMENT,
        'tinympesa-payment',
        { status: mpesaResponse.status, response: mpesaData }
      )
      
      // Handle specific M-Pesa errors
      let userMessage = errorMessage
      if (errorMessage.includes('insufficient')) {
        userMessage = 'Insufficient funds in your M-Pesa account'
      } else if (errorMessage.includes('invalid')) {
        userMessage = 'Invalid phone number or request'
      } else if (errorMessage.includes('timeout')) {
        userMessage = 'Request timeout. Please try again'
      }

      return NextResponse.json(
        { error: userMessage, code: mpesaData.code },
        { status: 400 }
      )
    }

    // Create transaction record
    if (userId) {
      const transactionResult = await Database.createTransaction({
        user_id: userId,
        transaction_type: 'rent_payment',
        amount: amount,
        status: 'pending',
        description: description || 'M-Pesa payment',
        payment_method: 'tinympesa',
        payment_reference: mpesaData.id || paymentReference
      })

      if (!transactionResult.success) {
        await ErrorHandler.logError(
          `Failed to create transaction record: ${transactionResult.error}`,
          ErrorType.DATABASE,
          'tinympesa-payment'
        )
      }
    }

    // Log successful payment initiation
    await ErrorHandler.logError(
      `TinyMpesa payment initiated: ${mpesaData.id}`,
      ErrorType.UNKNOWN,
      'tinympesa-payment-success',
      { amount, phone: formattedPhone, reference: paymentReference }
    )

    return NextResponse.json({
      success: true,
      reference: mpesaData.id || paymentReference,
      message: 'Payment initiated. Please check your phone for M-Pesa prompt.',
      amount: amount,
      phone: formattedPhone
    })

  } catch (error: any) {
    await ErrorHandler.handlePaymentError(error, 'tinympesa-payment')
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Unable to connect to M-Pesa service. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'M-Pesa payment failed. Please try again.' },
      { status: 500 }
    )
  }
}