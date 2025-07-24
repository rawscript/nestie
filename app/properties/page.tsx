'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Search,
    Filter,
    MapPin,
    Bed,
    Bath,
    Square,
    Heart,
    Grid,
    List,
    SlidersHorizontal,
    Home,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { PropertyCard } from '@/components/PropertyCard'
import { sampleProperties } from '@/lib/sampleData'

interface FilterState {
    location: string
    priceMin: string
    priceMax: string
    bedrooms: string
    propertyType: string
    sortBy: string
}

export default function PropertiesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [showFilters, setShowFilters] = useState(false)
    const [favorites, setFavorites] = useState<string[]>([])
    const [filteredProperties, setFilteredProperties] = useState(sampleProperties)
    const [filters, setFilters] = useState<FilterState>({
        location: '',
        priceMin: '',
        priceMax: '',
        bedrooms: '',
        propertyType: '',
        sortBy: 'newest'
    })

    // Filter and search properties
    useEffect(() => {
        let filtered = sampleProperties.filter(property => {
            const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                property.location.address.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesLocation = !filters.location ||
                property.location.address.toLowerCase().includes(filters.location.toLowerCase())

            const matchesPriceMin = !filters.priceMin || property.price >= parseInt(filters.priceMin)
            const matchesPriceMax = !filters.priceMax || property.price <= parseInt(filters.priceMax)

            const matchesBedrooms = !filters.bedrooms || property.bedrooms >= parseInt(filters.bedrooms)

            const matchesType = !filters.propertyType || property.type === filters.propertyType

            return matchesSearch && matchesLocation && matchesPriceMin &&
                matchesPriceMax && matchesBedrooms && matchesType
        })

        // Sort properties
        switch (filters.sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price)
                break
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price)
                break
            case 'bedrooms':
                filtered.sort((a, b) => b.bedrooms - a.bedrooms)
                break
            case 'newest':
            default:
                // Keep original order (newest first)
                break
        }

        setFilteredProperties(filtered)
    }, [searchQuery, filters])

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            location: '',
            priceMin: '',
            priceMax: '',
            bedrooms: '',
            propertyType: '',
            sortBy: 'newest'
        })
        setSearchQuery('')
    }

    const toggleFavorite = (propertyId: string) => {
        setFavorites(prev =>
            prev.includes(propertyId)
                ? prev.filter(id => id !== propertyId)
                : [...prev, propertyId]
        )
    }

    return (
        <div className="min-h-screen bg-nestie-grey-50">
            {/* Header */}
            <header className="bg-nestie-white border-b border-nestie-grey-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center space-x-2 text-nestie-grey-600 hover:text-nestie-black transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back to Home</span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-nestie-black rounded-lg flex items-center justify-center">
                                <Home className="h-5 w-5 text-nestie-white" />
                            </div>
                            <span className="text-xl font-display font-bold text-nestie-black">Nestie</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-nestie-black mb-2">
                        Find Your Perfect Property
                    </h1>
                    <p className="text-nestie-grey-600">
                        Discover {sampleProperties.length} premium properties across Kenya
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6 mb-8">
                    {/* Search Bar */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-nestie-grey-400" />
                            <input
                                type="text"
                                placeholder="Search by location, property name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${showFilters
                                    ? 'bg-nestie-black text-nestie-white border-nestie-black'
                                    : 'border-nestie-grey-300 text-nestie-grey-700 hover:bg-nestie-grey-50'
                                    }`}
                            >
                                <SlidersHorizontal className="h-5 w-5 mr-2" />
                                Filters
                            </button>

                            <div className="flex border border-nestie-grey-300 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 ${viewMode === 'grid' ? 'bg-nestie-black text-nestie-white' : 'text-nestie-grey-600 hover:bg-nestie-grey-50'}`}
                                >
                                    <Grid className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 ${viewMode === 'list' ? 'bg-nestie-black text-nestie-white' : 'text-nestie-grey-600 hover:bg-nestie-grey-50'}`}
                                >
                                    <List className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-nestie-grey-200 pt-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter location"
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                        Min Price (KSh)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.priceMin}
                                        onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                        Max Price (KSh)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="1000000"
                                        value={filters.priceMax}
                                        onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                        Min Bedrooms
                                    </label>
                                    <select
                                        value={filters.bedrooms}
                                        onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                    >
                                        <option value="">Any</option>
                                        <option value="1">1+</option>
                                        <option value="2">2+</option>
                                        <option value="3">3+</option>
                                        <option value="4">4+</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                        Property Type
                                    </label>
                                    <select
                                        value={filters.propertyType}
                                        onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                    >
                                        <option value="">All Types</option>
                                        <option value="apartment">Apartment</option>
                                        <option value="house">House</option>
                                        <option value="villa">Villa</option>
                                        <option value="townhouse">Townhouse</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                        Sort By
                                    </label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="bedrooms">Most Bedrooms</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-nestie-grey-600 hover:text-nestie-black transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Results Summary */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-nestie-grey-600">
                        Showing {filteredProperties.length} of {sampleProperties.length} properties
                    </p>

                    {filteredProperties.length > 0 && (
                        <div className="text-sm text-nestie-grey-500">
                            {searchQuery && (
                                <span>Search: "{searchQuery}" • </span>
                            )}
                            Sorted by {filters.sortBy === 'newest' ? 'Newest First' :
                                filters.sortBy === 'price-low' ? 'Price: Low to High' :
                                    filters.sortBy === 'price-high' ? 'Price: High to Low' : 'Most Bedrooms'}
                        </div>
                    )}
                </div>

                {/* Properties Grid/List */}
                {filteredProperties.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-nestie-grey-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-nestie-grey-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-nestie-black mb-2">No Properties Found</h3>
                        <p className="text-nestie-grey-600 mb-6">
                            Try adjusting your search criteria or filters to find more properties.
                        </p>
                        <button
                            onClick={clearFilters}
                            className="bg-nestie-black text-nestie-white px-6 py-3 rounded-lg hover:bg-nestie-grey-800 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className={
                            viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                : 'space-y-6'
                        }
                    >
                        {filteredProperties.map((property, index) => (
                            <motion.div
                                key={property.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <PropertyCard
                                    property={property}
                                    isFavorite={favorites.includes(property.id)}
                                    onToggleFavorite={() => toggleFavorite(property.id)}
                                    viewMode={viewMode}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Load More Button (if needed for pagination) */}
                {filteredProperties.length > 0 && filteredProperties.length >= 12 && (
                    <div className="text-center mt-12">
                        <button className="bg-nestie-white border border-nestie-grey-300 text-nestie-black px-8 py-3 rounded-lg hover:bg-nestie-grey-50 transition-colors">
                            Load More Properties
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}