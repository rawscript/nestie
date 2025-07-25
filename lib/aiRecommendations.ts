import { supabase } from './supabase'

export interface UserPreferences {
  budget_range: { min: number; max: number }
  preferred_locations: string[]
  property_types: string[]
  must_have_amenities: string[]
  lifestyle_preferences: string[]
  commute_preferences?: {
    work_location?: string
    max_commute_time?: number
    transport_mode?: 'car' | 'public' | 'walk'
  }
}

export interface RecommendationScore {
  property_id: string
  score: number
  reasons: string[]
  match_percentage: number
}

export class AIRecommendationService {
  
  // Generate personalized property recommendations
  static async getPersonalizedRecommendations(
    userId: string, 
    limit = 10
  ): Promise<any[]> {
    try {
      // Get user preferences and behavior
      const userPreferences = await this.getUserPreferences(userId)
      const userBehavior = await this.getUserBehavior(userId)
      
      // Get available properties
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!inner(id, full_name, verified)
        `)
        .eq('status', 'available')
        .eq('profiles.verified', true)

      if (error) throw error

      // Score each property
      const scoredProperties = properties?.map(property => {
        const score = this.calculateRecommendationScore(
          property, 
          userPreferences, 
          userBehavior
        )
        return { ...property, recommendation_score: score }
      }) || []

      // Sort by score and return top recommendations
      return scoredProperties
        .sort((a, b) => b.recommendation_score.score - a.recommendation_score.score)
        .slice(0, limit)

    } catch (error) {
      console.error('AI recommendations error:', error)
      return []
    }
  }

  // Calculate recommendation score for a property
  private static calculateRecommendationScore(
    property: any,
    preferences: UserPreferences,
    behavior: any
  ): RecommendationScore {
    let score = 0
    const reasons: string[] = []
    const maxScore = 100

    // Budget compatibility (30% weight)
    const budgetScore = this.calculateBudgetScore(property.price, preferences.budget_range)
    score += budgetScore * 0.3
    if (budgetScore > 0.8) {
      reasons.push('Within your budget range')
    }

    // Location preference (25% weight)
    const locationScore = this.calculateLocationScore(property.location, preferences.preferred_locations)
    score += locationScore * 0.25
    if (locationScore > 0.8) {
      reasons.push('In your preferred area')
    }

    // Property type preference (15% weight)
    const typeScore = this.calculateTypeScore(property.type, preferences.property_types)
    score += typeScore * 0.15
    if (typeScore > 0.8) {
      reasons.push('Matches your property type preference')
    }

    // Amenities match (20% weight)
    const amenitiesScore = this.calculateAmenitiesScore(property.amenities, preferences.must_have_amenities)
    score += amenitiesScore * 0.2
    if (amenitiesScore > 0.8) {
      reasons.push('Has your must-have amenities')
    }

    // Behavioral similarity (10% weight)
    const behaviorScore = this.calculateBehaviorScore(property, behavior)
    score += behaviorScore * 0.1
    if (behaviorScore > 0.8) {
      reasons.push('Similar to properties you\'ve shown interest in')
    }

    // Bonus factors
    if (property.agent.verified) {
      score += 5
      reasons.push('Verified agent')
    }

    if (property.images && property.images.length > 3) {
      score += 3
      reasons.push('Well-documented with photos')
    }

    if (property.virtual_tour_url) {
      score += 3
      reasons.push('Virtual tour available')
    }

    return {
      property_id: property.id,
      score: Math.min(score, maxScore),
      reasons,
      match_percentage: Math.round((score / maxScore) * 100)
    }
  }

  private static calculateBudgetScore(price: number, budgetRange: { min: number; max: number }): number {
    if (price >= budgetRange.min && price <= budgetRange.max) {
      // Perfect match
      return 1.0
    } else if (price < budgetRange.min) {
      // Below budget - still good but maybe too cheap
      const ratio = price / budgetRange.min
      return Math.max(0.7, ratio)
    } else {
      // Above budget - penalize based on how much over
      const overBudget = (price - budgetRange.max) / budgetRange.max
      return Math.max(0, 1 - overBudget)
    }
  }

  private static calculateLocationScore(propertyLocation: any, preferredLocations: string[]): number {
    if (!propertyLocation || preferredLocations.length === 0) return 0.5

    const locationText = `${propertyLocation.city} ${propertyLocation.address} ${propertyLocation.region}`.toLowerCase()
    
    for (const preferred of preferredLocations) {
      if (locationText.includes(preferred.toLowerCase())) {
        return 1.0
      }
    }

    return 0.2 // No match but not zero to allow for discovery
  }

  private static calculateTypeScore(propertyType: string, preferredTypes: string[]): number {
    if (preferredTypes.length === 0) return 0.5
    return preferredTypes.includes(propertyType) ? 1.0 : 0.3
  }

  private static calculateAmenitiesScore(propertyAmenities: any, mustHaveAmenities: string[]): number {
    if (!propertyAmenities || mustHaveAmenities.length === 0) return 0.5

    const matchedAmenities = mustHaveAmenities.filter(amenity => 
      propertyAmenities[amenity] === true
    )

    return matchedAmenities.length / mustHaveAmenities.length
  }

  private static calculateBehaviorScore(property: any, behavior: any): number {
    if (!behavior.viewed_properties || behavior.viewed_properties.length === 0) return 0.5

    // Find similar properties based on price range, type, and location
    const similarProperties = behavior.viewed_properties.filter((viewed: any) => {
      const priceSimilar = Math.abs(viewed.price - property.price) / property.price < 0.3
      const typeSimilar = viewed.type === property.type
      const locationSimilar = viewed.location?.city === property.location?.city

      return priceSimilar || typeSimilar || locationSimilar
    })

    return Math.min(similarProperties.length / behavior.viewed_properties.length, 1.0)
  }

  // Get user preferences from profile and behavior
  private static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Try to get explicit preferences first
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (preferences) {
        return preferences
      }

      // Fallback: infer from user behavior
      return await this.inferPreferencesFromBehavior(userId)

    } catch (error) {
      console.error('Error getting user preferences:', error)
      return this.getDefaultPreferences()
    }
  }

  private static async inferPreferencesFromBehavior(userId: string): Promise<UserPreferences> {
    try {
      // Get user's search history, viewed properties, and saved properties
      const [searches, views, saves] = await Promise.all([
        this.getUserSearchHistory(userId),
        this.getUserViewHistory(userId),
        this.getUserSavedProperties(userId)
      ])

      // Analyze patterns
      const budgetRange = this.inferBudgetRange(views, saves)
      const preferredLocations = this.inferPreferredLocations(searches, views, saves)
      const propertyTypes = this.inferPropertyTypes(views, saves)
      const amenities = this.inferPreferredAmenities(saves)

      return {
        budget_range: budgetRange,
        preferred_locations: preferredLocations,
        property_types: propertyTypes,
        must_have_amenities: amenities,
        lifestyle_preferences: []
      }

    } catch (error) {
      console.error('Error inferring preferences:', error)
      return this.getDefaultPreferences()
    }
  }

  private static async getUserBehavior(userId: string) {
    try {
      const [viewHistory, searchHistory, savedProperties] = await Promise.all([
        this.getUserViewHistory(userId),
        this.getUserSearchHistory(userId),
        this.getUserSavedProperties(userId)
      ])

      return {
        viewed_properties: viewHistory,
        search_history: searchHistory,
        saved_properties: savedProperties
      }

    } catch (error) {
      console.error('Error getting user behavior:', error)
      return {
        viewed_properties: [],
        search_history: [],
        saved_properties: []
      }
    }
  }

  private static async getUserViewHistory(userId: string) {
    const { data } = await supabase
      .from('property_views')
      .select(`
        property_id,
        viewed_at,
        properties (price, type, location)
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(50)

    return data || []
  }

  private static async getUserSearchHistory(userId: string) {
    const { data } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    return data || []
  }

  private static async getUserSavedProperties(userId: string) {
    const { data } = await supabase
      .from('saved_properties')
      .select(`
        property_id,
        created_at,
        properties (price, type, location, amenities)
      `)
      .eq('user_id', userId)

    return data || []
  }

  private static inferBudgetRange(views: any[], saves: any[]): { min: number; max: number } {
    const allPrices = [
      ...views.map(v => v.properties?.price).filter(Boolean),
      ...saves.map(s => s.properties?.price).filter(Boolean)
    ]

    if (allPrices.length === 0) {
      return { min: 20000, max: 150000 } // Default range
    }

    const sortedPrices = allPrices.sort((a, b) => a - b)
    const min = sortedPrices[Math.floor(sortedPrices.length * 0.1)] || sortedPrices[0]
    const max = sortedPrices[Math.floor(sortedPrices.length * 0.9)] || sortedPrices[sortedPrices.length - 1]

    return { min: min * 0.8, max: max * 1.2 } // Add some buffer
  }

  private static inferPreferredLocations(searches: any[], views: any[], saves: any[]): string[] {
    const locations = new Map<string, number>()

    // Weight saved properties more than views, views more than searches
    saves.forEach(save => {
      const city = save.properties?.location?.city
      if (city) locations.set(city, (locations.get(city) || 0) + 3)
    })

    views.forEach(view => {
      const city = view.properties?.location?.city
      if (city) locations.set(city, (locations.get(city) || 0) + 2)
    })

    searches.forEach(search => {
      if (search.filters?.location) {
        locations.set(search.filters.location, (locations.get(search.filters.location) || 0) + 1)
      }
    })

    return Array.from(locations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location]) => location)
  }

  private static inferPropertyTypes(views: any[], saves: any[]): string[] {
    const types = new Map<string, number>()

    saves.forEach(save => {
      const type = save.properties?.type
      if (type) types.set(type, (types.get(type) || 0) + 2)
    })

    views.forEach(view => {
      const type = view.properties?.type
      if (type) types.set(type, (types.get(type) || 0) + 1)
    })

    return Array.from(types.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type)
  }

  private static inferPreferredAmenities(saves: any[]): string[] {
    const amenities = new Map<string, number>()

    saves.forEach(save => {
      if (save.properties?.amenities) {
        Object.entries(save.properties.amenities).forEach(([amenity, hasIt]) => {
          if (hasIt) {
            amenities.set(amenity, (amenities.get(amenity) || 0) + 1)
          }
        })
      }
    })

    return Array.from(amenities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([amenity]) => amenity)
  }

  private static getDefaultPreferences(): UserPreferences {
    return {
      budget_range: { min: 20000, max: 150000 },
      preferred_locations: ['Nairobi', 'Westlands', 'Kilimani'],
      property_types: ['apartment', 'house'],
      must_have_amenities: ['security', 'parking'],
      lifestyle_preferences: []
    }
  }

  // Save user preferences explicitly
  static async saveUserPreferences(userId: string, preferences: UserPreferences) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data

    } catch (error) {
      console.error('Error saving user preferences:', error)
      throw error
    }
  }

  // Track user interactions for better recommendations
  static async trackPropertyView(userId: string, propertyId: string) {
    try {
      await supabase
        .from('property_views')
        .insert({
          user_id: userId,
          property_id: propertyId,
          viewed_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error tracking property view:', error)
    }
  }

  static async trackSearch(userId: string, filters: any) {
    try {
      await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          filters: filters,
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error tracking search:', error)
    }
  }
}