'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Search, Filter, MapPin, Eye, MessageCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PropertyCard } from '@/components/PropertyCard'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { Breadcrumb } from '@/components/Breadcrumb'
import { sampleProperties, type Property } from '@/lib/sampleData'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SavedPropertiesPage() {
  const [savedProperties, setSavedProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])

  useEffect(() => {
    // Simulate loading saved properties
    // In a real app, this would fetch from your database
    const loadSavedProperties = async () => {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, let's show first 3 properties as saved
      const mockSavedProperties = sampleProperties.slice(0, 3)
      setSavedProperties(mockSavedProperties)
      setFilteredProperties(mockSavedProperties)
      setLoading(false)
    }

    loadSavedProperties()
  }, [])

  useEffect(() => {
    // Filter properties based on search query
    if (searchQuery.trim() === '') {
      setFilteredProperties(savedProperties)
    } else {
      const filtered = savedProperties.filter(property =>
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProperties(filtered)
    }
  }, [searchQuery, savedProperties])

  const handleRemoveFromSaved = (propertyId: string) => {
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId))
    toast.success('Property removed from saved list')
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tenant">
        <div className="min-h-screen bg-nestie-grey-50">
          <Navigation userRole="tenant" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nestie-black"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="tenant">
      <div className="min-h-screen bg-nestie-grey-50">
        <Navigation userRole="tenant" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Saved Properties' }
          ]} />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-nestie-black mb-2">Saved Properties</h1>
                <p className="text-nestie-grey-600">
                  Properties you've saved for later viewing
                </p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Search
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search saved properties..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {filteredProperties.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-nestie-black">
                  {filteredProperties.length} Saved {filteredProperties.length === 1 ? 'Property' : 'Properties'}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PropertyCard 
                      property={property} 
                      onRemoveFromSaved={() => handleRemoveFromSaved(property.id)}
                      showRemoveButton={true}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center py-16"
            >
              <Heart className="h-16 w-16 text-nestie-grey-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-nestie-grey-600 mb-2">
                {searchQuery ? 'No matching saved properties' : 'No saved properties yet'}
              </h3>
              <p className="text-nestie-grey-500 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start exploring properties and save the ones you like'
                }
              </p>
              {!searchQuery && (
                <Link href="/dashboard">
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}