import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    // Create the booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        property_id: bookingData.property_id,
        tenant_id: bookingData.tenant_id,
        agent_id: bookingData.agent_id,
        booking_details: bookingData.booking_details,
        deposit_amount: bookingData.deposit_amount,
        platform_fee: bookingData.platform_fee,
        agent_amount: bookingData.agent_amount,
        payment_method: bookingData.payment_method,
        payment_reference: bookingData.payment_reference,
        status: bookingData.status,
        created_at: bookingData.created_at
      }])
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Create a transaction record for tracking
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        booking_id: booking.id,
        property_id: bookingData.property_id,
        tenant_id: bookingData.tenant_id,
        agent_id: bookingData.agent_id,
        transaction_type: 'booking_deposit',
        amount: bookingData.deposit_amount,
        status: 'completed',
        description: `Deposit payment for booking ${booking.id}`,
        payment_method: bookingData.payment_method,
        payment_reference: bookingData.payment_reference,
        created_at: new Date().toISOString()
      }])

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      // Don't fail the booking if transaction logging fails
    }

    return NextResponse.json({ 
      data: booking,
      message: 'Booking created successfully' 
    })

  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const agentId = searchParams.get('agent_id')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        tenant:profiles!bookings_tenant_id_fkey(id, full_name, email, phone),
        agent:profiles!bookings_agent_id_fkey(id, full_name, email, phone, company)
      `)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Bookings GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}