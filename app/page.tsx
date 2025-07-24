'use client'

import { motion } from 'framer-motion'
import { Home, Search, MapPin, Shield, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-nestie-white">
      {/* Header */}
      <header className="border-b border-nestie-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Home className="h-8 w-8 text-nestie-black" />
              <span className="text-2xl font-bold text-nestie-black">Nestie</span>
            </motion.div>
            
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-nestie-black mb-6"
          >
            Find Your Perfect
            <span className="block text-nestie-grey-600">Home</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-nestie-grey-500 mb-8 max-w-2xl mx-auto"
          >
            Discover, manage, and transact real estate with our ultra-modern, minimalist platform designed for the mobile-first world.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-nestie-black text-nestie-white font-semibold rounded-lg hover:bg-nestie-grey-800 transition-colors"
              >
                <Search className="mr-2 h-5 w-5" />
                Find Properties
              </Link>
              <Link 
                href="/auth/signup?role=agent"
                className="inline-flex items-center justify-center px-8 py-4 border border-nestie-grey-300 text-nestie-black font-semibold rounded-lg hover:bg-nestie-grey-50 transition-colors"
              >
                <Home className="mr-2 h-5 w-5" />
                List Properties
              </Link>
            </div>
            <p className="text-sm text-nestie-grey-400">
              Looking for a home? <Link href="/dashboard" className="text-nestie-black hover:underline">Browse properties</Link> • 
              Property owner? <Link href="/auth/signup?role=agent" className="text-nestie-black hover:underline">Become an agent</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-nestie-grey-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-nestie-black mb-4">
              Why Choose Nestie?
            </h2>
            <p className="text-nestie-grey-500 text-lg max-w-2xl mx-auto">
              Built for modern real estate discovery with cutting-edge technology and user-first design.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="h-8 w-8" />,
                title: "Mobile-First Design",
                description: "Optimized for mobile devices with responsive design that works perfectly on any screen size."
              },
              {
                icon: <MapPin className="h-8 w-8" />,
                title: "Interactive Maps",
                description: "Animated property discovery with Yandex Maps integration for seamless location-based search."
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Secure Payments",
                description: "Multiple payment options including M-Pesa and Stripe for secure, convenient transactions."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-nestie-white p-8 rounded-lg border border-nestie-grey-200"
              >
                <div className="text-nestie-black mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-nestie-black mb-3">{feature.title}</h3>
                <p className="text-nestie-grey-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-nestie-black mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-nestie-grey-500 text-lg mb-8">
              Choose your path and join thousands who trust Nestie for their real estate needs.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6 text-left">
                <Search className="h-8 w-8 text-nestie-black mb-4" />
                <h3 className="text-xl font-semibold text-nestie-black mb-2">I'm Looking for a Home</h3>
                <p className="text-nestie-grey-500 mb-4">Browse properties, schedule viewings, and find your perfect rental.</p>
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-nestie-black text-nestie-white font-semibold rounded-lg hover:bg-nestie-grey-800 transition-colors"
                >
                  Start Searching
                </Link>
              </div>
              
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6 text-left">
                <Home className="h-8 w-8 text-nestie-black mb-4" />
                <h3 className="text-xl font-semibold text-nestie-black mb-2">I Have Properties to Rent</h3>
                <p className="text-nestie-grey-500 mb-4">List your properties, manage tenants, and grow your rental business.</p>
                <Link 
                  href="/auth/signup?role=agent"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-nestie-grey-300 text-nestie-black font-semibold rounded-lg hover:bg-nestie-grey-50 transition-colors"
                >
                  Become an Agent
                </Link>
              </div>
            </div>
            
            <p className="text-sm text-nestie-grey-400">
              Already have an account? <Link href="/auth/login" className="text-nestie-black hover:underline">Sign in here</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-nestie-grey-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Home className="h-6 w-6 text-nestie-black" />
              <span className="text-xl font-bold text-nestie-black">Nestie</span>
            </div>
            <p className="text-nestie-grey-500 text-sm">
              © 2024 Nestie. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}