'use client'

import { Home, ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function TermsOfService() {
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
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-nestie-black mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-nestie-grey-600">
            Please read these terms carefully before using our platform and services.
          </p>
          <p className="text-sm text-nestie-grey-500 mt-4">
            Last updated: January 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          
          {/* Agreement */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Scale className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-nestie-black">Agreement to Terms</h2>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800 leading-relaxed">
                By accessing and using Nestie's platform and services, you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to abide by the above, please do not 
                use this service.
              </p>
            </div>
          </section>

          {/* Service Description */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Service Description</h2>
            <p className="text-nestie-grey-600 mb-4">
              Nestie is a real estate platform that connects property seekers with property owners and agents. 
              Our services include:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                <h3 className="font-semibold text-nestie-black mb-2">Property Listings</h3>
                <p className="text-sm text-nestie-grey-600">Browse and search property listings</p>
              </div>
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                <h3 className="font-semibold text-nestie-black mb-2">Agent Services</h3>
                <p className="text-sm text-nestie-grey-600">Connect with verified real estate agents</p>
              </div>
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                <h3 className="font-semibold text-nestie-black mb-2">Booking System</h3>
                <p className="text-sm text-nestie-grey-600">Schedule property viewings</p>
              </div>
              <div className="bg-nestie-grey-50 rounded-lg p-4">
                <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                <h3 className="font-semibold text-nestie-black mb-2">Payment Processing</h3>
                <p className="text-sm text-nestie-grey-600">Secure payment transactions</p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">User Responsibilities</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-orange-400 pl-4">
                <h3 className="font-semibold text-nestie-black mb-2">Account Security</h3>
                <p className="text-nestie-grey-600 text-sm">
                  You are responsible for maintaining the confidentiality of your account credentials and for all 
                  activities that occur under your account.
                </p>
              </div>
              
              <div className="border-l-4 border-orange-400 pl-4">
                <h3 className="font-semibold text-nestie-black mb-2">Accurate Information</h3>
                <p className="text-nestie-grey-600 text-sm">
                  You must provide accurate, current, and complete information when creating an account or 
                  listing properties.
                </p>
              </div>
              
              <div className="border-l-4 border-orange-400 pl-4">
                <h3 className="font-semibold text-nestie-black mb-2">Lawful Use</h3>
                <p className="text-nestie-grey-600 text-sm">
                  You agree to use our services only for lawful purposes and in accordance with these terms.
                </p>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-nestie-black">Prohibited Activities</h2>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 mb-4 font-medium">You may not use our platform to:</p>
              <ul className="text-red-700 space-y-2 text-sm">
                <li>• Post false, misleading, or fraudulent property listings</li>
                <li>• Harass, abuse, or harm other users</li>
                <li>• Violate any applicable laws or regulations</li>
                <li>• Attempt to gain unauthorized access to our systems</li>
                <li>• Distribute malware, viruses, or harmful code</li>
                <li>• Engage in any form of spam or unsolicited communications</li>
                <li>• Infringe on intellectual property rights</li>
                <li>• Impersonate another person or entity</li>
              </ul>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Payment Terms</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">For Property Seekers</h3>
                <ul className="text-nestie-grey-600 space-y-2 text-sm">
                  <li>• Basic search and browsing is free</li>
                  <li>• Premium features may require subscription</li>
                  <li>• Property deposits and payments are processed securely</li>
                  <li>• Refunds subject to property owner policies</li>
                </ul>
              </div>
              
              <div className="bg-nestie-white border border-nestie-grey-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">For Agents & Owners</h3>
                <ul className="text-nestie-grey-600 space-y-2 text-sm">
                  <li>• Commission fees apply to successful transactions</li>
                  <li>• Premium listing features available</li>
                  <li>• Monthly subscription plans for agents</li>
                  <li>• Payment processing fees may apply</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Intellectual Property</h2>
            <p className="text-nestie-grey-600 mb-4">
              The Nestie platform, including its design, functionality, and content, is protected by copyright, 
              trademark, and other intellectual property laws. You may not:
            </p>
            <ul className="text-nestie-grey-600 space-y-2">
              <li>• Copy, modify, or distribute our platform or content</li>
              <li>• Use our trademarks or branding without permission</li>
              <li>• Reverse engineer or attempt to extract source code</li>
              <li>• Create derivative works based on our platform</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800 leading-relaxed">
                <strong>Service Availability:</strong> We strive to maintain continuous service availability but 
                cannot guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue 
                services with or without notice.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4">
              <p className="text-yellow-800 leading-relaxed">
                <strong>Third-Party Content:</strong> We are not responsible for the accuracy, completeness, or 
                reliability of property listings, agent information, or other user-generated content.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Limitation of Liability</h2>
            <p className="text-nestie-grey-600 mb-4">
              To the maximum extent permitted by law, Nestie shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="text-nestie-grey-600 space-y-2">
              <li>• Loss of profits, data, or business opportunities</li>
              <li>• Property transaction disputes</li>
              <li>• Third-party actions or omissions</li>
              <li>• Service interruptions or technical issues</li>
            </ul>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Termination</h2>
            <p className="text-nestie-grey-600 mb-4">
              We may terminate or suspend your account and access to our services at our sole discretion, 
              without prior notice, for conduct that we believe violates these terms or is harmful to other 
              users, us, or third parties.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Governing Law</h2>
            <p className="text-nestie-grey-600">
              These terms shall be governed by and construed in accordance with the laws of Kenya. Any disputes 
              arising from these terms or your use of our services shall be subject to the exclusive jurisdiction 
              of the courts of Kenya.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Changes to Terms</h2>
            <p className="text-nestie-grey-600">
              We reserve the right to modify these terms at any time. We will notify users of significant changes 
              via email or platform notifications. Continued use of our services after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-nestie-black mb-6">Contact Information</h2>
            <div className="bg-nestie-black text-nestie-white rounded-lg p-6">
              <p className="mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2">
                <p>Email: <a href="mailto:legal@nestie.co.ke" className="text-blue-300 hover:text-blue-100">legal@nestie.co.ke</a></p>
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