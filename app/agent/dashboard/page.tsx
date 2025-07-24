'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Home,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  MessageCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { sampleProperties, sampleBookings, type Property, type Booking } from '@/lib/sampleData'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AgentDashboard() {
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    monthlyRevenue: 0,
    pendingBookings: 0
  })


  useEffect(() => {
    // Load comprehensive sample data
    const agentProperties = sampleProperties.filter(p => p.agent_id === 'agent1') // Show properties for current agent
    setProperties(agentProperties)
    setBookings(sampleBookings)
    
    // Calculate stats
    const occupiedCount = agentProperties.filter(p => p.status === 'occupied').length
    const monthlyRevenue = agentProperties
      .filter(p => p.type === 'rent' && p.status === 'occupied')
      .reduce((sum, p) => sum + p.price, 0)
    
    setStats({
      totalProperties: agentProperties.length,
      occupiedProperties: occupiedCount,
      monthlyRevenue,
      pendingBookings: sampleBookings.filter(b => b.status === 'pending').length
    })
  }, [])

  const handleBookingAction = (bookingId: string, action: 'approve' | 'reject') => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId
        ? { ...booking, status: action === 'approve' ? 'approved' : 'rejected' }
        : booking
    ))
  }

  return (
    <ProtectedRoute requiredRole="agent">
      <div className="min-h-screen bg-nestie-grey-50">
      <Navigation userRole="agent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-nestie-grey-500">Total Properties</p>
                  <p className="text-2xl font-bold text-nestie-black">{stats.totalProperties}</p>
                </div>
                <Home className="h-8 w-8 text-nestie-grey-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-nestie-grey-500">Occupied</p>
                  <p className="text-2xl font-bold text-nestie-black">{stats.occupiedProperties}</p>
                </div>
                <Users className="h-8 w-8 text-nestie-grey-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-nestie-grey-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-nestie-black">KSh {stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-nestie-grey-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-nestie-grey-500">Pending Bookings</p>
                  <p className="text-2xl font-bold text-nestie-black">{stats.pendingBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-nestie-grey-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Properties List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Your Properties</CardTitle>
                    <Link href="/agent/properties/add">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div key={property.id} className="border border-nestie-grey-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-nestie-black">{property.title}</h3>
                            <p className="text-sm text-nestie-grey-500 flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {property.location.address}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : property.status === 'occupied'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-grey-100 text-grey-800'
                              }`}>
                              {property.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4 text-sm text-nestie-grey-600">
                            <span>{property.bedrooms} bed</span>
                            <span>{property.bathrooms} bath</span>
                            <span>{property.area} sqft</span>
                            <span className="font-semibold text-nestie-black">
                              KSh {property.price.toLocaleString()}
                              {property.type === 'rent' && '/month'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bookings & Messages */}
          <div className="space-y-6">
            {/* Pending Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Pending Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.filter(b => b.status === 'pending').map((booking) => (
                      <div key={booking.id} className="border border-nestie-grey-200 rounded-lg p-4">
                        <div className="mb-3">
                          <h4 className="font-medium text-nestie-black">{booking.user_name}</h4>
                          <p className="text-sm text-nestie-grey-500">{booking.user_email}</p>
                        </div>

                        <p className="text-sm text-nestie-grey-600 mb-3">{booking.message}</p>

                        <div className="flex items-center justify-between text-sm text-nestie-grey-500 mb-3">
                          <span>Visit: {new Date(booking.visit_date).toLocaleDateString()}</span>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleBookingAction(booking.id, 'approve')}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBookingAction(booking.id, 'reject')}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}

                    {bookings.filter(b => b.status === 'pending').length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-nestie-grey-300 mx-auto mb-3" />
                        <p className="text-nestie-grey-500">No pending bookings</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Property
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      View Messages
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}