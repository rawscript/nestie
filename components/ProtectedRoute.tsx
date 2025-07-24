'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'tenant' | 'agent'
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && user.user_metadata?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on user role
        if (user.user_metadata?.role === 'agent') {
          router.push('/agent/dashboard')
        } else {
          router.push('/dashboard')
        }
        return
      }
    }
  }, [user, loading, requiredRole, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="h-12 w-12 bg-nestie-black rounded-lg flex items-center justify-center mx-auto mb-4">
            <Home className="h-6 w-6 text-nestie-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nestie-black mx-auto mb-4"></div>
          <p className="text-nestie-grey-600">Loading...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (requiredRole && user.user_metadata?.role !== requiredRole) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}