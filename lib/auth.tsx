'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'tenant' | 'agent'
  avatar_url?: string
  location?: string
  bio?: string
  verified: boolean
  created_at: string
  updated_at: string
  // Cached stats
  stats?: {
    properties_listed?: number
    properties_rented?: number
    total_earnings?: number
    rating?: number
    reviews_count?: number
  }
  // Notification preferences
  notification_settings?: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    marketing_emails: boolean
  }
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error getting initial session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          notification_settings (*)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error

      // Fetch cached stats
      const stats = await fetchUserStats(userId, data.role)
      
      setProfile({
        ...data,
        stats,
        notification_settings: data.notification_settings || {
          email_notifications: true,
          sms_notifications: true,
          push_notifications: false,
          marketing_emails: false
        }
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserStats = async (userId: string, role: string) => {
    try {
      if (role === 'agent') {
        // Fetch agent stats
        const [propertiesResult, earningsResult, ratingsResult] = await Promise.all([
          supabase
            .from('properties')
            .select('id, status')
            .eq('agent_id', userId),
          supabase
            .from('payments')
            .select('amount')
            .eq('agent_id', userId)
            .eq('status', 'completed'),
          supabase
            .from('reviews')
            .select('rating')
            .eq('agent_id', userId)
        ])

        const properties = propertiesResult.data || []
        const payments = earningsResult.data || []
        const reviews = ratingsResult.data || []

        const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0)
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0

        return {
          properties_listed: properties.length,
          total_earnings: totalEarnings,
          rating: Math.round(avgRating * 10) / 10,
          reviews_count: reviews.length
        }
      } else {
        // Fetch tenant stats
        const { data: rentals } = await supabase
          .from('rentals')
          .select('id')
          .eq('tenant_id', userId)

        return {
          properties_rented: rentals?.length || 0
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {}
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role
        }
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      // Update main profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update notification settings if provided
      if (updates.notification_settings) {
        const { error: notificationError } = await supabase
          .from('notification_settings')
          .upsert({
            user_id: user.id,
            ...updates.notification_settings
          })

        if (notificationError) throw notificationError
      }

      // Refresh profile data
      await fetchProfile(user.id)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}