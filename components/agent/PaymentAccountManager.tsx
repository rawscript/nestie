'use client'

import React, { useState, useEffect } from 'react'
import { AgentPaymentService, type AgentPaymentAccount } from '@/lib/agentPayments'
import { useAuth } from '@/lib/useAuth'

interface PaymentAccountFormData {
  account_type: 'bank' | 'mobile_money' | 'paypal'
  account_details: {
    bank_name?: string
    account_number?: string
    account_name?: string
    phone_number?: string
    paypal_email?: string
    routing_number?: string
    swift_code?: string
  }
  is_primary: boolean
}

export default function PaymentAccountManager() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<AgentPaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<PaymentAccountFormData>({
    account_type: 'mobile_money',
    account_details: {},
    is_primary: false
  })

  useEffect(() => {
    if (user?.id) {
      loadPaymentAccounts()
    }
  }, [user?.id])

  const loadPaymentAccounts = async () => {
    if (!user?.id) return

    setLoading(true)
    const result = await AgentPaymentService.getAgentPaymentAccounts(user.id)

    if (result.success && result.data) {
      setAccounts(result.data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    const result = await AgentPaymentService.addPaymentAccount(user.id, {
      ...formData,
      is_verified: false // New accounts start as unverified
    })

    if (result.success) {
      await loadPaymentAccounts()
      setShowForm(false)
      setFormData({
        account_type: 'mobile_money',
        account_details: {},
        is_primary: false
      })
    } else {
      alert('Error adding payment account: ' + result.error)
    }
  }

  const renderAccountForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Add Payment Account</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type
          </label>
          <select
            value={formData.account_type}
            onChange={(e) => setFormData({
              ...formData,
              account_type: e.target.value as 'bank' | 'mobile_money' | 'paypal',
              account_details: {} // Reset details when type changes
            })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="mobile_money">Mobile Money (M-Pesa)</option>
            <option value="bank">Bank Account</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>

        {formData.account_type === 'mobile_money' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.account_details.phone_number || ''}
              onChange={(e) => setFormData({
                ...formData,
                account_details: { ...formData.account_details, phone_number: e.target.value }
              })}
              placeholder="254712345678"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {formData.account_type === 'bank' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.account_details.bank_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, bank_name: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={formData.account_details.account_number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, account_number: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.account_details.account_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  account_details: { ...formData.account_details, account_name: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </>
        )}

        {formData.account_type === 'paypal' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PayPal Email
            </label>
            <input
              type="email"
              value={formData.account_details.paypal_email || ''}
              onChange={(e) => setFormData({
                ...formData,
                account_details: { ...formData.account_details, paypal_email: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_primary"
            checked={formData.is_primary}
            onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="is_primary" className="text-sm text-gray-700">
            Set as primary account
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Account
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )

  const renderAccountCard = (account: AgentPaymentAccount) => (
    <div key={account.id} className="bg-white p-4 rounded-lg shadow-md border">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900 capitalize">
            {account.account_type.replace('_', ' ')} Account
          </h4>
          {account.is_primary && (
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Primary
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {account.is_verified ? (
            <span className="text-green-600 text-sm">✓ Verified</span>
          ) : (
            <span className="text-yellow-600 text-sm">⚠ Pending Verification</span>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {account.account_type === 'mobile_money' && (
          <p>Phone: {account.account_details.phone_number}</p>
        )}
        {account.account_type === 'bank' && (
          <>
            <p>Bank: {account.account_details.bank_name}</p>
            <p>Account: ****{account.account_details.account_number?.slice(-4)}</p>
            <p>Name: {account.account_details.account_name}</p>
          </>
        )}
        {account.account_type === 'paypal' && (
          <p>Email: {account.account_details.paypal_email}</p>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Added: {new Date(account.created_at).toLocaleDateString()}
      </div>
    </div>
  )

  if (loading) {
    return <div className="text-center py-8">Loading payment accounts...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Accounts</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Account
        </button>
      </div>

      {showForm && renderAccountForm()}

      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map(renderAccountCard)}
      </div>

      {accounts.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No payment accounts added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Add Your First Account
          </button>
        </div>
      )}
    </div>
  )
}