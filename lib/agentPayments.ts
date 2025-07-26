import { Database } from './database'
import { supabase } from './supabase'
import type { UUID, PaymentMethod, TransactionStatus } from './types'

// Agent payment account types
export interface AgentPaymentAccount {
    id: UUID
    agent_id: UUID
    account_type: 'bank' | 'mobile_money' | 'paypal'
    account_details: {
        bank_name?: string
        account_number?: string
        account_name?: string
        phone_number?: string
        paypal_email?: string
        routing_number?: string
        swift_code?: string
    }
    is_primary: boolean
    is_verified: boolean
    created_at: string
    updated_at: string
}

// Agent earnings tracking
export interface AgentEarning {
    id: UUID
    agent_id: UUID
    property_id: UUID
    tenant_id: UUID
    transaction_id: UUID
    earning_type: 'commission' | 'booking_fee' | 'service_fee'
    amount: number
    commission_rate: number
    original_amount: number
    status: 'pending' | 'processed' | 'paid' | 'failed'
    payment_account_id?: UUID
    payment_reference?: string
    processed_at?: string
    created_at: string
    updated_at: string
}

// Payout request
export interface PayoutRequest {
    id: UUID
    agent_id: UUID
    payment_account_id: UUID
    amount: number
    status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed' | 'failed'
    requested_at: string
    processed_at?: string
    processed_by?: UUID
    rejection_reason?: string
    payment_reference?: string
    created_at: string
    updated_at: string
}

