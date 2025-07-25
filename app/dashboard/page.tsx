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
import { Navigation } from '@/components/Navigation'
import { Breadcrumb } from '@/components/Breadcrumb'
import { sampleProperties, type Property } from '@/lib/sampleData'
import { useRouter } from 'next/navigation'
import { useSessionState } from '@/lib/sessionStateManager'
import { TabStateIndicator } from '@/components/TabStateIndicator'

export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const router = useRouter()
  
  // Use session state management to preserve search state
  const { isTabActive, restoreState, saveCurrentState } = useSessionState('dashboard-search')

  // Restore search state when component mounts
  useEffect(() => {
    restoreState()
  }, [restoreState])

  // Save state when search query or location changes
  useEffect(() => {
    if (searchQuery || location) {
      saveCurrentState()
    }
  }, [searchQuery, location, saveCurrentState])



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
      <TabStateIndicator showIndicator={process.env.NODE_ENV === 'development'} />
      <Navigation userRole="tenant" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Property Search' }]} />
        
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
                  name="searchQuery"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Input
                  name="location"
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