import { Database } from './database'
import { ErrorHandler, ErrorType } from './errorHandler'
import { MonitoringService } from './monitoring'
import type { Property, SearchFilters } from './types'

export interface GeoLocation {
  lat: number
  lng: number
}

export interface GeoSearchParams extends SearchFilters {
  center?: GeoLocation
  radius?: number // in kilometers
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface GeoSearchResult {
  properties: Property[]
  center: GeoLocation
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  count: number
}

export class GeoSearchService {
  // Geocode address to coordinates
  static async geocodeAddress(address: string): Promise<GeoLocation | null> {
    const stopTimer = MonitoringService.startTimer('geocode_address')
    
    try {
      // Try multiple geocoding services for better coverage
      
      // 1. Try Yandex Maps Geocoding API
      const yandexResult = await this.geocodeWithYandex(address)
      if (yandexResult) {
        stopTimer()
        return yandexResult
      }

      // 2. Fallback to OpenStreetMap Nominatim (free)
      const nominatimResult = await this.geocodeWithNominatim(address)
      if (nominatimResult) {
        stopTimer()
        return nominatimResult
      }

      stopTimer()
      return null
    } catch (error) {
      stopTimer()
      await ErrorHandler.handleError(error as Error, ErrorType.NETWORK, 'geocode_address')
      return null
    }
  }

  // Reverse geocode coordinates to address
  static async reverseGeocode(location: GeoLocation): Promise<string | null> {
    const stopTimer = MonitoringService.startTimer('reverse_geocode')
    
    try {
      // Try Yandex Maps first
      const yandexResult = await this.reverseGeocodeWithYandex(location)
      if (yandexResult) {
        stopTimer()
        return yandexResult
      }

      // Fallback to Nominatim
      const nominatimResult = await this.reverseGeocodeWithNominatim(location)
      if (nominatimResult) {
        stopTimer()
        return nominatimResult
      }

      stopTimer()
      return null
    } catch (error) {
      stopTimer()
      await ErrorHandler.handleError(error as Error, ErrorType.NETWORK, 'reverse_geocode')
      return null
    }
  }

  // Search properties within radius
  static async searchPropertiesWithinRadius(
    center: GeoLocation,
    radius: number,
    filters: SearchFilters = {}
  ): Promise<GeoSearchResult> {
    const stopTimer = MonitoringService.startTimer('geo_search_radius')
    
    try {
      // Use PostGIS function for radius search
      const response = await fetch('/api/properties/geo-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center,
          radius,
          filters
        })
      })

      if (!response.ok) {
        throw new Error('Geographic search failed')
      }

      const result = await response.json()
      stopTimer()

      MonitoringService.recordMetric({
        name: 'geo_search_results',
        value: result.count,
        unit: 'count',
        context: 'geo_search',
        metadata: { radius, center }
      })

