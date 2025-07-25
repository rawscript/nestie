import { NextRequest, NextResponse } from 'next/server'
import { SimpleDatabase } from '@/lib/simpleDatabase'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET - Fetch all properties (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const filters = {
      type: searchParams.get('type'),
      location: searchParams.get('location'),
      priceMin: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      priceMax: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      bedrooms: searchParams.get('bedrooms'),
      bathrooms: searchParams.get('bathrooms')
    }

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined)
    )

    const result = await SimpleDatabase.getProperties(cleanFilters)

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
    console.error('Properties API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json({
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}