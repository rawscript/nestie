'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, MapPin, DollarSign, CheckCircle, X, CreditCard, Smartphone } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'

interface CalendarBookingProps {
  property: any
  agent: any
  onClose: () => void
  onBookingComplete: (bookingData: any) => void
}

export default function CalendarBooking({ property, agent, onClose, onBookingComplete }: CalendarBookingProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<'calendar' | 'payment' | 'confirmation'>('calendar')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [bookingType, setBookingType] = useState<'viewing' | 'lease' | 'purchase'>('viewing')
  const [paymentMethod, setPaymentMethod] = useState<'tinympesa' | 'stripe'>('tinympesa')
  const [paymentDetails, setPaymentDetails] = useState({
    mpesaPhone: '',
    cardDetails: {
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    }
  })
  const [processing, setProcessing] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  // Generate available time slots
  useEffect(() => {
    const slots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', 
      '14:00', '15:00', '16:00', '17:00', '18:00'
    ]
    setAvailableSlots(slots)
  }, [])

  // Calculate payment amount based on booking type
  const getPaymentAmount = () => {
    switch (bookingType) {
      case 'viewing':
        return 0 // Free viewing
      case 'lease':
        return property.terms?.deposit ? parseInt(property.terms.deposit) : property.price * 0.1
      case 'purchase':
        return property.price * 0.1 // 10% down payment
      default:
        return 0
    }
  }

  const handleDateTimeSelection = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time')
      return
    }

    if (bookingType === 'viewing') {
      // For viewing, skip payment and go directly to confirmation
      handleBookingSubmission()
    } else {
      // For lease/purchase, proceed to payment
      setCurrentStep('payment')
    }
  }

  const handlePaymentSubmission = async () => {
    if (!user) return

    setProcessing(true)
    try {
      const amount = getPaymentAmount()
      
      // Process payment
      let paymentResult
      if (paymentMethod === 'tinympesa') {
        paymentResult = await processMpesaPayment(amount)
      } else {
        paymentResult = await processStripePayment(amount)
      }

      if (paymentResult.success) {
        await handleBookingSubmission(paymentResult)
      } else {
        throw new Error('Payment failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const processMpesaPayment = async (amount: number) => {
    const response = await fetch('/api/payments/tinympesa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        phone: paymentDetails.mpesaPhone,
        reference: `${bookingType.toUpperCase()}-${property.id}-${Date.now()}`,
        description: `${bookingType} payment for ${property.title}`
      })
    })

    return response.json()
  }

  const processStripePayment = async (amount: number) => {
    const response = await fetch('/api/payments/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency: 'kes',
        card: paymentDetails.cardDetails,
        description: `${bookingType} payment for ${property.title}`
      })
    })

    return response.json()
  }

  const handleBookingSubmission = async (paymentResult?: any) => {
    if (!user) return

    try {
      const bookingData = {
        property_id: property.id,
        tenant_id: user.id,
        agent_id: property.agent_id || agent?.id,
        booking_type: bookingType,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        amount_paid: getPaymentAmount(),
        payment_method: bookingType !== 'viewing' ? paymentMethod : null,
        payment_reference: paymentResult?.reference || null,
        status: 'confirmed',
        created_at: new Date().toISOString()
      }

      const response = await fetch('/api/bookings/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) throw new Error('Booking failed')

      const { data: booking } = await response.json()

      // Send notification to agent
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: property.agent_id || agent?.id,
          title: `New ${bookingType} booking`,
          message: `${user.email} has booked a ${bookingType} for "${property.title}" on ${selectedDate} at ${selectedTime}`,
          type: 'booking_confirmation',
          data: {
            booking_id: booking.id,
            property_id: property.id,
            booking_type: bookingType,
            scheduled_date: selectedDate,
            scheduled_time: selectedTime,
            amount_paid: getPaymentAmount()
          }
        })
      })

      // Add to both calendars (agent and tenant)
      await Promise.all([
        addToCalendar(booking, 'agent'),
        addToCalendar(booking, 'tenant')
      ])

      setCurrentStep('confirmation')
      onBookingComplete(booking)
      toast.success(`${bookingType} booked successfully!`)

    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Booking failed. Please try again.')
    }
  }

  const addToCalendar = async (booking: any, userType: 'agent' | 'tenant') => {
    const calendarEvent = {
      booking_id: booking.id,
      user_id: userType === 'agent' ? (property.agent_id || agent?.id) : user?.id,
      user_type: userType,
      title: `${bookingType} - ${property.title}`,
      description: `${bookingType} appointment for property: ${property.title}`,
      start_date: selectedDate,
      start_time: selectedTime,
      end_time: getEndTime(selectedTime),
      location: property.location?.address,
      property_id: property.id,
      status: 'confirmed',
      created_at: new Date().toISOString()
    }

    await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calendarEvent)
    })
  }

  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endHours = hours + 1 // 1 hour duration
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Book Property</h2>
            <button onClick={onClose}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-4">
            <div className={`flex items-center ${currentStep === 'calendar' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'calendar' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
              }`}>
                {currentStep === 'calendar' ? '1' : <CheckCircle className="h-5 w-5" />}
              </div>
              <span className="ml-2 text-sm font-medium">Schedule</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${
              currentStep === 'payment' ? 'text-blue-600' : 
              currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'payment' ? 'bg-blue-600 text-white' :
                currentStep === 'confirmation' ? 'bg-green-500 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                {currentStep === 'confirmation' ? <CheckCircle className="h-5 w-5" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${currentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Property Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {property.images && property.images.length > 0 ? (
                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <MapPin className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{property.title}</h3>
                <p className="text-sm text-gray-600">{property.location?.address}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  KSh {parseInt(property.price).toLocaleString()}/{property.listingType === 'rent' ? 'month' : property.listingType}
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Calendar Scheduling */}
          {currentStep === 'calendar' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Your Appointment</h3>
                
                {/* Booking Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Booking Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setBookingType('viewing')}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        bookingType === 'viewing' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">Property Viewing</div>
                      <div className="text-sm text-gray-500">Free</div>
                    </button>
                    <button
                      onClick={() => setBookingType('lease')}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        bookingType === 'lease' 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">Lease Agreement</div>
                      <div className="text-sm text-gray-500">
                        KSh {(property.terms?.deposit ? parseInt(property.terms.deposit) : property.price * 0.1).toLocaleString()}
                      </div>
                    </button>
                    <button
                      onClick={() => setBookingType('purchase')}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        bookingType === 'purchase' 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">Purchase</div>
                      <div className="text-sm text-gray-500">
                        KSh {(property.price * 0.1).toLocaleString()} (10%)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getMinDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose time</option>
                      {availableSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Agent Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Meeting with Agent</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{agent?.full_name || 'Property Agent'}</p>
                      <p className="text-sm text-blue-700">{agent?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDateTimeSelection}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {bookingType === 'viewing' ? 'Confirm Booking' : 'Continue to Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment (for lease/purchase only) */}
          {currentStep === 'payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-green-800 mb-2">Payment Amount</h4>
                  <p className="text-2xl font-bold text-green-900">
                    KSh {getPaymentAmount().toLocaleString()}
                  </p>
                  <p className="text-green-700 text-sm">
                    {bookingType === 'lease' ? 'Security deposit' : 'Down payment (10%)'} for {property.title}
                  </p>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('tinympesa')}
                      className={`flex items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                        paymentMethod === 'tinympesa'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Smartphone className="h-5 w-5 mr-2" />
                      <span className="font-medium">M-Pesa</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`flex items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                        paymentMethod === 'stripe'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span className="font-medium">Card</span>
                    </button>
                  </div>
                </div>

                {/* Payment Forms */}
                {paymentMethod === 'tinympesa' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Smartphone className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-green-800">M-Pesa Payment</h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        M-Pesa Phone Number
                      </label>
                      <input
                        type="tel"
                        value={paymentDetails.mpesaPhone}
                        onChange={(e) => setPaymentDetails({
                          ...paymentDetails,
                          mpesaPhone: e.target.value
                        })}
                        placeholder="254712345678"
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'stripe' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-blue-800">Credit/Debit Card</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.cardDetails.name}
                          onChange={(e) => setPaymentDetails({
                            ...paymentDetails,
                            cardDetails: { ...paymentDetails.cardDetails, name: e.target.value }
                          })}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.cardDetails.number}
                          onChange={(e) => setPaymentDetails({
                            ...paymentDetails,
                            cardDetails: { ...paymentDetails.cardDetails, number: e.target.value }
                          })}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={paymentDetails.cardDetails.expiry}
                            onChange={(e) => setPaymentDetails({
                              ...paymentDetails,
                              cardDetails: { ...paymentDetails.cardDetails, expiry: e.target.value }
                            })}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={paymentDetails.cardDetails.cvv}
                            onChange={(e) => setPaymentDetails({
                              ...paymentDetails,
                              cardDetails: { ...paymentDetails.cardDetails, cvv: e.target.value }
                            })}
                            placeholder="123"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setCurrentStep('calendar')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePaymentSubmission}
                    disabled={processing || 
                      (paymentMethod === 'tinympesa' && !paymentDetails.mpesaPhone) ||
                      (paymentMethod === 'stripe' && (!paymentDetails.cardDetails.number || !paymentDetails.cardDetails.name))
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      `Pay KSh ${getPaymentAmount().toLocaleString()}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-600">
                  Your {bookingType} has been successfully scheduled and added to both calendars.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3">Booking Details</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{bookingType}</span>
                  </div>
                  {getPaymentAmount() > 0 && (
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-medium">KSh {getPaymentAmount().toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">What's Next?</h4>
                <ul className="text-blue-700 text-sm space-y-1 text-left">
                  <li>• Both you and the agent have this appointment in your calendars</li>
                  <li>• You'll receive a reminder 24 hours before the appointment</li>
                  <li>• The agent will contact you if any changes are needed</li>
                  {bookingType !== 'viewing' && (
                    <li>• Your payment has been processed and recorded</li>
                  )}
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
                <button
                  onClick={() => window.open(`/calendar`, '_blank')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  View Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}