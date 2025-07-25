import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Database } from '@/lib/database'
import { ErrorHandler, ErrorType } from '@/lib/errorHandler'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', card, description, userId, propertyId } = await request.json()

    // Validate input
    if (!amount || !card) {
      await ErrorHandler.logError(
        'Missing required fields for Stripe payment',
        ErrorType.VALIDATION,
        'stripe-payment'
      )
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate card details
    if (!card.number || !card.expiry || !card.cvv || !card.name) {
      await ErrorHandler.logError(
        'Incomplete card details',
        ErrorType.VALIDATION,
        'stripe-payment'
      )
      return NextResponse.json(
        { error: 'Incomplete card details' },
        { status: 400 }
      )
    }

    // Create payment method first
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: card.number.replace(/\s/g, ''),
        exp_month: parseInt(card.expiry.split('/')[0]),
        exp_year: parseInt('20' + card.expiry.split('/')[1]),
        cvc: card.cvv
      },
      billing_details: {
        name: card.name
      }
    })

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethod.id,
      description: description || 'Nestie payment',
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
      metadata: {
        userId: userId || '',
        propertyId: propertyId || '',
        platform: 'nestie'
      }
    })

    // Create transaction record
    if (userId) {
      const transactionResult = await Database.createTransaction({
        user_id: userId,
        transaction_type: 'rent_payment',
        amount: amount,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        description: description || 'Stripe payment',
        payment_method: 'stripe',
        payment_reference: paymentIntent.id
      })

      if (!transactionResult.success) {
        await ErrorHandler.logError(
          `Failed to create transaction record: ${transactionResult.error}`,
          ErrorType.DATABASE,
          'stripe-payment'
        )
      }
    }

    // Log successful payment
    await ErrorHandler.logError(
      `Stripe payment successful: ${paymentIntent.id}`,
      ErrorType.UNKNOWN,
      'stripe-payment-success',
      { amount, currency, status: paymentIntent.status }
    )

    return NextResponse.json({
      success: true,
      reference: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
      amount: amount,
      currency: currency
    })

  } catch (error: any) {
    await ErrorHandler.handlePaymentError(error, 'stripe-payment')
    
    // Handle specific Stripe errors
    let errorMessage = 'Payment processing failed'
    let statusCode = 500

    if (error.type === 'StripeCardError') {
      errorMessage = error.message || 'Your card was declined'
      statusCode = 400
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid payment request'
      statusCode = 400
    } else if (error.type === 'StripeAPIError') {
      errorMessage = 'Payment service temporarily unavailable'
      statusCode = 503
    }

    return NextResponse.json(
      { error: errorMessage, type: error.type },
      { status: statusCode }
    )
  }
}