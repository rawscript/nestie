import { useState } from 'react'
import { Heart, MapPin, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface PropertyCardProps {
  property: {
    id: string
    title: string
    description: string
    price: number
    type: 'rent' | 'sale'
    bedrooms: number
    bathrooms: number
    area: number
    location: {
      address: string
    }
    images: string[]
  }
  isFavorite?: boolean
  onToggleFavorite?: () => void
  viewMode?: 'grid' | 'list'
}

export function PropertyCard({ 
  property, 
  isFavorite = false, 
  onToggleFavorite, 
  viewMode = 'grid' 
}: PropertyCardProps) {
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite()
    }
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="property-card"
      >
        <Link href={`/property/${property.id}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex">
              <div className="w-64 h-48 bg-nestie-grey-200 relative flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-nestie-grey-400" />
                </div>
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-nestie-white/80 rounded-full"
                    onClick={toggleFavorite}
                  >
                    <Heart
                      className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </Button>
                </div>
              </div>

              <CardContent className="p-6 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-nestie-black mb-2">{property.title}</h3>
                    <div className="flex items-center text-nestie-grey-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{property.location.address}</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-nestie-black ml-4">
                    {formatPrice(property.price, property.type)}
                  </span>
                </div>

                <p className="text-nestie-grey-500 mb-4 line-clamp-2">{property.description}</p>

                <div className="flex items-center space-x-6 text-nestie-grey-600">
                  <span className="flex items-center">
                    <span className="font-medium">{property.bedrooms}</span>
                    <span className="ml-1">bed</span>
                  </span>
                  <span className="flex items-center">
                    <span className="font-medium">{property.bathrooms}</span>
                    <span className="ml-1">bath</span>
                  </span>
                  <span className="flex items-center">
                    <span className="font-medium">{property.area}</span>
                    <span className="ml-1">sqft</span>
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      </motion.div>
    )
  }

  // Grid view (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="property-card"
    >
      <Link href={`/property/${property.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
          <div className="aspect-video bg-nestie-grey-200 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Eye className="h-8 w-8 text-nestie-grey-400" />
            </div>
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-nestie-white/80 rounded-full"
                onClick={toggleFavorite}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-nestie-black">{property.title}</h3>
              <span className="text-lg font-bold text-nestie-black">
                {formatPrice(property.price, property.type)}
              </span>
            </div>

            <p className="text-sm text-nestie-grey-500 mb-3 line-clamp-2">{property.description}</p>

            <div className="flex items-center text-sm text-nestie-grey-600 mb-3">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{property.location.address}</span>
            </div>

            <div className="flex justify-between items-center text-sm text-nestie-grey-600">
              <span>{property.bedrooms} bed</span>
              <span>{property.bathrooms} bath</span>
              <span>{property.area} sqft</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}