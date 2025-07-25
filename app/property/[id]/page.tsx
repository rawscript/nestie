'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import CalendarBooking from '@/components/CalendarBooking'
import { useAuth } from '@/lib/auth'
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  MessageCircle,
  Phone,
  Mail,
  Star,
  ChevronLeft,
  ChevronRight,
  Home,
  Utensils,
  Car,
  Trees,
  Building,
  ImageIcon,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { YandexMap } from '@/components/YandexMap'
import { sampleProperties, sampleAgents } from '@/lib/sampleData'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

// Mock labeled images for demo
const mockLabeledImages = {
  exterior: [
    { url: '/api/placeholder/800/600', label: 'Front View' },
    { url: '/api/placeholder/800/600', label: 'Side View' },
    { url: '/api/placeholder/800/600', label: 'Back View' }
  ],
  living_room: [
    { url: '/api/placeholder/800/600', label: 'Main Living Area' },
    { url: '/api/placeholder/800/600', label: 'Living Room View 2' }
  ],
  kitchen: [
    { url: '/api/placeholder/800/600', label: 'Modern Kitchen' },
    { url: '/api/placeholder/800/600', label: 'Kitchen Island' }
  ],
  bedroom: [
    { url: '/api/placeholder/800/600', label: 'Master Bedroom' },
    { url: '/api/placeholder/800/600', label: 'Bedroom 2' },
    { url: '/api/placeholder/800/600', label: 'Guest Bedroom' }
  ],
  bathroom: [
    { url: '/api/placeholder/800/600', label: 'Master Bathroom' },
    { url: '/api/placeholder/800/600', label: 'Guest Bathroom' }
  ],
  garden: [
    { url: '/api/placeholder/800/600', label: 'Back Garden' },
    { url: '/api/placeholder/800/600', label: 'Garden View' }
  ],
  parking: [
    { url: '/api/placeholder/800/600', label: 'Parking Area' }
  ]
}

const ROOM_ICONS = {
  exterior: Home,
  living_room: Home,
  kitchen: Utensils,
  bedroom: Bed,
  bathroom: Bath,
  dining_room: Utensils,
  balcony: Building,
  garden: Trees,
  parking: Car,
  amenities: Building,
  neighborhood: MapPin,
  other: ImageIcon
}

const ROOM_LABELS = {
  exterior: 'Exterior',
  living_room: 'Living Room',
  kitchen: 'Kitchen',
  bedroom: 'Bedrooms',
  bathroom: 'Bathrooms',
  dining_room: 'Dining Room',
  balcony: 'Balcony/Terrace',
  garden: 'Garden/Yard',
  parking: 'Parking',
  amenities: 'Amenities',
  neighborhood: 'Neighborhood',
  other: 'Other'
}

