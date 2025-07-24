'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { signIn } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<'tenant' | 'agent'>('tenant')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await signIn(email, password)
      
      if (data.user) {
        toast.success('Welcome back!')
        
        // Get user metadata to determine role
        const userRole = data.user.user_metadata?.role || userType
        
        // Redirect based on user role
        if (userRole === 'agent') {
          router.push('/agent/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Home className="h-8 w-8 text-nestie-black" />
            <span className="text-2xl font-bold text-nestie-black">Nestie</span>
          </Link>
          <h1 className="text-2xl font-bold text-nestie-black mb-2">Welcome Back</h1>
          <p className="text-nestie-grey-500">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {/* User Type Toggle */}
            <div className="flex bg-nestie-grey-100 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setUserType('tenant')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  userType === 'tenant'
                    ? 'bg-nestie-white text-nestie-black shadow-sm'
                    : 'text-nestie-grey-600 hover:text-nestie-black'
                }`}
              >
                House Seeker
              </button>
              <button
                type="button"
                onClick={() => setUserType('agent')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  userType === 'agent'
                    ? 'bg-nestie-white text-nestie-black shadow-sm'
                    : 'text-nestie-grey-600 hover:text-nestie-black'
                }`}
              >
                Agent/Owner
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-nestie-grey-400 hover:text-nestie-grey-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-nestie-grey-300 text-nestie-black focus:ring-nestie-black"
                  />
                  <span className="ml-2 text-sm text-nestie-grey-600">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-nestie-black hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-nestie-grey-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-nestie-black hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-nestie-white rounded-lg border border-nestie-grey-200"
        >
          <h3 className="text-sm font-medium text-nestie-black mb-2">Demo Credentials</h3>
          <div className="text-xs text-nestie-grey-600 space-y-1">
            <p><strong>Tenant:</strong> tenant@demo.com / demo123</p>
            <p><strong>Agent:</strong> agent@demo.com / demo123</p>
          </div>
          <div className="mt-2 text-xs text-nestie-grey-500">
            <p>Or create a new account with any email/password</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}