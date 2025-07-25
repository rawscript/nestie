'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, DollarSign, CheckCircle, AlertCircle, X, Eye } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'

interface CalendarEvent {
    id: string
    title: string
    description: string
    start_date: string
    start_time: string
    end_time: string
    location: string
    status: string
    user_type: 'agent' | 'tenant'
    property: {
        id: string
        title: string
        location: any
        images: string[]
    }
    booking: {
        id: string
        booking_type: string
        amount_paid: number
        status: string
    }
}

export default function CalendarPage() {
    const { user } = useAuth()
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [showEventModal, setShowEventModal] = useState(false)

    useEffect(() => {
        if (user) {
            loadCalendarEvents()
        }
    }, [user, selectedDate])

    const loadCalendarEvents = async () => {
        if (!user) return

        setLoading(true)
        try {
            const startDate = getStartDate()
            const endDate = getEndDate()

            const response = await fetch(
                `/api/calendar/events?userId=${user.id}&startDate=${startDate}&endDate=${endDate}`
            )

            if (!response.ok) throw new Error('Failed to load calendar events')

            const { data } = await response.json()
            setEvents(data || [])
        } catch (error) {
            console.error('Error loading calendar events:', error)
            toast.error('Failed to load calendar events')
        } finally {
            setLoading(false)
        }
    }

    const getStartDate = () => {
        const date = new Date(selectedDate)
        if (viewMode === 'week') {
            const day = date.getDay()
            date.setDate(date.getDate() - day)
        } else if (viewMode === 'month') {
            date.setDate(1)
        }
        return date.toISOString().split('T')[0]
    }

    const getEndDate = () => {
        const date = new Date(selectedDate)
        if (viewMode === 'day') {
            return date.toISOString().split('T')[0]
        } else if (viewMode === 'week') {
            const day = date.getDay()
            date.setDate(date.getDate() - day + 6)
        } else if (viewMode === 'month') {
            date.setMonth(date.getMonth() + 1)
            date.setDate(0)
        }
        return date.toISOString().split('T')[0]
    }

    const getEventsForDate = (date: string) => {
        return events.filter(event => event.start_date === date)
    }

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes} ${ampm}`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getBookingTypeColor = (type: string) => {
        switch (type) {
            case 'viewing':
                return 'bg-blue-100 text-blue-800'
            case 'lease':
                return 'bg-green-100 text-green-800'
            case 'purchase':
                return 'bg-purple-100 text-purple-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const generateWeekDays = () => {
        const startDate = new Date(getStartDate())
        const days = []

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)
            days.push(date)
        }

        return days
    }

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event)
        setShowEventModal(true)
    }

    const navigateDate = (direction: 'prev' | 'next') => {
        const date = new Date(selectedDate)

        if (viewMode === 'day') {
            date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
        } else if (viewMode === 'week') {
            date.setDate(date.getDate() + (direction === 'next' ? 7 : -7))
        } else if (viewMode === 'month') {
            date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1))
        }

        setSelectedDate(date.toISOString().split('T')[0])
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
                    <p className="text-gray-600">You need to be logged in to view your calendar.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
                            <p className="text-gray-600">Manage your property appointments and bookings</p>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-2">
                            <div className="flex border border-gray-300 rounded-lg">
                                {['day', 'week', 'month'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode as any)}
                                        className={`px-4 py-2 text-sm font-medium capitalize ${viewMode === mode
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            } ${mode === 'day' ? 'rounded-l-lg' : mode === 'month' ? 'rounded-r-lg' : ''}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigateDate('prev')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            >
                                ←
                            </button>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {new Date(selectedDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    ...(viewMode === 'day' ? { day: 'numeric' } : {})
                                })}
                            </h2>
                            <button
                                onClick={() => navigateDate('next')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            >
                                →
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Today
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Week View */}
                        {viewMode === 'week' && (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="grid grid-cols-7 border-b border-gray-200">
                                    {generateWeekDays().map((date, index) => (
                                        <div key={index} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                                            <div className="text-sm font-medium text-gray-900">
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div className={`text-lg font-semibold mt-1 ${date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                                                ? 'text-blue-600'
                                                : 'text-gray-900'
                                                }`}>
                                                {date.getDate()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 min-h-[400px]">
                                    {generateWeekDays().map((date, index) => {
                                        const dateStr = date.toISOString().split('T')[0]
                                        const dayEvents = getEventsForDate(dateStr)

                                        return (
                                            <div key={index} className="p-2 border-r border-gray-200 last:border-r-0">
                                                <div className="space-y-1">
                                                    {dayEvents.map((event) => (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => handleEventClick(event)}
                                                            className="p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
                                                            style={{
                                                                backgroundColor: event.booking.booking_type === 'viewing' ? '#dbeafe' :
                                                                    event.booking.booking_type === 'lease' ? '#dcfce7' : '#f3e8ff'
                                                            }}
                                                        >
                                                            <div className="text-xs font-medium text-gray-900 truncate">
                                                                {formatTime(event.start_time)}
                                                            </div>
                                                            <div className="text-xs text-gray-600 truncate">
                                                                {event.title}
                                                            </div>
                                                            <div className={`text-xs px-1 py-0.5 rounded mt-1 inline-block ${getBookingTypeColor(event.booking.booking_type)}`}>
                                                                {event.booking.booking_type}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Day View */}
                        {viewMode === 'day' && (
                            <div className="bg-white rounded-lg border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {new Date(selectedDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                </div>

                                <div className="p-6">
                                    {getEventsForDate(selectedDate).length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No appointments scheduled for this day</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {getEventsForDate(selectedDate).map((event) => (
                                                <div
                                                    key={event.id}
                                                    onClick={() => handleEventClick(event)}
                                                    className="p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer transition-shadow"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <Clock className="h-4 w-4 text-gray-500" />
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                                </span>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingTypeColor(event.booking.booking_type)}`}>
                                                                    {event.booking.booking_type}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                                                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                                                <MapPin className="h-4 w-4 mr-1" />
                                                                {event.location}
                                                            </div>
                                                            {event.booking.amount_paid > 0 && (
                                                                <div className="flex items-center text-sm text-green-600">
                                                                    <DollarSign className="h-4 w-4 mr-1" />
                                                                    KSh {event.booking.amount_paid.toLocaleString()} paid
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                                                            {event.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Month View */}
                        {viewMode === 'month' && (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="grid grid-cols-7 border-b border-gray-200">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                        <div key={day} className="p-4 text-center font-medium text-gray-900 border-r border-gray-200 last:border-r-0">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 min-h-[500px]">
                                    {/* Month calendar implementation would go here */}
                                    <div className="col-span-7 p-8 text-center text-gray-500">
                                        Month view coming soon...
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Event Details Modal */}
            {showEventModal && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                                <button onClick={() => setShowEventModal(false)}>
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">{selectedEvent.title}</h4>
                                <p className="text-gray-600 text-sm">{selectedEvent.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(selectedEvent.start_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <p className="text-sm text-gray-900">
                                        {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <p className="text-sm text-gray-900">{selectedEvent.location}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingTypeColor(selectedEvent.booking.booking_type)}`}>
                                        {selectedEvent.booking.booking_type}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedEvent.status)}`}>
                                        {selectedEvent.status}
                                    </span>
                                </div>
                            </div>

                            {selectedEvent.booking.amount_paid > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-green-800">
                                            Payment: KSh {selectedEvent.booking.amount_paid.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => window.open(`/property/${selectedEvent.property.id}`, '_blank')}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Property
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}