export class AgentPaymentService {
    // Add or update agent payment account
    static async addPaymentAccount(
        agentId: UUID,
        accountData: Omit<AgentPaymentAccount, 'id' | 'agent_id' | 'created_at' | 'updated_at'>
    ) {
        try {
            // If this is set as primary, unset other primary accounts
            if (accountData.is_primary) {
                await supabase
                    .from('agent_payment_accounts')
                    .update({ is_primary: false })
                    .eq('agent_id', agentId)
            }

            const { data, error } = await supabase
                .from('agent_payment_accounts')
                .insert([{
                    agent_id: agentId,
                    ...accountData
                }])
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error adding payment account:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Get agent payment accounts
    static async getAgentPaymentAccounts(agentId: UUID) {
        try {
            const { data, error } = await supabase
                .from('agent_payment_accounts')
                .select('*')
                .eq('agent_id', agentId)
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            return { success: true, data: data || [] }
        } catch (error) {
            console.error('Error fetching payment accounts:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Process commission when tenant makes payment
    static async processAgentCommission(
        transactionId: UUID,
        propertyId: UUID,
        agentId: UUID,
        tenantId: UUID,
        originalAmount: number,
        commissionRate: number = 0.15 // Default 15% commission
    ) {
        try {
            const commissionAmount = originalAmount * commissionRate

            const { data, error } = await supabase
                .from('agent_earnings')
                .insert([{
                    agent_id: agentId,
                    property_id: propertyId,
                    tenant_id: tenantId,
                    transaction_id: transactionId,
                    earning_type: 'commission',
                    amount: commissionAmount,
                    commission_rate: commissionRate,
                    original_amount: originalAmount,
                    status: 'pending'
                }])
                .select()
                .single()

            if (error) throw error

            // Update agent stats
            await this.updateAgentStats(agentId, commissionAmount)

            // Send notification to agent
            await Database.createNotification({
                recipient_id: agentId,
                title: 'Commission Earned',
                message: `You earned KES ${commissionAmount.toLocaleString()} commission from a tenant payment`,
                type: 'system_update',
                data: {
                    earning_id: data.id,
                    amount: commissionAmount,
                    property_id: propertyId
                },
                read: false
            })

            return { success: true, data }
        } catch (error) {
            console.error('Error processing agent commission:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Process booking fee when tenant books property
    static async processBookingFee(
        propertyId: UUID,
        agentId: UUID,
        tenantId: UUID,
        bookingAmount: number,
        feeRate: number = 0.05 // Default 5% booking fee
    ) {
        try {
            const feeAmount = bookingAmount * feeRate

            const { data, error } = await supabase
                .from('agent_earnings')
                .insert([{
                    agent_id: agentId,
                    property_id: propertyId,
                    tenant_id: tenantId,
                    earning_type: 'booking_fee',
                    amount: feeAmount,
                    commission_rate: feeRate,
                    original_amount: bookingAmount,
                    status: 'pending'
                }])
                .select()
                .single()

            if (error) throw error

            await this.updateAgentStats(agentId, feeAmount)

            return { success: true, data }
        } catch (error) {
            console.error('Error processing booking fee:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Get agent earnings
    static async getAgentEarnings(agentId: UUID, filters: {
        status?: string
        earning_type?: string
        from_date?: string
        to_date?: string
        limit?: number
    } = {}) {
        try {
            let query = supabase
                .from('agent_earnings')
                .select(`
          *,
          property:properties(id, title, location),
          tenant:profiles!tenant_id(id, full_name, email)
        `)
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })

            if (filters.status) query = query.eq('status', filters.status)
            if (filters.earning_type) query = query.eq('earning_type', filters.earning_type)
            if (filters.from_date) query = query.gte('created_at', filters.from_date)
            if (filters.to_date) query = query.lte('created_at', filters.to_date)

            query = query.limit(filters.limit || 50)

            const { data, error } = await query

            if (error) throw error
            return { success: true, data: data || [] }
        } catch (error) {
            console.error('Error fetching agent earnings:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Request payout
    static async requestPayout(agentId: UUID, paymentAccountId: UUID, amount: number) {
        try {
            // Check if agent has sufficient pending earnings
            const { data: earnings, error: earningsError } = await supabase
                .from('agent_earnings')
                .select('amount')
                .eq('agent_id', agentId)
                .eq('status', 'pending')

            if (earningsError) throw earningsError

            const totalPending = earnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0

            if (totalPending < amount) {
                return {
                    success: false,
                    error: `Insufficient pending earnings. Available: KES ${totalPending.toLocaleString()}`
                }
            }

            // Create payout request
            const { data, error } = await supabase
                .from('payout_requests')
                .insert([{
                    agent_id: agentId,
                    payment_account_id: paymentAccountId,
                    amount: amount,
                    status: 'pending',
                    requested_at: new Date().toISOString()
                }])
                .select()
                .single()

            if (error) throw error

            // Mark earnings as processed
            await supabase
                .from('agent_earnings')
                .update({ status: 'processed' })
                .eq('agent_id', agentId)
                .eq('status', 'pending')
                .lte('amount', amount)

            return { success: true, data }
        } catch (error) {
            console.error('Error requesting payout:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Get agent payout requests
    static async getPayoutRequests(agentId: UUID) {
        try {
            const { data, error } = await supabase
                .from('payout_requests')
                .select(`
          *,
          payment_account:agent_payment_accounts(*)
        `)
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return { success: true, data: data || [] }
        } catch (error) {
            console.error('Error fetching payout requests:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Get agent earnings summary
    static async getEarningsSummary(agentId: UUID) {
        try {
            const { data, error } = await supabase
                .from('agent_earnings')
                .select('amount, status, earning_type')
                .eq('agent_id', agentId)

            if (error) throw error

            const summary = {
                total_earnings: 0,
                pending_earnings: 0,
                paid_earnings: 0,
                commission_earnings: 0,
                booking_fee_earnings: 0,
                service_fee_earnings: 0
            }

            data?.forEach(earning => {
                summary.total_earnings += earning.amount

                if (earning.status === 'pending') {
                    summary.pending_earnings += earning.amount
                } else if (earning.status === 'paid') {
                    summary.paid_earnings += earning.amount
                }

                if (earning.earning_type === 'commission') {
                    summary.commission_earnings += earning.amount
                } else if (earning.earning_type === 'booking_fee') {
                    summary.booking_fee_earnings += earning.amount
                } else if (earning.earning_type === 'service_fee') {
                    summary.service_fee_earnings += earning.amount
                }
            })

            return { success: true, data: summary }
        } catch (error) {
            console.error('Error fetching earnings summary:', error)
            return { success: false, error: (error as Error).message }
        }
    }

    // Update agent stats
    private static async updateAgentStats(agentId: UUID, earningAmount: number) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('stats')
                .eq('id', agentId)
                .single()

            const currentStats = profile?.stats || {}
            const updatedStats = {
                ...currentStats,
                total_earnings: (currentStats.total_earnings || 0) + earningAmount
            }

            await supabase
                .from('profiles')
                .update({
                    stats: updatedStats,
                    updated_at: new Date().toISOString()
                })
                .eq('id', agentId)

        } catch (error) {
            console.error('Error updating agent stats:', error)
        }
    }

    // Admin: Process payout (approve/reject)
    static async processPayout(
        payoutId: UUID,
        status: 'approved' | 'rejected',
        processedBy: UUID,
        rejectionReason?: string,
        paymentReference?: string
    ) {
        try {
            const updates: any = {
                status,
                processed_by: processedBy,
                processed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            if (rejectionReason) updates.rejection_reason = rejectionReason
            if (paymentReference) updates.payment_reference = paymentReference

            const { data, error } = await supabase
                .from('payout_requests')
                .update(updates)
                .eq('id', payoutId)
                .select()
                .single()

            if (error) throw error

            // If approved, mark associated earnings as paid
            if (status === 'approved') {
                await supabase
                    .from('agent_earnings')
                    .update({ status: 'paid' })
                    .eq('agent_id', data.agent_id)
                    .eq('status', 'processed')
            }

            return { success: true, data }
        } catch (error) {
            console.error('Error processing payout:', error)
            return { success: false, error: (error as Error).message }
        }
    }
}