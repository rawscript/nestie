'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface BookingFormData {
  visitDate: string
  visitTime: string
  fullName: string
  email: string
  phone: string
  message: string
}

export default function BookPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Form, 2: Confirmation
  const [formData, setFormData] = useState<BookingFormData>({
    visitDate: '',
    visitTime: '',
    fullName: '',
    email: '',
    phone: '',
    message: ''
  })

  // Mock property data
  const property = {
    id: params.id,
    title: 'Modern 2BR Apartment in Westlands',
    address: 'Westlands, Nairobi',
    price: 85000,
    agent: {
      name: 'Sarah Johnson',
      phone: '+254 700 123 456',
      email: 'sarah@nestie.com'
    }
  }

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.visitDate || !formData.visitTime || !formData.fullName || !formData.email) {
        toast.error('Please fill in all required fields')
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      setStep(2)
      toast.success('Booking request submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit booking request')
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-nestie-grey-50">
        {/* Header */}
        <header className="bg-nestie-white border-b border-nestie-grey-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href={`/property/${params.id}`} className="flex items-center space-x-2">
                <ArrowLeft className="h-5 w-5 text-nestie-grey-600" />
                <span className="text-nestie-grey-600">Back to Property</span>
              </Link>

              <h1 className="text-xl font-bold text-nestie-black">Booking Confirmation</h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-nestie-black mb-4">
              Booking Request Submitted!
            </h2>

            <p className="text-nestie-grey-600 mb-8">
              Your visit request has been sent to the property agent. You'll receive a confirmation within 24 hours.
            </p>

            <Card className="text-left mb-8">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-nestie-grey-500">Property</p>
                  <p className="font-medium text-nestie-black">{property.title}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-nestie-grey-500">Visit Date</p>
                    <p className="font-medium text-nestie-black">
                      {new Date(formData.visitDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-nestie-grey-500">Visit Time</p>
                    <p className="font-medium text-nestie-black">{formData.visitTime}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-nestie-grey-500">Contact Person</p>
                  <p className="font-medium text-nestie-black">{formData.fullName}</p>
                  <p className="text-sm text-nestie-grey-600">{formData.email}</p>
                </div>

                {formData.message && (
                  <div>
                    <p className="text-sm text-nestie-grey-500">Message</p>
                    <p className="text-nestie-grey-600">{formData.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push('/dashboard')}>
                Back to Search
              </Button>
              <Button variant="outline" onClick={() => router.push(`/property/${params.id}`)}>
                View Property
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Header */}
      <header className="bg-nestie-white border-b border-nestie-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/property/${params.id}`} className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-nestie-grey-600" />
              <span className="text-nestie-grey-600">Back to Property</span>
            </Link>

            <h1 className="text-xl font-bold text-nestie-black">Schedule Visit</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-nestie-black mb-2">{property.title}</h2>
                  <p className="text-nestie-grey-600 mb-2">{property.address}</p>
                  <p className="text-2xl font-bold text-nestie-black">
                    KSh {property.price.toLocaleString()}/month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule Your Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date and Time Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Preferred Date *"
                    type="date"
                    name="visitDate"
                    value={formData.visitDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                      Preferred Time *
                    </label>
                    <select
                      name="visitTime"
                      value={formData.visitTime}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-nestie-grey-300 bg-nestie-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                      required
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-nestie-black flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Contact Information
                  </h3>

                  <Input
                    label="Full Name *"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Email Address *"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>

                {/* Additional Message */}
                <div>
                  <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Any specific requirements or questions..."
                    rows={4}
                    className="w-full rounded-lg border border-nestie-grey-300 bg-nestie-white px-3 py-2 text-sm placeholder:text-nestie-grey-400 focus:outline-none focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                  />
                </div>

                {/* Agent Contact Info */}
                <div className="bg-nestie-grey-50 rounded-lg p-4">
                  <h4 className="font-medium text-nestie-black mb-2">Property Agent</h4>
                  <div className="space-y-1 text-sm text-nestie-grey-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {property.agent.name}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {property.agent.phone}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {property.agent.email}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}