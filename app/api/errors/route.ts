import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    // Validate error data
    if (!errorData.message || !errorData.type) {
      return NextResponse.json(
        { error: 'Missing required error data' },
        { status: 400 }
      )
    }

    // Store error in database (optional - for production monitoring)
    if (process.env.NODE_ENV === 'production') {
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert([{
          type: errorData.type,
          message: errorData.message,
          stack: errorData.stack,
          context: errorData.context,
          user_id: errorData.userId,
          metadata: errorData.metadata,
          user_agent: errorData.userAgent,
          url: errorData.url,
          created_at: new Date().toISOString()
        }])

      if (dbError) {
        console.error('Failed to store error log:', dbError)
      }
    }

    // Log to console for immediate debugging
    console.error('Client Error:', {
      type: errorData.type,
      message: errorData.message,
      context: errorData.context,
      timestamp: errorData.timestamp
    })

    // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
    // await sendToMonitoringService(errorData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging endpoint failed:', error)
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    )
  }
}

// Optional: Get error logs for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')

    let query = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    )
  }
}