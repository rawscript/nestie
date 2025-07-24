import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json()

    // Record the payment in the payments table
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        booking_id: paymentData.booking_id,
        tenant_id: paymentData.tenant_id,
        agent_id: paymentData.agent_id,
        property_id: paymentData.property_id,
        amount: paymentData.amount,
        platform_fee: paymentData.platform_fee,
        agent_amount: paymentData.agent_amount,
        payment_method: paymentData.payment_method,
        payment_reference: paymentData.payment_reference,
        status: paymentData.status,
        type: paymentData.type,
        created_at: paymentData.created_at
      }])
      .select()
      .single()

    if (paymentError) {
      console.error('Payment record error:', paymentError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: payment,
      message: 'Payment recorded successfully' 
    })

  } catch (error) {
    console.error('Payment record API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const agentId = searchParams.get('agent_id')
    const bookingId = searchParams.get('booking_id')

    let query = supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(*),
        property:properties(title, location),
        tenant:profiles!payments_tenant_id_fkey(full_name, email),
        agent:profiles!payments_agent_id_fkey(full_name, email, company)
      `)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Payments GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}