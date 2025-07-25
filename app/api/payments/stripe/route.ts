import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'kes', card, description } = await request.json()

    // Validate input
    if (!amount || !card) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`
    })

    // Store payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        transaction_id: paymentIntent.id,
        amount: amount,
        method: 'stripe',
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        payment_data: {
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret
        }
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      reference: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret
    })

  } catch (error: any) {
    console.error('Stripe payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment processing failed' },
      { status: 500 }
    )
  }
}