      return result
    } catch (error) {
      stopTimer()
      await ErrorHandler.handleError(error as Error, ErrorType.NETWORK, 'geo_search_radius')
      
      // Fallback to basic search
      const fallbackResult = await Database.searchProperties(filters)
      return {
        properties: fallbackResult.data || [],
        center,
        bounds: this.calculateBounds([center], radius),
        count: fallbackResult.data?.length || 0
      }
    }
  }

  // Search properties within bounds
  static async searchPropertiesWithinBounds(
    bounds: GeoSearchParams['bounds'],
    filters: SearchFilters = {}
  ): Promise<GeoSearchResult> {
    if (!bounds) {
      throw new Error('Bounds are required for bounds search')
    }

    const stopTimer = MonitoringService.startTimer('geo_search_bounds')
    
    try {
      const response = await fetch('/api/properties/geo-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bounds,
          filters
        })
      })

      if (!response.ok) {
        throw new Error('Geographic bounds search failed')
      }

      const result = await response.json()
      stopTimer()

      return result
    } catch (error) {
      stopTimer()
      await ErrorHandler.handleError(error as Error, ErrorType.NETWORK, 'geo_search_bounds')
      
      // Fallback to basic search
      const fallbackResult = await Database.searchProperties(filters)
      const center = this.calculateCenter(bounds)
      
      return {
        properties: fallbackResult.data || [],
        center,
        bounds,
        count: fallbackResult.data?.length || 0
      }
    }
  }

  // Get user's current location
  static async getCurrentLocation(): Promise<GeoLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation error:', error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(point1: GeoLocation, point2: GeoLocation): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Calculate bounds from center and radius
  static calculateBounds(points: GeoLocation[], radius?: number): GeoSearchParams['bounds'] {
    if (points.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 }
    }

    let north = points[0].lat
    let south = points[0].lat
    let east = points[0].lng
    let west = points[0].lng

    points.forEach(point => {
      north = Math.max(north, point.lat)
      south = Math.min(south, point.lat)
      east = Math.max(east, point.lng)
      west = Math.min(west, point.lng)
    })

    // Expand bounds by radius if provided
    if (radius) {
      const latDelta = radius / 111 // Approximate km to degrees
      const lngDelta = radius / (111 * Math.cos(this.toRadians((north + south) / 2)))
      
      north += latDelta
      south -= latDelta
      east += lngDelta
      west -= lngDelta
    }

    return { north, south, east, west }
  }

  // Calculate center from bounds
  static calculateCenter(bounds: GeoSearchParams['bounds']): GeoLocation {
    if (!bounds) {
      return { lat: -1.2921, lng: 36.8219 } // Default to Nairobi
    }

    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    }
  }

  // Geocoding implementations
  private static async geocodeWithYandex(address: string): Promise<GeoLocation | null> {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
    if (!apiKey || apiKey === 'demo-key') return null

    try {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(address)}&format=json&results=1`
      )

      if (!response.ok) return null

      const data = await response.json()
      const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
      
      if (geoObject) {
        const [lng, lat] = geoObject.Point.pos.split(' ').map(Number)
        return { lat, lng }
      }

      return null
    } catch (error) {
      console.warn('Yandex geocoding failed:', error)
      return null
    }
  }

  private static async geocodeWithNominatim(address: string): Promise<GeoLocation | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ke`
      )

      if (!response.ok) return null

      const data = await response.json()
      
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }

      return null
    } catch (error) {
      console.warn('Nominatim geocoding failed:', error)
      return null
    }
  }

  private static async reverseGeocodeWithYandex(location: GeoLocation): Promise<string | null> {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
    if (!apiKey || apiKey === 'demo-key') return null

    try {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${location.lng},${location.lat}&format=json&results=1`
      )

      if (!response.ok) return null

      const data = await response.json()
      const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
      
      return geoObject?.metaDataProperty?.GeocoderMetaData?.text || null
    } catch (error) {
      console.warn('Yandex reverse geocoding failed:', error)
      return null
    }
  }

  private static async reverseGeocodeWithNominatim(location: GeoLocation): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&countrycodes=ke`
      )

      if (!response.ok) return null

      const data = await response.json()
      return data.display_name || null
    } catch (error) {
      console.warn('Nominatim reverse geocoding failed:', error)
      return null
    }
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

// React hook for geographic search
export function useGeoSearch() {
  const [currentLocation, setCurrentLocation] = React.useState<GeoLocation | null>(null)
  const [locationPermission, setLocationPermission] = React.useState<'granted' | 'denied' | 'prompt'>('prompt')

  React.useEffect(() => {
    // Check geolocation permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as any)
        
        result.addEventListener('change', () => {
          setLocationPermission(result.state as any)
        })
      })
    }
  }, [])

  const getCurrentLocation = async (): Promise<GeoLocation | null> => {
    const location = await GeoSearchService.getCurrentLocation()
    setCurrentLocation(location)
    return location
  }

  const searchNearby = async (
    radius: number = 5,
    filters: SearchFilters = {}
  ): Promise<GeoSearchResult | null> => {
    const location = currentLocation || await getCurrentLocation()
    if (!location) return null

    return GeoSearchService.searchPropertiesWithinRadius(location, radius, filters)
  }

  const geocodeAddress = (address: string) => {
    return GeoSearchService.geocodeAddress(address)
  }

  const reverseGeocode = (location: GeoLocation) => {
    return GeoSearchService.reverseGeocode(location)
  }

  const calculateDistance = (point1: GeoLocation, point2: GeoLocation) => {
    return GeoSearchService.calculateDistance(point1, point2)
  }

  return {
    currentLocation,
    locationPermission,
    getCurrentLocation,
    searchNearby,
    geocodeAddress,
    reverseGeocode,
    calculateDistance
  }
}