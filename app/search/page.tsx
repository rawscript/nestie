'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Filter,
  MapPin,
  Bed,
  Bath,
  Car,
  Wifi,
  Waves,
  Shield,
  Heart,
  Star,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'

interface Property {
  id: string
  title: string
  description: string
  type: string
  listingType: string
  price: number
  location: {
    address: string
    city: string
    county: string
    coordinates: { lat: number; lng: number }
  }
  specifications: {
    bedrooms: number
    bathrooms: number
    area: string
    parking: boolean
    furnished: boolean
    petFriendly: boolean
  }
  amenities: {
    wifi: boolean
    pool: boolean
    gym: boolean
    security: boolean
    garden: boolean
    balcony: boolean
    aircon: boolean
    heating: boolean
  }
  images: string[]
  contactInfo: {
    phone: string
    email: string
    whatsapp: string
  }
  terms: {
    deposit: string
    leasePeriod: string
    paymentMethod: string
    utilities: string
  }
  agent_id: string
  status: string
  created_at: string
  rating?: number
  reviews?: number
}

function PropertySearchContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [savedProperties, setSavedProperties] = useState<string[]>([])

  // Search filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'all')
  const [listingType, setListingType] = useState(searchParams.get('listing') || 'all')
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  })
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || 'any')
  const [bathrooms, setBathrooms] = useState(searchParams.get('bathrooms') || 'any')
  const [amenities, setAmenities] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    handleSearch()
  }, [])

  useEffect(() => {
    if (user) {
      loadSavedProperties()
    }
  }, [user])

  const handleSearch = async () => {
    setLoading(true)
    try {
      // Prepare search parameters for the optimized API
      const searchParams = {
        query: searchQuery,
        filters: {
          location: location,
          propertyType: propertyType,
          listingType: listingType,
          priceRange: {
            min: priceRange.min,
            max: priceRange.max
          },
          bedrooms: bedrooms,
          bathrooms: bathrooms,
          amenities: amenities.reduce((acc, amenity) => {
            acc[amenity] = true
            return acc
          }, {} as Record<string, boolean>)
        }
      }

      const response = await fetch('/api/properties/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setProperties(data.data || [])

      // Update URL with search params for bookmarking
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (location) params.append('location', location)
      if (propertyType !== 'all') params.append('type', propertyType)
      if (listingType !== 'all') params.append('listing', listingType)
      if (priceRange.min) params.append('minPrice', priceRange.min)
      if (priceRange.max) params.append('maxPrice', priceRange.max)
      if (bedrooms !== 'any') params.append('bedrooms', bedrooms)
      if (bathrooms !== 'any') params.append('bathrooms', bathrooms)
      if (amenities.length > 0) params.append('amenities', amenities.join(','))

      const newUrl = `/search?${params.toString()}`
      window.history.replaceState({}, '', newUrl)

    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search properties')
    } finally {
      setLoading(false)
    }
  }

  const loadSavedProperties = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/properties/saved?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSavedProperties(data.savedProperties || [])
      }
    } catch (error) {
      console.error('Error loading saved properties:', error)
    }
  }

  const handleSaveProperty = async (propertyId: string) => {
    if (!user) {
      toast.error('Please login to save properties')
      router.push('/auth/login')
      return
    }

    try {
      const isSaved = savedProperties.includes(propertyId)
      const method = isSaved ? 'DELETE' : 'POST'

      const response = await fetch('/api/properties/saved', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, propertyId })
      })

      if (!response.ok) throw new Error('Failed to update saved property')

      if (isSaved) {
        setSavedProperties(prev => prev.filter(id => id !== propertyId))
        toast.success('Property removed from saved')
      } else {
        setSavedProperties(prev => [...prev, propertyId])
        toast.success('Property saved successfully')
      }
    } catch (error) {
      console.error('Error saving property:', error)
      toast.error('Failed to save property')
    }
  }

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/property/${propertyId}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setLocation('')
    setPropertyType('all')
    setListingType('all')
    setPriceRange({ min: '', max: '' })
    setBedrooms('any')
    setBathrooms('any')
    setAmenities([])
    setProperties([])
  }

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Search Header */}
      <div className="bg-nestie-white border-b border-nestie-grey-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Search Bar */}
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-nestie-grey-400" />
                <input
                  type="text"
                  placeholder="Search by keywords, property type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-nestie-grey-400" />
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent min-w-[200px]"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-nestie-black text-white px-6 py-3 rounded-lg hover:bg-nestie-grey-800 disabled:opacity-50 flex items-center"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 border border-nestie-grey-300 rounded-lg hover:bg-nestie-grey-50"
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-nestie-grey-50 rounded-lg">
              <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                </select>

                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className="px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                >
                  <option value="all">All Listings</option>
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                  <option value="lease">For Lease</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                />

                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                >
                  <option value="any">Any Bedrooms</option>
                  <option value="1">1+ Bedroom</option>
                  <option value="2">2+ Bedrooms</option>
                  <option value="3">3+ Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>

                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                >
                  <option value="any">Any Bathrooms</option>
                  <option value="1">1+ Bathroom</option>
                  <option value="2">2+ Bathrooms</option>
                  <option value="3">3+ Bathrooms</option>
                </select>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={clearFilters}
                  className="text-nestie-grey-600 hover:text-nestie-black"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={handleSearch}
                  className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-nestie-black">
              {properties.length} Properties Found
            </h1>
            {(searchQuery || location) && (
              <p className="text-nestie-grey-600 mt-1">
                {searchQuery && `"${searchQuery}"`}
                {searchQuery && location && ' in '}
                {location && `${location}`}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-nestie-black text-white' : 'text-nestie-grey-600 hover:bg-nestie-grey-100'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-nestie-black text-white' : 'text-nestie-grey-600 hover:bg-nestie-grey-100'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestie-black"></div>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
            {properties.map((property) => (
              <div
                key={property.id}
                className={`bg-nestie-white rounded-xl border border-nestie-grey-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${viewMode === 'list' ? 'flex' : ''
                  }`}
                onClick={() => handlePropertyClick(property.id)}
              >
                {/* Property Image */}
                <div className={`relative bg-nestie-grey-200 ${viewMode === 'list' ? 'w-80 h-48' : 'h-48'}`}>
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-nestie-grey-400" />
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSaveProperty(property.id)
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full ${savedProperties.includes(property.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-nestie-grey-600 hover:text-red-500'
                      } shadow-md transition-colors`}
                  >
                    <Heart className={`h-4 w-4 ${savedProperties.includes(property.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.listingType === 'rent' ? 'bg-blue-100 text-blue-800' :
                      property.listingType === 'sale' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                      For {property.listingType}
                    </span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-nestie-black text-lg line-clamp-1">
                      {property.title}
                    </h3>
                    {property.rating && (
                      <div className="flex items-center ml-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-nestie-grey-600 ml-1">
                          {property.rating} ({property.reviews || 0})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-nestie-grey-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm line-clamp-1">{property.location.address}</span>
                  </div>

                  <p className="text-nestie-grey-600 text-sm mb-3 line-clamp-2">
                    {property.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-nestie-grey-600 mb-3">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span>{property.specifications.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span>{property.specifications.bathrooms} bath</span>
                    </div>
                    {property.specifications.area && (
                      <span>{property.specifications.area} sqft</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-nestie-black">
                        KSh {property.price.toLocaleString()}
                      </span>
                      <span className="text-nestie-grey-500 text-sm">
                        /{property.listingType === 'rent' ? 'month' : property.listingType}
                      </span>
                    </div>
                  </div>

                  {/* Amenities Icons */}
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-nestie-grey-200">
                    {property.amenities.wifi && <Wifi className="h-4 w-4 text-nestie-grey-600" />}
                    {property.amenities.pool && <Waves className="h-4 w-4 text-blue-500" />}
                    {property.specifications.parking && <Car className="h-4 w-4 text-nestie-grey-600" />}
                    {property.amenities.security && <Shield className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-nestie-grey-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-nestie-black mb-2">No properties found</h3>
            <p className="text-nestie-grey-600 mb-4">
              Try adjusting your search criteria or browse all available properties.
            </p>
            <button
              onClick={clearFilters}
              className="bg-nestie-black text-white px-6 py-2 rounded-lg hover:bg-nestie-grey-800"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function SearchPageLoading() {
  return (
    <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestie-black"></div>
    </div>
  )
}

// Main component with Suspense wrapper
export default function PropertySearch() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <PropertySearchContent />
    </Suspense>
  )
}