export default function PropertyDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [agent, setAgent] = useState<any>(null)
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>('exterior')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    // Find property by ID
    const foundProperty = sampleProperties.find(p => p.id === params.id)
    if (foundProperty) {
      setProperty(foundProperty)

      // Find agent
      const foundAgent = sampleAgents.find(a => a.id === foundProperty.agent_id)
      setAgent(foundAgent)
    }
  }, [params.id])

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: property?.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  const handleBookViewing = () => {
    if (!user) {
      toast.error('Please login to book a viewing')
      router.push('/auth/login')
      return
    }
    setShowBookingModal(true)
  }

  const handleScheduleTour = () => {
    if (!user) {
      toast.error('Please login to schedule a tour')
      router.push('/auth/login')
      return
    }
    setShowBookingModal(true)
  }

  const handleContact = () => {
    toast.success('Contact information copied')
  }

  const handleBookingComplete = (bookingData: any) => {
    toast.success('Booking completed successfully!')
    setShowBookingModal(false)
    // Optionally redirect to calendar or dashboard
  }

  const getImagesForCategory = (category: string) => {
    return mockLabeledImages[category as keyof typeof mockLabeledImages] || []
  }

  const availableCategories = Object.keys(mockLabeledImages).filter(
    category => getImagesForCategory(category).length > 0
  )

  const nextImage = () => {
    const images = getImagesForCategory(selectedImageCategory)
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    const images = getImagesForCategory(selectedImageCategory)
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-nestie-grey-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestie-black mx-auto mb-4"></div>
          <p className="text-nestie-grey-600">Loading property...</p>
        </div>
      </div>
    )
  }

  const currentImages = getImagesForCategory(selectedImageCategory)
  const currentImage = currentImages[selectedImageIndex]

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Header */}
      <header className="bg-nestie-white border-b border-nestie-grey-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-nestie-grey-600" />
              <span className="text-nestie-grey-600 hidden sm:inline">Back to Search</span>
            </Link>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                className={isFavorite ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery with Room Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="aspect-video bg-nestie-grey-200 relative">
                  {currentImage && (
                    <img
                      src={currentImage.url}
                      alt={currentImage.label}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setShowImageModal(true)}
                    />
                  )}

                  {/* Navigation Arrows */}
                  {currentImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-nestie-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-nestie-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-nestie-black bg-opacity-75 text-white px-3 py-1 rounded-md text-sm">
                    {selectedImageIndex + 1} / {currentImages.length}
                  </div>

                  {/* Current Room Label */}
                  <div className="absolute top-4 left-4 bg-nestie-black bg-opacity-75 text-white px-3 py-1 rounded-md text-sm">
                    {currentImage?.label}
                  </div>
                </div>

                {/* Room Category Tabs */}
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableCategories.map(category => {
                      const Icon = ROOM_ICONS[category as keyof typeof ROOM_ICONS]
                      const images = getImagesForCategory(category)

                      return (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedImageCategory(category)
                            setSelectedImageIndex(0)
                          }}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedImageCategory === category
                            ? 'bg-nestie-black text-nestie-white'
                            : 'bg-nestie-grey-100 text-nestie-grey-700 hover:bg-nestie-grey-200'
                            }`}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {ROOM_LABELS[category as keyof typeof ROOM_LABELS]} ({images.length})
                        </button>
                      )
                    })}
                  </div>

                  {/* Thumbnail Strip */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {currentImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImageIndex === index
                          ? 'border-nestie-black'
                          : 'border-nestie-grey-300 hover:border-nestie-grey-400'
                          }`}
                      >
                        <img
                          src={image.url}
                          alt={image.label}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Property Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-nestie-black mb-2">{property.title}</h1>
                      <div className="flex items-center text-nestie-grey-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.location.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-nestie-black">
                        KSh {property.price.toLocaleString()}
                        {property.type === 'rent' && '/month'}
                      </div>
                      <div className="text-sm text-nestie-grey-500">
                        {property.type === 'rent' ? 'Monthly Rent' : 'Sale Price'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center">
                      <Bed className="h-5 w-5 text-nestie-grey-400 mr-2" />
                      <span className="text-nestie-grey-700">{property.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-5 w-5 text-nestie-grey-400 mr-2" />
                      <span className="text-nestie-grey-700">{property.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center">
                      <Square className="h-5 w-5 text-nestie-grey-400 mr-2" />
                      <span className="text-nestie-grey-700">{property.area} sqft</span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold text-nestie-black mb-3">Description</h3>
                    <p className="text-nestie-grey-700 leading-relaxed">{property.description}</p>
                  </div>

                  {property.features && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-nestie-black mb-3">Features & Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.features.map((feature: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-nestie-grey-100 text-nestie-grey-700 rounded-full text-sm"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <YandexMap
                    properties={[{
                      id: property.id,
                      title: property.title,
                      location: { lat: property.location.lat, lng: property.location.lng },
                      price: property.price
                    }]}
                    center={[property.location.lat, property.location.lng]}
                    zoom={15}
                    height="h-64"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Info */}
            {agent && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Agent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-nestie-grey-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-nestie-grey-600 font-semibold">
                          {agent.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-nestie-black">{agent.name}</h3>
                        <p className="text-sm text-nestie-grey-500">{agent.company}</p>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-nestie-grey-600 ml-1">
                            {agent.rating} ({agent.properties_count} properties)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button className="w-full" onClick={handleBookViewing}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Viewing
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleContact}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={toggleFavorite}>
                      <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                      {isFavorite ? 'Remove from Favorites' : 'Save Property'}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Property
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleScheduleTour}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Tour
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage.url}
                alt={currentImage.label}
                className="max-w-full max-h-full object-contain"
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 bg-nestie-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-4 bg-nestie-black bg-opacity-75 text-white px-4 py-2 rounded-md">
                {currentImage.label}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Calendar Booking Modal */}
      {showBookingModal && property && agent && (
        <CalendarBooking
          property={property}
          agent={agent}
          onClose={() => setShowBookingModal(false)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  )
}