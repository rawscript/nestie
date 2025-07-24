'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  CreditCard, 
  Phone, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import toast from 'react-hot-toast'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  description: string
  onSuccess: (paymentData: any) => void
}

interface PaymentData {
  method: 'mpesa' | 'stripe'
  amount: number
  phone?: string
  cardDetails?: {
    number: string
    expiry: string
    cvv: string
    name: string
  }
}

export function PaymentModal({ isOpen, onClose, amount, description, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'stripe'>('mpesa')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'success' | 'error'>('method')
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'mpesa',
    amount,
    phone: '',
    cardDetails: {
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    }
  })

  if (!isOpen) return null

  const handlePaymentMethodSelect = (method: 'mpesa' | 'stripe') => {
    setPaymentMethod(method)
    setPaymentData(prev => ({ ...prev, method }))
    setStep('details')
  }

  const handleMpesaPayment = async () => {
    if (!paymentData.phone) {
      toast.error('Please enter your M-Pesa phone number')
      return
    }

    setLoading(true)
    setStep('processing')

    try {
      // Simulate TinyMpesa API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate success
      const paymentResult = {
        method: 'mpesa',
        transaction_id: `MPESA${Date.now()}`,
        amount,
        phone: paymentData.phone,
        status: 'completed'
      }
      
      setStep('success')
      setTimeout(() => {
        onSuccess(paymentResult)
        onClose()
      }, 2000)
    } catch (error) {
      setStep('error')
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStripePayment = async () => {
    const { cardDetails } = paymentData
    if (!cardDetails?.number || !cardDetails?.expiry || !cardDetails?.cvv || !cardDetails?.name) {
      toast.error('Please fill in all card details')
      return
    }

    setLoading(true)
    setStep('processing')

    try {
      // Simulate Stripe API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const paymentResult = {
        method: 'stripe',
        transaction_id: `STRIPE${Date.now()}`,
        amount,
        card_last4: cardDetails.number.slice(-4),
        status: 'completed'
      }
      
      setStep('success')
      setTimeout(() => {
        onSuccess(paymentResult)
        onClose()
      }, 2000)
    } catch (error) {
      setStep('error')
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      setPaymentData(prev => ({ ...prev, phone: value }))
    } else {
      setPaymentData(prev => ({
        ...prev,
        cardDetails: {
          ...prev.cardDetails!,
          [name]: value
        }
      }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-nestie-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-nestie-grey-200">
          <h2 className="text-xl font-bold text-nestie-black">Payment</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Payment Summary */}
          <div className="mb-6 p-4 bg-nestie-grey-50 rounded-lg">
            <h3 className="font-medium text-nestie-black mb-1">{description}</h3>
            <p className="text-2xl font-bold text-nestie-black">
              KSh {amount.toLocaleString()}
            </p>
          </div>

          {/* Method Selection */}
          {step === 'method' && (
            <div className="space-y-4">
              <h3 className="font-medium text-nestie-black mb-4">Choose Payment Method</h3>
              
              <button
                onClick={() => handlePaymentMethodSelect('mpesa')}
                className="w-full p-4 border border-nestie-grey-200 rounded-lg hover:border-nestie-black transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-nestie-black">M-Pesa</h4>
                    <p className="text-sm text-nestie-grey-500">Pay with mobile money</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('stripe')}
                className="w-full p-4 border border-nestie-grey-200 rounded-lg hover:border-nestie-black transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-nestie-black">Credit Card</h4>
                    <p className="text-sm text-nestie-grey-500">Visa, Mastercard, etc.</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* M-Pesa Details */}
          {step === 'details' && paymentMethod === 'mpesa' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-medium text-nestie-black">M-Pesa Payment</h3>
              </div>

              <Input
                label="M-Pesa Phone Number"
                name="phone"
                type="tel"
                value={paymentData.phone}
                onChange={handleInputChange}
                placeholder="254700000000"
                required
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p>You'll receive an M-Pesa prompt on your phone to complete the payment.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep('method')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleMpesaPayment} loading={loading} className="flex-1">
                  Pay KSh {amount.toLocaleString()}
                </Button>
              </div>
            </div>
          )}

          {/* Stripe Details */}
          {step === 'details' && paymentMethod === 'stripe' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-medium text-nestie-black">Card Payment</h3>
              </div>

              <Input
                label="Cardholder Name"
                name="name"
                value={paymentData.cardDetails?.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
              />

              <Input
                label="Card Number"
                name="number"
                value={paymentData.cardDetails?.number}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  name="expiry"
                  value={paymentData.cardDetails?.expiry}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  required
                />
                <Input
                  label="CVV"
                  name="cvv"
                  value={paymentData.cardDetails?.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  required
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Secure & Encrypted</p>
                    <p>Your payment information is protected with bank-level security.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep('method')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStripePayment} loading={loading} className="flex-1">
                  Pay KSh {amount.toLocaleString()}
                </Button>
              </div>
            </div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader className="h-12 w-12 text-nestie-black mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-nestie-black mb-2">Processing Payment</h3>
              <p className="text-nestie-grey-500">
                {paymentMethod === 'mpesa' 
                  ? 'Please check your phone for the M-Pesa prompt'
                  : 'Processing your card payment...'
                }
              </p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-nestie-black mb-2">Payment Successful!</h3>
              <p className="text-nestie-grey-500">Your payment has been processed successfully.</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-nestie-black mb-2">Payment Failed</h3>
              <p className="text-nestie-grey-500 mb-4">Something went wrong. Please try again.</p>
              <Button onClick={() => setStep('method')}>Try Again</Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}