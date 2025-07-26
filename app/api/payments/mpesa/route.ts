import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { MpesaDarajaService } from '@/lib/mpesaDaraja'
import { Database } from '@/lib/database'

// M-Pesa STK Push using Daraja API
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, phone, transactionId, description } = await request.json()

    // Validate input
    if (!amount || !phone || !transactionId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Validate amount (minimum KES 1)
    if (amount < 1) {
      return NextResponse.json({ 
        error: 'Amount must be at least KES 1' 
      }, { status: 400 })
    }

    const mpesaService = new MpesaDarajaService()

    try {
      // Initiate STK Push
      const stkResponse = await mpesaService.initiateSTKPush({
        phoneNumber: phone,
        amount: amount,
        accountReference: transactionId.substring(0, 12), // Max 12 characters
        transactionDesc: description || 'Property payment'
      })

      // Store the checkout request ID for callback processing
      await Database.updateTransactionStatus(
        transactionId,
        'pending',
        user.id
      )

      // You might want to store the CheckoutRequestID in your database
      // to match it with the callback later

      return NextResponse.json({
        success: true,
        reference: stkResponse.CheckoutRequestID,
        message: stkResponse.CustomerMessage || 'STK Push sent successfully',
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID
      })

    } catch (mpesaError) {
      console.error('M-Pesa STK Push error:', mpesaError)
      
      // Update transaction status to failed
      await Database.updateTransactionStatus(
        transactionId,
        'rejected'
      )

      return NextResponse.json({
        success: false,
        error: mpesaError instanceof Error ? mpesaError.message : 'STK Push failed'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('M-Pesa payment error:', error)
    return NextResponse.json({ 
      error: 'Payment processing failed' 
    }, { status: 500 })
  }
}