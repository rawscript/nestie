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
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

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