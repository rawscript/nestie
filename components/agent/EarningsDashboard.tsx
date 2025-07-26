'use client'

import React, { useState, useEffect } from 'react'
import { AgentPaymentService, type AgentEarning, type PayoutRequest } from '@/lib/agentPayments'
import { useAuth } from '@/lib/useAuth'

export default function EarningsDashboard() {
  const { user } = useAuth()
  const [earnings, setEarnings] = useState<AgentEarning[]>([])
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [summary, setSummary] = useState({
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
    commission_earnings: 0,
    booking_fee_earnings: 0,
    service_fee_earnings: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'earnings' | 'payouts'>('earnings')
  const [showPayoutForm, setShowPayoutForm] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return

    setLoading(true)

    const [earningsResult, payoutsResult, summaryResult] = await Promise.all([
      AgentPaymentService.getAgentEarnings(user.id),
      AgentPaymentService.getPayoutRequests(user.id),
      AgentPaymentService.getEarningsSummary(user.id)
    ])

    if (earningsResult.success && earningsResult.data) {
      setEarnings(earningsResult.data)
    }
    if (payoutsResult.success && payoutsResult.data) {
      setPayoutRequests(payoutsResult.data)
    }
    if (summaryResult.success && summaryResult.data) {
      setSummary(summaryResult.data)
    }

    setLoading(false)
  }

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !payoutAmount) return

    // For now, assume using the first/primary payment account
    // In a real app, you'd let the user select which account to use
    const accountsResult = await AgentPaymentService.getAgentPaymentAccounts(user.id)
    if (!accountsResult.success || !accountsResult.data || accountsResult.data.length === 0) {
      alert('Please add a payment account first')
      return
    }

    const primaryAccount = accountsResult.data.find(acc => acc.is_primary) || accountsResult.data[0]

    const result = await AgentPaymentService.requestPayout(
      user.id,
      primaryAccount.id,
      parseFloat(payoutAmount)
    )

    if (result.success) {
      await loadData()
      setShowPayoutForm(false)
      setPayoutAmount('')
      alert('Payout request submitted successfully!')
    } else {
      alert('Error requesting payout: ' + result.error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'paid': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Total Earnings
        </h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {formatCurrency(summary.total_earnings)}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Pending Earnings
        </h3>
        <p className="mt-2 text-3xl font-bold text-yellow-600">
          {formatCurrency(summary.pending_earnings)}
        </p>
        {summary.pending_earnings > 0 && (
          <button
            onClick={() => setShowPayoutForm(true)}
            className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Request Payout
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Paid Out
        </h3>
        <p className="mt-2 text-3xl font-bold text-green-600">
          {formatCurrency(summary.paid_earnings)}
        </p>
      </div>
    </div>
  )

  const renderPayoutForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Request Payout</h3>

        <form onSubmit={handleRequestPayout}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (KES)
            </label>
            <input
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              max={summary.pending_earnings}
              min="100"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Available: {formatCurrency(summary.pending_earnings)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Request Payout
            </button>
            <button
              type="button"
              onClick={() => setShowPayoutForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const renderEarningsTable = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Earnings</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {earnings.map((earning) => (
              <tr key={earning.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {(earning as any).property?.title || 'Property'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(earning as any).property?.location?.address}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="capitalize text-sm text-gray-900">
                    {earning.earning_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(earning.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(earning.status)}`}>
                    {earning.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(earning.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {earnings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No earnings yet</p>
        </div>
      )}
    </div>
  )

  const renderPayoutsTable = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Payout Requests</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Processed
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payoutRequests.map((payout) => (
              <tr key={payout.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(payout.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(payout as any).payment_account?.account_type?.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payout.requested_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payoutRequests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No payout requests yet</p>
        </div>
      )}
    </div>
  )

  if (loading) {
    return <div className="text-center py-8">Loading earnings data...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h2>

      {renderSummaryCards()}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'earnings'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Earnings History
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'payouts'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Payout Requests
          </button>
        </nav>
      </div>

      {activeTab === 'earnings' ? renderEarningsTable() : renderPayoutsTable()}

      {showPayoutForm && renderPayoutForm()}
    </div>
  )
}