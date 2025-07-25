import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const action = await request.json()

    // Validate action data
    if (!action.action || !action.page) {
      return NextResponse.json(
        { error: 'Invalid action data' },
        { status: 400 }
      )
    }

    // Store action in database (optional - for production analytics)
    if (process.env.NODE_ENV === 'production') {
      const { error } = await supabase
        .from('user_actions')
        .insert([{
          user_id: action.userId,
          action: action.action,
          page: action.page,
          duration: action.duration,
          metadata: action.metadata,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Failed to store action:', error)
      }
    }

    // Log action for immediate monitoring
    console.log('👤 User Action:', {
      action: action.action,
      page: action.page,
      userId: action.userId,
      duration: action.duration
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Actions endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to record action' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const page = searchParams.get('page')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('user_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) query = query.eq('user_id', userId)
    if (action) query = query.eq('action', action)
    if (page) query = query.eq('page', page)

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch actions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching actions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    )
  }
}