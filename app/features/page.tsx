'use client'

import { motion } from 'framer-motion'
import { Home, Smartphone, MapPin, Shield, Users, Star, CheckCircle, ArrowRight, Zap, Globe, Lock } from 'lucide-react'
import Link from 'next/link'

export default function FeaturesPage() {
  const features = [
    {
      icon: <Smartphone className="h-12 w-12" />,
      title: "Mobile-First Experience",
      description: "Seamlessly browse properties on any device with our responsive design optimized for mobile users.",
      details: [
        "Responsive design that works on all devices",
        "Touch-optimized interface for mobile browsing",
        "Offline property viewing capabilities",
        "Push notifications for new listings"
      ],
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <MapPin className="h-12 w-12" />,
      title: "Smart Location Search",
      description: "Find properties with interactive maps and location-based filters powered by advanced geolocation.",
      details: [
        "Interactive map with property markers",
        "Radius-based property search",
        "Neighborhood insights and analytics",
        "Commute time calculations"
      ],
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <Shield className="h-12 w-12" />,
      title: "Secure Transactions",
      description: "Complete transactions safely with multiple payment options including M-Pesa and international cards.",
      details: [
        "End-to-end encryption for all transactions",
        "M-Pesa integration for local payments",
        "International payment gateway support",
        "Escrow services for property purchases"
      ],
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: <Users className="h-12 w-12" />,
      title: "Agent Network",
      description: "Connect with verified real estate agents who know the local market inside and out.",
      details: [
        "Verified agent profiles with ratings",
        "Direct messaging with agents",
        "Agent performance analytics",
        "24/7 agent support availability"
      ],
      color: "from-orange-500 to-red-600"
    },
    {
      icon: <Zap className="h-12 w-12" />,
      title: "AI-Powered Matching",
      description: "Our intelligent system learns your preferences to suggest the perfect properties for you.",
      details: [
        "Machine learning recommendation engine",
        "Personalized property suggestions",
        "Price prediction algorithms",
        "Market trend analysis"
      ],
      color: "from-yellow-500 to-orange-600"
    },
    {
      icon: <Globe className="h-12 w-12" />,
      title: "Multi-Language Support",
      description: "Access Nestie in multiple languages including English, Swahili, and other local languages.",
      details: [
        "Full English and Swahili support",
        "Localized content for different regions",
        "Currency conversion tools",
        "Cultural preference settings"
      ],
      color: "from-teal-500 to-cyan-600"
    }
  ]

  return (
    <div className="min-h-screen bg-nestie-white">
      {/* Header */}
      <header className="border-b border-nestie-grey-200 bg-nestie-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-nestie-black rounded-xl flex items-center justify-center">
                <Home className="h-6 w-6 text-nestie-white" />
              </div>
              <span className="text-3xl font-display font-bold text-nestie-black">Nestie</span>
            </Link>
            <Link
              href="/"
              className="text-nestie-grey-600 hover:text-nestie-black transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-nestie-grey-50 to-nestie-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-nestie-black mb-6">
              Powerful Features for
              <span className="block text-nestie-grey-600">Modern Real Estate</span>
            </h1>
            <p className="text-xl text-nestie-grey-600 max-w-3xl mx-auto leading-relaxed">
              Discover how Nestie's cutting-edge features make finding and managing properties easier than ever before.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-nestie-white p-8 rounded-2xl border border-nestie-grey-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-nestie-black mb-4">{feature.title}</h3>
                <p className="text-nestie-grey-600 mb-6 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center text-nestie-grey-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-nestie-black text-nestie-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Ready to Experience These Features?
            </h2>
            <p className="text-xl text-nestie-grey-300 mb-10 leading-relaxed">
              Join thousands of users who are already enjoying Nestie's powerful features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-nestie-white text-nestie-black font-semibold rounded-xl hover:bg-nestie-grey-100 transition-colors"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/properties"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-nestie-grey-600 text-nestie-white font-semibold rounded-xl hover:bg-nestie-grey-900 transition-colors"
              >
                View Properties
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-nestie-grey-200 py-12 bg-nestie-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-nestie-black rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-nestie-white" />
            </div>
            <span className="text-2xl font-display font-bold text-nestie-black">Nestie</span>
          </div>
          <p className="text-nestie-grey-500 text-sm">
            © 2024 Nestie. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}