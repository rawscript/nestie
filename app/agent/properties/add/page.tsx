'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Upload,
    MapPin,
    Home,
    DollarSign,
    Plus,
    X,
    Bell,
    MessageSquare,
    Search,
    User
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface PropertyFormData {
    title: string
    description: string
    price: number
    type: 'rent' | 'sale'
    bedrooms: number
    bathrooms: number
    area: number
    location: {
        address: string
        lat: number
        lng: number
    }
    amenities: string[]
    images: File[]
}

export default function AddPropertyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [newAmenity, setNewAmenity] = useState('')
    const [formData, setFormData] = useState<PropertyFormData>({
        title: '',
        description: '',
        price: 0,
        type: 'rent',
        bedrooms: 1,
        bathrooms: 1,
        area: 0,
        location: {
            address: '',
            lat: -1.2921,
            lng: 36.8219
        },
        amenities: [],
        images: []
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        if (name.includes('.')) {
            const [parent, child] = name.split('.')
            if (parent === 'location') {
                setFormData(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        [child]: child === 'lat' || child === 'lng' ? Number(value) : value
                    }
                }))
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'price' || name === 'bedrooms' || name === 'bathrooms' || name === 'area'
                    ? Number(value)
                    : value
            }))
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }))
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const addAmenity = () => {
        if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
            setFormData(prev => ({
                ...prev,
                amenities: [...prev.amenities, newAmenity.trim()]
            }))
            setNewAmenity('')
        }
    }

    const removeAmenity = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.filter(a => a !== amenity)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validate form
            if (!formData.title || !formData.description || !formData.location.address) {
                toast.error('Please fill in all required fields')
                return
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            toast.success('Property added successfully!')
            router.push('/agent/dashboard')
        } catch (error) {
            toast.error('Failed to add property')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-nestie-grey-50 pb-20 md:pb-0">
            {/* Header */}
            <header className="bg-nestie-white border-b border-nestie-grey-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/agent/dashboard" className="flex items-center space-x-2">
                            <ArrowLeft className="h-5 w-5 text-nestie-grey-600" />
                            <span className="text-nestie-grey-600 hidden sm:inline">Back to Dashboard</span>
                        </Link>

                        <div className="flex items-center space-x-2">
                            <Home className="h-6 w-6 text-nestie-black" />
                            <span className="text-xl font-bold text-nestie-black">Add Property</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    label="Property Title *"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Modern 2BR Apartment in Westlands"
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe the property in detail..."
                                        rows={4}
                                        className="w-full rounded-lg border border-nestie-grey-300 bg-nestie-white px-3 py-2 text-sm placeholder:text-nestie-grey-400 focus:outline-none focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-nestie-grey-700 mb-1">
                                            Property Type *
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-nestie-grey-300 bg-nestie-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nestie-black focus:border-transparent"
                                        >
                                            <option value="rent">For Rent</option>
                                            <option value="sale">For Sale</option>
                                        </select>
                                    </div>

                                    <Input
                                        label="Price (KSh) *"
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="85000"
                                        required
                                    />
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
                            <CardHeader>
                                <CardTitle>Property Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Input
                                        label="Bedrooms"
                                        name="bedrooms"
                                        type="number"
                                        min="0"
                                        value={formData.bedrooms}
                                        onChange={handleInputChange}
                                    />

                                    <Input
                                        label="Bathrooms"
                                        name="bathrooms"
                                        type="number"
                                        min="0"
                                        value={formData.bathrooms}
                                        onChange={handleInputChange}
                                    />

                                    <Input
                                        label="Area (sqft)"
                                        name="area"
                                        type="number"
                                        min="0"
                                        value={formData.area}
                                        onChange={handleInputChange}
                                        placeholder="1200"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Location */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <MapPin className="h-5 w-5 mr-2" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    label="Address *"
                                    name="location.address"
                                    value={formData.location.address}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Westlands, Nairobi"
                                    required
                                />

                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <Input
                                        label="Latitude"
                                        name="location.lat"
                                        type="number"
                                        step="any"
                                        value={formData.location.lat}
                                        onChange={handleInputChange}
                                        placeholder="-1.2921"
                                    />

                                    <Input
                                        label="Longitude"
                                        name="location.lng"
                                        type="number"
                                        step="any"
                                        value={formData.location.lng}
                                        onChange={handleInputChange}
                                        placeholder="36.8219"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Amenities */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Amenities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-4">
                                    <Input
                                        placeholder="Add amenity (e.g., Swimming Pool)"
                                        value={newAmenity}
                                        onChange={(e) => setNewAmenity(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                                    />
                                    <Button type="button" onClick={addAmenity}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {formData.amenities.map((amenity, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-nestie-grey-100 text-nestie-grey-700"
                                        >
                                            {amenity}
                                            <button
                                                type="button"
                                                onClick={() => removeAmenity(amenity)}
                                                className="ml-2 text-nestie-grey-500 hover:text-nestie-grey-700"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Images */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Images</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-nestie-grey-300 rounded-lg p-6 text-center">
                                    <Upload className="h-12 w-12 text-nestie-grey-400 mx-auto mb-4" />
                                    <p className="text-nestie-grey-600 mb-2">Upload property images</p>
                                    <p className="text-sm text-nestie-grey-500 mb-4">
                                        Drag and drop files here, or click to select files
                                    </p>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload">
                                        <Button type="button" variant="outline" className="cursor-pointer">
                                            Select Images
                                        </Button>
                                    </label>
                                </div>

                                {formData.images.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-nestie-grey-700 mb-2">
                                            Selected Images ({formData.images.length})
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {formData.images.map((file, index) => (
                                                <div key={index} className="relative">
                                                    <div className="aspect-square bg-nestie-grey-200 rounded-lg flex items-center justify-center">
                                                        <span className="text-xs text-nestie-grey-500 text-center p-2">
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-end space-x-4"
                    >
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Add Property
                        </Button>
                    </motion.div>
                </form>
            </div>

            {/* Mobile Footer Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-nestie-white border-t border-nestie-grey-200 md:hidden z-50">
                <div className="flex items-center justify-around py-2">
                    <Link 
                        href="/dashboard" 
                        className="flex flex-col items-center p-2 text-nestie-grey-600 hover:text-nestie-black transition-colors"
                    >
                        <Home className="h-5 w-5" />
                        <span className="text-xs mt-1">Home</span>
                    </Link>
                    
                    <Link 
                        href="/search" 
                        className="flex flex-col items-center p-2 text-nestie-grey-600 hover:text-nestie-black transition-colors"
                    >
                        <Search className="h-5 w-5" />
                        <span className="text-xs mt-1">Search</span>
                    </Link>
                    
                    <Link 
                        href="/messages" 
                        className="flex flex-col items-center p-2 text-nestie-grey-600 hover:text-nestie-black transition-colors relative"
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-xs mt-1">Messages</span>
                        {/* Notification badge */}
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            2
                        </div>
                    </Link>
                    
                    <Link 
                        href="/notifications" 
                        className="flex flex-col items-center p-2 text-nestie-grey-600 hover:text-nestie-black transition-colors relative"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="text-xs mt-1">Alerts</span>
                        {/* Notification badge */}
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            5
                        </div>
                    </Link>
                    
                    <Link 
                        href="/profile" 
                        className="flex flex-col items-center p-2 text-nestie-grey-600 hover:text-nestie-black transition-colors"
                    >
                        <User className="h-5 w-5" />
                        <span className="text-xs mt-1">Profile</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}