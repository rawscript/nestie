'use client'

import { Home, ArrowLeft, Search, MessageCircle, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

export default function HelpCenter() {
  const faqs = [
    {
      question: "How do I search for properties?",
      answer: "Use our search filters to find properties by location, price range, property type, and amenities. You can also use the map view to explore properties in specific areas."
    },
    {
      question: "How do I book a property viewing?",
      answer: "Click on any property listing and use the 'Book Viewing' button. You can select your preferred date and time, and the agent will confirm your appointment."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, bank transfers, and major credit/debit cards. All transactions are secured with industry-standard encryption."
    },
    {
      question: "How do I become a verified agent?",
      answer: "Sign up as an agent and submit your professional credentials. Our team will review your application within 2-3 business days."
    },
    {
      question: "Can I save my favorite properties?",
      answer: "Yes! Create an account to save properties to your favorites list and receive notifications when similar properties become available."
    },
    {
      question: "How do I report a problem with a listing?",
      answer: "Use the 'Report Issue' button on any property listing, or contact our support team directly through the contact form."
    }
  ]

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
          <h1 className="text-4xl md:text-5xl font-display font-bold text-nestie-black mb-6">
            Help Center
          </h1>
          <p className="text-xl text-nestie-grey-600 mb-8">
            Find answers to common questions and get the support you need
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-nestie-grey-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-4 border border-nestie-grey-300 rounded-xl focus:ring-2 focus:ring-nestie-black focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-display font-bold text-nestie-black mb-12 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-nestie-white border border-nestie-grey-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-nestie-black mb-3">
                  {faq.question}
                </h3>
                <p className="text-nestie-grey-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 bg-nestie-grey-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold text-nestie-black mb-6">
            Still Need Help?
          </h2>
          <p className="text-xl text-nestie-grey-600 mb-12">
            Our support team is here to assist you
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-nestie-white p-6 rounded-xl border border-nestie-grey-200">
              <MessageCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-nestie-black mb-2">Live Chat</h3>
              <p className="text-nestie-grey-600 mb-4">Chat with our support team</p>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Start Chat
              </button>
            </div>
            
            <div className="bg-nestie-white p-6 rounded-xl border border-nestie-grey-200">
              <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-nestie-black mb-2">Email Support</h3>
              <p className="text-nestie-grey-600 mb-4">Get help via email</p>
              <Link href="/contact" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors inline-block">
                Send Email
              </Link>
            </div>
            
            <div className="bg-nestie-white p-6 rounded-xl border border-nestie-grey-200">
              <Phone className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-nestie-black mb-2">Phone Support</h3>
              <p className="text-nestie-grey-600 mb-4">Call us directly</p>
              <a href="tel:+254700000000" className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors inline-block">
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}