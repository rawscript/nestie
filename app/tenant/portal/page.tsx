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
    Save,
    Search,
    MapPin,
    Bed,
    Bath,
    Car,
    Wifi,
    Waves,
    Building,
    Filter,
    Grid,
    List,
    Heart,
    Share,
    Star
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { TransactionService, Transaction, PropertyTenancy, Notification } from '@/lib/transactionService'
import CalendarBooking from '@/components/CalendarBooking'
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

    // Enhanced search functionality state
    const [searchProperties, setSearchProperties] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [keywordDescription, setKeywordDescription] = useState('')
    const [searchFilters, setSearchFilters] = useState({
        priceRange: { min: '', max: '' },
        propertyType: 'all', // all, apartment, house, commercial
        bedrooms: 'any', // any, 1, 2, 3, 4+
        bathrooms: 'any', // any, 1, 2, 3, 4+
        location: '',
        region: '',
        estate: '',
        amenities: {
            wifi: false,
            pool: false,
            gym: false,
            security: false,
            parking: false,
            furnished: false,
            balcony: false,
            garden: false,
            nearCBD: false,
            spacious: false
        }
    })
    const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid')
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedProperty, setSelectedProperty] = useState<any>(null)
    const [showPropertyModal, setShowPropertyModal] = useState(false)
    const [favoriteProperties, setFavoriteProperties] = useState<string[]>([])
    const [showInterestModal, setShowInterestModal] = useState(false)
    const [interestProperty, setInterestProperty] = useState<any>(null)

    // Booking and payment flow state
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [bookingProperty, setBookingProperty] = useState<any>(null)
    const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'confirmation'>('details')
    const [bookingDetails, setBookingDetails] = useState({
        moveInDate: '',
        leasePeriod: '12',
        specialRequests: ''
    })
    const [depositPayment, setDepositPayment] = useState({
        amount: '',
        paymentMethod: 'tinympesa',
        mpesaPhone: '',
        cardDetails: {
            number: '',
            expiry: '',
            cvv: '',
            name: ''
        }
    })
    const [processingBooking, setProcessingBooking] = useState(false)
    const [bookingStatus, setBookingStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)

    // Payment reminders and notifications
    const [paymentReminders, setPaymentReminders] = useState<any[]>([])
    const [upcomingPayments, setUpcomingPayments] = useState<any[]>([])
    const [overduePayments, setOverduePayments] = useState<any[]>([])

    // Saved properties and favorites
    const [savedProperties, setSavedProperties] = useState<any[]>([])

    // Chat interface state
    const [showChatModal, setShowChatModal] = useState(false)
    const [selectedAgent, setSelectedAgent] = useState<any>(null)
    const [chatProperty, setChatProperty] = useState<any>(null)
    const [chatMessages, setChatMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)

    // Tour scheduling state
    const [showTourModal, setShowTourModal] = useState(false)
    const [tourProperty, setTourProperty] = useState<any>(null)
    const [tourDetails, setTourDetails] = useState({
        preferredDate: '',
        preferredTime: '',
        message: ''
    })
    const [schedulingTour, setSchedulingTour] = useState(false)

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

    // Enhanced search functionality with robust location-based filtering
    const searchForProperties = async () => {
        setSearchLoading(true)
        try {
            // Enhanced search logic with location prioritization
            let searchParams: any = {
                status: 'available',
                includeAgentInfo: true
            }

            // If only location is provided (keyword box empty)
            if (!keywordDescription.trim() && searchFilters.location.trim()) {
                searchParams = {
                    ...searchParams,
                    locationOnly: true,
                    location: searchFilters.location,
                    region: searchFilters.region,
                    estate: searchFilters.estate,
                    filters: searchFilters
                }
            }
            // If both keyword description and location are provided
            else if (keywordDescription.trim() && searchFilters.location.trim()) {
                searchParams = {
                    ...searchParams,
                    hybridSearch: true,
                    keywordDescription: keywordDescription,
                    location: searchFilters.location,
                    region: searchFilters.region,
                    estate: searchFilters.estate,
                    filters: searchFilters,
                    naturalLanguageSearch: true
                }
            }
            // Standard search with keywords only
            else {
                searchParams = {
                    ...searchParams,
                    query: searchQuery,
                    keywordDescription: keywordDescription,
                    filters: searchFilters,
                    naturalLanguageSearch: true
                }
            }

            const response = await fetch('/api/properties/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchParams)
            })

            if (!response.ok) throw new Error('Search failed')

            const { data } = await response.json()

            // Enhanced filtering with location relevance scoring
            let agentListings = data?.filter((property: any) =>
                property.agent_id &&
                property.status === 'available' &&
                property.created_by_agent === true
            ) || []

            // Sort by location relevance if location search is active
            if (searchFilters.location.trim()) {
                agentListings = agentListings.sort((a: any, b: any) => {
                    const aLocationMatch = calculateLocationRelevance(a, searchFilters.location)
                    const bLocationMatch = calculateLocationRelevance(b, searchFilters.location)
                    return bLocationMatch - aLocationMatch
                })
            }

            setSearchProperties(agentListings)
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Failed to search properties')
            setSearchProperties([])
        } finally {
            setSearchLoading(false)
        }
    }

    // Calculate location relevance score for sorting
    const calculateLocationRelevance = (property: any, searchLocation: string) => {
        const location = searchLocation.toLowerCase()
        let score = 0

        if (property.location?.city?.toLowerCase().includes(location)) score += 10
        if (property.location?.address?.toLowerCase().includes(location)) score += 8
        if (property.location?.region?.toLowerCase().includes(location)) score += 6
        if (property.location?.estate?.toLowerCase().includes(location)) score += 4
        if (property.description?.toLowerCase().includes(location)) score += 2

        return score
    }

    // Smart keyword parsing for natural language search
    const parseKeywordDescription = (description: string) => {
        const keywords = description.toLowerCase()
        const updatedAmenities = { ...searchFilters.amenities }

        // Parse common keywords
        if (keywords.includes('spacious') || keywords.includes('large')) updatedAmenities.spacious = true
        if (keywords.includes('balcony')) updatedAmenities.balcony = true
        if (keywords.includes('garden') || keywords.includes('yard')) updatedAmenities.garden = true
        if (keywords.includes('cbd') || keywords.includes('central')) updatedAmenities.nearCBD = true
        if (keywords.includes('wifi') || keywords.includes('internet')) updatedAmenities.wifi = true
        if (keywords.includes('pool') || keywords.includes('swimming')) updatedAmenities.pool = true
        if (keywords.includes('gym') || keywords.includes('fitness')) updatedAmenities.gym = true
        if (keywords.includes('security') || keywords.includes('secure')) updatedAmenities.security = true
        if (keywords.includes('parking') || keywords.includes('garage')) updatedAmenities.parking = true
        if (keywords.includes('furnished')) updatedAmenities.furnished = true

        setSearchFilters(prev => ({ ...prev, amenities: updatedAmenities }))
    }

    // Enhanced booking flow with calendar integration
    const handleBookNow = (property: any) => {
        if (!user) {
            toast.error('Please login to book a property')
            return
        }

        setBookingProperty(property)
        setShowBookingModal(true)
    }

    // Handle booking completion from CalendarBooking component
    const handleBookingComplete = (bookingData: any) => {
        toast.success('Booking completed successfully!')
        setShowBookingModal(false)
        setBookingProperty(null)

        // Refresh user data to show new booking
        loadUserData()

        // Optionally redirect to calendar
        if (bookingData.booking_type !== 'viewing') {
            toast.success('Payment processed! Check your calendar for the appointment.')
        }
    }

    const processBooking = async () => {
        if (!user || !bookingProperty) return

        setProcessingBooking(true)
        try {
            // Step 1: Process deposit payment
            if (bookingStep === 'payment') {
                const amount = parseFloat(depositPayment.amount)
                const platformFee = amount * 0.05 // 5% platform fee
                const agentAmount = amount - platformFee // Agent gets 95% of deposit

                // Process payment through platform
                let paymentResult
                if (depositPayment.paymentMethod === 'tinympesa') {
                    paymentResult = await processTinyMpesaPayment(amount, depositPayment.mpesaPhone)
                } else if (depositPayment.paymentMethod === 'stripe') {
                    paymentResult = await processStripePayment(amount, depositPayment.cardDetails)
                }

                // Step 2: Create booking record with payment details
                const bookingData = {
                    property_id: bookingProperty.id,
                    tenant_id: user.id,
                    agent_id: bookingProperty.agent_id,
                    booking_details: bookingDetails,
                    deposit_amount: amount,
                    platform_fee: platformFee,
                    agent_amount: agentAmount,
                    payment_method: depositPayment.paymentMethod,
                    payment_reference: paymentResult?.reference || `BK-${Date.now()}`,
                    status: 'pending_agent_approval',
                    created_at: new Date().toISOString()
                }

                const bookingResponse = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                })

                if (!bookingResponse.ok) throw new Error('Booking creation failed')
                const { data: bookingRecord } = await bookingResponse.json()

                // Step 3: Create payment record for tracking
                const paymentData = {
                    booking_id: bookingRecord.id,
                    tenant_id: user.id,
                    agent_id: bookingProperty.agent_id,
                    property_id: bookingProperty.id,
                    amount: amount,
                    platform_fee: platformFee,
                    agent_amount: agentAmount,
                    payment_method: depositPayment.paymentMethod,
                    payment_reference: paymentResult?.reference,
                    status: 'completed',
                    type: 'deposit',
                    created_at: new Date().toISOString()
                }

                await fetch('/api/payments/record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(paymentData)
                })

                // Step 4: Update property status to pending
                await fetch(`/api/properties/${bookingProperty.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'pending',
                        pending_booking_id: bookingRecord.id
                    })
                })

                // Step 5: Send comprehensive notification to agent
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient_id: bookingProperty.agent_id,
                        title: 'New Booking Request - Payment Received',
                        message: `${user.email} has booked "${bookingProperty.title}" with deposit payment of KSh ${amount.toLocaleString()}. Your earnings: KSh ${agentAmount.toLocaleString()}. Please review and approve.`,
                        type: 'booking_request',
                        data: {
                            booking_id: bookingRecord.id,
                            property_id: bookingProperty.id,
                            tenant_email: user.email,
                            deposit_amount: amount,
                            agent_earnings: agentAmount,
                            move_in_date: bookingDetails.moveInDate,
                            lease_period: bookingDetails.leasePeriod
                        }
                    })
                })

                // Step 6: Create agent earnings record (pending until approval)
                await fetch('/api/agent/earnings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent_id: bookingProperty.agent_id,
                        booking_id: bookingRecord.id,
                        property_id: bookingProperty.id,
                        amount: agentAmount,
                        type: 'deposit_commission',
                        status: 'pending_approval',
                        description: `Deposit commission for ${bookingProperty.title}`,
                        created_at: new Date().toISOString()
                    })
                })

                setBookingStatus('pending')
                setBookingStep('confirmation')
                toast.success('Booking submitted successfully! Agent will receive payment upon approval.')
            }
        } catch (error) {
            console.error('Booking error:', error)
            toast.error('Booking failed. Please try again.')
        } finally {
            setProcessingBooking(false)
        }
    }

    // Load saved properties and payment reminders
    const loadSavedProperties = async () => {
        if (!user) return

        try {
            const response = await fetch(`/api/users/${user.id}/saved-properties`)
            if (response.ok) {
                const { data } = await response.json()
                setSavedProperties(data || [])
                setFavoriteProperties(data?.map((p: any) => p.id) || [])
            }
        } catch (error) {
            console.error('Error loading saved properties:', error)
        }
    }

    const loadPaymentReminders = async () => {
        if (!user) return

        try {
            const response = await fetch(`/api/users/${user.id}/payment-reminders`)
            if (response.ok) {
                const { data } = await response.json()
                setPaymentReminders(data?.reminders || [])
                setUpcomingPayments(data?.upcoming || [])
                setOverduePayments(data?.overdue || [])
            }
        } catch (error) {
            console.error('Error loading payment reminders:', error)
        }
    }

    // Save property to favorites
    const savePropertyToFavorites = async (propertyId: string) => {
        if (!user) return

        try {
            const response = await fetch('/api/users/saved-properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    property_id: propertyId
                })
            })

            if (!response.ok) throw new Error('Failed to save property')

            loadSavedProperties()
        } catch (error) {
            console.error('Error saving property:', error)
        }
    }

    const handlePropertyView = (property: any) => {
        setSelectedProperty(property)
        setShowPropertyModal(true)
    }

    const handleToggleFavorite = async (propertyId: string) => {
        if (!user) return

        try {
            const isCurrentlyFavorite = favoriteProperties.includes(propertyId)

            if (isCurrentlyFavorite) {
                // Remove from favorites
                const response = await fetch(`/api/users/saved-properties/${propertyId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id })
                })

                if (!response.ok) throw new Error('Failed to remove from favorites')

                setFavoriteProperties(prev => prev.filter(id => id !== propertyId))
                setSavedProperties(prev => prev.filter(p => p.id !== propertyId))
                toast.success('Removed from favorites')
            } else {
                // Add to favorites
                const response = await fetch('/api/users/saved-properties', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id,
                        property_id: propertyId
                    })
                })

                if (!response.ok) throw new Error('Failed to add to favorites')

                setFavoriteProperties(prev => [...prev, propertyId])
                toast.success('Added to favorites')

                // Reload saved properties to get the full property data
                loadSavedProperties()
            }
        } catch (error) {
            console.error('Error toggling favorite:', error)
            toast.error('Failed to update favorites')
        }
    }

    // Chat functionality
    const handleMessageAgent = (property: any) => {
        setSelectedAgent(property.agent)
        setChatProperty(property)
        setShowChatModal(true)
        loadChatMessages(property.agent_id, property.id)
    }

    const loadChatMessages = async (agentId: string, propertyId: string) => {
        if (!user) return

        try {
            const response = await fetch(`/api/chat/messages?tenant_id=${user.id}&agent_id=${agentId}&property_id=${propertyId}`)
            if (response.ok) {
                const { data } = await response.json()
                setChatMessages(data || [])
            }
        } catch (error) {
            console.error('Error loading chat messages:', error)
        }
    }

    const sendMessage = async () => {
        if (!user || !selectedAgent || !chatProperty || !newMessage.trim()) return

        setSendingMessage(true)
        try {
            const messageData = {
                sender_id: user.id,
                recipient_id: selectedAgent.id,
                property_id: chatProperty.id,
                message: newMessage.trim(),
                sender_type: 'tenant',
                created_at: new Date().toISOString()
            }

            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            })

            if (!response.ok) throw new Error('Failed to send message')

            const { data: newMsg } = await response.json()
            setChatMessages(prev => [...prev, newMsg])
            setNewMessage('')

            // Send notification to agent
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_id: selectedAgent.id,
                    title: 'New Message from Tenant',
                    message: `${user.email} sent you a message about "${chatProperty.title}"`,
                    type: 'chat_message',
                    data: {
                        property_id: chatProperty.id,
                        tenant_email: user.email,
                        message_preview: newMessage.slice(0, 50) + (newMessage.length > 50 ? '...' : '')
                    }
                })
            })

            toast.success('Message sent successfully!')
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
        } finally {
            setSendingMessage(false)
        }
    }

    // Tour scheduling functionality
    const handleScheduleTour = (property: any) => {
        setTourProperty(property)
        setShowTourModal(true)
    }

    const scheduleTour = async () => {
        if (!user || !tourProperty || !tourDetails.preferredDate || !tourDetails.preferredTime) {
            toast.error('Please fill in all required fields')
            return
        }

        setSchedulingTour(true)
        try {
            const tourData = {
                property_id: tourProperty.id,
                tenant_id: user.id,
                agent_id: tourProperty.agent_id,
                preferred_date: tourDetails.preferredDate,
                preferred_time: tourDetails.preferredTime,
                message: tourDetails.message,
                status: 'pending',
                created_at: new Date().toISOString()
            }

            const response = await fetch('/api/tours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tourData)
            })

            if (!response.ok) throw new Error('Failed to schedule tour')

            // Send notification to agent
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_id: tourProperty.agent_id,
                    title: 'New Tour Request',
                    message: `${user.email} requested a tour for "${tourProperty.title}" on ${tourDetails.preferredDate} at ${tourDetails.preferredTime}`,
                    type: 'tour_request',
                    data: {
                        property_id: tourProperty.id,
                        tenant_email: user.email,
                        preferred_date: tourDetails.preferredDate,
                        preferred_time: tourDetails.preferredTime
                    }
                })
            })

            toast.success('Tour request sent successfully! The agent will contact you to confirm.')
            setShowTourModal(false)
            setTourDetails({ preferredDate: '', preferredTime: '', message: '' })
        } catch (error) {
            console.error('Error scheduling tour:', error)
            toast.error('Failed to schedule tour')
        } finally {
            setSchedulingTour(false)
        }
    }

    // Share property functionality
    const handleShareProperty = (property: any) => {
        const shareData = {
            title: property.title,
            text: `Check out this property: ${property.title} - KSh ${parseInt(property.price).toLocaleString()}/${property.listingType === 'rent' ? 'month' : property.listingType}`,
            url: `${window.location.origin}/property/${property.id}`
        }

        if (navigator.share) {
            navigator.share(shareData).catch(console.error)
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
                .then(() => toast.success('Property link copied to clipboard!'))
                .catch(() => toast.error('Failed to copy link'))
        }
    }

    const handleExpressInterest = (property: any) => {
        setInterestProperty(property)
        setShowInterestModal(true)
    }

    const submitInterest = async () => {
        if (!user || !interestProperty) return

        try {
            const response = await fetch('/api/properties/interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: interestProperty.id,
                    tenant_id: user.id,
                    message: `Interest expressed in ${interestProperty.title}`
                })
            })

            if (!response.ok) throw new Error('Failed to express interest')

            toast.success('Interest submitted successfully! The agent will contact you soon.')
            setShowInterestModal(false)
            setInterestProperty(null)
        } catch (error) {
            console.error('Interest submission error:', error)
            toast.error('Failed to submit interest')
        }
    }

    const filteredSearchProperties = searchProperties.filter(property => {
        const matchesQuery = !searchQuery ||
            property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.location?.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.description?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesPrice = (!searchFilters.priceRange.min || property.price >= parseInt(searchFilters.priceRange.min)) &&
            (!searchFilters.priceRange.max || property.price <= parseInt(searchFilters.priceRange.max))

        const matchesType = searchFilters.propertyType === 'all' || property.type === searchFilters.propertyType

        const matchesBedrooms = searchFilters.bedrooms === 'any' ||
            (searchFilters.bedrooms === '4+' ? property.specifications?.bedrooms >= 4 :
                property.specifications?.bedrooms === parseInt(searchFilters.bedrooms))

        const matchesBathrooms = searchFilters.bathrooms === 'any' ||
            (searchFilters.bathrooms === '4+' ? property.specifications?.bathrooms >= 4 :
                property.specifications?.bathrooms === parseInt(searchFilters.bathrooms))

        const matchesLocation = !searchFilters.location ||
            property.location?.address.toLowerCase().includes(searchFilters.location.toLowerCase()) ||
            property.location?.city.toLowerCase().includes(searchFilters.location.toLowerCase())

        const matchesAmenities = Object.entries(searchFilters.amenities).every(([key, required]) =>
            !required || property.amenities?.[key] || property.specifications?.[key]
        )

        return matchesQuery && matchesPrice && matchesType && matchesBedrooms && matchesBathrooms && matchesLocation && matchesAmenities
    })

    // Load properties when search tab is activated and load saved properties
    useEffect(() => {
        if (activeTab === 'search') {
            loadAgentProperties() // Load actual agent listings first
            loadSavedProperties()
        }
    }, [activeTab])

    // Load initial data when component mounts
    useEffect(() => {
        if (user) {
            loadSavedProperties()
            loadPaymentReminders()
            loadUserBookings()
        }
    }, [user])

    // Enhanced property search that connects to agent listings with caching
    const loadAgentProperties = async () => {
        setSearchLoading(true)
        try {
            const response = await fetch('/api/properties/agent-listings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=300' // 5 minutes cache
                }
            })

            if (!response.ok) throw new Error('Failed to load properties')

            const { data, cached } = await response.json()

            // Properties are already filtered by the API for verified agents
            setSearchProperties(data || [])

            if (cached) {
                console.log('Loaded properties from cache')
            }
        } catch (error) {
            console.error('Error loading agent properties:', error)
            toast.error('Failed to load properties')
            setSearchProperties([])
        } finally {
            setSearchLoading(false)
        }
    }

    // Load user's bookings to show booking status
    const loadUserBookings = async () => {
        if (!user) return

        try {
            const response = await fetch(`/api/bookings?tenant_id=${user.id}`)
            if (response.ok) {
                const { data } = await response.json()
                // Update booking status for properties
                data?.forEach((booking: any) => {
                    if (booking.status === 'pending_agent_approval') {
                        toast(`Your booking for "${booking.property?.title}" is awaiting agent approval.`, {
                            icon: '⏳',
                            duration: 4000
                        })
                    } else if (booking.status === 'approved') {
                        toast.success(`Your booking for "${booking.property?.title}" has been approved!`)
                    } else if (booking.status === 'rejected') {
                        toast.error(`Your booking for "${booking.property?.title}" was rejected.`)
                    }
                })
            }
        } catch (error) {
            console.error('Error loading user bookings:', error)
        }
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
                                    { id: 'search', label: 'Search Properties', icon: Search },
                                    { id: 'saved', label: 'Saved Properties', icon: Heart },
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

                        {activeTab === 'search' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Search Properties</h1>
                                    <p className="text-nestie-grey-600">Find your perfect home from available properties.</p>
                                </div>

                                {/* Search Bar and Filters */}
                                <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-6">
                                    <div className="space-y-4">
                                        {/* Smart Natural Language Search */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                    Describe what you're looking for
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., spacious apartment with balcony near CBD, furnished house with garden..."
                                                        value={keywordDescription}
                                                        onChange={(e) => {
                                                            setKeywordDescription(e.target.value)
                                                            parseKeywordDescription(e.target.value)
                                                        }}
                                                        className="flex-1 px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                    />
                                                    <button
                                                        onClick={searchForProperties}
                                                        disabled={searchLoading}
                                                        className="bg-nestie-black text-white px-6 py-2 rounded-lg hover:bg-nestie-grey-800 disabled:opacity-50 flex items-center"
                                                    >
                                                        {searchLoading ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        ) : (
                                                            <Search className="h-4 w-4 mr-2" />
                                                        )}
                                                        Search
                                                    </button>
                                                </div>
                                                <p className="text-xs text-nestie-grey-500 mt-1">
                                                    Use natural language to describe your ideal property
                                                </p>
                                            </div>

                                            {/* Traditional Search */}
                                            <div className="flex gap-4">
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-nestie-grey-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by title, location, or description..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Filters */}
                                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-nestie-grey-700 mb-1">Property Type</label>
                                                <select
                                                    value={searchFilters.propertyType}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, propertyType: e.target.value })}
                                                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                >
                                                    <option value="all">All Types</option>
                                                    <option value="apartment">Apartment</option>
                                                    <option value="house">House</option>
                                                    <option value="commercial">Commercial</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-nestie-grey-700 mb-1">Bedrooms</label>
                                                <select
                                                    value={searchFilters.bedrooms}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, bedrooms: e.target.value })}
                                                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                >
                                                    <option value="any">Any</option>
                                                    <option value="1">1 Bedroom</option>
                                                    <option value="2">2 Bedrooms</option>
                                                    <option value="3">3 Bedrooms</option>
                                                    <option value="4+">4+ Bedrooms</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-nestie-grey-700 mb-1">Price Range (KSh)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={searchFilters.priceRange.min}
                                                        onChange={(e) => setSearchFilters({
                                                            ...searchFilters,
                                                            priceRange: { ...searchFilters.priceRange, min: e.target.value }
                                                        })}
                                                        className="w-full px-2 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={searchFilters.priceRange.max}
                                                        onChange={(e) => setSearchFilters({
                                                            ...searchFilters,
                                                            priceRange: { ...searchFilters.priceRange, max: e.target.value }
                                                        })}
                                                        className="w-full px-2 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-nestie-grey-700 mb-1">City</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Nairobi, Mombasa..."
                                                    value={searchFilters.location}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
                                                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* Additional Location Filters */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-nestie-grey-700 mb-1">Region/Area</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Westlands, Karen, Kilimani..."
                                                    value={searchFilters.region}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, region: e.target.value })}
                                                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-nestie-grey-700 mb-1">Estate/Development</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Spring Valley, Runda..."
                                                    value={searchFilters.estate}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, estate: e.target.value })}
                                                    className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* Enhanced Amenities Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">Amenities & Features</label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                {[
                                                    { key: 'wifi', label: 'WiFi/Internet', icon: Wifi },
                                                    { key: 'pool', label: 'Swimming Pool', icon: Waves },
                                                    { key: 'gym', label: 'Gym/Fitness', icon: Building },
                                                    { key: 'security', label: '24/7 Security', icon: Shield },
                                                    { key: 'parking', label: 'Parking/Garage', icon: Car },
                                                    { key: 'furnished', label: 'Furnished', icon: Home },
                                                    { key: 'balcony', label: 'Balcony/Terrace', icon: Building },
                                                    { key: 'garden', label: 'Garden/Yard', icon: Building },
                                                    { key: 'nearCBD', label: 'Near CBD', icon: MapPin },
                                                    { key: 'spacious', label: 'Spacious/Large', icon: Building }
                                                ].map(({ key, label, icon: Icon }) => (
                                                    <label key={key} className="flex items-center space-x-2 p-2 border border-nestie-grey-200 rounded-lg hover:bg-nestie-grey-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={searchFilters.amenities[key as keyof typeof searchFilters.amenities]}
                                                            onChange={(e) => setSearchFilters({
                                                                ...searchFilters,
                                                                amenities: { ...searchFilters.amenities, [key]: e.target.checked }
                                                            })}
                                                            className="rounded border-nestie-grey-300 text-nestie-black focus:ring-nestie-black"
                                                        />
                                                        <Icon className="h-4 w-4 text-nestie-grey-600" />
                                                        <span className="text-sm text-nestie-grey-700">{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* View Mode Toggle */}
                                        <div className="flex items-center justify-between pt-4 border-t border-nestie-grey-200">
                                            <p className="text-sm text-nestie-grey-600">
                                                {filteredSearchProperties.length} properties found
                                            </p>
                                            <div className="flex border border-nestie-grey-300 rounded-lg">
                                                <button
                                                    onClick={() => setSearchViewMode('grid')}
                                                    className={`p-2 ${searchViewMode === 'grid' ? 'bg-nestie-black text-white' : 'text-nestie-grey-600'}`}
                                                >
                                                    <Grid className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setSearchViewMode('list')}
                                                    className={`p-2 ${searchViewMode === 'list' ? 'bg-nestie-black text-white' : 'text-nestie-grey-600'}`}
                                                >
                                                    <List className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Search Results */}
                                {searchLoading ? (
                                    <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-12 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestie-black mx-auto mb-4"></div>
                                        <p className="text-nestie-grey-600">Searching properties...</p>
                                    </div>
                                ) : (
                                    <div className={searchViewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                                        {filteredSearchProperties.map((property) => (
                                            <div key={property.id} className="bg-nestie-white rounded-xl border border-nestie-grey-200 overflow-hidden hover:shadow-lg transition-shadow">
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
                                                            <Building className="h-12 w-12 text-nestie-grey-400" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 flex space-x-2">
                                                        <button
                                                            onClick={() => handleToggleFavorite(property.id)}
                                                            className={`p-2 rounded-full ${favoriteProperties.includes(property.id)
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-white text-nestie-grey-600 hover:text-red-500'
                                                                }`}
                                                        >
                                                            <Heart className="h-4 w-4" />
                                                        </button>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.status === 'available' ? 'bg-green-100 text-green-800' :
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
                                                        <button
                                                            onClick={() => handlePropertyView(property)}
                                                            className="p-1 text-nestie-grey-600 hover:text-nestie-black"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
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

                                                    <div className="flex items-center justify-between mb-3">
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
                                                    <div className="flex items-center space-x-2 mb-4 pt-3 border-t border-nestie-grey-200">
                                                        {property.amenities?.wifi && <Wifi className="h-4 w-4 text-nestie-grey-600" />}
                                                        {property.amenities?.pool && <Waves className="h-4 w-4 text-blue-500" />}
                                                        {property.specifications?.parking && <Car className="h-4 w-4 text-nestie-grey-600" />}
                                                        {property.amenities?.security && <Shield className="h-4 w-4 text-green-500" />}
                                                    </div>

                                                    {/* Quick Actions */}
                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        <button
                                                            onClick={() => handleShareProperty(property)}
                                                            className="flex items-center justify-center p-2 border border-nestie-grey-300 rounded-lg hover:bg-nestie-grey-50 text-sm"
                                                        >
                                                            <Share className="h-4 w-4 mr-1" />
                                                            Share
                                                        </button>
                                                        <button
                                                            onClick={() => handleScheduleTour(property)}
                                                            className="flex items-center justify-center p-2 border border-nestie-grey-300 rounded-lg hover:bg-nestie-grey-50 text-sm"
                                                        >
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            Tour
                                                        </button>
                                                        <button
                                                            onClick={() => handleMessageAgent(property)}
                                                            className="flex items-center justify-center p-2 border border-nestie-grey-300 rounded-lg hover:bg-nestie-grey-50 text-sm"
                                                        >
                                                            <Send className="h-4 w-4 mr-1" />
                                                            Message
                                                        </button>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handlePropertyView(property)}
                                                            className="flex-1 bg-nestie-grey-100 text-nestie-black px-4 py-2 rounded-lg hover:bg-nestie-grey-200 transition-colors text-sm"
                                                        >
                                                            View Details
                                                        </button>
                                                        {property.status === 'available' ? (
                                                            <button
                                                                onClick={() => handleBookNow(property)}
                                                                className="flex-1 bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 transition-colors text-sm font-medium"
                                                            >
                                                                Book Now
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleExpressInterest(property)}
                                                                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                                                            >
                                                                Express Interest
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!searchLoading && filteredSearchProperties.length === 0 && (
                                    <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-12 text-center">
                                        <Search className="h-12 w-12 text-nestie-grey-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-nestie-black mb-2">No properties found</h3>
                                        <p className="text-nestie-grey-600 mb-4">Try adjusting your search criteria or filters.</p>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('')
                                                setSearchFilters({
                                                    priceRange: { min: '', max: '' },
                                                    propertyType: 'all',
                                                    bedrooms: 'any',
                                                    bathrooms: 'any',
                                                    location: '',
                                                    region: '',
                                                    estate: '',
                                                    amenities: {
                                                        wifi: false,
                                                        pool: false,
                                                        gym: false,
                                                        security: false,
                                                        parking: false,
                                                        furnished: false,
                                                        balcony: false,
                                                        garden: false,
                                                        nearCBD: false,
                                                        spacious: false
                                                    }
                                                })
                                                searchForProperties()
                                            }}
                                            className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                )}
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

                        {activeTab === 'saved' && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-nestie-black mb-2">Saved Properties</h1>
                                    <p className="text-nestie-grey-600">Properties you've saved for later viewing.</p>
                                </div>

                                {savedProperties.length === 0 ? (
                                    <div className="bg-nestie-white rounded-xl border border-nestie-grey-200 p-12 text-center">
                                        <Heart className="h-12 w-12 text-nestie-grey-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-nestie-black mb-2">No saved properties</h3>
                                        <p className="text-nestie-grey-600 mb-4">Start browsing properties and save your favorites.</p>
                                        <button
                                            onClick={() => setActiveTab('search')}
                                            className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800"
                                        >
                                            Browse Properties
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {savedProperties.map((property) => (
                                            <div key={property.id} className="bg-nestie-white rounded-xl border border-nestie-grey-200 overflow-hidden hover:shadow-lg transition-shadow">
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
                                                            <Building className="h-12 w-12 text-nestie-grey-400" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2">
                                                        <button
                                                            onClick={() => handleToggleFavorite(property.id)}
                                                            className="p-2 rounded-full bg-red-500 text-white"
                                                        >
                                                            <Heart className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Property Details */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-semibold text-nestie-black text-lg">{property.title}</h3>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.status === 'available' ? 'bg-green-100 text-green-800' :
                                                            'bg-orange-100 text-orange-800'
                                                            }`}>
                                                            {property.status}
                                                        </span>
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
                                                    </div>

                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <span className="text-2xl font-bold text-nestie-black">
                                                                KSh {parseInt(property.price).toLocaleString()}
                                                            </span>
                                                            <span className="text-nestie-grey-500 text-sm">
                                                                /{property.listingType === 'rent' ? 'month' : property.listingType}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions */}
                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        <button
                                                            onClick={() => handleShareProperty(property)}
                                                            className="flex items-center justify-center p-2 border border-nestie-grey-300 rounded-lg hover:bg-nestie-grey-50 text-sm"
                                                        >
                                                            <Share className="h-4 w-4 mr-1" />
                                                            Share
                                                        </button>
                                                        <button
                                                            onClick={() => handleScheduleTour(property)}
                                                            className="flex items-center justify-center p-2 border border-nestie-grey-300 rounded-lg hover:bg-nestie-grey-50 text-sm"
                                                        >
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            Tour
                                                        </button>
                                                        <button
                                                            onClick={() => handleMessageAgent(property)}
                                                            className="flex items-center justify-center p-2 border border-nestie-grey-300 rounded-lg hover:bg-nestie-grey-50 text-sm"
                                                        >
                                                            <Send className="h-4 w-4 mr-1" />
                                                            Message
                                                        </button>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handlePropertyView(property)}
                                                            className="flex-1 bg-nestie-grey-100 text-nestie-black px-4 py-2 rounded-lg hover:bg-nestie-grey-200 transition-colors text-sm"
                                                        >
                                                            View Details
                                                        </button>
                                                        {property.status === 'available' ? (
                                                            <button
                                                                onClick={() => handleBookNow(property)}
                                                                className="flex-1 bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 transition-colors text-sm font-medium"
                                                            >
                                                                Book Now
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleExpressInterest(property)}
                                                                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                                                            >
                                                                Express Interest
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

            {/* Property Details Modal */}
            {showPropertyModal && selectedProperty && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-nestie-grey-200 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-nestie-black">{selectedProperty.title}</h2>
                                <button onClick={() => setShowPropertyModal(false)}>
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
                                            <span className="font-medium text-green-600">KSh {parseInt(selectedProperty.price).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-nestie-grey-600">Status:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedProperty.status === 'available' ? 'bg-green-100 text-green-800' :
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
                                        <div className="flex justify-between">
                                            <span className="text-nestie-grey-600">Parking:</span>
                                            <span>{selectedProperty.specifications?.parking ? 'Available' : 'Not Available'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-nestie-grey-600">Furnished:</span>
                                            <span>{selectedProperty.specifications?.furnished ? 'Yes' : 'No'}</span>
                                        </div>
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

                                    {/* Terms */}
                                    {selectedProperty.terms && (
                                        <>
                                            <h4 className="text-md font-semibold text-nestie-black mt-6 mb-3">Terms</h4>
                                            <div className="space-y-2">
                                                {selectedProperty.terms.deposit && (
                                                    <div className="flex justify-between">
                                                        <span className="text-nestie-grey-600">Security Deposit:</span>
                                                        <span>KSh {parseInt(selectedProperty.terms.deposit).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-nestie-grey-600">Lease Period:</span>
                                                    <span>{selectedProperty.terms.leasePeriod} months</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-nestie-grey-600">Payment Method:</span>
                                                    <span className="capitalize">{selectedProperty.terms.paymentMethod}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-nestie-grey-600">Utilities:</span>
                                                    <span className="capitalize">{selectedProperty.terms.utilities}</span>
                                                </div>
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

                            {/* Action Buttons */}
                            <div className="flex space-x-4 mt-8 pt-6 border-t border-nestie-grey-200">
                                <button
                                    onClick={() => handleToggleFavorite(selectedProperty.id)}
                                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${favoriteProperties.includes(selectedProperty.id)
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-white border-nestie-grey-300 text-nestie-grey-700 hover:bg-nestie-grey-50'
                                        }`}
                                >
                                    <Heart className="h-4 w-4 mr-2" />
                                    {favoriteProperties.includes(selectedProperty.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPropertyModal(false)
                                        handleExpressInterest(selectedProperty)
                                    }}
                                    className="flex-1 bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 transition-colors"
                                >
                                    Express Interest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Express Interest Modal */}
            {showInterestModal && interestProperty && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-nestie-black">Express Interest</h2>
                                <button onClick={() => setShowInterestModal(false)}>
                                    <X className="h-5 w-5 text-nestie-grey-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">{interestProperty.title}</h3>
                                    <p className="text-blue-700 text-sm">{interestProperty.location?.address}</p>
                                    <p className="text-blue-800 font-medium mt-2">
                                        KSh {parseInt(interestProperty.price).toLocaleString()}/{interestProperty.listingType === 'rent' ? 'month' : interestProperty.listingType}
                                    </p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-medium text-green-800 mb-2">What happens next?</h4>
                                    <ul className="text-green-700 text-sm space-y-1">
                                        <li>• Your interest will be sent to the property agent</li>
                                        <li>• The agent will contact you within 24 hours</li>
                                        <li>• You can arrange a viewing or ask questions</li>
                                        <li>• If interested, you can proceed with the application</li>
                                    </ul>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowInterestModal(false)}
                                        className="flex-1 px-4 py-2 border border-nestie-grey-300 text-nestie-grey-700 rounded-lg hover:bg-nestie-grey-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitInterest}
                                        className="flex-1 px-4 py-2 bg-nestie-black text-white rounded-lg hover:bg-nestie-grey-800"
                                    >
                                        Submit Interest
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Calendar Booking Modal */}
            {showBookingModal && bookingProperty && (
                <CalendarBooking
                    property={bookingProperty}
                    agent={bookingProperty.agent || {
                        id: bookingProperty.agent_id,
                        full_name: 'Property Agent',
                        email: 'agent@example.com'
                    }}
                    onClose={() => setShowBookingModal(false)}
                    onBookingComplete={handleBookingComplete}
                />
            )}

            {/* Chat Modal */}
            {
                showChatModal && selectedAgent && chatProperty && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-2xl h-[600px] flex flex-col">
                            <div className="border-b border-nestie-grey-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-nestie-grey-300 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-nestie-grey-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-nestie-black">
                                                {selectedAgent.name || selectedAgent.email}
                                            </h2>
                                            <p className="text-sm text-nestie-grey-600">
                                                Agent for {chatProperty.title}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowChatModal(false)}>
                                        <X className="h-6 w-6 text-nestie-grey-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center text-nestie-grey-500 py-8">
                                        <Mail className="h-12 w-12 mx-auto mb-4 text-nestie-grey-400" />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    chatMessages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${message.sender_type === 'tenant' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_type === 'tenant'
                                                    ? 'bg-nestie-black text-white'
                                                    : 'bg-nestie-grey-100 text-nestie-black'
                                                    }`}
                                            >
                                                <p className="text-sm">{message.message}</p>
                                                <p className={`text-xs mt-1 ${message.sender_type === 'tenant' ? 'text-nestie-grey-300' : 'text-nestie-grey-500'
                                                    }`}>
                                                    {new Date(message.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="border-t border-nestie-grey-200 p-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() || sendingMessage}
                                        className="bg-nestie-black text-white px-4 py-2 rounded-lg hover:bg-nestie-grey-800 disabled:opacity-50 flex items-center"
                                    >
                                        {sendingMessage ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Tour Scheduling Modal */}
            {
                showTourModal && tourProperty && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-md mx-4">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-nestie-black">Schedule Tour</h2>
                                    <button onClick={() => setShowTourModal(false)}>
                                        <X className="h-5 w-5 text-nestie-grey-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-blue-900 mb-2">{tourProperty.title}</h3>
                                        <p className="text-blue-700 text-sm">{tourProperty.location?.address}</p>
                                        <p className="text-blue-800 font-medium mt-2">
                                            KSh {parseInt(tourProperty.price).toLocaleString()}/{tourProperty.listingType === 'rent' ? 'month' : tourProperty.listingType}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                Preferred Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={tourDetails.preferredDate}
                                                onChange={(e) => setTourDetails({ ...tourDetails, preferredDate: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                                Preferred Time *
                                            </label>
                                            <select
                                                value={tourDetails.preferredTime}
                                                onChange={(e) => setTourDetails({ ...tourDetails, preferredTime: e.target.value })}
                                                className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                            >
                                                <option value="">Select time</option>
                                                <option value="09:00">9:00 AM</option>
                                                <option value="10:00">10:00 AM</option>
                                                <option value="11:00">11:00 AM</option>
                                                <option value="12:00">12:00 PM</option>
                                                <option value="13:00">1:00 PM</option>
                                                <option value="14:00">2:00 PM</option>
                                                <option value="15:00">3:00 PM</option>
                                                <option value="16:00">4:00 PM</option>
                                                <option value="17:00">5:00 PM</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-nestie-grey-700 mb-2">
                                            Additional Message (Optional)
                                        </label>
                                        <textarea
                                            value={tourDetails.message}
                                            onChange={(e) => setTourDetails({ ...tourDetails, message: e.target.value })}
                                            placeholder="Any specific requirements or questions..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-nestie-grey-300 rounded-lg focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                        />
                                    </div>

                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-800 mb-2">What happens next?</h4>
                                        <ul className="text-green-700 text-sm space-y-1">
                                            <li>• Your tour request will be sent to the agent</li>
                                            <li>• The agent will confirm or suggest alternative times</li>
                                            <li>• You'll receive a notification with the confirmation</li>
                                            <li>• Meet the agent at the property on the scheduled time</li>
                                        </ul>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={() => setShowTourModal(false)}
                                            className="flex-1 px-4 py-2 border border-nestie-grey-300 text-nestie-grey-700 rounded-lg hover:bg-nestie-grey-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={scheduleTour}
                                            disabled={!tourDetails.preferredDate || !tourDetails.preferredTime || schedulingTour}
                                            className="flex-1 px-4 py-2 bg-nestie-black text-white rounded-lg hover:bg-nestie-grey-800 disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {schedulingTour ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Scheduling...
                                                </>
                                            ) : (
                                                'Schedule Tour'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}