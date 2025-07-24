import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export const signUp = async (email: string, password: string, metadata: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  if (error) throw error
  return data
}

// Database types
export interface Property {
  id: string
  title: string
  description: string
  price: number
  type: 'rent' | 'sale'
  status: 'available' | 'occupied' | 'sold'
  bedrooms: number
  bathrooms: number
  area: number
  location: {
    address: string
    lat: number
    lng: number
  }
  images: string[]
  agent_id: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'tenant' | 'agent'
  created_at: string
}

export interface Booking {
  id: string
  property_id: string
  user_id: string
  agent_id: string
  status: 'pending' | 'approved' | 'rejected'
  visit_date: string
  message: string
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  property_id: string
  amount: number
  type: 'rent' | 'deposit' | 'utilities'
  method: 'mpesa' | 'stripe'
  status: 'pending' | 'completed' | 'failed'
  transaction_id: string
  created_at: string
}