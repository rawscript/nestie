'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, MapPin, Star, Bookmark, X, ChevronDown } from 'lucide-react'
import { AdvancedSearchService, SearchFilters } from '@/lib/advancedSearch'
import { AIRecommendationService } from '@/lib/aiRecommendations'
import { useAuth } from '@/lib/auth'
import { debounce } from 'lodash'

interface EnhancedSearchProps {
    onResults: (results: any[]) => void
    onLoading: (loading: boolean) => void
}

export default function EnhancedSearch({ onResults, onLoading }: EnhancedSearchProps) {
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [filters, setFilters] = useState<SearchFilters>({
        sortBy: 'relevance'
    })
    const [showFilters, setShowFilters] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [savedSearches, setSavedSearches] = useState<any[]>([])
    const [showSavedSearches, setShowSavedSearches] = useState(false)
    const [facets, setFacets] = useState<any>({})
    const [recommendations, setRecommendations] = useState<any[]>([])

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
            if (!searchQuery && Object.keys(searchFilters).length <= 1) {
                // Load recommendations when no search query
                if (user) {
                    loadRecommendations()
                }
                return
            }

            onLoading(true)
            try {
                const results = await AdvancedSearchService.searchProperties({
                    query: searchQuery,
                    ...searchFilters
                })

                onResults(results.properties)
                setFacets(results.facets)

                // Track search for AI recommendations
                if (user) {
                    AIRecommendationService.trackSearch(user.id, { query: searchQuery, ...searchFilters })
                }

            } catch (error) {
                console.error('Search error:', error)
                onResults([])
            } finally {
                onLoading(false)
            }
        }, 300),
        [user, onResults, onLoading]
    )

    // Load AI recommendations
    const loadRecommendations = async () => {
        if (!user) return

        try {
            onLoading(true)
            const recs = await AIRecommendationService.getPersonalizedRecommendations(user.id)
            setRecommendations(recs)
            onResults(recs)
        } catch (error) {
            console.error('Recommendations error:', error)
        } finally {
            onLoading(false)
        }
    }

    // Load search suggestions
    const loadSuggestions = async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setSuggestions([])
            return
        }

        try {
            const suggestions = await AdvancedSearchService.getSearchSuggestions(searchQuery)
            setSuggestions(suggestions)
            setShowSuggestions(true)
        } catch (error) {
            console.error('Suggestions error:', error)
        }
    }

    // Load saved searches
    const loadSavedSearches = async () => {
        if (!user) return

        try {
            const searches = await AdvancedSearchService.getSavedSearches(user.id)
            setSavedSearches(searches)
        } catch (error) {
            console.error('Saved searches error:', error)
        }
    }

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setQuery(value)
        loadSuggestions(value)
        debouncedSearch(value, filters)
    }

    // Handle filter change
    const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
        const updatedFilters = { ...filters, ...newFilters }
        setFilters(updatedFilters)
        debouncedSearch(query, updatedFilters)
    }

    // Save current search
    const saveCurrentSearch = async () => {
        if (!user || !query) return

        const searchName = prompt('Enter a name for this search:')
        if (!searchName) return

        try {
            await AdvancedSearchService.saveSearch(user.id, searchName, {
                query,
                ...filters
            })
            loadSavedSearches()
            alert('Search saved successfully!')
        } catch (error) {
            console.error('Save search error:', error)
            alert('Failed to save search')
        }
    }

    // Load saved search
    const loadSavedSearch = (savedSearch: any) => {
        setQuery(savedSearch.filters.query || '')
        setFilters(savedSearch.filters)
        debouncedSearch(savedSearch.filters.query || '', savedSearch.filters)
        setShowSavedSearches(false)
    }

    // Clear all filters
    const clearFilters = () => {
        setQuery('')
        setFilters({ sortBy: 'relevance' })
        setShowSuggestions(false)
        if (user) {
            loadRecommendations()
        } else {
            onResults([])
        }
    }

    useEffect(() => {
        if (user) {
            loadSavedSearches()
            loadRecommendations()
        }
    }, [user])

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {/* Search Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                    {query || Object.keys(filters).length > 1 ? 'Search Results' : 'Recommended for You'}
                </h2>
                <div className="flex items-center space-x-2">
                    {user && (
                        <button
                            onClick={() => setShowSavedSearches(!showSavedSearches)}
                            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                            title="Saved Searches"
                        >
                            <Bookmark className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Main Search Bar */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search properties, locations, or describe what you're looking for..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onFocus={() => setShowSuggestions(suggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {query && (
                        <button
                            onClick={clearFilters}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setQuery(suggestion)
                                    setShowSuggestions(false)
                                    debouncedSearch(suggestion, filters)
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                            >
                                <div className="flex items-center space-x-2">
                                    <Search className="h-4 w-4 text-gray-400" />
                                    <span>{suggestion}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Saved Searches Dropdown */}
            {showSavedSearches && savedSearches.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Saved Searches</h3>
                    <div className="space-y-2">
                        {savedSearches.map((savedSearch) => (
                            <button
                                key={savedSearch.id}
                                onClick={() => loadSavedSearch(savedSearch)}
                                className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-100 border border-gray-200"
                            >
                                <div className="font-medium text-gray-900">{savedSearch.name}</div>
                                <div className="text-sm text-gray-500">
                                    {savedSearch.filters.query && `"${savedSearch.filters.query}"`}
                                    {savedSearch.filters.location && ` in ${savedSearch.filters.location}`}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
                        <div className="flex items-center space-x-2">
                            {user && query && (
                                <button
                                    onClick={saveCurrentSearch}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Save Search
                                </button>
                            )}
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.location || ''}
                                    onChange={(e) => handleFilterChange({ location: e.target.value })}
                                    placeholder="City, area, or address"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (KSh)</label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    value={filters.priceRange?.min || ''}
                                    onChange={(e) => handleFilterChange({
                                        priceRange: { ...filters.priceRange, min: parseInt(e.target.value) || undefined }
                                    })}
                                    placeholder="Min"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <input
                                    type="number"
                                    value={filters.priceRange?.max || ''}
                                    onChange={(e) => handleFilterChange({
                                        priceRange: { ...filters.priceRange, max: parseInt(e.target.value) || undefined }
                                    })}
                                    placeholder="Max"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Property Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                            <select
                                value={filters.propertyType || 'all'}
                                onChange={(e) => handleFilterChange({ propertyType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Types</option>
                                <option value="apartment">Apartment</option>
                                <option value="house">House</option>
                                <option value="commercial">Commercial</option>
                                <option value="land">Land</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <select
                                value={filters.sortBy || 'relevance'}
                                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="relevance">Relevance</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="date_desc">Newest First</option>
                            </select>
                        </div>

                        {/* Bedrooms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                            <select
                                value={filters.bedrooms || 'any'}
                                onChange={(e) => handleFilterChange({ bedrooms: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="any">Any</option>
                                <option value="1">1 Bedroom</option>
                                <option value="2">2 Bedrooms</option>
                                <option value="3">3 Bedrooms</option>
                                <option value="4+">4+ Bedrooms</option>
                            </select>
                        </div>

                        {/* Bathrooms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                            <select
                                value={filters.bathrooms || 'any'}
                                onChange={(e) => handleFilterChange({ bathrooms: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="any">Any</option>
                                <option value="1">1 Bathroom</option>
                                <option value="2">2 Bathrooms</option>
                                <option value="3">3 Bathrooms</option>
                                <option value="4+">4+ Bathrooms</option>
                            </select>
                        </div>
                    </div>

                    {/* Amenities */}
                    {facets.amenities && facets.amenities.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                            <div className="flex flex-wrap gap-2">
                                {facets.amenities.slice(0, 10).map((amenity: any) => (
                                    <button
                                        key={amenity.amenity}
                                        onClick={() => {
                                            const currentAmenities = filters.amenities || []
                                            const newAmenities = currentAmenities.includes(amenity.amenity)
                                                ? currentAmenities.filter(a => a !== amenity.amenity)
                                                : [...currentAmenities, amenity.amenity]
                                            handleFilterChange({ amenities: newAmenities })
                                        }}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${(filters.amenities || []).includes(amenity.amenity)
                                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {amenity.amenity} ({amenity.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search Stats */}
            {!query && recommendations.length > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Personalized recommendations based on your preferences</span>
                    </div>
                    <span>{recommendations.length} properties</span>
                </div>
            )}
        </div>
    )
}