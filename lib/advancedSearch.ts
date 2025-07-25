import { supabase } from './supabase'

export interface SearchFilters {
    query?: string
    location?: string
    priceRange?: { min?: number; max?: number }
    propertyType?: string
    bedrooms?: string
    bathrooms?: string
    amenities?: string[]
    sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'relevance'
    radius?: number // in kilometers
    coordinates?: { lat: number; lng: number }
}

export interface SearchResult {
    properties: any[]
    total: number
    facets: {
        priceRanges: { range: string; count: number }[]
        propertyTypes: { type: string; count: number }[]
        locations: { location: string; count: number }[]
        amenities: { amenity: string; count: number }[]
    }
}

export class AdvancedSearchService {
    static async searchProperties(filters: SearchFilters, page = 1, limit = 20): Promise<SearchResult> {
        try {
            let query = supabase
                .from('properties')
                .select(`
          *,
          agent:profiles!inner(id, full_name, email, phone, verified)
        `, { count: 'exact' })
                .eq('status', 'available')
                .eq('profiles.verified', true)

            // Text search
            if (filters.query) {
                query = query.textSearch('search_vector', filters.query)
            }

            // Location search with radius
            if (filters.location) {
                if (filters.coordinates && filters.radius) {
                    // For geographic search within radius, we need to use a different approach
                    // Since we can't chain rpc with other filters, we'll use PostGIS functions in the query
                    query = query.or(`
            location->>city.ilike.%${filters.location}%,
            location->>address.ilike.%${filters.location}%,
            location->>region.ilike.%${filters.location}%
          `)
                    // Note: For true geographic radius search, you would need to implement
                    // a PostGIS function in your database and call it separately
                } else {
                    // Text-based location search
                    query = query.or(`
            location->>city.ilike.%${filters.location}%,
            location->>address.ilike.%${filters.location}%,
            location->>region.ilike.%${filters.location}%
          `)
                }
            }

            // Price range
            if (filters.priceRange?.min) {
                query = query.gte('price', filters.priceRange.min)
            }
            if (filters.priceRange?.max) {
                query = query.lte('price', filters.priceRange.max)
            }

            // Property type
            if (filters.propertyType && filters.propertyType !== 'all') {
                query = query.eq('type', filters.propertyType)
            }

            // Bedrooms
            if (filters.bedrooms && filters.bedrooms !== 'any') {
                if (filters.bedrooms === '4+') {
                    query = query.gte('specifications->>bedrooms', 4)
                } else {
                    query = query.eq('specifications->>bedrooms', parseInt(filters.bedrooms))
                }
            }

            // Bathrooms
            if (filters.bathrooms && filters.bathrooms !== 'any') {
                if (filters.bathrooms === '4+') {
                    query = query.gte('specifications->>bathrooms', 4)
                } else {
                    query = query.eq('specifications->>bathrooms', parseInt(filters.bathrooms))
                }
            }

            // Amenities
            if (filters.amenities && filters.amenities.length > 0) {
                const amenityConditions = filters.amenities.map(amenity =>
                    `amenities->>${amenity}.eq.true`
                ).join(',')
                query = query.or(amenityConditions)
            }

            // Sorting
            switch (filters.sortBy) {
                case 'price_asc':
                    query = query.order('price', { ascending: true })
                    break
                case 'price_desc':
                    query = query.order('price', { ascending: false })
                    break
                case 'date_desc':
                    query = query.order('created_at', { ascending: false })
                    break
                default:
                    // Relevance sorting (for text search)
                    if (filters.query) {
                        query = query.order('ts_rank(search_vector, plainto_tsquery($1))', {
                            ascending: false,
                            foreignTable: undefined
                        })
                    } else {
                        query = query.order('created_at', { ascending: false })
                    }
            }

            // Pagination
            const offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1)

            const { data: properties, error, count } = await query

            if (error) throw error

            // Get facets for filtering UI
            const facets = await this.getFacets(filters)

            return {
                properties: properties || [],
                total: count || 0,
                facets
            }

        } catch (error) {
            console.error('Advanced search error:', error)
            throw error
        }
    }

    private static async getFacets(filters: SearchFilters) {
        try {
            // Get base query for facet calculation
            let baseQuery = supabase
                .from('properties')
                .select('price, type, location, amenities')
                .eq('status', 'available')

            // Apply location filter if present
            if (filters.location) {
                baseQuery = baseQuery.or(`
          location->>city.ilike.%${filters.location}%,
          location->>address.ilike.%${filters.location}%
        `)
            }

            const { data: facetData } = await baseQuery

            if (!facetData) return this.getEmptyFacets()

            // Calculate price ranges
            const priceRanges = this.calculatePriceRanges(facetData)

            // Calculate property types
            const propertyTypes = this.calculatePropertyTypes(facetData)

            // Calculate locations
            const locations = this.calculateLocations(facetData)

            // Calculate amenities
            const amenities = this.calculateAmenities(facetData)

            return {
                priceRanges,
                propertyTypes,
                locations,
                amenities
            }

        } catch (error) {
            console.error('Facets calculation error:', error)
            return this.getEmptyFacets()
        }
    }

    private static calculatePriceRanges(data: any[]) {
        const ranges = [
            { range: '0-50000', min: 0, max: 50000 },
            { range: '50000-100000', min: 50000, max: 100000 },
            { range: '100000-200000', min: 100000, max: 200000 },
            { range: '200000-500000', min: 200000, max: 500000 },
            { range: '500000+', min: 500000, max: Infinity }
        ]

        return ranges.map(range => ({
            range: range.range,
            count: data.filter(item =>
                item.price >= range.min && item.price < range.max
            ).length
        }))
    }

    private static calculatePropertyTypes(data: any[]) {
        const typeCounts = data.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1
            return acc
        }, {})

        return Object.entries(typeCounts).map(([type, count]) => ({
            type,
            count: count as number
        }))
    }

    private static calculateLocations(data: any[]) {
        const locationCounts = data.reduce((acc, item) => {
            const city = item.location?.city
            if (city) {
                acc[city] = (acc[city] || 0) + 1
            }
            return acc
        }, {})

        return Object.entries(locationCounts)
            .map(([location, count]) => ({
                location,
                count: count as number
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10) // Top 10 locations
    }

    private static calculateAmenities(data: any[]) {
        const amenityCounts = data.reduce((acc, item) => {
            if (item.amenities) {
                Object.entries(item.amenities).forEach(([amenity, hasAmenity]) => {
                    if (hasAmenity) {
                        acc[amenity] = (acc[amenity] || 0) + 1
                    }
                })
            }
            return acc
        }, {})

        return Object.entries(amenityCounts)
            .map(([amenity, count]) => ({
                amenity,
                count: count as number
            }))
            .sort((a, b) => b.count - a.count)
    }

    private static getEmptyFacets() {
        return {
            priceRanges: [],
            propertyTypes: [],
            locations: [],
            amenities: []
        }
    }

    // Saved searches functionality
    static async saveSearch(userId: string, searchName: string, filters: SearchFilters) {
        try {
            const { data, error } = await supabase
                .from('saved_searches')
                .insert({
                    user_id: userId,
                    name: searchName,
                    filters: filters,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            return data

        } catch (error) {
            console.error('Save search error:', error)
            throw error
        }
    }

    static async getSavedSearches(userId: string) {
        try {
            const { data, error } = await supabase
                .from('saved_searches')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []

        } catch (error) {
            console.error('Get saved searches error:', error)
            return []
        }
    }

    // Search suggestions
    static async getSearchSuggestions(query: string, limit = 5) {
        try {
            if (!query || query.length < 2) return []

            const { data, error } = await supabase
                .from('properties')
                .select('title, location')
                .textSearch('search_vector', query)
                .limit(limit)

            if (error) throw error

            const suggestions = new Set<string>()

            data?.forEach(property => {
                // Add property title
                if (property.title.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(property.title)
                }

                // Add location suggestions
                if (property.location?.city?.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(property.location.city)
                }
                if (property.location?.address?.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(property.location.address)
                }
            })

            return Array.from(suggestions).slice(0, limit)

        } catch (error) {
            console.error('Search suggestions error:', error)
            return []
        }
    }
}