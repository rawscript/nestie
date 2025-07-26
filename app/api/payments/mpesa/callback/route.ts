import { NextRequest, NextResponse } from 'next/server'
import { MpesaDarajaService, type STKCallbackResponse } from '@/lib/mpesaDaraja'
import { Database } from '@/lib/database'
import { supabase } from '@/lib/supabase'

// M-Pesa callback handler (called by Safaricom)
export async function POST(request: NextRequest) {
  try {
    const callbackData: STKCallbackResponse = await request.json()
    
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2))

    // Validate callback authenticity
    if (!MpesaDarajaService.validateCallback(callbackData)) {
      console.error('Invalid M-Pesa callback')
      return NextResponse.json({ 
        error: 'Invalid callback' 
      }, { status: 400 })
    }

    // Process the callback
    const result = MpesaDarajaService.processCallback(callbackData)
    const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID

    if (result.success) {
      // Payment was successful
      console.log('Payment successful:', result)

      // Find the transaction by checkout request ID
      // You'll need to store this ID when initiating STK Push
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_reference', checkoutRequestId)
        .single()

      if (error || !transactions) {
        console.error('Transaction not found for checkout request:', checkoutRequestId)
        return NextResponse.json({ 
          success: true,
          message: 'Callback processed but transaction not found' 
        })
      }

      // Update transaction status to completed
      await Database.updateTransactionStatus(
        transactions.id,
        'completed'
      )

      // Update transaction with M-Pesa details
      await supabase
        .from('transactions')
        .update({
          payment_reference: result.mpesaReceiptNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactions.id)

      // The database trigger will automatically process agent commission
      // when transaction status changes to 'completed'

      console.log(`Transaction ${transactions.id} marked as completed`)

    } else {
      // Payment failed or was cancelled
      console.log('Payment failed:', result.error)

      // Find and update the transaction
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_reference', checkoutRequestId)
        .single()

      if (!error && transactions) {
        await Database.updateTransactionStatus(
          transactions.id,
          'rejected'
        )
        console.log(`Transaction ${transactions.id} marked as rejected`)
      }
    }

    // Always return success to Safaricom to avoid retries
    return NextResponse.json({ 
      success: true,
      message: 'Callback processed successfully' 
    })
    
  } catch (error) {
    console.error('M-Pesa callback processing error:', error)
    
    // Still return success to avoid Safaricom retries
    // Log the error for manual investigation
    return NextResponse.json({ 
      success: true,
      message: 'Callback received but processing failed' 
    })
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ 
    message: 'M-Pesa callback endpoint is active',
    timestamp: new Date().toISOString()
  })
}