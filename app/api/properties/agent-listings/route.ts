import { NextRequest, NextResponse } from 'next/server'
import { SimpleDatabase } from '@/lib/simpleDatabase'

export async function GET(request: NextRequest) {
  try {
    const result = await SimpleDatabase.getProperties()

    return NextResponse.json({
      ...result,
      success: true,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })

  } catch (error) {
    console.error('Agent listings API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}