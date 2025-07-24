'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Filter, Heart, Eye, MessageCircle, Calendar, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { YandexMap } from '@/components/YandexMap'
import { PropertyCard } from '@/components/PropertyCard'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { signOut } from '@/lib/supabase'
import { sampleProperties, type Property } from '@/lib/sampleData'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error('Error logging out')
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    setShowMap(true)
    
    // Simulate API call with comprehensive sample data
    setTimeout(() => {
      // Filter properties based on search query and location
      let filteredProperties = sampleProperties
      
      if (searchQuery) {
        filteredProperties = filteredProperties.filter(property =>
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      if (location) {
        filteredProperties = filteredProperties.filter(property =>
          property.location.address.toLowerCase().includes(location.toLowerCase())
        )
      }
      
      setProperties(filteredProperties)
      setLoading(false)
    }, 1000)
  }

  return (
    <ProtectedRoute requiredRole="tenant">
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
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
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
                  <PropertyCard property={property} />
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
    </ProtectedRoute>
  )
}