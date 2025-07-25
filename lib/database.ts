import { supabase } from './supabase'
import { PostgrestError } from '@supabase/supabase-js'

// Standardized response type
export interface DatabaseResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Standardized error handling
class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Main Database Service - Single source of truth
export class Database {
  // Generic error handler
  private static handleError(error: PostgrestError | Error | any): string {
    console.error('Database Error:', error)
    
    if (error?.code === 'PGRST116') return 'No data found'
    if (error?.code === '23505') return 'Record already exists'
    if (error?.code === '23503') return 'Referenced record not found'
    if (error?.message) return error.message
    
    return 'An unexpected database error occurred'
  }

  // Generic success response
  private static success<T>(data: T): DatabaseResponse<T> {
    return { data, error: null, success: true }
  }

  // Generic error response
  private static failure<T>(error: any): DatabaseResponse<T> {
    return { 
      data: null, 
      error: this.handleError(error), 
      success: false 
    }
  }

  // PROPERTIES
  static async getProperties(filters: {
    status?: string
    type?: string
    priceMin?: number
    priceMax?: number
    location?: string
    agentId?: string
    limit?: number
  } = {}): Promise<DatabaseResponse<Property[]>> {
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, email, phone, verified)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type)
      if (filters.priceMin) query = query.gte('price', filters.priceMin)
      if (filters.priceMax) query = query.lte('price', filters.priceMax)
      if (filters.agentId) query = query.eq('agent_id', filters.agentId)
      if (filters.location) {
        query = query.or(`
          location->>address.ilike.%${filters.location}%,
          location->>city.ilike.%${filters.location}%,
          location->>region.ilike.%${filters.location}%
        `)
      }

      query = query.limit(filters.limit || 50)

      const { data, error } = await query

      if (error) return this.failure(error)
      return this.success(data || [])
    } catch (error) {
      return this.failure(error)
    }
  }

  static async getPropertyById(id: string): Promise<DatabaseResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, email, phone, verified)
        `)
        .eq('id', id)
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async updateProperty(id: string, updates: Partial<Property>): Promise<DatabaseResponse<Property>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  // USERS & PROFILES
  static async getProfile(userId: string): Promise<DatabaseResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          notification_settings(*)
        `)
        .eq('id', userId)
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<DatabaseResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  // TRANSACTIONS
  static async createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async getUserTransactions(userId: string): Promise<DatabaseResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return this.failure(error)
      return this.success(data || [])
    } catch (error) {
      return this.failure(error)
    }
  }

  static async updateTransactionStatus(
    id: string, 
    status: Transaction['status'], 
    authorizedBy?: string
  ): Promise<DatabaseResponse<Transaction>> {
    try {
      const updates: any = { 
        status, 
        updated_at: new Date().toISOString() 
      }
      
      if (authorizedBy) {
        updates.authorized_by = authorizedBy
        updates.authorized_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  // TENANCIES
  static async createTenancy(tenancyData: Omit<PropertyTenancy, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<PropertyTenancy>> {
    try {
      const { data, error } = await supabase
        .from('property_tenancies')
        .insert([tenancyData])
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async getUserTenancies(userId: string): Promise<DatabaseResponse<PropertyTenancy[]>> {
    try {
      const { data, error } = await supabase
        .from('property_tenancies')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('tenant_id', userId)
        .order('created_at', { ascending: false })

      if (error) return this.failure(error)
      return this.success(data || [])
    } catch (error) {
      return this.failure(error)
    }
  }

  // NOTIFICATIONS
  static async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>): Promise<DatabaseResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async getUserNotifications(userId: string): Promise<DatabaseResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) return this.failure(error)
      return this.success(data || [])
    } catch (error) {
      return this.failure(error)
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<DatabaseResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  // SEARCH
  static async searchProperties(searchParams: {
    query?: string
    location?: string
    priceMin?: number
    priceMax?: number
    type?: string
    bedrooms?: number
    bathrooms?: number
    amenities?: string[]
  }): Promise<DatabaseResponse<Property[]>> {
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, email, phone, verified)
        `)
        .eq('status', 'available')

      // Text search
      if (searchParams.query) {
        query = query.or(`
          title.ilike.%${searchParams.query}%,
          description.ilike.%${searchParams.query}%
        `)
      }

      // Location search
      if (searchParams.location) {
        query = query.or(`
          location->>address.ilike.%${searchParams.location}%,
          location->>city.ilike.%${searchParams.location}%,
          location->>region.ilike.%${searchParams.location}%
        `)
      }

      // Price filters
      if (searchParams.priceMin) query = query.gte('price', searchParams.priceMin)
      if (searchParams.priceMax) query = query.lte('price', searchParams.priceMax)

      // Property type
      if (searchParams.type && searchParams.type !== 'all') {
        query = query.eq('type', searchParams.type)
      }

      // Specifications
      if (searchParams.bedrooms) {
        query = query.gte('specifications->>bedrooms', searchParams.bedrooms.toString())
      }
      if (searchParams.bathrooms) {
        query = query.gte('specifications->>bathrooms', searchParams.bathrooms.toString())
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) return this.failure(error)
      return this.success(data || [])
    } catch (error) {
      return this.failure(error)
    }
  }

  // SAVED PROPERTIES
  static async saveProperty(userId: string, propertyId: string): Promise<DatabaseResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .insert([{ user_id: userId, property_id: propertyId }])
        .select()
        .single()

      if (error) return this.failure(error)
      return this.success(data)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async unsaveProperty(userId: string, propertyId: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId)

      if (error) return this.failure(error)
      return this.success(true)
    } catch (error) {
      return this.failure(error)
    }
  }

  static async getSavedProperties(userId: string): Promise<DatabaseResponse<Property[]>> {
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .select(`
          property:properties(
            *,
            agent:profiles!agent_id(id, full_name, email, phone, verified)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return this.failure(error)
      return this.success(data?.map(item => item.property).filter(Boolean) || [])
    } catch (error) {
      return this.failure(error)
    }
  }

  // HEALTH CHECK
  static async healthCheck(): Promise<DatabaseResponse<{ status: string; timestamp: string }>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .limit(1)

      if (error) return this.failure(error)
      
      return this.success({
        status: 'healthy',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return this.failure(error)
    }
  }
}

// Import standardized types
export type {
  Property,
  Profile,
  Transaction,
  PropertyTenancy,
  Notification,
  SearchFilters,
  PropertyType,
  ListingType,
  PropertyStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  UserRole,
  NotificationType,
  UUID,
  Timestamp
} from './types'