import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const searchParams = await request.json()
    
    // Normalize search parameters for the optimized database service
    const normalizedParams = {
      query: searchParams.query || searchParams.keywordDescription,
      location: searchParams.location || searchParams.filters?.location,
      priceMin: searchParams.filters?.priceRange?.min ? parseInt(searchParams.filters.priceRange.min) : undefined,
      priceMax: searchParams.filters?.priceRange?.max ? parseInt(searchParams.filters.priceRange.max) : undefined,
      type: searchParams.filters?.propertyType,
      bedrooms: searchParams.filters?.bedrooms,
      bathrooms: searchParams.filters?.bathrooms,
      amenities: searchParams.filters?.amenities,
      region: searchParams.region || searchParams.filters?.region,
      estate: searchParams.estate || searchParams.filters?.estate
    }

    const result = await DatabaseService.searchProperties(normalizedParams)

    return NextResponse.json({
      ...result,
      success: true,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Performance-Metrics': JSON.stringify(DatabaseService.getMetrics())
      }
    })

  } catch (error) {
    console.error('Search API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}