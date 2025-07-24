'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  MessageCircle,
  Phone,
  Mail,
  Eye,
  Camera,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { YandexMap } from '@/components/YandexMap'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Property {
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
    lat: number
    lng: number
  }
  images: string[]
  agent: {
    id: string
    name: string
    email: string
    phone: string
    avatar: string
  }
  amenities: string[]
  virtualTourUrl?: string
  created_at: string
}

export default function PropertyDetailPage() {
  const params = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showVirtualTour, setShowVirtualTour] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mock property data
  const mockProperty: Property = {
    id: params.id as string,
    title: 'Modern 2BR Apartment in Westlands',
    description: 'Beautiful modern apartment with stunning city views, located in the heart of Westlands. This spacious 2-bedroom, 2-bathroom unit features contemporary finishes, an open-plan living area, and a private balcony overlooking the city skyline. Perfect for professionals or small families looking for luxury living in a prime location.',
    price: 85000,
    type: 'rent',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: {
      address: 'Westlands, Nairobi',
      lat: -1.2676,
      lng: 36.8108
    },
    images: [
      '/api/placeholder/800/600',
      '/api/placeholder/800/600',
      '/api/placeholder/800/600',
      '/api/placeholder/800/600'
    ],
    agent: {
      id: 'agent1',
      name: 'Sarah Johnson',
      email: 'sarah@nestie.com',
      phone: '+254 700 123 456',
      avatar: '/api/placeholder/100/100'
    },
    amenities: [
      'Swimming Pool',
      'Gym',
      'Parking',
      'Security',
      'Elevator',
      'Balcony',
      'Air Conditioning',
      'Internet'
    ],
    virtualTourUrl: 'https://example.com/virtual-tour',
    created_at: '2024-01-15'
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProperty(mockProperty)
      setLoading(false)
    }, 1000)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestie-black mx-auto mb-4"></div>
          <p className="text-nestie-grey-500">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-nestie-black mb-2">Property Not Found</h1>
          <p className="text-nestie-grey-500 mb-4">The property you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Header */}
      <header className="bg-nestie-white border-b border-nestie-grey-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-nestie-grey-600" />
              <span className="text-nestie-grey-600">Back to Search</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="relative">
                  <div className="aspect-video bg-nestie-grey-200 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-nestie-grey-400" />
                    </div>
                  </div>
                  
                  {/* Virtual Tour Button */}
                  {property.virtualTourUrl && (
                    <div className="absolute top-4 left-4">
                      <Button 
                        onClick={() => setShowVirtualTour(true)}
                        className="bg-nestie-black/80 hover:bg-nestie-black"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Virtual Tour
                      </Button>
                    </div>
                  )}
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-nestie-black/80 text-nestie-white px-3 py-1 rounded-lg text-sm">
                    <Eye className="h-4 w-4 inline mr-1" />
                    {property.images.length} Photos
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Property Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-nestie-black mb-2">{property.title}</h1>
                      <div className="flex items-center text-nestie-grey-600 mb-4">
                        <MapPin className="h-5 w-5 mr-2" />
                        {property.location.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-nestie-black">
                        KSh {property.price.toLocaleString()}
                      </div>
                      <div className="text-nestie-grey-500">
                        {property.type === 'rent' ? 'per month' : 'total price'}
                      </div>
                    </div>
                  </div>

                  {/* Property Stats */}
                  <div className="flex items-center space-x-6 mb-6 pb-6 border-b border-nestie-grey-200">
                    <div className="flex items-center space-x-2">
                      <Bed className="h-5 w-5 text-nestie-grey-400" />
                      <span className="text-nestie-grey-600">{property.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bath className="h-5 w-5 text-nestie-grey-400" />
                      <span className="text-nestie-grey-600">{property.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Square className="h-5 w-5 text-nestie-grey-400" />
                      <span className="text-nestie-grey-600">{property.area} sqft</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-nestie-black mb-3">Description</h3>
                    <p className="text-nestie-grey-600 leading-relaxed">{property.description}</p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="text-lg font-semibold text-nestie-black mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-nestie-black rounded-full"></div>
                          <span className="text-nestie-grey-600">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <YandexMap
                    properties={[{
                      id: property.id,
                      title: property.title,
                      location: property.location,
                      price: property.price
                    }]}
                    center={[property.location.lat, property.location.lng]}
                    zoom={15}
                    height="h-64"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Contact Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-nestie-grey-200 rounded-full flex items-center justify-center">
                      <span className="text-nestie-grey-600 font-medium">
                        {property.agent.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-nestie-black">{property.agent.name}</h4>
                      <p className="text-sm text-nestie-grey-500">Licensed Agent</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-nestie-grey-400" />
                      <span className="text-nestie-grey-600">{property.agent.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-nestie-grey-400" />
                      <span className="text-nestie-grey-600">{property.agent.email}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Link href="/messages">
                      <Button className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </Link>
                    <Link href={`/property/${property.id}/book`}>
                      <Button variant="outline" className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Visit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Heart className="h-4 w-4 mr-2" />
                      Save Property
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Property
                    </Button>
                    {property.virtualTourUrl && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setShowVirtualTour(true)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Virtual Tour
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Virtual Tour Modal */}
      {showVirtualTour && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-nestie-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-nestie-grey-200">
              <h3 className="text-lg font-semibold text-nestie-black">Virtual Tour</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowVirtualTour(false)}
              >
                ×
              </Button>
            </div>
            <div className="aspect-video bg-nestie-grey-100 flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 text-nestie-grey-400 mx-auto mb-4" />
                <p className="text-nestie-grey-500">Virtual tour would load here</p>
                <p className="text-sm text-nestie-grey-400">360° viewer or WebXR-compatible content</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}