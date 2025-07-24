'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Bell,
  Shield,
  CreditCard,
  Home,
  MessageSquare,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Building,
  Calendar,
  Star,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  email: string
  fullName: string
  phone: string
  role: 'tenant' | 'agent'
  avatar?: string
  location?: string
  bio?: string
  joinedDate: string
  verified: boolean
  stats?: {
    propertiesListed?: number
    propertiesRented?: number
    totalEarnings?: number
    rating?: number
    reviewsCount?: number
  }
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>('profile')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    email: 'user@nestie.com',
    fullName: 'John Doe',
    phone: '+254 700 123 456',
    role: 'tenant',
    location: 'Nairobi, Kenya',
    bio: 'Looking for a modern apartment in Nairobi with good amenities and transport links.',
    joinedDate: '2024-01-15',
    verified: true,
    stats: {
      propertiesRented: 2,
      rating: 4.8,
      reviewsCount: 12
    }
  })

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    marketingEmails: false
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    // Load user profile data
    // This would typically come from Supabase
    setEditedProfile(profile)
  }, [profile])

  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProfile(editedProfile)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordChange(false)
      toast.success('Password updated successfully!')
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Notification settings updated')
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const handleLogout = async () => {
    try {
      // Simulate logout
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedProfile(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Header */}
      <header className="bg-nestie-white border-b border-nestie-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-nestie-grey-600" />
              <span className="text-nestie-grey-600">Back to Dashboard</span>
            </Link>
            
            <h1 className="text-xl font-bold text-nestie-black">Profile</h1>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleProfileUpdate} loading={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* Profile Picture */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-nestie-grey-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-nestie-grey-400" />
                      )}
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 bg-nestie-black text-nestie-white rounded-full p-2 hover:bg-nestie-grey-800">
                        <Camera className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-nestie-black">{profile.fullName}</h2>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile.role === 'agent' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {profile.role === 'agent' ? 'Agent' : 'Tenant'}
                    </span>
                    {profile.verified && (
                      <div className="bg-green-100 text-green-800 rounded-full p-1">
                        <Shield className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                {profile.stats && (
                  <div className="space-y-3 mb-6">
                    {profile.role === 'agent' ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-nestie-grey-600">Properties Listed</span>
                          <span className="font-semibold text-nestie-black">{profile.stats.propertiesListed || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-nestie-grey-600">Total Earnings</span>
                          <span className="font-semibold text-nestie-black">
                            KSh {(profile.stats.totalEarnings || 0).toLocaleString()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-nestie-grey-600">Properties Rented</span>
                        <span className="font-semibold text-nestie-black">{profile.stats.propertiesRented || 0}</span>
                      </div>
                    )}
                    
                    {profile.stats.rating && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-nestie-grey-600">Rating</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-semibold text-nestie-black">{profile.stats.rating}</span>
                          <span className="text-sm text-nestie-grey-500">({profile.stats.reviewsCount})</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-nestie-black text-nestie-white' 
                        : 'text-nestie-grey-600 hover:bg-nestie-grey-100'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile Info</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === 'settings' 
                        ? 'bg-nestie-black text-nestie-white' 
                        : 'text-nestie-grey-600 hover:bg-nestie-grey-100'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === 'security' 
                        ? 'bg-nestie-black text-nestie-white' 
                        : 'text-nestie-grey-600 hover:bg-nestie-grey-100'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Security</span>
                  </button>
                </nav>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-nestie-grey-200 space-y-2">
                  <Link href="/messages">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                    </Button>
                  </Link>
                  
                  {profile.role === 'tenant' && (
                    <Link href="/tenant/portal">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Home className="h-4 w-4 mr-2" />
                        My Rentals
                      </Button>
                    </Link>
                  )}
                  
                  {profile.role === 'agent' && (
                    <Link href="/agent/dashboard">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Building className="h-4 w-4 mr-2" />
                        Agent Dashboard
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        name="fullName"
                        value={isEditing ? editedProfile.fullName : profile.fullName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={isEditing ? editedProfile.email : profile.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        name="phone"
                        value={isEditing ? editedProfile.phone : profile.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      
                      <Input
                        label="Location"
                        name="location"
                        value={isEditing ? editedProfile.location || '' : profile.location || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={isEditing ? editedProfile.bio || '' : profile.bio || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full rounded-lg border border-nestie-grey-300 bg-nestie-white px-3 py-2 text-sm placeholder:text-nestie-grey-400 focus:outline-none focus:ring-2 focus:ring-nestie-black focus:border-transparent disabled:bg-nestie-grey-50 disabled:text-nestie-grey-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-nestie-grey-500 mb-1">Account Type</p>
                        <div className="flex items-center space-x-2">
                          {profile.role === 'agent' ? (
                            <Building className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-medium text-nestie-black capitalize">{profile.role}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-nestie-grey-500 mb-1">Member Since</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-nestie-grey-400" />
                          <span className="font-medium text-nestie-black">
                            {new Date(profile.joinedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-nestie-grey-500 mb-1">Verification Status</p>
                        <div className="flex items-center space-x-2">
                          {profile.verified ? (
                            <>
                              <Shield className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-600">Verified</span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-yellow-600">Pending</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-nestie-black">Email Notifications</h4>
                          <p className="text-sm text-nestie-grey-500">Receive notifications via email</p>
                        </div>
                        <button
                          onClick={() => handleNotificationUpdate('emailNotifications', !notifications.emailNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.emailNotifications ? 'bg-nestie-black' : 'bg-nestie-grey-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-nestie-black">SMS Notifications</h4>
                          <p className="text-sm text-nestie-grey-500">Receive notifications via SMS</p>
                        </div>
                        <button
                          onClick={() => handleNotificationUpdate('smsNotifications', !notifications.smsNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.smsNotifications ? 'bg-nestie-black' : 'bg-nestie-grey-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-nestie-black">Push Notifications</h4>
                          <p className="text-sm text-nestie-grey-500">Receive push notifications in browser</p>
                        </div>
                        <button
                          onClick={() => handleNotificationUpdate('pushNotifications', !notifications.pushNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.pushNotifications ? 'bg-nestie-black' : 'bg-nestie-grey-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-nestie-black">Marketing Emails</h4>
                          <p className="text-sm text-nestie-grey-500">Receive promotional emails and updates</p>
                        </div>
                        <button
                          onClick={() => handleNotificationUpdate('marketingEmails', !notifications.marketingEmails)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.marketingEmails ? 'bg-nestie-black' : 'bg-nestie-grey-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showPasswordChange ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-nestie-grey-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-nestie-black">Password</h4>
                            <p className="text-sm text-nestie-grey-500">Last updated 30 days ago</p>
                          </div>
                          <Button onClick={() => setShowPasswordChange(true)}>
                            Change Password
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border border-nestie-grey-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-nestie-black">Two-Factor Authentication</h4>
                            <p className="text-sm text-nestie-grey-500">Add an extra layer of security</p>
                          </div>
                          <Button variant="outline">
                            Enable 2FA
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-nestie-black">Change Password</h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowPasswordChange(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="relative">
                          <Input
                            label="Current Password"
                            name="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-8 text-nestie-grey-400 hover:text-nestie-grey-600"
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        <div className="relative">
                          <Input
                            label="New Password"
                            name="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-8 text-nestie-grey-400 hover:text-nestie-grey-600"
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        <div className="relative">
                          <Input
                            label="Confirm New Password"
                            name="confirmPassword"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-8 text-nestie-grey-400 hover:text-nestie-grey-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <Button onClick={handlePasswordChange} loading={loading}>
                            Update Password
                          </Button>
                          <Button variant="outline" onClick={() => setShowPasswordChange(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-nestie-grey-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-nestie-black">Download Data</h4>
                          <p className="text-sm text-nestie-grey-500">Download a copy of your account data</p>
                        </div>
                        <Button variant="outline">
                          Download
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                        <div>
                          <h4 className="font-medium text-red-800">Delete Account</h4>
                          <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}