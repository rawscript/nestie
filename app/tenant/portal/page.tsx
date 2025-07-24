'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Home,
    CreditCard,
    FileText,
    Bell,
    Settings,
    LogOut,
    Calendar,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Clock,
    X,
    Send,
    Smartphone,
    User,
    Mail,
    Phone,
    Shield,
    Eye,
    EyeOff,
    Save
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { TransactionService, Transaction, PropertyTenancy, Notification } from '@/lib/transactionService'
import toast from 'react-hot-toast'

export default function TenantPortal() {
    const { user, signOut } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('overview')
    const [tenancies, setTenancies] = useState<PropertyTenancy[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showTerminationModal, setShowTerminationModal] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('tinympesa')
    const [terminationReason, setTerminationReason] = useState('')
    const [mpesaPhone, setMpesaPhone] = useState('')
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    })
    const [processingPayment, setProcessingPayment] = useState(false)

    // Settings state
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: user?.email || '',
        phone: '',
        emergencyContact: '',
        emergencyPhone: ''
    })
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: false,
        paymentReminders: true,
        maintenanceUpdates: true
    })
    const [showPasswordChange, setShowPasswordChange] = useState(false)
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    })

    useEffect(() => {
        if (!user) {
            router.push('/auth/login')
            return
        }

        loadUserData()
        setupRealtimeSubscriptions()
    }, [user, router])

    const loadUserData = async () => {
        if (!user) return

        try {
            setLoading(true)

            // Load tenancies
            const { data: tenanciesData } = await TransactionService.getUserTenancies(user.id)
            if (tenanciesData) setTenancies(tenanciesData)

            // Load transactions
            const { data: transactionsData } = await TransactionService.getUserTransactions(user.id)
            if (transactionsData) setTransactions(transactionsData)

            // Load notifications
            const { data: notificationsData } = await TransactionService.getUserNotifications(user.id)
            if (notificationsData) setNotifications(notificationsData)

        } catch (error) {
            console.error('Error loading user data:', error)
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
            setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t))

            if (transaction.status === 'approved') {
                toast.success('Transaction approved!')
            } else if (transaction.status === 'rejected') {
                toast.error('Transaction rejected')
            }
        })

        return () => {
            notificationSub.unsubscribe()
            transactionSub.unsubscribe()
        }
    }

    const handleMakePayment = async () => {
        if (!user || !tenancies[0] || !paymentAmount) return

        // Validate payment method specific requirements
        if (paymentMethod === 'tinympesa' && !mpesaPhone) {
            toast.error('Please enter your M-Pesa phone number')
            return
        }

        if (paymentMethod === 'stripe' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name)) {
            toast.error('Please fill in all card details')
            return
        }

        try {
            setProcessingPayment(true)
            const amount = parseFloat(paymentAmount)

            if (paymentMethod === 'tinympesa') {
                // TinyMpesa integration
                await processTinyMpesaPayment(amount, mpesaPhone)
            } else if (paymentMethod === 'stripe') {
                // Stripe integration
                await processStripePayment(amount, cardDetails)
            }

            const { data, error } = await TransactionService.makeRentPayment(
                tenancies[0].id,
                user.id,
                amount,
                paymentMethod,
                `PAY-${Date.now()}`
            )

            if (error) throw error

            toast.success('Payment processed successfully!')
            setShowPaymentModal(false)
            setPaymentAmount('')
            setMpesaPhone('')
            setCardDetails({ number: '', expiry: '', cvv: '', name: '' })
            loadUserData()
        } catch (error) {
            console.error('Payment error:', error)
            toast.error('Payment failed. Please try again.')
        } finally {
            setProcessingPayment(false)
        }
    }

    const processTinyMpesaPayment = async (amount: number, phone: string) => {
        // TinyMpesa API integration
        const response = await fetch('/api/payments/tinympesa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                phone,
                reference: `RENT-${tenancies[0].id}-${Date.now()}`,
                description: `Rent payment for Property #${tenancies[0].property_id}`
            })
        })

        if (!response.ok) {
            throw new Error('TinyMpesa payment failed')
        }

        return response.json()
    }

    const processStripePayment = async (amount: number, card: typeof cardDetails) => {
        // Stripe API integration
        const response = await fetch('/api/payments/stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount * 100, // Convert to cents
                currency: 'kes',
                card,
                description: `Rent payment for Property #${tenancies[0].property_id}`
            })
        })

        if (!response.ok) {
            throw new Error('Stripe payment failed')
        }

        return response.json()
    }

    const handleUpdateProfile = async () => {
        try {
            // Update profile logic here
            toast.success('Profile updated successfully!')
        } catch (error) {
            toast.error('Failed to update profile')
        }
    }

    const handleUpdateNotificationSettings = async () => {
        try {
            // Update notification settings logic here
            toast.success('Notification settings updated!')
        } catch (error) {
            toast.error('Failed to update settings')
        }
    }

    const handlePasswordChange = async () => {
        if (passwordData.new !== passwordData.confirm) {
            toast.error('New passwords do not match')
            return
        }

        try {
            // Password change logic here
            toast.success('Password changed successfully!')
            setShowPasswordChange(false)
            setPasswordData({ current: '', new: '', confirm: '' })
        } catch (error) {
            toast.error('Failed to change password')
        }
    }

    const handleTerminateRent = async () => {
        if (!user || !tenancies[0]) return

        try {
            const { data, error } = await TransactionService.terminateRent(
                tenancies[0].id,
                user.id,
                terminationReason
            )

            if (error) throw error

            toast.success('Termination request submitted. Awaiting agent approval.')
            setShowTerminationModal(false)
            setTerminationReason('')
            loadUserData()
        } catch (error) {
            console.error('Termination error:', error)
            toast.error('Failed to submit termination request')
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

    const activeTenancy = tenancies[0]
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
                            <span className="text-nestie-grey-600">Tenant Portal</span>
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
                                    { id: 'payments', label: 'Payments', icon: CreditCard },
                                    { id: 'transactions', label: 'Transactions', icon: FileText },
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
                                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Welcome back!</h1>
                                    <p className="text-nestie-grey-600">Here's what's happening with your rental.</p>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-nestie-grey-500">Next Payment Due</p>
                                                <p className="text-2xl font-bold text-nestie-black">
                                                    {activeTenancy ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                            <Calendar className="h-8 w-8 text-blue-500" />
                                        </div>
                                    </div>

                                    <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-nestie-grey-500">Monthly Rent</p>
                                                <p className="text-2xl font-bold text-nestie-black">
                                                    KSh {activeTenancy?.monthly_rent?.toLocaleString() || '0'}
                                                </p>
                                            </div>
                                            <DollarSign className="h-8 w-8 text-green-500" />
                                        </div>
                                    </div>

                                    <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-nestie-grey-500">Lease Status</p>
                                                <p className={`text-2xl font-bold ${activeTenancy?.status === 'active' ? 'text-green-600' : 'text-orange-600'
                                                    }`}>
                                                    {activeTenancy?.status?.charAt(0).toUpperCase() + activeTenancy?.status?.slice(1) || 'None'}
                                                </p>
                                            </div>
                                            <CheckCircle className="h-8 w-8 text-green-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Current Property */}
                                {activeTenancy && (
                                    <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                        <h2 className="text-lg font-semibold text-nestie-black mb-4">Current Property</h2>
                                        <div className="flex items-start space-x-4">
                                            <div className="w-24 h-24 bg-nestie-grey-200 rounded-lg flex items-center justify-center">
                                                <Home className="h-8 w-8 text-nestie-grey-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-nestie-black">Property #{activeTenancy.property_id}</h3>
                                                <p className="text-nestie-grey-600">Rental Property</p>
                                                <p className="text-sm text-nestie-grey-500 mt-2">
                                                    Lease: {new Date(activeTenancy.start_date).toLocaleDateString()} - {
                                                        activeTenancy.end_date ? new Date(activeTenancy.end_date).toLocaleDateString() : 'Ongoing'
                                                    }
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-nestie-black">KSh {activeTenancy.monthly_rent.toLocaleString()}</p>
                                                <p className="text-sm text-nestie-grey-500">per month</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <h2 className="text-lg font-semibold text-nestie-black mb-4">Quick Actions</h2>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setShowPaymentModal(true)}
                                            disabled={!activeTenancy}
                                            className="flex items-center space-x-3 p-4 border border-nestie-grey-200 rounded-lg hover:bg-nestie-grey-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CreditCard className="h-6 w-6 text-blue-500" />
                                            <div className="text-left">
                                                <p className="font-medium text-nestie-black">Make Payment</p>
                                                <p className="text-sm text-nestie-grey-500">Pay your monthly rent</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setShowTerminationModal(true)}
                                            disabled={!activeTenancy}
                                            className="flex items-center space-x-3 p-4 border border-nestie-grey-200 rounded-lg hover:bg-nestie-grey-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <AlertTriangle className="h-6 w-6 text-orange-500" />
                                            <div className="text-left">
                                                <p className="font-medium text-nestie-black">Terminate Lease</p>
                                                <p className="text-sm text-nestie-grey-500">Request lease termination</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Transactions */}
                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <h2 className="text-lg font-semibold text-nestie-black mb-4">Recent Activity</h2>
                                    <div className="space-y-4">
                                        {transactions.slice(0, 5).map((transaction) => (
                                            <div key={transaction.id} className="flex items-start space-x-3 p-3 bg-nestie-grey-50 rounded-lg">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${transaction.status === 'completed' ? 'bg-green-500' :
                                                    transaction.status === 'approved' ? 'bg-blue-500' :
                                                        transaction.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                                                    }`} />
                                                <div className="flex-1">
                                                    <p className="font-medium text-nestie-black">
                                                        {transaction.transaction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </p>
                                                    <p className="text-sm text-nestie-grey-600">{transaction.description}</p>
                                                    <p className="text-xs text-nestie-grey-500 mt-1">
                                                        {new Date(transaction.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    transaction.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                        transaction.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {transaction.status}
                                                </span>
                                            </div>
                                        ))}
                                        {transactions.length === 0 && (
                                            <p className="text-nestie-grey-500 text-center py-4">No recent activity</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'transactions' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Transactions</h1>
                                    <p className="text-nestie-grey-600">View all your transaction history and status updates.</p>
                                </div>

                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <div className="space-y-4">
                                        {transactions.map((transaction) => (
                                            <div key={transaction.id} className="border border-nestie-grey-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-nestie-black">
                                                        {transaction.transaction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        transaction.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                            transaction.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-orange-100 text-orange-800'
                                                        }`}>
                                                        {transaction.status}
                                                    </span>
                                                </div>
                                                <p className="text-nestie-grey-600 mb-2">{transaction.description}</p>
                                                {transaction.amount && (
                                                    <p className="font-medium text-nestie-black">Amount: KSh {transaction.amount.toLocaleString()}</p>
                                                )}
                                                <p className="text-sm text-nestie-grey-500">
                                                    Created: {new Date(transaction.created_at).toLocaleString()}
                                                </p>
                                                {transaction.authorized_at && (
                                                    <p className="text-sm text-nestie-grey-500">
                                                        Authorized: {new Date(transaction.authorized_at).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                        {transactions.length === 0 && (
                                            <p className="text-nestie-grey-500 text-center py-8">No transactions found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Notifications</h1>
                                    <p className="text-nestie-grey-600">Stay updated with your rental activities.</p>
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

                        {activeTab === 'payments' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Payments</h1>
                                    <p className="text-nestie-grey-600">Manage your rent payments and payment methods.</p>
                                </div>

                                {/* Payment Due Alert */}
                                {activeTenancy && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-blue-900">Next Payment Due</h3>
                                                <p className="text-blue-700">
                                                    KSh {activeTenancy.monthly_rent.toLocaleString()} due on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowPaymentModal(true)}
                                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Pay Now
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Payment History */}
                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <h2 className="text-lg font-semibold text-nestie-black mb-4">Payment History</h2>
                                    <div className="space-y-4">
                                        {transactions.filter(t => t.transaction_type === 'rent_payment').map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between p-4 border border-nestie-grey-200 rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-3 h-3 rounded-full ${payment.status === 'completed' ? 'bg-green-500' :
                                                        payment.status === 'approved' ? 'bg-blue-500' :
                                                            payment.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                                                        }`} />
                                                    <div>
                                                        <p className="font-medium text-nestie-black">
                                                            KSh {payment.amount?.toLocaleString()}
                                                        </p>
                                                        <p className="text-sm text-nestie-grey-500">
                                                            {new Date(payment.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    payment.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                        payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                        ))}
                                        {transactions.filter(t => t.transaction_type === 'rent_payment').length === 0 && (
                                            <p className="text-nestie-grey-500 text-center py-8">No payment history</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Settings</h1>
                                    <p className="text-nestie-grey-600">Manage your account and preferences.</p>
                                </div>

                                {/* Profile Settings */}
                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <h2 className="text-lg font-semibold text-nestie-black mb-4 flex items-center">
                                        <User className="h-5 w-5 mr-2" />
                                        Profile Information
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                                className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg bg-nestie-grey-50 text-nestie-grey-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                Emergency Contact
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.emergencyContact}
                                                onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                                                className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                Emergency Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={profileData.emergencyPhone}
                                                onChange={(e) => setProfileData({ ...profileData, emergencyPhone: e.target.value })}
                                                className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleUpdateProfile}
                                        className="mt-4 bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Profile
                                    </button>
                                </div>

                                {/* Notification Settings */}
                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <h2 className="text-lg font-semibold text-nestie-black mb-4 flex items-center">
                                        <Bell className="h-5 w-5 mr-2" />
                                        Notification Preferences
                                    </h2>
                                    <div className="space-y-4">
                                        {Object.entries(notificationSettings).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-nestie-black">
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                    </p>
                                                    <p className="text-sm text-nestie-grey-500">
                                                        {key === 'emailNotifications' && 'Receive notifications via email'}
                                                        {key === 'smsNotifications' && 'Receive SMS notifications'}
                                                        {key === 'pushNotifications' && 'Receive push notifications'}
                                                        {key === 'paymentReminders' && 'Get reminders for upcoming payments'}
                                                        {key === 'maintenanceUpdates' && 'Updates about property maintenance'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setNotificationSettings({
                                                        ...notificationSettings,
                                                        [key]: !value
                                                    })}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-nestie-black' : 'bg-nestie-grey-300'
                                                        }`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleUpdateNotificationSettings}
                                        className="mt-4 bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Preferences
                                    </button>
                                </div>

                                {/* Security Settings */}
                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <h2 className="text-lg font-semibold text-nestie-black mb-4 flex items-center">
                                        <Shield className="h-5 w-5 mr-2" />
                                        Security
                                    </h2>
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                                            className="flex items-center justify-between w-full p-4 border border-nestie-grey-200 rounded-lg hover:bg-nestie-grey-50"
                                        >
                                            <div className="text-left">
                                                <p className="font-medium text-nestie-black">Change Password</p>
                                                <p className="text-sm text-nestie-grey-500">Update your account password</p>
                                            </div>
                                            {showPasswordChange ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>

                                        {showPasswordChange && (
                                            <div className="space-y-4 p-4 bg-nestie-grey-50 rounded-lg">
                                                <div>
                                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                        Current Password
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.current}
                                                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                        New Password
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.new}
                                                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                        Confirm New Password
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.confirm}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                        className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handlePasswordChange}
                                                    className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800"
                                                >
                                                    Update Password
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-nestie-black">Make Payment</h2>
                            <button onClick={() => setShowPaymentModal(false)}>
                                <X className="h-5 w-5 text-nestie-grey-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                    Payment Amount (KSh)
                                </label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder={activeTenancy?.monthly_rent?.toString() || '0'}
                                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('tinympesa')}
                                        className={`flex items-center justify-center p-3 border-2 rounded-lg transition-colors ${paymentMethod === 'tinympesa'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-nestie-grey-300 hover:border-nestie-grey-400'
                                            }`}
                                    >
                                        <Smartphone className="h-5 w-5 mr-2" />
                                        <span className="font-medium">M-Pesa</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('stripe')}
                                        className={`flex items-center justify-center p-3 border-2 rounded-lg transition-colors ${paymentMethod === 'stripe'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-nestie-grey-300 hover:border-nestie-grey-400'
                                            }`}
                                    >
                                        <CreditCard className="h-5 w-5 mr-2" />
                                        <span className="font-medium">Card</span>
                                    </button>
                                </div>
                            </div>

                            {/* M-Pesa Payment Form */}
                            {paymentMethod === 'tinympesa' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center mb-3">
                                        <Smartphone className="h-5 w-5 text-green-600 mr-2" />
                                        <h3 className="font-medium text-green-800">M-Pesa Payment</h3>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-green-700 mb-2">
                                            M-Pesa Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={mpesaPhone}
                                            onChange={(e) => setMpesaPhone(e.target.value)}
                                            placeholder="254712345678"
                                            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-green-600 mt-1">
                                            You will receive an M-Pesa prompt on this number
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Stripe Payment Form */}
                            {paymentMethod === 'stripe' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center mb-3">
                                        <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-medium text-blue-800">Credit/Debit Card</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-blue-700 mb-1">
                                                Cardholder Name
                                            </label>
                                            <input
                                                type="text"
                                                value={cardDetails.name}
                                                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
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
                                                value={cardDetails.number}
                                                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
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
                                                    value={cardDetails.expiry}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
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
                                                    value={cardDetails.cvv}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
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
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-nestie-grey-300 text-nestie-grey-700 rounded-lg hover:bg-nestie-grey-50"
                                    disabled={processingPayment}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMakePayment}
                                    disabled={!paymentAmount || processingPayment}
                                    className="flex-1 px-4 py-2 bg-nestie-black text-white rounded-lg hover:bg-nestie-grey-800 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {processingPayment ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        'Pay Now'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Termination Modal */}
            {showTerminationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-nestie-black">Terminate Lease</h2>
                            <button onClick={() => setShowTerminationModal(false)}>
                                <X className="h-5 w-5 text-nestie-grey-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <p className="text-orange-800 text-sm">
                                    This will send a termination request to your agent. The request requires agent approval before your lease can be terminated.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                    Reason for Termination (Optional)
                                </label>
                                <textarea
                                    value={terminationReason}
                                    onChange={(e) => setTerminationReason(e.target.value)}
                                    placeholder="Please provide a reason for lease termination..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setShowTerminationModal(false)}
                                    className="flex-1 px-4 py-2 border border-nestie-grey-300 text-nestie-grey-700 rounded-lg hover:bg-nestie-grey-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTerminateRent}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}