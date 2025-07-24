'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  Users,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  CheckCircle,
  Clock,
  X,
  Eye,
  MessageCircle
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { TransactionService, Transaction, Notification } from '@/lib/transactionService'
import toast from 'react-hot-toast'

export default function AgentDashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [propertiesWithTenancies, setPropertiesWithTenancies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    loadAgentData()
    setupRealtimeSubscriptions()
  }, [user, router])

  const loadAgentData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load pending transactions
      const { data: pendingData } = await TransactionService.getAgentPendingTransactions(user.id)
      if (pendingData) setPendingTransactions(pendingData)

      // Load notifications
      const { data: notificationsData } = await TransactionService.getUserNotifications(user.id)
      if (notificationsData) setNotifications(notificationsData)

      // Load properties with tenancies
      const { data: propertiesData } = await TransactionService.getAgentPropertiesWithTenancies(user.id)
      if (propertiesData) setPropertiesWithTenancies(propertiesData)

    } catch (error) {
      console.error('Error loading agent data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!user) return

    // Subscribe to notifications
    const notificationSub = TransactionService.subscribeToNotifications(user.id, (notification) => {
      setNotifications(prev => [notification, ...prev])
      toast.success(notification.title)
    })

    // Subscribe to transaction updates
    const transactionSub = TransactionService.subscribeToTransactionUpdates(user.id, (transaction) => {
      setPendingTransactions(prev => prev.filter(t => t.id !== transaction.id))
      loadAgentData() // Reload data to get updated counts
    })

    return () => {
      notificationSub.unsubscribe()
      transactionSub.unsubscribe()
    }
  }

  const handleTransactionAction = async (transactionId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await TransactionService.updateTransactionStatus(transactionId, action, user?.id || '')

      if (error) throw error

      toast.success(`Transaction ${action}!`)
      loadAgentData()
    } catch (error) {
      console.error('Transaction action error:', error)
      toast.error(`Failed to ${action.slice(0, -1)} transaction`)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const markNotificationAsRead = async (notificationId: string) => {
    await TransactionService.markNotificationAsRead(notificationId, user?.id || '')
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestie-black"></div>
      </div>
    )
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Header */}
      <header className="bg-nestie-white border-b border-nestie-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-nestie-black rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-nestie-white" />
              </div>
              <span className="text-xl font-display font-bold text-nestie-black">Nestie</span>
              <span className="text-nestie-grey-500">|</span>
              <span className="text-nestie-grey-600">Agent Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('notifications')}
                className="relative p-2 text-nestie-grey-600 hover:text-nestie-black"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-nestie-grey-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-nestie-grey-700">
                    {user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-nestie-grey-700">{user.email}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-nestie-grey-600 hover:text-nestie-black"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-4">
              <ul className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: Home },
                  { id: 'transactions', label: 'Transactions', icon: MessageCircle, badge: pendingTransactions.length },
                  { id: 'properties', label: 'Properties', icon: Users },
                  { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${activeTab === item.id
                        ? 'bg-nestie-black text-nestie-white'
                        : 'text-nestie-grey-600 hover:bg-nestie-grey-50'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-nestie-black mb-2">Agent Dashboard</h1>
                  <p className="text-nestie-grey-600">Manage your properties and tenant requests.</p>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-nestie-grey-500">Pending Requests</p>
                        <p className="text-2xl font-bold text-nestie-black">{pendingTransactions.length}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>

                  <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-nestie-grey-500">Active Properties</p>
                        <p className="text-2xl font-bold text-nestie-black">{propertiesWithTenancies.length}</p>
                      </div>
                      <Home className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-nestie-grey-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-nestie-black">
                          KSh {propertiesWithTenancies.reduce((sum, p) => sum + (p.monthly_rent || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Pending Transactions */}
                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                  <h2 className="text-lg font-semibold text-nestie-black mb-4">Pending Requests</h2>
                  <div className="space-y-4">
                    {pendingTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border border-nestie-grey-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-nestie-black">
                            {transaction.transaction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <p className="text-sm text-nestie-grey-600">{transaction.description}</p>
                          <p className="text-xs text-nestie-grey-500">
                            Property: {transaction.property_id} • {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTransactionAction(transaction.id, 'approved')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleTransactionAction(transaction.id, 'rejected')}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingTransactions.length === 0 && (
                      <p className="text-nestie-grey-500 text-center py-4">No pending requests</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-nestie-black mb-2">Transaction Requests</h1>
                  <p className="text-nestie-grey-600">Review and approve tenant requests.</p>
                </div>

                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                  <div className="space-y-4">
                    {pendingTransactions.map((transaction) => (
                      <div key={transaction.id} className="border border-nestie-grey-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-nestie-black mb-2">
                              {transaction.transaction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <p className="text-nestie-grey-600 mb-2">{transaction.description}</p>
                            {transaction.amount && (
                              <p className="font-medium text-nestie-black">Amount: KSh {transaction.amount.toLocaleString()}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-nestie-grey-500 mt-2">
                              <span>Property: {transaction.property_id}</span>
                              <span>•</span>
                              <span>Submitted: {new Date(transaction.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            {transaction.status}
                          </span>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleTransactionAction(transaction.id, 'approved')}
                            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleTransactionAction(transaction.id, 'rejected')}
                            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingTransactions.length === 0 && (
                      <p className="text-nestie-grey-500 text-center py-8">No pending transactions</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-nestie-black mb-2">Properties</h1>
                  <p className="text-nestie-grey-600">Manage your property portfolio and tenancies.</p>
                </div>

                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                  <div className="space-y-4">
                    {propertiesWithTenancies.map((property, index) => (
                      <div key={index} className="border border-nestie-grey-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-nestie-black">Property #{property.property_id}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.tenancy_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-grey-100 text-grey-800'
                            }`}>
                            {property.tenancy_status || 'Available'}
                          </span>
                        </div>

                        {property.tenant_email && (
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-nestie-grey-500">Tenant</p>
                              <p className="font-medium text-nestie-black">{property.tenant_email}</p>
                            </div>
                            <div>
                              <p className="text-nestie-grey-500">Monthly Rent</p>
                              <p className="font-medium text-nestie-black">KSh {property.monthly_rent?.toLocaleString()}</p>
                            </div>
                          </div>
                        )}

                        {property.pending_transactions > 0 && (
                          <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-800">
                              {property.pending_transactions} pending transaction(s) require your attention
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {propertiesWithTenancies.length === 0 && (
                      <p className="text-nestie-grey-500 text-center py-8">No properties found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-nestie-black mb-2">Notifications</h1>
                  <p className="text-nestie-grey-600">Stay updated with tenant activities and requests.</p>
                </div>

                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${notification.read ? 'border-nestie-grey-200 bg-white' : 'border-blue-200 bg-blue-50'
                          }`}
                        onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-nestie-black">{notification.title}</h3>
                            <p className="text-nestie-grey-600 mt-1">{notification.message}</p>
                            <p className="text-sm text-nestie-grey-500 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-nestie-grey-500 text-center py-8">No notifications</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings placeholder */}
            {activeTab === 'settings' && (
              <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                <h2 className="text-lg font-semibold text-nestie-black mb-4">Settings</h2>
                <p className="text-nestie-grey-600">Settings panel coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}