import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { query, keywordDescription, filters, naturalLanguageSearch, status, includeAgentInfo } = await request.json()

    // Build the search query for agent-created properties only
    let searchQuery = supabase
      .from('properties')
      .select(`
        *,
        agent:profiles!properties_agent_id_fkey(
          id,
          full_name,
          email,
          phone,
          company,
          verified
        )
      `)
      .eq('created_by_agent', true)
      .eq('status', status || 'available')
      .not('agent_id', 'is', null)

    // Apply filters
    if (filters.propertyType && filters.propertyType !== 'all') {
      searchQuery = searchQuery.eq('type', filters.propertyType)
    }

    if (filters.priceRange.min) {
      searchQuery = searchQuery.gte('price', parseInt(filters.priceRange.min))
    }

    if (filters.priceRange.max) {
      searchQuery = searchQuery.lte('price', parseInt(filters.priceRange.max))
    }

    if (filters.location) {
      searchQuery = searchQuery.or(`location->>address.ilike.%${filters.location}%,location->>city.ilike.%${filters.location}%`)
    }

    if (filters.region) {
      searchQuery = searchQuery.ilike('location->>region', `%${filters.region}%`)
    }

    if (filters.estate) {
      searchQuery = searchQuery.ilike('location->>estate', `%${filters.estate}%`)
    }

    // Bedroom filter
    if (filters.bedrooms && filters.bedrooms !== 'any') {
      if (filters.bedrooms === '4+') {
        searchQuery = searchQuery.gte('specifications->>bedrooms', 4)
      } else {
        searchQuery = searchQuery.eq('specifications->>bedrooms', parseInt(filters.bedrooms))
      }
    }

    // Bathroom filter
    if (filters.bathrooms && filters.bathrooms !== 'any') {
      if (filters.bathrooms === '4+') {
        searchQuery = searchQuery.gte('specifications->>bathrooms', 4)
      } else {
        searchQuery = searchQuery.eq('specifications->>bathrooms', parseInt(filters.bathrooms))
      }
    }

    // Text search
    if (query) {
      searchQuery = searchQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Natural language keyword search
    if (naturalLanguageSearch && keywordDescription) {
      const keywords = keywordDescription.toLowerCase()
      let keywordConditions = []

      if (keywords.includes('spacious') || keywords.includes('large')) {
        keywordConditions.push('specifications->>area.gt.1000')
      }
      if (keywords.includes('balcony')) {
        keywordConditions.push('amenities->>balcony.eq.true')
      }
      if (keywords.includes('garden') || keywords.includes('yard')) {
        keywordConditions.push('amenities->>garden.eq.true')
      }
      if (keywords.includes('cbd') || keywords.includes('central')) {
        keywordConditions.push('amenities->>nearCBD.eq.true')
      }
      if (keywords.includes('furnished')) {
        keywordConditions.push('specifications->>furnished.eq.true')
      }
      if (keywords.includes('pool') || keywords.includes('swimming')) {
        keywordConditions.push('amenities->>pool.eq.true')
      }
      if (keywords.includes('gym') || keywords.includes('fitness')) {
        keywordConditions.push('amenities->>gym.eq.true')
      }
      if (keywords.includes('security')) {
        keywordConditions.push('amenities->>security.eq.true')
      }
      if (keywords.includes('parking') || keywords.includes('garage')) {
        keywordConditions.push('specifications->>parking.eq.true')
      }
      if (keywords.includes('wifi') || keywords.includes('internet')) {
        keywordConditions.push('amenities->>wifi.eq.true')
      }

      if (keywordConditions.length > 0) {
        searchQuery = searchQuery.or(keywordConditions.join(','))
      }
    }

    // Apply amenity filters
    Object.entries(filters.amenities || {}).forEach(([key, value]) => {
      if (value) {
        if (['parking', 'furnished', 'petFriendly'].includes(key)) {
          searchQuery = searchQuery.eq(`specifications->>${key}`, true)
        } else {
          searchQuery = searchQuery.eq(`amenities->>${key}`, true)
        }
      }
    })

    // Execute the query
    const { data, error } = await searchQuery.order('created_at', { ascending: false })

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Filter out properties from unverified agents
    const verifiedAgentProperties = data?.filter(property => 
      property.agent && property.agent.verified === true
    ) || []

    return NextResponse.json({ 
      data: verifiedAgentProperties,
      count: verifiedAgentProperties.length 
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}