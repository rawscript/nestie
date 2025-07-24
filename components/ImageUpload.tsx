'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Tag, Image as ImageIcon, Camera, MapPin, Home, Utensils, Bath, Bed, Car, Trees, Building } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export interface LabeledImage {
  file: File
  label: string
  preview: string
}

interface ImageUploadProps {
  onImagesChange: (images: LabeledImage[]) => void
  maxImages?: number
  className?: string
}

const IMAGE_LABELS = [
  { value: 'exterior', label: 'Exterior', icon: Home },
  { value: 'living_room', label: 'Living Room', icon: Home },
  { value: 'kitchen', label: 'Kitchen', icon: Utensils },
  { value: 'bedroom', label: 'Bedroom', icon: Bed },
  { value: 'bathroom', label: 'Bathroom', icon: Bath },
  { value: 'dining_room', label: 'Dining Room', icon: Utensils },
  { value: 'balcony', label: 'Balcony/Terrace', icon: Building },
  { value: 'garden', label: 'Garden/Yard', icon: Trees },
  { value: 'parking', label: 'Parking', icon: Car },
  { value: 'amenities', label: 'Amenities', icon: Building },
  { value: 'neighborhood', label: 'Neighborhood', icon: MapPin },
  { value: 'other', label: 'Other', icon: ImageIcon }
]

export function ImageUpload({ onImagesChange, maxImages = 15, className = '' }: ImageUploadProps) {
  const [images, setImages] = useState<LabeledImage[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList) => {
    const newImages = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        label: 'other', // Default label
        preview: URL.createObjectURL(file)
      }))
    
    const totalImages = images.length + newImages.length
    
    if (totalImages > maxImages) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const removeImage = (index: number) => {
    const imageToRemove = images[index]
    URL.revokeObjectURL(imageToRemove.preview) // Clean up memory
    
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const updateImageLabel = (index: number, label: string) => {
    const updatedImages = images.map((img, i) => 
      i === index ? { ...img, label } : img
    )
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const getLabelInfo = (labelValue: string) => {
    return IMAGE_LABELS.find(label => label.value === labelValue) || IMAGE_LABELS[IMAGE_LABELS.length - 1]
  }

  const getImagesByLabel = () => {
    const grouped: { [key: string]: LabeledImage[] } = {}
    images.forEach(img => {
      if (!grouped[img.label]) {
        grouped[img.label] = []
      }
      grouped[img.label].push(img)
    })
    return grouped
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
              dragActive
                ? 'border-nestie-black bg-nestie-grey-50'
                : 'border-nestie-grey-300 hover:border-nestie-grey-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-nestie-grey-400" />
              <div className="mt-4">
                <Button type="button" onClick={onButtonClick}>
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Property Images
                </Button>
              </div>
              <p className="mt-2 text-sm text-nestie-grey-500">
                Or drag and drop images here
              </p>
              <p className="text-xs text-nestie-grey-400">
                PNG, JPG, GIF up to 10MB each ({images.length}/{maxImages} images)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Management */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-nestie-black">Property Images ({images.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(getImagesByLabel()).map(([label, imgs]) => {
                      const labelInfo = getLabelInfo(label)
                      const Icon = labelInfo.icon
                      return (
                        <span
                          key={label}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-nestie-grey-100 text-nestie-grey-700"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {labelInfo.label} ({imgs.length})
                        </span>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Grid with Labels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => {
                const labelInfo = getLabelInfo(image.label)
                const Icon = labelInfo.icon
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <Card className="overflow-hidden">
                      <div className="aspect-video bg-nestie-grey-100 relative">
                        <img
                          src={image.preview}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        {/* Current Label Badge */}
                        <div className="absolute top-2 left-2 bg-nestie-black bg-opacity-75 text-white px-2 py-1 rounded-md text-xs flex items-center">
                          <Icon className="h-3 w-3 mr-1" />
                          {labelInfo.label}
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <p className="text-xs text-nestie-grey-500 truncate">{image.file.name}</p>
                          
                          {/* Label Selector */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-nestie-grey-700 flex items-center">
                              <Tag className="h-3 w-3 mr-1" />
                              Room/Area Type
                            </label>
                            <select
                              value={image.label}
                              onChange={(e) => updateImageLabel(index, e.target.value)}
                              className="w-full text-xs border border-nestie-grey-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-nestie-black"
                            >
                              {IMAGE_LABELS.map(label => (
                                <option key={label.value} value={label.value}>
                                  {label.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Quick Label Actions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-nestie-black mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {IMAGE_LABELS.slice(0, 6).map(label => {
                    const Icon = label.icon
                    const count = images.filter(img => img.label === label.value).length
                    
                    return (
                      <Button
                        key={label.value}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Label the last uploaded image with this category
                          const lastIndex = images.length - 1
                          if (lastIndex >= 0) {
                            updateImageLabel(lastIndex, label.value)
                          }
                        }}
                        className="text-xs"
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {label.label} {count > 0 && `(${count})`}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}