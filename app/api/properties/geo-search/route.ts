import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ErrorHandler, ErrorType } from '@/lib/errorHandler'
import { MonitoringService } from '@/lib/monitoring'

export async function POST(request: NextRequest) {
  const stopTimer = MonitoringService.startTimer('api_geo_search')

  try {
    const { center, radius, bounds, filters = {} } = await request.json()

    // Validate input
    if (!center && !bounds) {
      await ErrorHandler.logError(
        'Geographic search requires either center+radius or bounds',
        ErrorType.VALIDATION,
        'geo-search-api'
      )
      return NextResponse.json(
        { error: 'Either center+radius or bounds is required' },
        { status: 400 }
      )
    }

    let query
    let properties

    // Apply geographic filters
    if (center && radius) {
      // Use PostGIS function for radius search
      const { data, error } = await supabase.rpc('properties_within_radius', {
        lat: center.lat,
        lng: center.lng,
        radius_km: radius
      })

      if (error) {
        await ErrorHandler.handleDatabaseError(error, 'geo-search-api-rpc')
        return NextResponse.json(
          { error: 'Geographic search failed' },
          { status: 500 }
        )
      }

      properties = data || []
    } else {
      // Standard query for bounds or no geographic filter
      query = supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, email, phone, verified)
        `)
        .eq('status', 'available')

      if (bounds) {
        // Filter by geographic bounds using lat/lng from location JSONB
        query = query
          .gte('location->>lat', bounds.south.toString())
          .lte('location->>lat', bounds.north.toString())
          .gte('location->>lng', bounds.west.toString())
          .lte('location->>lng', bounds.east.toString())
      }
    }

    // Apply additional filters only if we have a query (not using RPC)
    if (!properties && query) {
      // Apply additional filters
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters.listingType && filters.listingType !== 'all') {
        query = query.eq('listingType', filters.listingType)
      }

      if (filters.priceMin) {
        query = query.gte('price', filters.priceMin)
      }

      if (filters.priceMax) {
        query = query.lte('price', filters.priceMax)
      }

      if (filters.bedrooms && filters.bedrooms !== 'any') {
        const bedroomCount = filters.bedrooms === '4+' ? 4 : parseInt(filters.bedrooms.toString())
        if (filters.bedrooms === '4+') {
          query = query.gte('specifications->>bedrooms', bedroomCount.toString())
        } else {
          query = query.eq('specifications->>bedrooms', bedroomCount.toString())
        }
      }

      if (filters.bathrooms && filters.bathrooms !== 'any') {
        const bathroomCount = filters.bathrooms === '4+' ? 4 : parseInt(filters.bathrooms.toString())
        if (filters.bathrooms === '4+') {
          query = query.gte('specifications->>bathrooms', bathroomCount.toString())
        } else {
          query = query.eq('specifications->>bathrooms', bathroomCount.toString())
        }
      }

      // Text search
      if (filters.query) {
        query = query.or(`
          title.ilike.%${filters.query}%,
          description.ilike.%${filters.query}%
        `)
      }

      // Location search
      if (filters.location) {
        query = query.or(`
          location->>address.ilike.%${filters.location}%,
          location->>city.ilike.%${filters.location}%,
          location->>region.ilike.%${filters.location}%
        `)
      }

      // Execute query
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        await ErrorHandler.handleDatabaseError(error, 'geo-search-api')
        return NextResponse.json(
          { error: 'Geographic search failed' },
          { status: 500 }
        )
      }

      properties = data || []
    }

    // If we used RPC, we need to apply filters manually
    if (properties && center && radius) {
      // Apply filters to RPC results
      properties = properties.filter((property: any) => {
        // Type filter
        if (filters.type && filters.type !== 'all' && property.type !== filters.type) {
          return false
        }

        // Listing type filter
        if (filters.listingType && filters.listingType !== 'all' && property.listingType !== filters.listingType) {
          return false
        }

        // Price filters
        if (filters.priceMin && property.price < filters.priceMin) {
          return false
        }
        if (filters.priceMax && property.price > filters.priceMax) {
          return false
        }

        // Bedroom filter
        if (filters.bedrooms && filters.bedrooms !== 'any') {
          const propertyBedrooms = parseInt(property.specifications?.bedrooms || '0')
          const filterBedrooms = filters.bedrooms === '4+' ? 4 : parseInt(filters.bedrooms.toString())

          if (filters.bedrooms === '4+') {
            if (propertyBedrooms < filterBedrooms) return false
          } else {
            if (propertyBedrooms !== filterBedrooms) return false
          }
        }

        // Bathroom filter
        if (filters.bathrooms && filters.bathrooms !== 'any') {
          const propertyBathrooms = parseInt(property.specifications?.bathrooms || '0')
          const filterBathrooms = filters.bathrooms === '4+' ? 4 : parseInt(filters.bathrooms.toString())

          if (filters.bathrooms === '4+') {
            if (propertyBathrooms < filterBathrooms) return false
          } else {
            if (propertyBathrooms !== filterBathrooms) return false
          }
        }

        // Text search
        if (filters.query) {
          const query = filters.query.toLowerCase()
          const title = property.title?.toLowerCase() || ''
          const description = property.description?.toLowerCase() || ''

          if (!title.includes(query) && !description.includes(query)) {
            return false
          }
        }

        // Location search
        if (filters.location) {
          const location = filters.location.toLowerCase()
          const address = property.location?.address?.toLowerCase() || ''
          const city = property.location?.city?.toLowerCase() || ''
          const region = property.location?.region?.toLowerCase() || ''

          if (!address.includes(location) && !city.includes(location) && !region.includes(location)) {
            return false
          }
        }

        return true
      })

      // Sort and limit results
      properties = properties
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100)
    }

    // Calculate result bounds
    let resultBounds = bounds
    if (!resultBounds && properties && properties.length > 0) {
      const locations = properties
        .filter((p: { location: { lat: any; lng: any } }) => p.location?.lat && p.location?.lng)
        .map((p: { location: { lat: any; lng: any } }) => ({ lat: p.location.lat, lng: p.location.lng }))

      if (locations.length > 0) {
        resultBounds = calculateBounds(locations)
      }
    }

    // Calculate center if not provided
    let resultCenter = center
    if (!resultCenter && resultBounds) {
      resultCenter = {
        lat: (resultBounds.north + resultBounds.south) / 2,
        lng: (resultBounds.east + resultBounds.west) / 2
      }
    }

    const result = {
      properties: properties || [],
      center: resultCenter || { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi
      bounds: resultBounds || { north: 0, south: 0, east: 0, west: 0 },
      count: properties?.length || 0
    }

    stopTimer()

    // Log successful search
    MonitoringService.recordMetric({
      name: 'geo_search_success',
      value: result.count,
      unit: 'count',
      context: 'api',
      metadata: {
        hasCenter: !!center,
        hasBounds: !!bounds,
        radius,
        filtersApplied: Object.keys(filters).length
      }
    })

    return NextResponse.json(result)

  } catch (error: any) {
    stopTimer()
    await ErrorHandler.handleError(error, ErrorType.UNKNOWN, 'geo-search-api')

    return NextResponse.json(
      { error: 'Geographic search failed' },
      { status: 500 }
    )
  }
}

// Helper function to calculate bounds from locations
function calculateBounds(locations: Array<{ lat: number; lng: number }>) {
  if (locations.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  let north = locations[0].lat
  let south = locations[0].lat
  let east = locations[0].lng
  let west = locations[0].lng

  locations.forEach(location => {
    north = Math.max(north, location.lat)
    south = Math.min(south, location.lat)
    east = Math.max(east, location.lng)
    west = Math.min(west, location.lng)
  })

  // Add small padding
  const padding = 0.01
  return {
    north: north + padding,
    south: south - padding,
    east: east + padding,
    west: west - padding
  }
}