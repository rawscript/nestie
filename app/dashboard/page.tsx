'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Filter, Heart, Eye, MessageCircle, Calendar, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { YandexMap } from '@/components/YandexMap'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  agent_id: string
}

export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)

  // Mock properties for demo
  const mockProperties: Property[] = [
    {
      id: '1',
      title: 'Modern 2BR Apartment',
      description: 'Beautiful modern apartment with city views',
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
      images: ['/api/placeholder/400/300'],
      agent_id: 'agent1'
    },
    {
      id: '2',
      title: 'Luxury Villa',
      description: 'Spacious villa with garden and pool',
      price: 12000000,
      type: 'sale',
      bedrooms: 4,
      bathrooms: 3,
      area: 2500,
      location: {
        address: 'Karen, Nairobi',
        lat: -1.3194,
        lng: 36.7085
      },
      images: ['/api/placeholder/400/300'],
      agent_id: 'agent2'
    }
  ]

  const handleSearch = async () => {
    setLoading(true)
    setShowMap(true)
    
    // Simulate API call
    setTimeout(() => {
      setProperties(mockProperties)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Header */}
      <header className="bg-nestie-white border-b border-nestie-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-nestie-black rounded-lg flex items-center justify-center">
                <span className="text-nestie-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-nestie-black">Nestie</span>
            </Link>
            
            <nav className="flex items-center space-x-4">
              <Link href="/tenant/portal">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  My Rentals
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Saved
              </Button>
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Find Your Perfect Home</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Button onClick={handleSearch} loading={loading} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Map Section */}
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-0">
                <YandexMap
                  properties={properties.map(p => ({
                    id: p.id,
                    title: p.title,
                    location: { lat: p.location.lat, lng: p.location.lng },
                    price: p.price
                  }))}
                  onMarkerClick={(propertyId) => {
                    // Handle property selection
                    console.log('Selected property:', propertyId)
                  }}
                  height="h-80"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results Section */}
        {properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-nestie-black">
                {properties.length} Properties Found
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/property/${property.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-video bg-nestie-grey-200 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Eye className="h-8 w-8 text-nestie-grey-400" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-nestie-white/80">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-nestie-black">{property.title}</h3>
                          <span className="text-lg font-bold text-nestie-black">
                            KSh {property.price.toLocaleString()}
                            {property.type === 'rent' && '/month'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-nestie-grey-500 mb-3">{property.description}</p>
                        
                        <div className="flex items-center text-sm text-nestie-grey-600 mb-3">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.location.address}
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-nestie-grey-600 mb-4">
                          <span>{property.bedrooms} bed</span>
                          <span>{property.bathrooms} bath</span>
                          <span>{property.area} sqft</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            Visit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!showMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="h-16 w-16 text-nestie-grey-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-nestie-grey-600 mb-2">
              Start Your Search
            </h3>
            <p className="text-nestie-grey-500">
              Enter your preferences above to discover amazing properties
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}