'use client'

import React, { useState } from 'react'
import { Camera, Play, ExternalLink } from 'lucide-react'
import VirtualTour from './VirtualTour'

interface VirtualTourButtonProps {
  property: any
  className?: string
}

export default function VirtualTourButton({ property, className = '' }: VirtualTourButtonProps) {
  const [showVirtualTour, setShowVirtualTour] = useState(false)

  // Check if property has virtual tour URL
  if (!property.virtual_tour_url) {
    return null
  }

  const handleVirtualTourClick = () => {
    // If it's an external URL (like Matterport), open in new tab
    if (property.virtual_tour_url.includes('matterport.com') || 
        property.virtual_tour_url.includes('kuula.co') ||
        property.virtual_tour_url.includes('ricoh360.com')) {
      window.open(property.virtual_tour_url, '_blank')
    } else {
      // Use our custom virtual tour component
      setShowVirtualTour(true)
    }
  }

  const isExternalTour = property.virtual_tour_url.includes('matterport.com') || 
                        property.virtual_tour_url.includes('kuula.co') ||
                        property.virtual_tour_url.includes('ricoh360.com')

  return (
    <>
      <button
        onClick={handleVirtualTourClick}
        className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <Camera className="h-4 w-4" />
        <span>Virtual Tour</span>
        {isExternalTour && <ExternalLink className="h-3 w-3" />}
      </button>

      {/* Custom Virtual Tour Modal */}
      {showVirtualTour && !isExternalTour && (
        <VirtualTour
          property={property}
          onClose={() => setShowVirtualTour(false)}
          onInteraction={(type, data) => {
            console.log('Virtual tour interaction:', type, data)
          }}
        />
      )}
    </>
  )
}