import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert([{
        booking_id: eventData.booking_id,
        user_id: eventData.user_id,
        user_type: eventData.user_type,
        title: eventData.title,
        description: eventData.description,
        start_date: eventData.start_date,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        location: eventData.location,
        property_id: eventData.property_id,
        status: eventData.status,
        created_at: eventData.created_at
      }])
      .select()
      .single()

    if (error) {
      console.error('Calendar event creation error:', error)
      return NextResponse.json({ 
        error: 'Failed to create calendar event',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      data: event,
      success: true,
      message: 'Calendar event created successfully'
    })

  } catch (error) {
    console.error('Calendar events API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

// GET - Fetch user's calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        property:properties(
          id,
          title,
          location,
          images
        ),
        booking:calendar_bookings(
          id,
          booking_type,
          amount_paid,
          status
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: true })

    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('start_date', endDate)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Fetch calendar events error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch calendar events',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      data: events || [],
      success: true 
    })

  } catch (error) {
    console.error('Get calendar events API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}