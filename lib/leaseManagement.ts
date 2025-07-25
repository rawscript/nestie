import { supabase } from './supabase'
import { notificationService } from './notifications'

export interface LeaseAgreement {
  id: string
  property_id: string
  tenant_id: string
  agent_id: string
  lease_type: 'fixed' | 'periodic' | 'month_to_month'
  start_date: string
  end_date: string
  monthly_rent: number
  security_deposit: number
  status: 'draft' | 'pending_signature' | 'active' | 'terminated' | 'expired'
  terms: {
    rent_due_date: number // day of month (1-31)
    late_fee_amount: number
    late_fee_grace_days: number
    utilities_included: string[]
    maintenance_responsibility: 'tenant' | 'landlord' | 'shared'
    pet_policy: 'allowed' | 'not_allowed' | 'with_deposit'
    smoking_policy: 'allowed' | 'not_allowed'
    subletting_allowed: boolean
    early_termination_fee: number
    renewal_notice_days: number
  }
  documents: Array<{
    type: 'lease_agreement' | 'addendum' | 'inspection_report' | 'other'
    url: string
    name: string
    uploaded_at: string
  }>
  signatures: Array<{
    party: 'tenant' | 'agent' | 'landlord'
    signed_at: string
    signature_data: string
    ip_address: string
  }>
  created_at: string
  updated_at: string
}

export interface RentPayment {
  id: string
  lease_id: string
  tenant_id: string
  amount: number
  due_date: string
  paid_date?: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  payment_method?: string
  transaction_id?: string
  late_fee?: number
  created_at: string
}

export interface MaintenanceRequest {
  id: string
  lease_id: string
  tenant_id: string
  agent_id: string
  title: string
  description: string
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other'
  priority: 'low' | 'medium' | 'high' | 'emergency'
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled'
  images: string[]
  estimated_cost?: number
  actual_cost?: number
  scheduled_date?: string
  completed_date?: string
  contractor_info?: {
    name: string
    phone: string
    email: string
  }
  created_at: string
  updated_at: string
}

class LeaseManagementSystem {
  private paymentScheduler: NodeJS.Timeout | null = null
  private maintenanceScheduler: NodeJS.Timeout | null = null
  private renewalScheduler: NodeJS.Timeout | null = null

  constructor() {
    this.initializeSchedulers()
  }

