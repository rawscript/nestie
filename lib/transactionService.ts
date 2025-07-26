import { ReactNode } from 'react'
import { supabase } from './supabase'

export interface Transaction {
  property_id: ReactNode
  id: string
  user_id: string
  tenancy_id?: string
  transaction_type: 'rent_payment' | 'deposit_payment' | 'rent_termination' | 'lease_renewal' | 'maintenance_request' | 'booking_payment'
  amount?: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  description: string
  payment_method?: 'tinympesa' | 'stripe' | 'bank_transfer'
  payment_reference?: string
  authorized_by?: string
  authorized_at?: string
  created_at: string
  updated_at: string
}

export interface PropertyTenancy {
  id: string
  property_id: string
  tenant_id: string
  agent_id: string
  start_date: string
  end_date?: string
  monthly_rent: number
  deposit_amount: number
  status: 'active' | 'terminated' | 'expired'
  lease_terms?: any
  created_at: string
  updated_at: string
}

export interface PaymentRecord {
  id: string
  transaction_id: string
  tenancy_id: string
  amount: number
  payment_method: string
  payment_reference?: string
  payment_date: string
  status: 'pending' | 'completed' | 'failed'
  metadata?: any
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'transaction' | 'payment' | 'authorization' | 'property_update'
  read: boolean
  data?: any
  created_at: string
}

export class TransactionService {
  // Create a new transaction
  static async createTransaction(transactionData: {
    tenant_id: string
    agent_id: string
    property_id: string
    transaction_type: Transaction['transaction_type']
    amount?: number
    description?: string
    metadata?: any
  }): Promise<{ data: Transaction | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single()

      if (error) throw error

      // Create notification for agent
      await this.createNotification({
        user_id: transactionData.agent_id,
        title: 'New Transaction Request',
        message: `New ${transactionData.transaction_type.replace('_', ' ')} request from tenant`,
        type: 'transaction',
        data: { transaction_id: data.id, transaction_type: transactionData.transaction_type }
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update transaction status (for agents)
  static async updateTransactionStatus(
    transactionId: string, 
    status: Transaction['status'],
    agentId: string
  ): Promise<{ data: Transaction | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'approved' ? { authorized_at: new Date().toISOString() } : {}),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', transactionId)
        .eq('agent_id', agentId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get transactions for a user (tenant or agent)
  static async getUserTransactions(userId: string): Promise<{ data: Transaction[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`tenant_id.eq.${userId},agent_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get pending transactions for agent
  static async getAgentPendingTransactions(agentId: string): Promise<{ data: Transaction[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create property tenancy
  static async createTenancy(tenancyData: {
    property_id: string
    tenant_id: string
    agent_id: string
    start_date: string
    monthly_rent: number
    deposit_amount: number
    lease_terms?: any
  }): Promise<{ data: PropertyTenancy | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('property_tenancies')
        .insert([tenancyData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get user's active tenancies
  static async getUserTenancies(userId: string): Promise<{ data: PropertyTenancy[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('property_tenancies')
        .select('*')
        .eq('tenant_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get agent's properties with tenancy info
  static async getAgentPropertiesWithTenancies(agentId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_agent_properties_with_tenancies', { agent_uuid: agentId })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Process payment
  static async processPayment(paymentData: {
    transaction_id: string
    tenancy_id: string
    amount: number
    payment_method: string
    payment_reference?: string
    metadata?: any
  }): Promise<{ data: PaymentRecord | null; error: any }> {
    try {
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payment_records')
        .insert([{
          ...paymentData,
          status: 'completed' // In real app, this would be 'pending' until payment gateway confirms
        }])
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update transaction status to completed
      await this.updateTransactionStatus(paymentData.transaction_id, 'completed', '')

      return { data: payment, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create notification
  static async createNotification(notificationData: {
    user_id: string
    title: string
    message: string
    type: Notification['type']
    data?: any
  }): Promise<{ data: Notification | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string): Promise<{ data: Notification[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string, userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()
  }

  // Subscribe to transaction updates
  static subscribeToTransactionUpdates(userId: string, callback: (transaction: Transaction) => void) {
    return supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Transaction)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `agent_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Transaction)
        }
      )
      .subscribe()
  }

  // Terminate rent
  static async terminateRent(tenancyId: string, tenantId: string, reason?: string): Promise<{ data: Transaction | null; error: any }> {
    try {
      // Get tenancy details
      const { data: tenancy, error: tenancyError } = await supabase
        .from('property_tenancies')
        .select('*')
        .eq('id', tenancyId)
        .eq('tenant_id', tenantId)
        .single()

      if (tenancyError || !tenancy) {
        throw new Error('Tenancy not found')
      }

      // Create termination transaction
      const transactionData = {
        tenant_id: tenantId,
        agent_id: tenancy.agent_id,
        property_id: tenancy.property_id,
        transaction_type: 'rent_termination' as const,
        description: reason || 'Tenant requested rent termination',
        metadata: { tenancy_id: tenancyId, termination_date: new Date().toISOString() }
      }

      return await this.createTransaction(transactionData)
    } catch (error) {
      return { data: null, error }
    }
  }

  // Make rent payment
  static async makeRentPayment(
    tenancyId: string, 
    tenantId: string, 
    amount: number, 
    paymentMethod: string,
    paymentReference?: string
  ): Promise<{ data: Transaction | null; error: any }> {
    try {
      // Get tenancy details
      const { data: tenancy, error: tenancyError } = await supabase
        .from('property_tenancies')
        .select('*')
        .eq('id', tenancyId)
        .eq('tenant_id', tenantId)
        .single()

      if (tenancyError || !tenancy) {
        throw new Error('Tenancy not found')
      }

      // Create payment transaction
      const transactionData = {
        tenant_id: tenantId,
        agent_id: tenancy.agent_id,
        property_id: tenancy.property_id,
        transaction_type: 'rent_payment' as const,
        amount,
        description: `Rent payment for ${new Date().toLocaleDateString()}`,
        metadata: { 
          tenancy_id: tenancyId, 
          payment_method: paymentMethod,
          payment_reference: paymentReference
        }
      }

      const { data: transaction, error } = await this.createTransaction(transactionData)
      
      if (error || !transaction) {
        throw error
      }

      // Process payment immediately (in real app, this would integrate with payment gateway)
      await this.processPayment({
        transaction_id: transaction.id,
        tenancy_id: tenancyId,
        amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference
      })

      return { data: transaction, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}