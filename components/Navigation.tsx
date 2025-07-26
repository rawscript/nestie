'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  Search, 
  MessageCircle, 
  Heart, 
  User, 
  Plus,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'

interface NavigationProps {
  userRole?: 'tenant' | 'agent' | null
  showAuthButtons?: boolean
}

export function Navigation({ userRole, showAuthButtons = false }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error: any) {
      toast.error('Error logging out')
    }
  }

  const tenantNavItems = [
    { href: '/dashboard', label: 'Search', icon: Search },
    { href: '/tenant/portal', label: 'My Rentals', icon: Home },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/saved', label: 'Saved', icon: Heart },
  ]

  const agentNavItems = [
    { href: '/agent/dashboard', label: 'Dashboard', icon: Home },
    { href: '/agent/properties/add', label: 'Add Property', icon: Plus },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
  ]

  const navItems = userRole === 'agent' ? agentNavItems : tenantNavItems

  return (
    <header className="bg-nestie-white border-b border-nestie-grey-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-nestie-black rounded-lg flex items-center justify-center">
              <span className="text-nestie-white font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold text-nestie-black">
              Nestie {userRole === 'agent' ? 'Agent' : ''}
            </span>
          </Link>

          {/* Desktop Navigation */}
          {userRole && (
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={isActive ? "primary" : "ghost"} 
                      size="sm"
                      className={isActive ? "bg-nestie-black text-nestie-white" : ""}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Auth Buttons for Landing Page */}
          {showAuthButtons && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-nestie-grey-600 hover:text-nestie-black transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-nestie-grey-600 hover:text-nestie-black transition-colors">
                How it Works
              </Link>
              <div className="flex items-center space-x-3">
                <Link href="/auth/login" className="text-nestie-grey-600 hover:text-nestie-black transition-colors">
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup"
                  className="px-4 py-2 bg-nestie-black text-nestie-white rounded-lg hover:bg-nestie-grey-800 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          )}

          {/* User Menu */}
          {userRole && (
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-nestie-black" />
            ) : (
              <Menu className="h-6 w-6 text-nestie-black" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-nestie-grey-200 py-4">
            {showAuthButtons ? (
              <div className="space-y-3">
                <Link 
                  href="#features" 
                  className="block py-2 text-nestie-grey-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#how-it-works" 
                  className="block py-2 text-nestie-grey-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How it Works
                </Link>
                <Link 
                  href="/auth/login" 
                  className="block py-2 text-nestie-grey-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup"
                  className="block w-full text-center py-3 bg-nestie-black text-nestie-white rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            ) : userRole ? (
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-nestie-black text-nestie-white' 
                          : 'text-nestie-grey-600 hover:bg-nestie-grey-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                <div className="border-t border-nestie-grey-200 pt-4 mt-4 space-y-2">
                  <Link 
                    href="/profile"
                    className="flex items-center space-x-3 py-3 px-4 w-full text-left text-nestie-grey-600 hover:bg-nestie-grey-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-3 py-3 px-4 w-full text-left text-nestie-grey-600 hover:bg-nestie-grey-50 rounded-lg"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  )
}