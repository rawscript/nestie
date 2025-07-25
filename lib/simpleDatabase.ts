import { supabase } from './supabase'

// Simplified database service without foreign key dependencies
export class SimpleDatabase {
  // Get properties without agent joins
  static async getProperties(filters: any = {}) {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(50)

      // Apply basic filters
      if (filters.priceMin) query = query.gte('price', filters.priceMin)
      if (filters.priceMax) query = query.lte('price', filters.priceMax)
      if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type)
      if (filters.location) {
        query = query.ilike('location->>address', `%${filters.location}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database error:', error)
        return { data: [], count: 0 }
      }

      return { data: data || [], count: data?.length || 0 }
    } catch (error) {
      console.error('Database service error:', error)
      return { data: [], count: 0 }
    }
  }

  // Search properties without complex joins
  static async searchProperties(searchParams: any) {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(100)

      // Basic text search
      if (searchParams.query) {
        query = query.or(`title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%`)
      }

      // Location search
      if (searchParams.location) {
        query = query.ilike('location->>address', `%${searchParams.location}%`)
      }

      // Price filters
      if (searchParams.priceMin) query = query.gte('price', searchParams.priceMin)
      if (searchParams.priceMax) query = query.lte('price', searchParams.priceMax)

      // Property type
      if (searchParams.type && searchParams.type !== 'all') {
        query = query.eq('type', searchParams.type)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Search error:', error)
        return { data: [], count: 0 }
      }

      return { data: data || [], count: data?.length || 0 }
    } catch (error) {
      console.error('Search service error:', error)
      return { data: [], count: 0 }
    }
  }

  // Get user data without complex joins
  static async getUserData(userId: string) {
    try {
      const [tenanciesResult, transactionsResult, notificationsResult] = await Promise.allSettled([
        supabase
          .from('property_tenancies')
          .select('*')
          .eq('tenant_id', userId)
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

      return {
        tenancies: tenanciesResult.status === 'fulfilled' ? tenanciesResult.value.data || [] : [],
        transactions: transactionsResult.status === 'fulfilled' ? transactionsResult.value.data || [] : [],
        notifications: notificationsResult.status === 'fulfilled' ? notificationsResult.value.data || [] : []
      }
    } catch (error) {
      console.error('User data service error:', error)
      return {
        tenancies: [],
        transactions: [],
        notifications: []
      }
    }
  }

  // Health check
  static async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .limit(1)

      return { healthy: !error, error }
    } catch (error) {
      return { healthy: false, error }
    }
  }
}