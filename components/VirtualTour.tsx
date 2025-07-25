'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Camera,
  MapPin,
  Info,
  Share,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Bed,
  Bath,
  Car,
  Wifi,
  Shield,
  Building
} from 'lucide-react'

interface VirtualTourProps {
  property: any
  onClose: () => void
  onInteraction?: (type: string, data: any) => void
}

interface TourScene {
  id: string
  name: string
  type: 'room' | 'exterior' | 'amenity'
  image360: string
  thumbnail: string
  description: string
  hotspots: Array<{
    id: string
    x: number // percentage from left
    y: number // percentage from top
    type: 'navigation' | 'info' | 'media'
    targetScene?: string
    title: string
    description?: string
    media?: string
  }>
  audio?: string
  ambientSound?: string
}

interface TourData {
  id: string
  property_id: string
  title: string
  description: string
  scenes: TourScene[]
  startScene: string
  created_at: string
}

export default function VirtualTour({ property, onClose, onInteraction }: VirtualTourProps) {
  const [tourData, setTourData] = useState<TourData | null>(null)
  const [currentScene, setCurrentScene] = useState<TourScene | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showSceneList, setShowSceneList] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null)
  const [viewTime, setViewTime] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const ambientAudioRef = useRef<HTMLAudioElement>(null)
  const viewTimeRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadTourData()
    return () => {
      if (viewTimeRef.current) {
        clearInterval(viewTimeRef.current)
      }
    }
  }, [property.id])

  useEffect(() => {
    // Track viewing time
    viewTimeRef.current = setInterval(() => {
      setViewTime(prev => prev + 1)
    }, 1000)

    return () => {
      if (viewTimeRef.current) {
        clearInterval(viewTimeRef.current)
      }
    }
  }, [currentScene])

  const loadTourData = async () => {
    try {
      setIsLoading(true)
      
      // In a real implementation, this would fetch from your API
      // For now, we'll create mock tour data
      const mockTourData: TourData = {
        id: `tour_${property.id}`,
        property_id: property.id,
        title: `Virtual Tour - ${property.title}`,
        description: 'Explore this property in 360°',
        startScene: 'living_room',
        created_at: new Date().toISOString(),
        scenes: [
          {
            id: 'living_room',
            name: 'Living Room',
            type: 'room',
            image360: '/api/placeholder/360/living-room.jpg',
            thumbnail: '/api/placeholder/200/living-room.jpg',
            description: 'Spacious living room with modern furnishing',
            hotspots: [
              {
                id: 'to_kitchen',
                x: 75,
                y: 45,
                type: 'navigation',
                targetScene: 'kitchen',
                title: 'Go to Kitchen',
                description: 'Navigate to the modern kitchen'
              },
              {
                id: 'tv_info',
                x: 30,
                y: 60,
                type: 'info',
                title: 'Entertainment Center',
                description: '65" Smart TV with surround sound system'
              },
              {
                id: 'to_bedroom',
                x: 20,
                y: 40,
                type: 'navigation',
                targetScene: 'bedroom',
                title: 'Go to Bedroom',
                description: 'Navigate to the master bedroom'
              }
            ],
            audio: '/audio/living-room-description.mp3',
            ambientSound: '/audio/ambient-home.mp3'
          },
          {
            id: 'kitchen',
            name: 'Kitchen',
            type: 'room',
            image360: '/api/placeholder/360/kitchen.jpg',
            thumbnail: '/api/placeholder/200/kitchen.jpg',
            description: 'Modern kitchen with premium appliances',
            hotspots: [
              {
                id: 'to_living',
                x: 25,
                y: 45,
                type: 'navigation',
                targetScene: 'living_room',
                title: 'Back to Living Room',
                description: 'Return to the living room'
              },
              {
                id: 'appliances_info',
                x: 60,
                y: 55,
                type: 'info',
                title: 'Premium Appliances',
                description: 'Stainless steel appliances including dishwasher, microwave, and refrigerator'
              },
              {
                id: 'to_balcony',
                x: 80,
                y: 35,
                type: 'navigation',
                targetScene: 'balcony',
                title: 'Go to Balcony',
                description: 'Step out to the balcony'
              }
            ],
            audio: '/audio/kitchen-description.mp3'
          },
          {
            id: 'bedroom',
            name: 'Master Bedroom',
            type: 'room',
            image360: '/api/placeholder/360/bedroom.jpg',
            thumbnail: '/api/placeholder/200/bedroom.jpg',
            description: 'Comfortable master bedroom with ensuite',
            hotspots: [
              {
                id: 'to_living',
                x: 80,
                y: 45,
                type: 'navigation',
                targetScene: 'living_room',
                title: 'Back to Living Room',
                description: 'Return to the living room'
              },
              {
                id: 'closet_info',
                x: 15,
                y: 50,
                type: 'info',
                title: 'Walk-in Closet',
                description: 'Spacious walk-in closet with built-in storage'
              },
              {
                id: 'to_bathroom',
                x: 45,
                y: 30,
                type: 'navigation',
                targetScene: 'bathroom',
                title: 'Go to Bathroom',
                description: 'Visit the ensuite bathroom'
              }
            ],
            audio: '/audio/bedroom-description.mp3'
          },
          {
            id: 'bathroom',
            name: 'Ensuite Bathroom',
            type: 'room',
            image360: '/api/placeholder/360/bathroom.jpg',
            thumbnail: '/api/placeholder/200/bathroom.jpg',
            description: 'Luxurious bathroom with modern fixtures',
            hotspots: [
              {
                id: 'to_bedroom',
                x: 70,
                y: 45,
                type: 'navigation',
                targetScene: 'bedroom',
                title: 'Back to Bedroom',
                description: 'Return to the bedroom'
              },
              {
                id: 'fixtures_info',
                x: 40,
                y: 60,
                type: 'info',
                title: 'Premium Fixtures',
                description: 'Rain shower, soaking tub, and double vanity'
              }
            ],
            audio: '/audio/bathroom-description.mp3'
          },
          {
            id: 'balcony',
            name: 'Balcony',
            type: 'exterior',
            image360: '/api/placeholder/360/balcony.jpg',
            thumbnail: '/api/placeholder/200/balcony.jpg',
            description: 'Private balcony with city views',
            hotspots: [
              {
                id: 'to_kitchen',
                x: 50,
                y: 70,
                type: 'navigation',
                targetScene: 'kitchen',
                title: 'Back to Kitchen',
                description: 'Return to the kitchen'
              },
              {
                id: 'view_info',
                x: 30,
                y: 30,
                type: 'info',
                title: 'City View',
                description: 'Panoramic view of the city skyline'
              }
            ],
            audio: '/audio/balcony-description.mp3',
            ambientSound: '/audio/ambient-outdoor.mp3'
          }
        ]
      }

      setTourData(mockTourData)
      const startScene = mockTourData.scenes.find(s => s.id === mockTourData.startScene)
      if (startScene) {
        setCurrentScene(startScene)
      }
      
      // Track tour start
      onInteraction?.('tour_start', {
        property_id: property.id,
        tour_id: mockTourData.id,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error loading tour data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToScene = (sceneId: string) => {
    if (!tourData) return

    const scene = tourData.scenes.find(s => s.id === sceneId)
    if (scene) {
      // Track scene navigation
      onInteraction?.('scene_navigation', {
        from_scene: currentScene?.id,
        to_scene: sceneId,
        view_time: viewTime,
        timestamp: new Date().toISOString()
      })

      setCurrentScene(scene)
      setRotation(0)
      setZoom(1)
      setViewTime(0)
      
      // Play scene audio if available
      if (scene.audio && audioRef.current) {
        audioRef.current.src = scene.audio
        if (!isMuted) {
          audioRef.current.play().catch(console.error)
        }
      }

      // Play ambient sound if available
      if (scene.ambientSound && ambientAudioRef.current) {
        ambientAudioRef.current.src = scene.ambientSound
        ambientAudioRef.current.loop = true
        if (!isMuted) {
          ambientAudioRef.current.play().catch(console.error)
        }
      }
    }
  }

  const handleHotspotClick = (hotspot: any) => {
    onInteraction?.('hotspot_click', {
      hotspot_id: hotspot.id,
      hotspot_type: hotspot.type,
      scene_id: currentScene?.id,
      timestamp: new Date().toISOString()
    })

    if (hotspot.type === 'navigation' && hotspot.targetScene) {
      navigateToScene(hotspot.targetScene)
    } else if (hotspot.type === 'info') {
      setSelectedHotspot(hotspot)
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
    
    if (ambientAudioRef.current) {
      ambientAudioRef.current.muted = !isMuted
    }
  }

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2
      return Math.max(0.5, Math.min(3, newZoom))
    })
  }

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => {
      const newRotation = direction === 'left' ? prev - 15 : prev + 15
      return newRotation % 360
    })
  }

  const resetView = () => {
    setRotation(0)
    setZoom(1)
  }

  const takeScreenshot = () => {
    if (imageRef.current) {
      // Create canvas and capture current view
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = imageRef.current.naturalWidth
        canvas.height = imageRef.current.naturalHeight
        
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.scale(zoom, zoom)
        ctx.drawImage(imageRef.current, -canvas.width / 2, -canvas.height / 2)
        ctx.restore()
        
        // Download screenshot
        const link = document.createElement('a')
        link.download = `${property.title}-tour-screenshot.png`
        link.href = canvas.toDataURL()
        link.click()
        
        onInteraction?.('screenshot_taken', {
          scene_id: currentScene?.id,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  const shareVirtualTour = () => {
    const shareData = {
      title: `Virtual Tour - ${property.title}`,
      text: `Check out this virtual tour of ${property.title}`,
      url: `${window.location.origin}/property/${property.id}/tour`
    }

    if (navigator.share) {
      navigator.share(shareData).catch(console.error)
    } else {
      navigator.clipboard.writeText(shareData.url)
        .then(() => alert('Tour link copied to clipboard!'))
        .catch(console.error)
    }

    onInteraction?.('tour_shared', {
      property_id: property.id,
      timestamp: new Date().toISOString()
    })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Virtual Tour...</p>
        </div>
      </div>
    )
  }

  if (!tourData || !currentScene) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <Building className="h-12 w-12 mx-auto mb-4" />
          <p>Virtual tour not available for this property</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-black z-50 ${isFullscreen ? 'cursor-none' : ''}`}
    >
      {/* Main Tour View */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          ref={imageRef}
          src={currentScene.image360}
          alt={currentScene.name}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{
            transform: `rotate(${rotation}deg) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />

        {/* Hotspots */}
        {currentScene.hotspots.map((hotspot) => (
          <motion.button
            key={hotspot.id}
            className="absolute w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200 hover:scale-110"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handleHotspotClick(hotspot)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {hotspot.type === 'navigation' ? (
              <ChevronRight className="h-4 w-4 text-black" />
            ) : (
              <Info className="h-4 w-4 text-black" />
            )}
          </motion.button>
        ))}

        {/* Pulse animation for hotspots */}
        {currentScene.hotspots.map((hotspot) => (
          <div
            key={`pulse-${hotspot.id}`}
            className="absolute w-8 h-8 bg-white bg-opacity-30 rounded-full animate-ping pointer-events-none"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
            <h3 className="font-semibold">{currentScene.name}</h3>
            <p className="text-sm opacity-80">{property.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
          >
            <Info className="h-5 w-5" />
          </button>
          
          <button
            onClick={shareVirtualTour}
            className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
          >
            <Share className="h-5 w-5" />
          </button>
          
          <button
            onClick={takeScreenshot}
            className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex justify-between items-end">
          {/* Scene Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSceneList(!showSceneList)}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <Home className="h-5 w-5" />
            </button>
            
            {showSceneList && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-2"
              >
                {tourData.scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => navigateToScene(scene.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      scene.id === currentScene.id
                        ? 'bg-white text-black'
                        : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                    }`}
                  >
                    <span className="text-sm font-medium">{scene.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRotate('left')}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => handleZoom('out')}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            
            <button
              onClick={resetView}
              className="px-3 py-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors text-sm"
            >
              Reset
            </button>
            
            <button
              onClick={() => handleZoom('in')}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => handleRotate('right')}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <RotateCcw className="h-5 w-5 transform rotate-180" />
            </button>
          </div>

          {/* Audio and Fullscreen Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Property Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-xl z-10 max-h-[calc(100vh-8rem)] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{property.title}</h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">{property.location?.address}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    KSh {parseInt(property.price).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    /{property.listingType === 'rent' ? 'month' : property.listingType}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
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

                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.slice(0, 6).map((amenity: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Current Scene</h4>
                  <p className="text-sm text-gray-600">{currentScene.description}</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-2">
                    Viewing time: {Math.floor(viewTime / 60)}:{(viewTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Scenes visited: {tourData.scenes.length}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotspot Info Modal */}
      <AnimatePresence>
        {selectedHotspot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
            onClick={() => setSelectedHotspot(null)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{selectedHotspot.title}</h3>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">{selectedHotspot.description}</p>
              
              {selectedHotspot.media && (
                <img
                  src={selectedHotspot.media}
                  alt={selectedHotspot.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <button
                onClick={() => setSelectedHotspot(null)}
                className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Elements */}
      <audio ref={audioRef} />
      <audio ref={ambientAudioRef} />
    </div>
  )
}