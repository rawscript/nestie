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
  MessageCircle,
  Plus,
  Building,
  MapPin,
  Camera,
  Upload,
  Edit,
  Trash2,
  Star,
  Bed,
  Bath,
  Car,
  Wifi,
  Waves,
  Shield,
  Phone,
  Mail,
  Save,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { TransactionService, Transaction, Notification } from '@/lib/transactionService'
import toast from 'react-hot-toast'
import { useSessionState } from '@/lib/sessionStateManager'
import { TabStateIndicator } from '@/components/TabStateIndicator'

export default function AgentDashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [propertiesWithTenancies, setPropertiesWithTenancies] = useState<any[]>([])
  const [allProperties, setAllProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Use state management hooks
  const { isTabActive, restoreState, saveCurrentState } = useSessionState('agent-dashboard')

  // Property management state
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [showPropertyDetailsModal, setShowPropertyDetailsModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [propertyViewMode, setPropertyViewMode] = useState<'grid' | 'list'>('grid')
  const [propertyFilter, setPropertyFilter] = useState('all') // all, available, occupied, for_sale
  const [searchQuery, setSearchQuery] = useState('')

  // New property form state
  const [newProperty, setNewProperty] = useState({
    title: '',
    description: '',
    type: 'apartment', // apartment, house, commercial
    listingType: 'rent', // rent, sale, lease
    price: '',
    location: {
      address: '',
      city: '',
      county: '',
      coordinates: { lat: 0, lng: 0 }
    },
    specifications: {
      bedrooms: 1,
      bathrooms: 1,
      area: '',
      parking: false,
      furnished: false,
      petFriendly: false
    },
    amenities: {
      wifi: false,
      pool: false,
      gym: false,
      security: false,
      garden: false,
      balcony: false,
      aircon: false,
      heating: false
    },
    images: [] as string[],
    contactInfo: {
      phone: '',
      email: user?.email || '',
      whatsapp: ''
    },
    terms: {
      deposit: '',
      leasePeriod: '12', // months
      paymentMethod: 'monthly',
      utilities: 'excluded' // included, excluded, partial
    }
  })

  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    loadAgentData()
    setupRealtimeSubscriptions()
    
    // Restore state after data loads
    const timer = setTimeout(() => {
      restoreState()
    }, 500)

    return () => clearTimeout(timer)
  }, [user, router, restoreState])

  // Save state when important data changes
  useEffect(() => {
    if (activeTab || searchQuery || propertyFilter) {
      saveCurrentState()
    }
  }, [activeTab, searchQuery, propertyFilter, saveCurrentState])

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

  // Handle booking approval/rejection
  const handleBookingAction = async (bookingId: string, action: 'approved' | 'rejected') => {
    if (!user) return

    try {
      // Update booking status
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })

      if (!response.ok) throw new Error('Failed to update booking')

      const { data: booking } = await response.json()

      if (action === 'approved') {
        // Update property status to occupied
        await fetch(`/api/properties/${booking.property_id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'occupied' })
        })

        // Update agent earnings to available
        await fetch(`/api/agent/earnings?booking_id=${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'available' })
        })

        // Create tenancy record
        await fetch('/api/tenancies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_id: booking.property_id,
            tenant_id: booking.tenant_id,
            agent_id: booking.agent_id,
            monthly_rent: booking.property?.price || 0,
            start_date: booking.booking_details?.moveInDate || new Date().toISOString(),
            lease_period: booking.booking_details?.leasePeriod || 12,
            status: 'active'
          })
        })

        toast.success('Booking approved! Property is now occupied and earnings are available.')
      } else {
        // Update property status back to available
        await fetch(`/api/properties/${booking.property_id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'available' })
        })

        // Update agent earnings to rejected (no payment)
        await fetch(`/api/agent/earnings?booking_id=${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' })
        })

        toast.success('Booking rejected. Property is available again.')
      }

      // Send notification to tenant
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: booking.tenant_id,
          title: `Booking ${action}`,
          message: `Your booking for "${booking.property?.title}" has been ${action} by the agent.`,
          type: 'booking_response'
        })
      })

      loadAgentData()
    } catch (error) {
      console.error('Booking action error:', error)
      toast.error(`Failed to ${action.slice(0, -1)} booking`)
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

  // Property management functions
  const handleAddProperty = async () => {
    try {
      // Validate user and required fields
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      if (!newProperty.title || !newProperty.price || !newProperty.location.address) {
        toast.error('Please fill in all required fields')
        return
      }

      // Create property listing
      const propertyData = {
        ...newProperty,
        agent_id: user.id,
        status: 'available',
        created_at: new Date().toISOString()
      }

      // API call to create property
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData)
      })

      if (!response.ok) throw new Error('Failed to create property')

      toast.success('Property listed successfully!')
      setShowAddPropertyModal(false)
      resetPropertyForm()
      loadAgentData()
    } catch (error) {
      console.error('Error adding property:', error)
      toast.error('Failed to add property')
    }
  }

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Upload failed')
        const { url } = await response.json()
        return url
      })

      const imageUrls = await Promise.all(uploadPromises)
      setNewProperty(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }))

      toast.success('Images uploaded successfully!')
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setNewProperty(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const resetPropertyForm = () => {
    setNewProperty({
      title: '',
      description: '',
      type: 'apartment',
      listingType: 'rent',
      price: '',
      location: {
        address: '',
        city: '',
        county: '',
        coordinates: { lat: 0, lng: 0 }
      },
      specifications: {
        bedrooms: 1,
        bathrooms: 1,
        area: '',
        parking: false,
        furnished: false,
        petFriendly: false
      },
      amenities: {
        wifi: false,
        pool: false,
        gym: false,
        security: false,
        garden: false,
        balcony: false,
        aircon: false,
        heating: false
      },
      images: [],
      contactInfo: {
        phone: '',
        email: user?.email || '',
        whatsapp: ''
      },
      terms: {
        deposit: '',
        leasePeriod: '12',
        paymentMethod: 'monthly',
        utilities: 'excluded'
      }
    })
  }

  const handlePropertyAction = async (propertyId: string, action: 'edit' | 'delete' | 'view') => {
    if (action === 'delete') {
      if (confirm('Are you sure you want to delete this property?')) {
        try {
          const response = await fetch(`/api/properties/${propertyId}`, {
            method: 'DELETE'
          })
          if (!response.ok) throw new Error('Failed to delete property')
          toast.success('Property deleted successfully!')
          loadAgentData()
        } catch (error) {
          toast.error('Failed to delete property')
        }
      }
    } else if (action === 'view') {
      const property = allProperties.find(p => p.id === propertyId)
      setSelectedProperty(property)
      setShowPropertyDetailsModal(true)
    }
  }

  const filteredProperties = allProperties.filter(property => {
    const matchesFilter = propertyFilter === 'all' ||
      (propertyFilter === 'available' && property.status === 'available') ||
      (propertyFilter === 'occupied' && property.status === 'occupied') ||
      (propertyFilter === 'for_sale' && property.listingType === 'sale')

    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.address.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

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
      <TabStateIndicator showIndicator={process.env.NODE_ENV === 'development'} />
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
                  { id: 'listings', label: 'Listings', icon: Building },
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
                            {transaction.tenancy_id ? `Tenancy: ${transaction.tenancy_id.slice(0, 8)}...` : 'Direct Payment'} • {new Date(transaction.created_at).toLocaleDateString()}
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

            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Property Listings</h1>
                    <p className="text-nestie-grey-600">Manage your property listings and availability.</p>
                  </div>
                  <button
                    onClick={() => setShowAddPropertyModal(true)}
                    className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-nestie-grey-400" />
                      <input
                        type="text"
                        name="searchQuery"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                      />
                    </div>
                    <select
                      name="propertyFilter"
                      value={propertyFilter}
                      onChange={(e) => setPropertyFilter(e.target.value)}
                      className="px-4 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    >
                      <option value="all">All Properties</option>
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="for_sale">For Sale</option>
                    </select>
                    <div className="flex border border-nestie-grey-300 rounded-lg">
                      <button
                        onClick={() => setPropertyViewMode('grid')}
                        className={`p-2 ${propertyViewMode === 'grid' ? 'bg-nestie-black text-white' : 'text-nestie-grey-600'}`}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPropertyViewMode('list')}
                        className={`p-2 ${propertyViewMode === 'list' ? 'bg-nestie-black text-white' : 'text-nestie-grey-600'}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Properties Grid/List */}
                <div className={propertyViewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="bg-nestie-white rounded-xl border border-nestie-grey-200 overflow-hidden">
                      {/* Property Image */}
                      <div className="relative h-48 bg-nestie-grey-200">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-12 w-12 text-nestie-grey-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.status === 'available' ? 'bg-green-100 text-green-800' :
                            property.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                            {property.status}
                          </span>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-nestie-black text-lg">{property.title}</h3>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handlePropertyAction(property.id, 'view')}
                              className="p-1 text-nestie-grey-600 hover:text-nestie-black"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePropertyAction(property.id, 'edit')}
                              className="p-1 text-nestie-grey-600 hover:text-nestie-black"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePropertyAction(property.id, 'delete')}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center text-nestie-grey-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{property.location?.address}</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-nestie-grey-600 mb-3">
                          <div className="flex items-center">
                            <Bed className="h-4 w-4 mr-1" />
                            <span>{property.specifications?.bedrooms} bed</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-4 w-4 mr-1" />
                            <span>{property.specifications?.bathrooms} bath</span>
                          </div>
                          {property.specifications?.area && (
                            <span>{property.specifications.area} sqft</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-nestie-black">
                              KSh {parseInt(property.price).toLocaleString()}
                            </span>
                            <span className="text-nestie-grey-500 text-sm">
                              /{property.listingType === 'rent' ? 'month' : property.listingType}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.listingType === 'rent' ? 'bg-blue-100 text-blue-800' :
                            property.listingType === 'sale' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                            For {property.listingType}
                          </span>
                        </div>

                        {/* Amenities Icons */}
                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-nestie-grey-200">
                          {property.amenities?.wifi && <Wifi className="h-4 w-4 text-nestie-grey-600" />}
                          {property.amenities?.pool && <Waves className="h-4 w-4 text-blue-500" />}
                          {property.specifications?.parking && <Car className="h-4 w-4 text-nestie-grey-600" />}
                          {property.amenities?.security && <Shield className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredProperties.length === 0 && (
                  <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-12 text-center">
                    <Building className="h-12 w-12 text-nestie-grey-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-nestie-black mb-2">No properties found</h3>
                    <p className="text-nestie-grey-600 mb-4">Start by adding your first property listing.</p>
                    <button
                      onClick={() => setShowAddPropertyModal(true)}
                      className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800"
                    >
                      Add Property
                    </button>
                  </div>
                )}
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

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-nestie-grey-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-nestie-black">Add New Property</h2>
                <button onClick={() => setShowAddPropertyModal(false)}>
                  <X className="h-6 w-6 text-nestie-grey-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-nestie-black mb-4">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      value={newProperty.title}
                      onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                      placeholder="Modern 2BR Apartment in Westlands"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Property Type
                    </label>
                    <select
                      value={newProperty.type}
                      onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="commercial">Commercial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Listing Type
                    </label>
                    <select
                      value={newProperty.listingType}
                      onChange={(e) => setNewProperty({ ...newProperty, listingType: e.target.value })}
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    >
                      <option value="rent">For Rent</option>
                      <option value="sale">For Sale</option>
                      <option value="lease">For Lease</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Price (KSh) *
                    </label>
                    <input
                      type="number"
                      value={newProperty.price}
                      onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                      placeholder="50000"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProperty.description}
                    onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                    placeholder="Describe your property..."
                    rows={4}
                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-nestie-black mb-4">Location</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={newProperty.location.address}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        location: { ...newProperty.location, address: e.target.value }
                      })}
                      placeholder="123 Main Street, Westlands"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={newProperty.location.city}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        location: { ...newProperty.location, city: e.target.value }
                      })}
                      placeholder="Nairobi"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      County
                    </label>
                    <input
                      type="text"
                      value={newProperty.location.county}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        location: { ...newProperty.location, county: e.target.value }
                      })}
                      placeholder="Nairobi County"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-nestie-black mb-4">Specifications</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={newProperty.specifications.bedrooms}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        specifications: { ...newProperty.specifications, bedrooms: parseInt(e.target.value) }
                      })}
                      min="0"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={newProperty.specifications.bathrooms}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        specifications: { ...newProperty.specifications, bathrooms: parseInt(e.target.value) }
                      })}
                      min="0"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Area (sqft)
                    </label>
                    <input
                      type="text"
                      value={newProperty.specifications.area}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        specifications: { ...newProperty.specifications, area: e.target.value }
                      })}
                      placeholder="1200"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  {[
                    { key: 'parking', label: 'Parking Available' },
                    { key: 'furnished', label: 'Furnished' },
                    { key: 'petFriendly', label: 'Pet Friendly' }
                  ].map((spec) => (
                    <label key={spec.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newProperty.specifications[spec.key as keyof typeof newProperty.specifications] as boolean}
                        onChange={(e) => setNewProperty({
                          ...newProperty,
                          specifications: {
                            ...newProperty.specifications,
                            [spec.key]: e.target.checked
                          }
                        })}
                        className="rounded border-nestie-grey-300 text-nestie-black focus:ring-nestie-black"
                      />
                      <span className="text-sm text-nestie-grey-700">{spec.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-nestie-black mb-4">Amenities</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { key: 'wifi', label: 'WiFi', icon: Wifi },
                    { key: 'pool', label: 'Swimming Pool', icon: Waves },
                    { key: 'gym', label: 'Gym', icon: Building },
                    { key: 'security', label: '24/7 Security', icon: Shield },
                    { key: 'garden', label: 'Garden', icon: Building },
                    { key: 'balcony', label: 'Balcony', icon: Building },
                    { key: 'aircon', label: 'Air Conditioning', icon: Building },
                    { key: 'heating', label: 'Heating', icon: Building }
                  ].map((amenity) => (
                    <label key={amenity.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newProperty.amenities[amenity.key as keyof typeof newProperty.amenities]}
                        onChange={(e) => setNewProperty({
                          ...newProperty,
                          amenities: {
                            ...newProperty.amenities,
                            [amenity.key]: e.target.checked
                          }
                        })}
                        className="rounded border-nestie-grey-300 text-nestie-black focus:ring-nestie-black"
                      />
                      <span className="text-sm text-nestie-grey-700">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold text-nestie-black mb-4">Property Images</h3>
                <div className="border-2 border-dashed border-nestie-grey-300 rounded-lg p-6">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-nestie-grey-400 mx-auto mb-4" />
                    <p className="text-nestie-grey-600 mb-4">Upload property images</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 cursor-pointer inline-flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImages ? 'Uploading...' : 'Choose Images'}
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {newProperty.images.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-4">
                    {newProperty.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-nestie-black mb-4">Contact Information</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newProperty.contactInfo.phone}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        contactInfo: { ...newProperty.contactInfo, phone: e.target.value }
                      })}
                      placeholder="+254712345678"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newProperty.contactInfo.email}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        contactInfo: { ...newProperty.contactInfo, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={newProperty.contactInfo.whatsapp}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        contactInfo: { ...newProperty.contactInfo, whatsapp: e.target.value }
                      })}
                      placeholder="+254712345678"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-nestie-black mb-4">Terms & Conditions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Security Deposit (KSh)
                    </label>
                    <input
                      type="number"
                      value={newProperty.terms.deposit}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        terms: { ...newProperty.terms, deposit: e.target.value }
                      })}
                      placeholder="100000"
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Lease Period (months)
                    </label>
                    <select
                      value={newProperty.terms.leasePeriod}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        terms: { ...newProperty.terms, leasePeriod: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    >
                      <option value="6">6 months</option>
                      <option value="12">12 months</option>
                      <option value="24">24 months</option>
                      <option value="36">36 months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={newProperty.terms.paymentMethod}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        terms: { ...newProperty.terms, paymentMethod: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                      Utilities
                    </label>
                    <select
                      value={newProperty.terms.utilities}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        terms: { ...newProperty.terms, utilities: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                    >
                      <option value="included">Included</option>
                      <option value="excluded">Excluded</option>
                      <option value="partial">Partially Included</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-nestie-grey-200 p-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowAddPropertyModal(false)}
                  className="flex-1 px-4 py-2 border border-nestie-grey-300 text-nestie-grey-700 rounded-lg hover:bg-nestie-grey-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProperty}
                  className="flex-1 px-4 py-2 bg-nestie-black text-white rounded-lg hover:bg-nestie-grey-800 flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  List Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {showPropertyDetailsModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-nestie-grey-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-nestie-black">{selectedProperty.title}</h2>
                <button onClick={() => setShowPropertyDetailsModal(false)}>
                  <X className="h-6 w-6 text-nestie-grey-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Property Images */}
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProperty.images.map((image: string, index: number) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedProperty.title} ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Property Details */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-nestie-black mb-4">Property Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-nestie-grey-600">Type:</span>
                      <span className="font-medium">{selectedProperty.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nestie-grey-600">Listing Type:</span>
                      <span className="font-medium">For {selectedProperty.listingType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nestie-grey-600">Price:</span>
                      <span className="font-medium">KSh {parseInt(selectedProperty.price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nestie-grey-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedProperty.status === 'available' ? 'bg-green-100 text-green-800' :
                        selectedProperty.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                        {selectedProperty.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-md font-semibold text-nestie-black mt-6 mb-3">Specifications</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-nestie-grey-600">Bedrooms:</span>
                      <span>{selectedProperty.specifications?.bedrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nestie-grey-600">Bathrooms:</span>
                      <span>{selectedProperty.specifications?.bathrooms}</span>
                    </div>
                    {selectedProperty.specifications?.area && (
                      <div className="flex justify-between">
                        <span className="text-nestie-grey-600">Area:</span>
                        <span>{selectedProperty.specifications.area} sqft</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-nestie-black mb-4">Location & Contact</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-nestie-grey-600">Address:</span>
                      <p className="font-medium">{selectedProperty.location?.address}</p>
                    </div>
                    {selectedProperty.location?.city && (
                      <div>
                        <span className="text-nestie-grey-600">City:</span>
                        <p className="font-medium">{selectedProperty.location.city}</p>
                      </div>
                    )}
                  </div>

                  <h4 className="text-md font-semibold text-nestie-black mt-6 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedProperty.contactInfo?.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-nestie-grey-600 mr-2" />
                        <span>{selectedProperty.contactInfo.phone}</span>
                      </div>
                    )}
                    {selectedProperty.contactInfo?.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-nestie-grey-600 mr-2" />
                        <span>{selectedProperty.contactInfo.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  {selectedProperty.amenities && (
                    <>
                      <h4 className="text-md font-semibold text-nestie-black mt-6 mb-3">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedProperty.amenities)
                          .filter(([key, value]) => value === true)
                          .map(([key]) => (
                            <span key={key} className="px-2 py-1 bg-nestie-grey-100 text-nestie-grey-700 rounded-full text-xs">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProperty.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-nestie-black mb-3">Description</h3>
                  <p className="text-nestie-grey-600">{selectedProperty.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}