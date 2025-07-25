import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    })

    // Test Stripe connection by retrieving account info
    const account = await stripe.accounts.retrieve()

    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      }
    })

  } catch (error: any) {
    console.error('Stripe test error:', error)
    
    return NextResponse.json(
      { 
        error: 'Stripe connection failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}