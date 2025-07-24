'use client'

import { Home, ArrowLeft, Shield, Eye, Lock, Users } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-nestie-white">
      {/* Header */}
      <header className="border-b border-nestie-grey-200 bg-nestie-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-nestie-grey-600 hover:text-nestie-black transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-nestie-black rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-nestie-white" />
              </div>
              <span className="text-2xl font-display font-bold text-nestie-black">Nestie</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-nestie-grey-50 to-nestie-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-nestie-black mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-nestie-grey-600">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-nestie-grey-500 mt-4">
            Last updated: January 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          
          {/* Overview */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Eye className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-nestie-black">Overview</h2>
            </div>
            <p className="text-nestie-grey-600 leading-relaxed">
              At Nestie, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              real estate platform and services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-nestie-black">Information We Collect</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-nestie-grey-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">Personal Information</h3>
                <ul className="text-nestie-grey-600 space-y-2">
                  <li>• Name, email address, and phone number</li>
                  <li>• Profile information and preferences</li>
                  <li>• Payment and billing information</li>
                  <li>• Communication history and support requests</li>
                </ul>
              </div>
              
              <div className="bg-nestie-grey-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">Usage Information</h3>
                <ul className="text-nestie-grey-600 space-y-2">
                  <li>• Property searches and viewing history</li>
                  <li>• Device information and IP address</li>
                  <li>• Browser type and operating system</li>
                  <li>• Pages visited and time spent on our platform</li>
                </ul>
              </div>
              
              <div className="bg-nestie-grey-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">Location Information</h3>
                <ul className="text-nestie-grey-600 space-y-2">
                  <li>• GPS coordinates (with your permission)</li>
                  <li>• Search location preferences</li>
                  <li>• Property location data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-nestie-black">How We Use Your Information</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">Service Provision</h3>
                <ul className="text-nestie-grey-600 space-y-2 text-sm">
                  <li>• Provide and maintain our services</li>
                  <li>• Process transactions and payments</li>
                  <li>• Connect you with property agents</li>
                  <li>• Send booking confirmations</li>
                </ul>
              </div>
              
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">Communication</h3>
                <ul className="text-nestie-grey-600 space-y-2 text-sm">
                  <li>• Send important updates and notifications</li>
                  <li>• Respond to your inquiries</li>
                  <li>• Provide customer support</li>
                  <li>• Send marketing communications (with consent)</li>
                </ul>
              </div>
              
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">Improvement</h3>
                <ul className="text-nestie-grey-600 space-y-2 text-sm">
                  <li>• Analyze usage patterns</li>
                  <li>• Improve our platform and services</li>
                  <li>• Develop new features</li>
                  <li>• Personalize your experience</li>
                </ul>
              </div>
              
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">Legal Compliance</h3>
                <ul className="text-nestie-grey-600 space-y-2 text-sm">
                  <li>• Comply with legal obligations</li>
                  <li>• Prevent fraud and abuse</li>
                  <li>• Protect user safety</li>
                  <li>• Resolve disputes</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Information Sharing</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <p className="text-yellow-800 font-medium">
                We do not sell, trade, or rent your personal information to third parties.
              </p>
            </div>
            
            <p className="text-nestie-grey-600 mb-4">We may share your information only in the following circumstances:</p>
            <ul className="text-nestie-grey-600 space-y-2">
              <li>• <strong>With Property Agents:</strong> To facilitate property viewings and transactions</li>
              <li>• <strong>Service Providers:</strong> Third-party services that help us operate our platform</li>
              <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li>• <strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              <li>• <strong>With Your Consent:</strong> Any other sharing with your explicit permission</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Data Security</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-800 leading-relaxed">
                We implement industry-standard security measures to protect your personal information, including 
                encryption, secure servers, and regular security audits. However, no method of transmission over 
                the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Your Rights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <h3 className="font-semibold text-nestie-black mb-2">Access & Portability</h3>
                <p className="text-sm text-nestie-grey-600">Request a copy of your personal data</p>
              </div>
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <h3 className="font-semibold text-nestie-black mb-2">Correction</h3>
                <p className="text-sm text-nestie-grey-600">Update or correct your information</p>
              </div>
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <h3 className="font-semibold text-nestie-black mb-2">Deletion</h3>
                <p className="text-sm text-nestie-grey-600">Request deletion of your data</p>
              </div>
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <h3 className="font-semibold text-nestie-black mb-2">Opt-out</h3>
                <p className="text-sm text-nestie-grey-600">Unsubscribe from marketing communications</p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Cookies and Tracking</h2>
            <p className="text-nestie-grey-600 mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide 
              personalized content. You can control cookie settings through your browser preferences.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Contact Us</h2>
            <div className="bg-nestie-black text-nestie-white rounded-lg p-6">
              <p className="mb-4">
                If you have questions about this Privacy Policy or want to exercise your rights, contact us:
              </p>
              <div className="space-y-2">
                <p>Email: <a href="mailto:privacy@nestie.co.ke" className="text-blue-300 hover:text-blue-100">privacy@nestie.co.ke</a></p>
                <p>Phone: <a href="tel:+254700000000" className="text-blue-300 hover:text-blue-100">+254 700 000 000</a></p>
                <p>Address: Westlands Office Park, Waiyaki Way, Nairobi, Kenya</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}