  // Lease Creation and Management
  async createLease(leaseData: Omit<LeaseAgreement, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('lease_agreements')
        .insert({
          ...leaseData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Generate initial rent payment schedule
      await this.generatePaymentSchedule(data.id, leaseData)

      // Send notifications
      await notificationService.sendNotification({
        user_id: leaseData.tenant_id,
        type: 'system',
        title: 'Lease Agreement Created',
        message: 'Your lease agreement has been created and is ready for review',
        priority: 'high',
        action_url: `/lease/${data.id}`,
        read: false
      })

      return data.id
    } catch (error) {
      console.error('Error creating lease:', error)
      throw error
    }
  }  
  async updateLeaseStatus(leaseId: string, status: LeaseAgreement['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('lease_agreements')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseId)

      if (error) throw error

      // Handle status-specific actions
      if (status === 'active') {
        await this.activateLease(leaseId)
      } else if (status === 'terminated') {
        await this.terminateLease(leaseId)
      }
    } catch (error) {
      console.error('Error updating lease status:', error)
      throw error
    }
  }

  async signLease(
    leaseId: string, 
    party: 'tenant' | 'agent' | 'landlord',
    signatureData: string,
    ipAddress: string
  ): Promise<void> {
    try {
      // Get current lease
      const { data: lease, error: fetchError } = await supabase
        .from('lease_agreements')
        .select('*')
        .eq('id', leaseId)
        .single()

      if (fetchError) throw fetchError

      // Add signature
      const updatedSignatures = [
        ...(lease.signatures || []),
        {
          party,
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
          ip_address: ipAddress
        }
      ]

      // Check if all parties have signed
      const requiredParties = ['tenant', 'agent']
      const signedParties = updatedSignatures.map(s => s.party)
      const allSigned = requiredParties.every(party => signedParties.includes(party))

      const { error } = await supabase
        .from('lease_agreements')
        .update({
          signatures: updatedSignatures,
          status: allSigned ? 'active' : 'pending_signature',
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseId)

      if (error) throw error

      // Send notifications
      if (allSigned) {
        await this.notifyLeaseActivation(leaseId)
      } else {
        await this.notifySignatureReceived(leaseId, party)
      }
    } catch (error) {
      console.error('Error signing lease:', error)
      throw error
    }
  }

  // Payment Management
  async generatePaymentSchedule(leaseId: string, lease: Partial<LeaseAgreement>): Promise<void> {
    try {
      const startDate = new Date(lease.start_date!)
      const endDate = new Date(lease.end_date!)
      const payments: Omit<RentPayment, 'id' | 'created_at'>[] = []

      let currentDate = new Date(startDate)
      currentDate.setDate(lease.terms!.rent_due_date)

      // If the due date has passed for the first month, move to next month
      if (currentDate <= startDate) {
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      while (currentDate <= endDate) {
        payments.push({
          lease_id: leaseId,
          tenant_id: lease.tenant_id!,
          amount: lease.monthly_rent!,
          due_date: currentDate.toISOString().split('T')[0],
          status: 'pending'
        })

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      const { error } = await supabase
        .from('rent_payments')
        .insert(payments.map(payment => ({
          ...payment,
          created_at: new Date().toISOString()
        })))

      if (error) throw error
    } catch (error) {
      console.error('Error generating payment schedule:', error)
      throw error
    }
  }

  async processRentPayment(
    paymentId: string,
    amount: number,
    paymentMethod: string,
    transactionId: string
  ): Promise<void> {
    try {
      const { data: payment, error: fetchError } = await supabase
        .from('rent_payments')
        .select('*, lease_agreements(*)')
        .eq('id', paymentId)
        .single()

      if (fetchError) throw fetchError

      const isFullPayment = amount >= payment.amount
      const isPartialPayment = amount > 0 && amount < payment.amount

      let status: RentPayment['status'] = 'pending'
      if (isFullPayment) {
        status = 'paid'
      } else if (isPartialPayment) {
        status = 'partial'
      }

      const { error } = await supabase
        .from('rent_payments')
        .update({
          status,
          paid_date: new Date().toISOString(),
          payment_method: paymentMethod,
          transaction_id: transactionId
        })
        .eq('id', paymentId)

      if (error) throw error

      // Send payment confirmation
      await notificationService.sendPaymentNotification(
        payment.tenant_id,
        {
          amount,
          payment_id: paymentId,
          property_title: 'Rental Property'
        },
        'success'
      )

      // If partial payment, create reminder for remaining amount
      if (isPartialPayment) {
        const remainingAmount = payment.amount - amount
        await this.schedulePaymentReminder(payment.tenant_id, remainingAmount, paymentId)
      }
    } catch (error) {
      console.error('Error processing rent payment:', error)
      throw error
    }
  }

  // Maintenance Management
  async createMaintenanceRequest(
    requestData: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          ...requestData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Notify agent
      await notificationService.sendNotification({
        user_id: requestData.agent_id,
        type: 'system',
        title: 'New Maintenance Request',
        message: `${requestData.title} - Priority: ${requestData.priority}`,
        priority: requestData.priority === 'emergency' ? 'urgent' : 'medium',
        action_url: `/maintenance/${data.id}`,
        read: false
      })

      // Auto-assign based on category and priority
      if (requestData.priority === 'emergency') {
        await this.autoAssignEmergencyMaintenance(data.id)
      }

      return data.id
    } catch (error) {
      console.error('Error creating maintenance request:', error)
      throw error
    }
  }

  async updateMaintenanceStatus(
    requestId: string,
    status: MaintenanceRequest['status'],
    updates: Partial<MaintenanceRequest> = {}
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      // Get request details for notifications
      const { data: request } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (request) {
        await this.notifyMaintenanceUpdate(request, status)
      }
    } catch (error) {
      console.error('Error updating maintenance status:', error)
      throw error
    }
  }

  // Automated Lease Renewal
  async checkLeaseRenewals(): Promise<void> {
    try {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data: expiringLeases, error } = await supabase
        .from('lease_agreements')
        .select('*')
        .eq('status', 'active')
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])

      if (error) throw error

      for (const lease of expiringLeases || []) {
        await this.initiateRenewalProcess(lease)
      }
    } catch (error) {
      console.error('Error checking lease renewals:', error)
    }
  }

  async initiateRenewalProcess(lease: LeaseAgreement): Promise<void> {
    try {
      // Create renewal offer
      const renewalOffer = {
        original_lease_id: lease.id,
        tenant_id: lease.tenant_id,
        agent_id: lease.agent_id,
        property_id: lease.property_id,
        proposed_start_date: lease.end_date,
        proposed_end_date: this.calculateNewEndDate(lease.end_date, 12), // 12 months
        proposed_rent: this.calculateRenewalRent(lease.monthly_rent),
        status: 'pending_tenant_response',
        expires_at: this.calculateOfferExpiry(lease.end_date),
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('lease_renewal_offers')
        .insert(renewalOffer)

      if (error) throw error

      // Notify tenant
      await notificationService.sendNotification({
        user_id: lease.tenant_id,
        type: 'system',
        title: 'Lease Renewal Offer',
        message: `Your lease is expiring soon. We've prepared a renewal offer for you.`,
        priority: 'high',
        action_url: `/lease/${lease.id}/renewal`,
        read: false
      })

      // Notify agent
      await notificationService.sendNotification({
        user_id: lease.agent_id,
        type: 'system',
        title: 'Lease Renewal Initiated',
        message: `Renewal process started for lease ${lease.id}`,
        priority: 'medium',
        action_url: `/agent/leases/${lease.id}`,
        read: false
      })
    } catch (error) {
      console.error('Error initiating renewal process:', error)
    }
  }

  // Automated Reminders and Notifications
  async checkOverduePayments(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: overduePayments, error } = await supabase
        .from('rent_payments')
        .select('*, lease_agreements(*)')
        .eq('status', 'pending')
        .lt('due_date', today)

      if (error) throw error

      for (const payment of overduePayments || []) {
        await this.processOverduePayment(payment)
      }
    } catch (error) {
      console.error('Error checking overdue payments:', error)
    }
  }

  async processOverduePayment(payment: any): Promise<void> {
    try {
      const daysOverdue = this.calculateDaysOverdue(payment.due_date)
      const lease = payment.lease_agreements
      const graceDays = lease.terms.late_fee_grace_days || 3

      if (daysOverdue > graceDays) {
        // Apply late fee
        const lateFee = lease.terms.late_fee_amount || (payment.amount * 0.05) // 5% default
        
        await supabase
          .from('rent_payments')
          .update({
            status: 'overdue',
            late_fee: lateFee
          })
          .eq('id', payment.id)

        // Send overdue notice
        await notificationService.sendPaymentNotification(
          payment.tenant_id,
          {
            amount: payment.amount,
            late_fee: lateFee,
            days_overdue: daysOverdue
          },
          'overdue'
        )

        // Escalate if severely overdue
        if (daysOverdue > 14) {
          await this.escalateOverduePayment(payment, daysOverdue)
        }
      }
    } catch (error) {
      console.error('Error processing overdue payment:', error)
    }
  }

  // Lease Termination
  async terminateLease(leaseId: string, reason?: string): Promise<void> {
    try {
      const { data: lease, error: fetchError } = await supabase
        .from('lease_agreements')
        .select('*')
        .eq('id', leaseId)
        .single()

      if (fetchError) throw fetchError

      // Update lease status
      await supabase
        .from('lease_agreements')
        .update({
          status: 'terminated',
          termination_date: new Date().toISOString(),
          termination_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseId)

      // Cancel future payments
      await supabase
        .from('rent_payments')
        .update({ status: 'cancelled' })
        .eq('lease_id', leaseId)
        .eq('status', 'pending')
        .gt('due_date', new Date().toISOString().split('T')[0])

      // Schedule security deposit return
      await this.scheduleSecurityDepositReturn(lease)

      // Send termination notifications
      await this.notifyLeaseTermination(lease, reason)
    } catch (error) {
      console.error('Error terminating lease:', error)
      throw error
    }
  }

  // Private helper methods
  private initializeSchedulers(): void {
    // Check overdue payments daily at 9 AM
    this.paymentScheduler = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        this.checkOverduePayments()
      }
    }, 60000) // Check every minute

    // Check lease renewals daily at 10 AM
    this.renewalScheduler = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 10 && now.getMinutes() === 0) {
        this.checkLeaseRenewals()
      }
    }, 60000)

    // Check maintenance requests every 4 hours
    this.maintenanceScheduler = setInterval(() => {
      this.checkMaintenanceEscalation()
    }, 4 * 60 * 60 * 1000)
  }

  private async activateLease(leaseId: string): Promise<void> {
    // Implementation for lease activation
    console.log(`Activating lease ${leaseId}`)
  }

  private async notifyLeaseActivation(leaseId: string): Promise<void> {
    // Implementation for lease activation notifications
    console.log(`Notifying lease activation ${leaseId}`)
  }

  private async notifySignatureReceived(leaseId: string, party: string): Promise<void> {
    // Implementation for signature notifications
    console.log(`Signature received from ${party} for lease ${leaseId}`)
  }

  private async schedulePaymentReminder(tenantId: string, amount: number, paymentId: string): Promise<void> {
    // Implementation for payment reminders
    console.log(`Scheduling payment reminder for ${tenantId}`)
  }

  private async autoAssignEmergencyMaintenance(requestId: string): Promise<void> {
    // Implementation for emergency maintenance auto-assignment
    console.log(`Auto-assigning emergency maintenance ${requestId}`)
  }

  private async notifyMaintenanceUpdate(request: MaintenanceRequest, status: string): Promise<void> {
    // Implementation for maintenance update notifications
    console.log(`Maintenance ${request.id} updated to ${status}`)
  }

  private calculateNewEndDate(currentEndDate: string, months: number): string {
    const date = new Date(currentEndDate)
    date.setMonth(date.getMonth() + months)
    return date.toISOString().split('T')[0]
  }

  private calculateRenewalRent(currentRent: number): number {
    // Apply 3% annual increase by default
    return Math.round(currentRent * 1.03)
  }

  private calculateOfferExpiry(leaseEndDate: string): string {
    const date = new Date(leaseEndDate)
    date.setDate(date.getDate() - 30) // Offer expires 30 days before lease end
    return date.toISOString()
  }

  private calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private async escalateOverduePayment(payment: any, daysOverdue: number): Promise<void> {
    // Implementation for payment escalation
    console.log(`Escalating overdue payment ${payment.id}, ${daysOverdue} days overdue`)
  }

  private async scheduleSecurityDepositReturn(lease: LeaseAgreement): Promise<void> {
    // Implementation for security deposit return scheduling
    console.log(`Scheduling security deposit return for lease ${lease.id}`)
  }

  private async notifyLeaseTermination(lease: LeaseAgreement, reason?: string): Promise<void> {
    // Implementation for termination notifications
    console.log(`Lease ${lease.id} terminated: ${reason}`)
  }

  private async checkMaintenanceEscalation(): Promise<void> {
    // Implementation for maintenance escalation checks
    console.log('Checking maintenance escalation')
  }

  // Public API methods
  async getLeaseById(leaseId: string): Promise<LeaseAgreement | null> {
    try {
      const { data, error } = await supabase
        .from('lease_agreements')
        .select('*')
        .eq('id', leaseId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching lease:', error)
      return null
    }
  }

  async getTenantLeases(tenantId: string): Promise<LeaseAgreement[]> {
    try {
      const { data, error } = await supabase
        .from('lease_agreements')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tenant leases:', error)
      return []
    }
  }

  async getAgentLeases(agentId: string): Promise<LeaseAgreement[]> {
    try {
      const { data, error } = await supabase
        .from('lease_agreements')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching agent leases:', error)
      return []
    }
  }

  async getUpcomingPayments(tenantId: string, limit: number = 5): Promise<RentPayment[]> {
    try {
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching upcoming payments:', error)
      return []
    }
  }

  async getMaintenanceRequests(
    filters: {
      lease_id?: string
      tenant_id?: string
      agent_id?: string
      status?: MaintenanceRequest['status']
    },
    limit: number = 20
  ): Promise<MaintenanceRequest[]> {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select('*')

      if (filters.lease_id) query = query.eq('lease_id', filters.lease_id)
      if (filters.tenant_id) query = query.eq('tenant_id', filters.tenant_id)
      if (filters.agent_id) query = query.eq('agent_id', filters.agent_id)
      if (filters.status) query = query.eq('status', filters.status)

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching maintenance requests:', error)
      return []
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.paymentScheduler) {
      clearInterval(this.paymentScheduler)
    }
    if (this.renewalScheduler) {
      clearInterval(this.renewalScheduler)
    }
    if (this.maintenanceScheduler) {
      clearInterval(this.maintenanceScheduler)
    }
  }
}

export const leaseManagement = new LeaseManagementSystem()