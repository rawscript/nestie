import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    // Create the booking record
    const { data: booking, error: bookingError } = await supabase
      .from('calendar_bookings')
      .insert([{
        property_id: bookingData.property_id,
        tenant_id: bookingData.tenant_id,
        agent_id: bookingData.agent_id,
        booking_type: bookingData.booking_type,
        scheduled_date: bookingData.scheduled_date,
        scheduled_time: bookingData.scheduled_time,
        amount_paid: bookingData.amount_paid,
        payment_method: bookingData.payment_method,
        payment_reference: bookingData.payment_reference,
        status: bookingData.status,
        created_at: bookingData.created_at
      }])
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json({ 
        error: 'Failed to create booking',
        details: bookingError.message 
      }, { status: 500 })
    }

    // If payment was made, create payment record
    if (bookingData.amount_paid > 0) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          booking_id: booking.id,
          user_id: bookingData.tenant_id,
          property_id: bookingData.property_id,
          amount: bookingData.amount_paid,
          type: bookingData.booking_type === 'lease' ? 'deposit' : 'down_payment',
          method: bookingData.payment_method,
          status: 'completed',
          transaction_id: bookingData.payment_reference,
          created_at: new Date().toISOString()
        }])

      if (paymentError) {
        console.error('Payment record error:', paymentError)
        // Don't fail the booking if payment record fails
      }
    }

    return NextResponse.json({ 
      data: booking,
      success: true,
      message: 'Booking created successfully'
    })

  } catch (error) {
    console.error('Calendar booking API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

// GET - Fetch user's bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType') // 'tenant' or 'agent'

    if (!userId || !userType) {
      return NextResponse.json({ 
        error: 'User ID and user type are required' 
      }, { status: 400 })
    }

    const column = userType === 'tenant' ? 'tenant_id' : 'agent_id'

    const { data: bookings, error } = await supabase
      .from('calendar_bookings')
      .select(`
        *,
        property:properties(
          id,
          title,
          location,
          images,
          price
        ),
        tenant:profiles!calendar_bookings_tenant_id_fkey(
          id,
          full_name,
          email,
          phone
        ),
        agent:profiles!calendar_bookings_agent_id_fkey(
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq(column, userId)
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Fetch bookings error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch bookings',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      data: bookings || [],
      success: true 
    })

  } catch (error) {
    console.error('Get bookings API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}