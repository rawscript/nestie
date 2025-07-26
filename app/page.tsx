'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Home, MapPin, Shield, Smartphone, ArrowRight, Star, Users, CheckCircle, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSessionState } from '@/lib/sessionStateManager'

export default function LandingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { shouldPreventRedirect } = useSessionState('landing-page')

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          // Only auto-redirect if not prevented by tab state manager
          if (!shouldPreventRedirect) {
            const userRole = session.user.user_metadata?.role
            if (userRole === 'agent') {
              router.push('/agent/dashboard')
            } else {
              router.push('/dashboard')
            }
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          // Only redirect on actual auth events, not tab focus
          if (!shouldPreventRedirect && event !== 'TOKEN_REFRESHED') {
            const userRole = session.user.user_metadata?.role
            if (userRole === 'agent') {
              router.push('/agent/dashboard')
            } else {
              router.push('/dashboard')
            }
          }
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, shouldPreventRedirect])

  const handleGetStarted = () => {
    if (user) {
      const userRole = user.user_metadata?.role
      if (userRole === 'agent') {
        router.push('/agent/dashboard')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/role-selection')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-nestie-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 bg-nestie-black rounded-lg flex items-center justify-center mx-auto mb-4">
            <Home className="h-6 w-6 text-nestie-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nestie-black mx-auto mb-4"></div>
          <p className="text-nestie-grey-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-nestie-white overflow-hidden">
        {/* Header */}
        <header className="relative z-50 border-b border-nestie-grey-200 bg-nestie-white/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="h-10 w-10 bg-nestie-black rounded-xl flex items-center justify-center">
                  <Home className="h-6 w-6 text-nestie-white" />
                </div>
                <span className="text-3xl font-display font-bold text-nestie-black">Nestie</span>
              </motion.div>

              <nav className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-nestie-grey-600 hover:text-nestie-black transition-colors font-medium">
                  Features
                </Link>
                <Link href="#properties" className="text-nestie-grey-600 hover:text-nestie-black transition-colors font-medium">
                  Properties
                </Link>
                <Link href="#about" className="text-nestie-grey-600 hover:text-nestie-black transition-colors font-medium">
                  About
                </Link>
                {!user ? (
                  <div className="flex items-center space-x-4">
                    <Link href="/auth/login" className="text-nestie-grey-600 hover:text-nestie-black transition-colors font-medium">
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-nestie-black text-nestie-white px-6 py-2 rounded-lg hover:bg-nestie-grey-800 transition-colors font-medium"
                    >
                      Get Started
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="bg-nestie-black text-nestie-white px-6 py-2 rounded-lg hover:bg-nestie-grey-800 transition-colors font-medium"
                  >
                    Dashboard
                  </button>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className={"relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden"}>
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-nestie-grey-50 to-nestie-white"></div>
          <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23f5f5f5\" fill-opacity=\"0.4\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"}></div><div className={"relative max-w-7xl mx-auto"}>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-6"
                >
                  <span className="inline-flex items-center px-4 py-2 bg-nestie-grey-100 text-nestie-grey-700 rounded-full text-sm font-medium mb-6">
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    Trusted by 10,000+ users
                  </span>
                  <h1 className="text-5xl md:text-7xl font-display font-bold text-nestie-black leading-tight">
                    Find Your
                    <span className="block text-nestie-grey-600">Dream Home</span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl text-nestie-grey-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                >
                  Discover premium properties with our AI-powered platform. From luxury apartments to family homes, find your perfect match in Kenya's top locations.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <button
                    onClick={handleGetStarted}
                    className="group inline-flex items-center justify-center px-8 py-4 bg-nestie-black text-nestie-white font-semibold rounded-xl hover:bg-nestie-grey-800 transition-all duration-300 transform hover:scale-105"
                  >
                    {user ? 'Go to Dashboard' : 'Start Your Search'}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <Link
                    href="#properties"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-nestie-grey-300 text-nestie-black font-semibold rounded-xl hover:bg-nestie-grey-50 transition-colors"
                  >
                    View Properties
                  </Link>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex items-center justify-center lg:justify-start gap-8 mt-12"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nestie-black">500+</div>
                    <div className="text-sm text-nestie-grey-600">Properties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nestie-black">50+</div>
                    <div className="text-sm text-nestie-grey-600">Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nestie-black">4.9</div>
                    <div className="text-sm text-nestie-grey-600">Rating</div>
                  </div>
                </motion.div>
              </div>

              {/* Right Content - Property Images */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Main large image */}
                  <div className="col-span-2 aspect-[4/3] bg-gradient-to-br from-nestie-grey-100 to-nestie-grey-200 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <div className="text-center">
                        <Building2 className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                        <p className="text-indigo-600 font-medium">Modern Apartment</p>
                        <p className="text-sm text-indigo-500">Westlands, Nairobi</p>
                      </div>
                    </div>
                  </div>

                  {/* Smaller images */}
                  <div className="aspect-square bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl overflow-hidden shadow-lg">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Home className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm text-emerald-600 font-medium">Villa</p>
                      </div>
                    </div>
                  </div>

                  <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl overflow-hidden shadow-lg">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Building2 className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                        <p className="text-sm text-amber-600 font-medium">Townhouse</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-nestie-white rounded-xl shadow-lg p-4"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-nestie-black">Available Now</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -bottom-4 -left-4 bg-nestie-white rounded-xl shadow-lg p-4"
                >
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-nestie-black">4.9 Rating</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section >

        {/* Features Section */}
        < section id="features" className="py-24 bg-nestie-white" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-nestie-black mb-6">
                Why Choose Nestie?
              </h2>
              <p className="text-xl text-nestie-grey-600 max-w-3xl mx-auto leading-relaxed">
                Experience the future of real estate with our premium platform designed for modern property seekers and agents.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Smartphone className="h-10 w-10" />,
                  title: "Mobile-First Experience",
                  description: "Seamlessly browse properties on any device with our responsive design optimized for mobile users.",
                  color: "from-blue-500 to-indigo-600"
                },
                {
                  icon: <MapPin className="h-10 w-10" />,
                  title: "Smart Location Search",
                  description: "Find properties with interactive maps and location-based filters powered by advanced geolocation.",
                  color: "from-green-500 to-emerald-600"
                },
                {
                  icon: <Shield className="h-10 w-10" />,
                  title: "Secure Transactions",
                  description: "Complete transactions safely with multiple payment options including M-Pesa and international cards.",
                  color: "from-purple-500 to-violet-600"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-nestie-white p-8 rounded-2xl border border-nestie-grey-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-nestie-black mb-4">{feature.title}</h3>
                  <p className="text-nestie-grey-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section >

        {/* Properties Preview Section */}
        < section id="properties" className="py-24 bg-nestie-grey-50" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-nestie-black mb-6">
                Featured Properties
              </h2>
              <p className="text-xl text-nestie-grey-600 max-w-2xl mx-auto">
                Discover handpicked premium properties in Kenya's most desirable locations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  title: "Modern Apartment",
                  location: "Westlands, Nairobi",
                  price: "KSh 85,000/month",
                  beds: 2,
                  baths: 2,
                  area: "1,200 sqft",
                  gradient: "from-blue-400 to-indigo-500"
                },
                {
                  title: "Luxury Villa",
                  location: "Karen, Nairobi",
                  price: "KSh 12M",
                  beds: 4,
                  baths: 3,
                  area: "2,500 sqft",
                  gradient: "from-green-400 to-emerald-500"
                },
                {
                  title: "Executive Townhouse",
                  location: "Lavington, Nairobi",
                  price: "KSh 120,000/month",
                  beds: 3,
                  baths: 2,
                  area: "1,800 sqft",
                  gradient: "from-purple-400 to-violet-500"
                }
              ].map((property, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-nestie-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`aspect-video bg-gradient-to-br ${property.gradient} flex items-center justify-center`}>
                    <Home className="h-16 w-16 text-white opacity-80" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-nestie-black">{property.title}</h3>
                      <span className="text-lg font-bold text-nestie-black">{property.price}</span>
                    </div>
                    <div className="flex items-center text-nestie-grey-600 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.location}
                    </div>
                    <div className="flex justify-between text-sm text-nestie-grey-600">
                      <span>{property.beds} beds</span>
                      <span>{property.baths} baths</span>
                      <span>{property.area}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 bg-nestie-black text-nestie-white font-semibold rounded-xl hover:bg-nestie-grey-800 transition-colors"
              >
                View All Properties
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </section >

        {/* CTA Section */}
        < section className="py-24 bg-nestie-black text-nestie-white" >
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Ready to Find Your Dream Home?
              </h2>
              <p className="text-xl text-nestie-grey-300 mb-10 leading-relaxed">
                Join thousands of satisfied users who found their perfect property through Nestie.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center px-8 py-4 bg-nestie-white text-nestie-black font-semibold rounded-xl hover:bg-nestie-grey-100 transition-colors"
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                {!user && (
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-nestie-grey-600 text-nestie-white font-semibold rounded-xl hover:bg-nestie-grey-900 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section >

        {/* Footer */}
        < footer className="border-t border-nestie-grey-200 py-16 bg-nestie-white" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-10 w-10 bg-nestie-black rounded-xl flex items-center justify-center">
                    <Home className="h-6 w-6 text-nestie-white" />
                  </div>
                  <span className="text-3xl font-display font-bold text-nestie-black">Nestie</span>
                </div>
                <p className="text-nestie-grey-600 max-w-md leading-relaxed">
                  Your trusted partner in finding the perfect home. We connect property seekers with their dream homes across Kenya.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-nestie-black mb-4">Quick Links</h3>
                <ul className="space-y-2 text-nestie-grey-600">
                  <li><Link href="#features" className="hover:text-nestie-black transition-colors">Features</Link></li>
                  <li><Link href="#properties" className="hover:text-nestie-black transition-colors">Properties</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-nestie-black transition-colors">Sign Up</Link></li>
                  <li><Link href="/auth/login" className="hover:text-nestie-black transition-colors">Sign In</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-nestie-black mb-4">Support</h3>
                <ul className="space-y-2 text-nestie-grey-600">
                  <li><Link href="/help" className="hover:text-nestie-black transition-colors">Help Center</Link></li>
                  <li><Link href="/contact" className="hover:text-nestie-black transition-colors">Contact Us</Link></li>
                  <li><Link href="/privacy" className="hover:text-nestie-black transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-nestie-black transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-nestie-grey-200 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-nestie-grey-500 text-sm mb-4 md:mb-0">
                © 2025 Nestie. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-nestie-grey-600">Secure Platform</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-nestie-grey-600">10,000+ Users</span>
                </div>
              </div>
            </div>
          </div>

        </footer >
      </div >
    </>
  )

}
