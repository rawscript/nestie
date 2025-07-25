import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json()

    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      )
    }

    // Store metric in database (optional - for production analytics)
    if (process.env.NODE_ENV === 'production') {
      const { error } = await supabase
        .from('performance_metrics')
        .insert([{
          name: metric.name,
          value: metric.value,
          unit: metric.unit,
          context: metric.context,
          metadata: metric.metadata,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Failed to store metric:', error)
      }
    }

    // Log metric for immediate monitoring
    console.log('📊 Performance Metric:', {
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      context: metric.context
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Metrics endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const context = searchParams.get('context')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('performance_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (context) {
      query = query.eq('context', context)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}