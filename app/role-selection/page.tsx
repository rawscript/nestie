'use client'

import { motion } from 'framer-motion'
import { Search, Home, Users, MapPin, CreditCard, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-nestie-white">
      <Navigation showAuthButtons={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-nestie-black mb-6">
            How do you want to use Nestie?
          </h1>
          <p className="text-xl text-nestie-grey-500 max-w-2xl mx-auto">
            Choose your path to get started with the right tools and features for your needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Tenant Option */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="bg-nestie-grey-50 border-2 border-nestie-grey-200 rounded-2xl p-8 h-full hover:border-nestie-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-16 h-16 bg-nestie-black rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <Search className="h-8 w-8 text-nestie-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-nestie-black mb-4">I'm Looking for a Home</h2>
              <p className="text-nestie-grey-600 mb-6 leading-relaxed">
                Find your perfect rental property with our advanced search, interactive maps, and seamless booking system.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-nestie-grey-700">
                  <MapPin className="h-5 w-5 mr-3 text-nestie-grey-400" />
                  <span>Browse properties with interactive maps</span>
                </div>
                <div className="flex items-center text-nestie-grey-700">
                  <Calendar className="h-5 w-5 mr-3 text-nestie-grey-400" />
                  <span>Schedule property viewings</span>
                </div>
                <div className="flex items-center text-nestie-grey-700">
                  <CreditCard className="h-5 w-5 mr-3 text-nestie-grey-400" />
                  <span>Secure online payments</span>
                </div>
              </div>
              
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center w-full px-6 py-4 bg-nestie-black text-nestie-white font-semibold rounded-lg hover:bg-nestie-grey-800 transition-colors group"
              >
                Start Searching
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Agent Option */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="group"
          >
            <div className="bg-nestie-grey-50 border-2 border-nestie-grey-200 rounded-2xl p-8 h-full hover:border-nestie-black transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-center w-16 h-16 bg-nestie-black rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <Home className="h-8 w-8 text-nestie-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-nestie-black mb-4">I Have Properties to Rent</h2>
              <p className="text-nestie-grey-600 mb-6 leading-relaxed">
                List and manage your rental properties with powerful tools for agents and property owners.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-nestie-grey-700">
                  <Home className="h-5 w-5 mr-3 text-nestie-grey-400" />
                  <span>List unlimited properties</span>
                </div>
                <div className="flex items-center text-nestie-grey-700">
                  <Users className="h-5 w-5 mr-3 text-nestie-grey-400" />
                  <span>Manage tenant applications</span>
                </div>
                <div className="flex items-center text-nestie-grey-700">
                  <CreditCard className="h-5 w-5 mr-3 text-nestie-grey-400" />
                  <span>Track payments and revenue</span>
                </div>
              </div>
              
              <Link 
                href="/auth/signup?role=agent"
                className="inline-flex items-center justify-center w-full px-6 py-4 border-2 border-nestie-black text-nestie-black font-semibold rounded-lg hover:bg-nestie-black hover:text-nestie-white transition-colors group"
              >
                Become an Agent
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-nestie-grey-500 mb-4">
            Not sure which option is right for you?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="text-nestie-black hover:underline font-medium"
            >
              Browse properties first →
            </Link>
            <span className="hidden sm:inline text-nestie-grey-300">•</span>
            <Link 
              href="/auth/login"
              className="text-nestie-black hover:underline font-medium"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}