import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { amount, phone, reference, description } = await request.json()

    // Validate input
    if (!amount || !phone || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TinyMpesa API integration
    const mpesaResponse = await fetch('https://tinypesa.com/api/v1/express', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Apikey': process.env.TINYMPESA_API_KEY!,
        'Apisecret': process.env.TINYMPESA_API_SECRET!
      },
      body: JSON.stringify({
        amount: amount,
        msisdn: phone,
        account_no: reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/tinympesa/callback`
      })
    })

    const mpesaData = await mpesaResponse.json()

    if (!mpesaResponse.ok) {
      throw new Error(mpesaData.message || 'M-Pesa payment failed')
    }

    // Store payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        transaction_id: mpesaData.id || reference,
        amount: amount,
        method: 'tinympesa',
        status: 'pending',
        payment_data: mpesaData
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      reference: mpesaData.id || reference,
      message: 'Payment initiated. Please check your phone for M-Pesa prompt.'
    })

  } catch (error) {
    console.error('TinyMpesa payment error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}