'use client'

import React, { useState } from 'react'
import { PaymentService, type PaymentRequest } from '@/lib/paymentService'
import { useAuth } from '@/lib/useAuth'
import type { PaymentMethod, TransactionType } from '@/lib/types'

interface PaymentFormProps {
  propertyId: string
  tenancyId?: string
  amount: number
  transactionType: TransactionType
  description: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

export default function PaymentForm({
  propertyId,
  tenancyId,
  amount,
  transactionType,
  description,
  onSuccess,
  onError
}: PaymentFormProps) {
  const { user } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tinympesa')
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setLoading(true)

    const paymentRequest: PaymentRequest = {
      userId: user.id,
      propertyId,
      tenancyId,
      amount,
      paymentMethod,
      transactionType,
      description,
      phone: paymentMethod === 'tinympesa' ? phone : undefined,
      cardDetails: paymentMethod === 'stripe' ? cardDetails : undefined
    }

    try {
      const result = await PaymentService.processPayment(paymentRequest)
      
      if (result.success) {
        onSuccess?.(result)
      } else {
        onError?.(result.error || result.message)
      }
    } catch (error) {
      onError?.((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`
  }

  const renderMpesaForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          M-Pesa Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="254712345678"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter your M-Pesa registered phone number
        </p>
      </div>
    </div>
  )

  const renderStripeForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardDetails.name}
          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Number
        </label>
        <input
          type="text"
          value={cardDetails.number}
          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
          placeholder="1234 5678 9012 3456"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </label>
          <input
            type="text"
            value={cardDetails.expiry}
            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
            placeholder="MM/YY"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVV
          </label>
          <input
            type="text"
            value={cardDetails.cvv}
            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
            placeholder="123"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
    </div>
  )

  const renderBankTransferForm = () => (
    <div className="bg-blue-50 p-4 rounded-md">
      <h4 className="font-medium text-blue-900 mb-2">Bank Transfer Instructions</h4>
      <div className="text-sm text-blue-800 space-y-1">
        <p><strong>Bank:</strong> Equity Bank</p>
        <p><strong>Account Name:</strong> Nestie Properties Ltd</p>
        <p><strong>Account Number:</strong> 1234567890</p>
        <p><strong>Reference:</strong> {propertyId.slice(0, 8)}</p>
      </div>
      <p className="text-sm text-blue-700 mt-3">
        Please use the reference number above and upload proof of payment after transfer.
      </p>
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payment Details
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-lg">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Description:</span>
            <span className="text-gray-900">{description}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('tinympesa')}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                paymentMethod === 'tinympesa'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">M-Pesa</div>
              <div className="text-sm text-gray-500">Mobile Money</div>
            </button>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe')}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                paymentMethod === 'stripe'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Card</div>
              <div className="text-sm text-gray-500">Visa, Mastercard</div>
            </button>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                paymentMethod === 'bank_transfer'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Bank Transfer</div>
              <div className="text-sm text-gray-500">Manual Transfer</div>
            </button>
          </div>
        </div>

        <div>
          {paymentMethod === 'tinympesa' && renderMpesaForm()}
          {paymentMethod === 'stripe' && renderStripeForm()}
          {paymentMethod === 'bank_transfer' && renderBankTransferForm()}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : paymentMethod === 'tinympesa'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : paymentMethod === 'stripe'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay ${formatCurrency(amount)}`
          )}
        </button>
      </form>

      {paymentMethod === 'tinympesa' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-900 mb-2">M-Pesa Payment Instructions</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>1. You will receive an STK Push notification on your phone</p>
            <p>2. Enter your M-Pesa PIN to authorize the payment</p>
            <p>3. You will receive an SMS confirmation from M-Pesa</p>
            <p>4. Payment will be processed automatically</p>
          </div>
          <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
            <strong>Test Phone:</strong> Use 254792813814 for sandbox testing
          </div>
        </div>
      )}
    </div>
  )
}