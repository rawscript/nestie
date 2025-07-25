import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'booking' | 'payment' | 'message' | 'property' | 'system' | 'reminder'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  data?: any
  action_url?: string
  created_at: string
  expires_at?: string
}

export interface NotificationPreferences {
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  in_app_notifications: boolean
  notification_types: {
    bookings: boolean
    payments: boolean
    messages: boolean
    property_updates: boolean
    system_alerts: boolean
    marketing: boolean
  }
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
  }
}

class NotificationService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private notificationQueue: Notification[] = []
  private isOnline = true
  private retryAttempts = 0
  private maxRetries = 3

  constructor() {
    this.setupOnlineStatusListener()
    this.setupPeriodicSync()
  }

  // Real-time subscription management
  async subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): Promise<() => void> {
    const channelName = `notifications:${userId}`
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      await this.unsubscribeFromNotifications(userId)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = payload.new as Notification
          this.handleNewNotification(notification, callback)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = payload.new as Notification
          callback(notification)
        }
      )
      .subscribe((status) => {
        console.log(`Notification subscription status: ${status}`)
        if (status === 'SUBSCRIBED') {
          this.retryAttempts = 0
        } else if (status === 'CHANNEL_ERROR' && this.retryAttempts < this.maxRetries) {
          this.retryAttempts++
          setTimeout(() => {
            this.subscribeToNotifications(userId, callback)
          }, 1000 * this.retryAttempts)
        }
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribeFromNotifications(userId)
  }

  async unsubscribeFromNotifications(userId: string): Promise<void> {
    const channelName = `notifications:${userId}`
    const channel = this.channels.get(channelName)
    
    if (channel) {
      await supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Send notifications
  async sendNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(notification.user_id)
      if (!this.shouldSendNotification(notification, preferences)) {
        return
      }

      // Store in database
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send push notification if enabled
      if (preferences.push_notifications) {
        await this.sendPushNotification(notification)
      }

      // Send email if enabled and high priority
      if (preferences.email_notifications && 
          ['high', 'urgent'].includes(notification.priority)) {
        await this.sendEmailNotification(notification)
      }

      // Send SMS for urgent notifications
      if (preferences.sms_notifications && notification.priority === 'urgent') {
        await this.sendSMSNotification(notification)
      }

    } catch (error) {
      console.error('Error sending notification:', error)
      
      // Queue for retry if offline
      if (!this.isOnline) {
        this.notificationQueue.push({
          ...notification,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString()
        })
      }
    }
  }

  // Bulk notifications
  async sendBulkNotifications(notifications: Omit<Notification, 'id' | 'created_at'>[]): Promise<void> {
    const batchSize = 100
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      
      try {
        const { error } = await supabase
          .from('notifications')
          .insert(
            batch.map(notification => ({
              ...notification,
              created_at: new Date().toISOString()
            }))
          )

        if (error) throw error

        // Send push notifications for high priority items
        const highPriorityNotifications = batch.filter(n => 
          ['high', 'urgent'].includes(n.priority)
        )
        
        await Promise.all(
          highPriorityNotifications.map(notification => 
            this.sendPushNotification(notification)
          )
        )

      } catch (error) {
        console.error('Error sending bulk notifications:', error)
      }
    }
  }

  // Notification templates
  async sendBookingNotification(
    userId: string,
    bookingData: any,
    type: 'new' | 'approved' | 'rejected' | 'reminder'
  ): Promise<void> {
    const templates = {
      new: {
        title: 'New Booking Request',
        message: `You have a new booking request for "${bookingData.property_title}"`,
        priority: 'high' as const
      },
      approved: {
        title: 'Booking Approved',
        message: `Your booking for "${bookingData.property_title}" has been approved!`,
        priority: 'high' as const
      },
      rejected: {
        title: 'Booking Declined',
        message: `Your booking for "${bookingData.property_title}" was declined`,
        priority: 'medium' as const
      },
      reminder: {
        title: 'Booking Reminder',
        message: `Your viewing for "${bookingData.property_title}" is tomorrow`,
        priority: 'medium' as const
      }
    }

    const template = templates[type]
    
    await this.sendNotification({
      user_id: userId,
      type: 'booking',
      ...template,
      data: bookingData,
      action_url: `/bookings/${bookingData.booking_id}`,
      read: false
    })
  }

  async sendPaymentNotification(
    userId: string,
    paymentData: any,
    type: 'success' | 'failed' | 'reminder' | 'overdue'
  ): Promise<void> {
    const templates = {
      success: {
        title: 'Payment Successful',
        message: `Your payment of KSh ${paymentData.amount.toLocaleString()} was processed successfully`,
        priority: 'medium' as const
      },
      failed: {
        title: 'Payment Failed',
        message: `Your payment of KSh ${paymentData.amount.toLocaleString()} could not be processed`,
        priority: 'high' as const
      },
      reminder: {
        title: 'Payment Due Soon',
        message: `Your rent payment of KSh ${paymentData.amount.toLocaleString()} is due in 3 days`,
        priority: 'medium' as const
      },
      overdue: {
        title: 'Payment Overdue',
        message: `Your rent payment of KSh ${paymentData.amount.toLocaleString()} is overdue`,
        priority: 'urgent' as const
      }
    }

    const template = templates[type]
    
    await this.sendNotification({
      user_id: userId,
      type: 'payment',
      ...template,
      data: paymentData,
      action_url: '/payments',
      read: false
    })
  }

  async sendMessageNotification(
    userId: string,
    messageData: any
  ): Promise<void> {
    await this.sendNotification({
      user_id: userId,
      type: 'message',
      title: 'New Message',
      message: `You have a new message from ${messageData.sender_name}`,
      priority: 'medium',
      data: messageData,
      action_url: `/messages/${messageData.conversation_id}`,
      read: false
    })
  }

  async sendPropertyNotification(
    userId: string,
    propertyData: any,
    type: 'new_match' | 'price_drop' | 'status_change'
  ): Promise<void> {
    const templates = {
      new_match: {
        title: 'New Property Match',
        message: `We found a property that matches your criteria: "${propertyData.title}"`,
        priority: 'medium' as const
      },
      price_drop: {
        title: 'Price Drop Alert',
        message: `The price for "${propertyData.title}" has dropped to KSh ${propertyData.price.toLocaleString()}`,
        priority: 'high' as const
      },
      status_change: {
        title: 'Property Status Update',
        message: `"${propertyData.title}" is now ${propertyData.status}`,
        priority: 'medium' as const
      }
    }

    const template = templates[type]
    
    await this.sendNotification({
      user_id: userId,
      type: 'property',
      ...template,
      data: propertyData,
      action_url: `/property/${propertyData.id}`,
      read: false
    })
  }

  // Notification management
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) throw error
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) throw error
  }

  async getNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
      type?: string
    } = {}
  ): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options.unreadOnly) {
      query = query.eq('read', false)
    }

    if (options.type) {
      query = query.eq('type', options.type)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  }

  // User preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Return default preferences
      return {
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        in_app_notifications: true,
        notification_types: {
          bookings: true,
          payments: true,
          messages: true,
          property_updates: true,
          system_alerts: true,
          marketing: false
        },
        quiet_hours: {
          enabled: false,
          start_time: '22:00',
          end_time: '08:00'
        }
      }
    }

    return data
  }

  async updateUserPreferences(preferences: NotificationPreferences): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(preferences)

    if (error) throw error
  }

  // Private helper methods
  private handleNewNotification(
    notification: Notification,
    callback: (notification: Notification) => void
  ): void {
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      })
    }

    // Call the callback
    callback(notification)
  }

  private shouldSendNotification(
    notification: Omit<Notification, 'id' | 'created_at'>,
    preferences: NotificationPreferences
  ): boolean {
    // Check if notification type is enabled
    const typeKey = notification.type as keyof typeof preferences.notification_types
    if (!preferences.notification_types[typeKey]) {
      return false
    }

    // Check quiet hours
    if (preferences.quiet_hours.enabled) {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5)
      const { start_time, end_time } = preferences.quiet_hours

      if (start_time < end_time) {
        // Same day quiet hours
        if (currentTime >= start_time && currentTime <= end_time) {
          return notification.priority === 'urgent'
        }
      } else {
        // Overnight quiet hours
        if (currentTime >= start_time || currentTime <= end_time) {
          return notification.priority === 'urgent'
        }
      }
    }

    return true
  }

  private async sendPushNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    // Implementation would depend on your push notification service (FCM, etc.)
    console.log('Sending push notification:', notification.title)
  }

  private async sendEmailNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    // Implementation would depend on your email service
    console.log('Sending email notification:', notification.title)
  }

  private async sendSMSNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    // Implementation would depend on your SMS service
    console.log('Sending SMS notification:', notification.title)
  }

  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processQueuedNotifications()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private setupPeriodicSync(): void {
    // Sync queued notifications every 30 seconds
    setInterval(() => {
      if (this.isOnline && this.notificationQueue.length > 0) {
        this.processQueuedNotifications()
      }
    }, 30000)
  }

  private async processQueuedNotifications(): Promise<void> {
    const queue = [...this.notificationQueue]
    this.notificationQueue = []

    for (const notification of queue) {
      try {
        await this.sendNotification(notification)
      } catch (error) {
        console.error('Error processing queued notification:', error)
        // Re-queue if still failing
        this.notificationQueue.push(notification)
      }
    }
  }
}

export const notificationService = new NotificationService()