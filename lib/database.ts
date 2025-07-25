import { supabase } from './supabase'
import { APICache, PerformanceMonitor } from './performance'

export class DatabaseService {
  private static monitor = PerformanceMonitor.getInstance()

  // Optimized property queries
  static async getProperties(filters: any = {}) {
    const cacheKey = `properties_${JSON.stringify(filters)}`
    const cached = APICache.get(cacheKey)
    if (cached) return cached

    const endTimer = this.monitor.startTimer('db_get_properties')
    
    try {
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          type,
          status,
          images,
          location,
          specifications,
          amenities,
          terms,
          created_at,
          agent_id
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(50)

      // Apply filters efficiently
      if (filters.priceMin) query = query.gte('price', filters.priceMin)
      if (filters.priceMax) query = query.lte('price', filters.priceMax)
      if (filters.type) query = query.eq('type', filters.type)
      if (filters.location) {
        query = query.or(`location->>address.ilike.%${filters.location}%,location->>city.ilike.%${filters.location}%`)
      }

      const { data, error } = await query

      if (error) throw error

      const result = { data: data || [], count: data?.length || 0 }
      APICache.set(cacheKey, result, 5) // Cache for 5 minutes
      
      return result
    } finally {
      endTimer()
    }
  }

  // Optimized search with full-text search
  static async searchProperties(searchParams: any) {
    const cacheKey = `search_${JSON.stringify(searchParams)}`
    const cached = APICache.get(cacheKey)
    if (cached) return cached

    const endTimer = this.monitor.startTimer('db_search_properties')
    
    try {
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          type,
          status,
          images,
          location,
          specifications,
          amenities,
          terms,
          created_at,
          agent_id
        `)
        .eq('status', 'available')
        .limit(100)

      // Text search optimization
      if (searchParams.query) {
        query = query.textSearch('title,description', searchParams.query, {
          type: 'websearch',
          config: 'english'
        })
      }

      // Location-based search
      if (searchParams.location) {
        query = query.or(`location->>address.ilike.%${searchParams.location}%,location->>city.ilike.%${searchParams.location}%,location->>region.ilike.%${searchParams.location}%`)
      }

      // Price range
      if (searchParams.priceMin) query = query.gte('price', searchParams.priceMin)
      if (searchParams.priceMax) query = query.lte('price', searchParams.priceMax)

      // Property type
      if (searchParams.type && searchParams.type !== 'all') {
        query = query.eq('type', searchParams.type)
      }

      // Bedrooms/Bathrooms
      if (searchParams.bedrooms && searchParams.bedrooms !== 'any') {
        if (searchParams.bedrooms === '4+') {
          query = query.gte('specifications->>bedrooms', 4)
        } else {
          query = query.eq('specifications->>bedrooms', parseInt(searchParams.bedrooms))
        }
      }

      if (searchParams.bathrooms && searchParams.bathrooms !== 'any') {
        if (searchParams.bathrooms === '4+') {
          query = query.gte('specifications->>bathrooms', 4)
        } else {
          query = query.eq('specifications->>bathrooms', parseInt(searchParams.bathrooms))
        }
      }

      // Amenities
      if (searchParams.amenities) {
        Object.entries(searchParams.amenities).forEach(([key, value]) => {
          if (value) {
            if (['parking', 'furnished'].includes(key)) {
              query = query.eq(`specifications->>${key}`, true)
            } else {
              query = query.eq(`amenities->>${key}`, true)
            }
          }
        })
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      const result = { data: data || [], count: data?.length || 0 }
      APICache.set(cacheKey, result, 5) // Cache for 5 minutes
      
      return result
    } finally {
      endTimer()
    }
  }

  // Optimized user data loading
  static async getUserData(userId: string) {
    const cacheKey = `user_data_${userId}`
    const cached = APICache.get(cacheKey)
    if (cached) return cached

    const endTimer = this.monitor.startTimer('db_get_user_data')
    
    try {
      // Load all user data in parallel
      const [tenanciesResult, transactionsResult, notificationsResult] = await Promise.all([
        supabase
          .from('property_tenancies')
          .select('*')
          .eq('tenant_id', userId)
          .eq('status', 'active')
          .limit(10),
        
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      const result = {
        tenancies: tenanciesResult.data || [],
        transactions: transactionsResult.data || [],
        notifications: notificationsResult.data || []
      }

      APICache.set(cacheKey, result, 2) // Cache for 2 minutes (user data changes more frequently)
      
      return result
    } finally {
      endTimer()
    }
  }

  // Batch operations for better performance
  static async batchInsert(table: string, records: any[]) {
    const endTimer = this.monitor.startTimer(`db_batch_insert_${table}`)
    
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select()

      if (error) throw error
      return { data, error: null }
    } finally {
      endTimer()
    }
  }

  // Connection health check
  static async healthCheck() {
    const endTimer = this.monitor.startTimer('db_health_check')
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      return { healthy: !error, error }
    } finally {
      endTimer()
    }
  }

  // Get performance metrics
  static getMetrics() {
    return this.monitor.getAllMetrics()
  }

  // Clean up cache
  static clearCache() {
    APICache.clear()
  }
}

// Export optimized query builders
export const QueryBuilder = {
  properties: () => supabase.from('properties'),
  profiles: () => supabase.from('profiles'),
  transactions: () => supabase.from('transactions'),
  notifications: () => supabase.from('notifications'),
  tenancies: () => supabase.from('property_tenancies')
}

// Export common query patterns
export const CommonQueries = {
  getAvailableProperties: (limit = 50) => 
    QueryBuilder.properties()
      .select(`
        id, title, description, price, type, status, images, location,
        specifications, amenities, terms, created_at, agent_id
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(limit),

  getUserTenancies: (userId: string) =>
    QueryBuilder.tenancies()
      .select('*')
      .eq('tenant_id', userId)
      .eq('status', 'active'),

  getUserTransactions: (userId: string, limit = 20) =>
    QueryBuilder.transactions()
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
}