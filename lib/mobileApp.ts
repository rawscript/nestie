// Progressive Web App (PWA) utilities for mobile experience

export interface PWAInstallPrompt {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export class MobileAppService {
    private static installPrompt: PWAInstallPrompt | null = null

    // Initialize PWA features
    static init() {
        if (typeof window === 'undefined') return

        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault()
            this.installPrompt = e as any
            this.showInstallBanner()
        })

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('Nestie PWA installed successfully')
            this.hideInstallBanner()
            this.trackInstallation()
        })

        // Check if app is already installed
        if (this.isInstalled()) {
            this.hideInstallBanner()
        }

        // Initialize push notifications
        this.initPushNotifications()

        // Setup offline functionality
        this.setupOfflineSupport()
    }

    // Check if app is installed
    static isInstalled(): boolean {
        if (typeof window === 'undefined') return false

        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes('android-app://')
        )
    }

    // Show install banner
    static showInstallBanner() {
        if (this.isInstalled() || !this.installPrompt) return

        const banner = document.createElement('div')
        banner.id = 'pwa-install-banner'
        banner.className = 'fixed bottom-4 left-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between'
        banner.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l7.293 7.293a1 1 0 001.414-1.414l-9-9z"/>
          </svg>
        </div>
        <div>
          <div class="font-semibold">Install Nestie App</div>
          <div class="text-sm text-gray-300">Get the full mobile experience</div>
        </div>
      </div>
      <div class="flex space-x-2">
        <button id="pwa-install-btn" class="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium">
          Install
        </button>
        <button id="pwa-dismiss-btn" class="text-gray-300 hover:text-white">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `

        document.body.appendChild(banner)

        // Add event listeners
        document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
            this.installApp()
        })

        document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
            this.hideInstallBanner()
            localStorage.setItem('pwa-install-dismissed', Date.now().toString())
        })

        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideInstallBanner()
        }, 10000)
    }

    // Hide install banner
    static hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner')
        if (banner) {
            banner.remove()
        }
    }

    // Install the app
    static async installApp() {
        if (!this.installPrompt) return

        try {
            await this.installPrompt.prompt()
            const { outcome } = await this.installPrompt.userChoice

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt')
            } else {
                console.log('User dismissed the install prompt')
            }

            this.installPrompt = null
            this.hideInstallBanner()

        } catch (error) {
            console.error('Error installing PWA:', error)
        }
    }

    // Track installation
    static trackInstallation() {
        // Track with analytics
        if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as any).gtag('event', 'pwa_install', {
                event_category: 'engagement',
                event_label: 'PWA Installation'
            })
        }

        // Track in database
        fetch('/api/analytics/pwa-install', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            })
        }).catch(console.error)
    }

    // Initialize push notifications
    static async initPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push messaging is not supported')
            return
        }

        try {
            const registration = await navigator.serviceWorker.ready

            // Check if already subscribed
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
                console.log('Already subscribed to push notifications')
                return
            }

            // Request permission
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                console.log('Push notification permission denied')
                return
            }

            // Subscribe to push notifications
            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
                )
            })

            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSubscription)
            })

            console.log('Subscribed to push notifications')

        } catch (error) {
            console.error('Error setting up push notifications:', error)
        }
    }

    // Setup offline support
    static setupOfflineSupport() {
        if (!('serviceWorker' in navigator)) return

        // Register service worker
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration)
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error)
            })

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.showNetworkStatus('online')
            this.syncOfflineData()
        })

        window.addEventListener('offline', () => {
            this.showNetworkStatus('offline')
        })
    }

    // Show network status
    static showNetworkStatus(status: 'online' | 'offline') {
        const existingToast = document.getElementById('network-status-toast')
        if (existingToast) existingToast.remove()

        const toast = document.createElement('div')
        toast.id = 'network-status-toast'
        toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white z-50 ${status === 'online' ? 'bg-green-500' : 'bg-red-500'
            }`
        toast.textContent = status === 'online' ? 'Back online' : 'You are offline'

        document.body.appendChild(toast)

        setTimeout(() => {
            toast.remove()
        }, 3000)
    }

    // Sync offline data when back online
    static async syncOfflineData() {
        try {
            // Get offline data from IndexedDB
            const offlineData = await this.getOfflineData()

            if (offlineData.length === 0) return

            // Sync each offline action
            for (const action of offlineData) {
                try {
                    await fetch(action.url, {
                        method: action.method,
                        headers: action.headers,
                        body: action.body
                    })

                    // Remove from offline storage after successful sync
                    await this.removeOfflineData(action.id)

                } catch (error) {
                    console.error('Failed to sync offline action:', error)
                }
            }

            console.log('Offline data synced successfully')

        } catch (error) {
            console.error('Error syncing offline data:', error)
        }
    }

    // Store data for offline sync
    static async storeOfflineData(action: {
        id: string
        url: string
        method: string
        headers: any
        body: string
        timestamp: number
    }) {
        if (!('indexedDB' in window)) return

        try {
            const db = await this.openOfflineDB()
            const transaction = db.transaction(['offline_actions'], 'readwrite')
            const store = transaction.objectStore('offline_actions')

            return new Promise<void>((resolve, reject) => {
                const request = store.add(action)
                request.onsuccess = () => resolve()
                request.onerror = () => reject(request.error)
            })
        } catch (error) {
            console.error('Error storing offline data:', error)
        }
    }

    // Get offline data
    static async getOfflineData(): Promise<any[]> {
        if (!('indexedDB' in window)) return []

        try {
            const db = await this.openOfflineDB()
            const transaction = db.transaction(['offline_actions'], 'readonly')
            const store = transaction.objectStore('offline_actions')

            return new Promise((resolve, reject) => {
                const request = store.getAll()
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        } catch (error) {
            console.error('Error getting offline data:', error)
            return []
        }
    }

    // Remove offline data
    static async removeOfflineData(id: string) {
        if (!('indexedDB' in window)) return

        try {
            const db = await this.openOfflineDB()
            const transaction = db.transaction(['offline_actions'], 'readwrite')
            const store = transaction.objectStore('offline_actions')

            return new Promise<void>((resolve, reject) => {
                const request = store.delete(id)
                request.onsuccess = () => resolve()
                request.onerror = () => reject(request.error)
            })
        } catch (error) {
            console.error('Error removing offline data:', error)
        }
    }

    // Open offline database
    static openOfflineDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('nestie_offline', 1)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains('offline_actions')) {
                    db.createObjectStore('offline_actions', { keyPath: 'id' })
                }
            }
        })
    }

    // Utility function for VAPID key conversion
    static urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    // Get device info for mobile optimization
    static getDeviceInfo() {
        const userAgent = navigator.userAgent
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
        const isIOS = /iPad|iPhone|iPod/.test(userAgent)
        const isAndroid = /Android/.test(userAgent)

        return {
            isMobile,
            isIOS,
            isAndroid,
            isStandalone: this.isInstalled(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            devicePixelRatio: window.devicePixelRatio || 1
        }
    }

    // Optimize for mobile performance
    static optimizeForMobile() {
        const deviceInfo = this.getDeviceInfo()

        if (deviceInfo.isMobile) {
            // Add mobile-specific optimizations
            document.documentElement.classList.add('mobile-device')

            if (deviceInfo.isIOS) {
                document.documentElement.classList.add('ios-device')
            }

            if (deviceInfo.isAndroid) {
                document.documentElement.classList.add('android-device')
            }

            // Optimize touch interactions
            document.addEventListener('touchstart', () => { }, { passive: true })

            // Prevent zoom on input focus (iOS)
            if (deviceInfo.isIOS) {
                const viewport = document.querySelector('meta[name=viewport]')
                if (viewport) {
                    viewport.setAttribute('content',
                        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
                    )
                }
            }
        }
    }
}

// Initialize mobile app features when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            MobileAppService.init()
            MobileAppService.optimizeForMobile()
        })
    } else {
        MobileAppService.init()
        MobileAppService.optimizeForMobile()
    }
}