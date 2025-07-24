'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

// Extend Window interface for Yandex Maps
declare global {
  interface Window {
    ymaps: any
  }
}

interface YandexMapProps {
  properties?: Array<{
    id: string
    title: string
    location: {
      lat: number
      lng: number
    }
    price: number
  }>
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (propertyId: string) => void
  height?: string
  className?: string
}

export function YandexMap({ 
  properties = [], 
  center = [-1.2921, 36.8219], // Default to Nairobi
  zoom = 12,
  onMarkerClick,
  height = "h-64 md:h-96",
  className = ""
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load Yandex Maps API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.ymaps) {
      const script = document.createElement('script')
      // Use environment variable for API key or fallback to demo key
      const apiKey = process.env.NEXT_PUBLIC_YANDEX_API_KEY || 'demo-key'
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=en_US`
      script.async = true
      script.onload = () => {
        window.ymaps.ready(() => {
          setMapLoaded(true)
        })
      }
      script.onerror = () => {
        setError('Failed to load Yandex Maps API')
      }
      document.body.appendChild(script)
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    } else if (window.ymaps) {
      window.ymaps.ready(() => {
        setMapLoaded(true)
      })
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstance) {
      const map = new window.ymaps.Map(mapRef.current, {
        center,
        zoom,
        controls: ['zoomControl', 'fullscreenControl']
      })
      
      setMapInstance(map)
    }
  }, [mapLoaded, center, zoom, mapInstance])

  // Add markers for properties
  useEffect(() => {
    if (mapInstance && properties.length > 0) {
      // Clear existing markers
      markers.forEach((marker: any) => {
        mapInstance.geoObjects.remove(marker)
      })
      
      const newMarkers = properties.map((property) => {
        // Create placemark with custom balloon content
        const placemark = new window.ymaps.Placemark(
          [property.location.lat, property.location.lng],
          {
            hintContent: property.title,
            balloonContent: `
              <div class="p-3">
                <h3 class="font-semibold text-lg mb-2">${property.title}</h3>
                <p class="text-green-600 font-bold">KSh ${property.price.toLocaleString()}</p>
              </div>
            `
          },
          {
            preset: 'islands#redDotIcon',
            iconColor: '#000000'
          }
        )
        
        // Add click event
        placemark.events.add('click', () => {
          if (onMarkerClick) {
            onMarkerClick(property.id)
          }
        })
        
        mapInstance.geoObjects.add(placemark)
        return placemark
      })
      
      setMarkers(newMarkers)
      
      // Adjust map bounds to fit all markers if there are multiple properties
      if (newMarkers.length > 1) {
        try {
          mapInstance.setBounds(mapInstance.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
          })
        } catch (e) {
          console.warn('Could not adjust map bounds:', e)
        }
      }
    }
  }, [mapInstance, properties, onMarkerClick])

  return (
    <div className={`relative w-full ${className}`}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}
      {!mapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
      <motion.div 
        ref={mapRef} 
        className={`w-full ${height} rounded-lg overflow-hidden`}
        initial={{ opacity: 0 }}
        animate={{ opacity: mapLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
}