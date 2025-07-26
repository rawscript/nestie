import { supabase } from './supabase'
import { Database } from './database'
import { AgentPaymentService } from './agentPayments'
import type { UUID, PaymentMethod, TransactionType } from './types'

export interface PaymentRequest {
  userId: UUID
  propertyId: UUID
  tenancyId?: UUID
  amount: number
  paymentMethod: PaymentMethod
  transactionType: TransactionType
  description: string
  phone?: string // For M-Pesa
  cardDetails?: {
    number: string
    expiry: string
    cvv: string
    name: string
  } // For Stripe
}

export interface PaymentResult {
  success: boolean
  transactionId?: UUID
  paymentReference?: string
  message: string
  error?: string
}

export class PaymentService {
  // Process payment and handle agent commission
  static async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    try {
      // Create transaction record
      const transactionResult = await Database.createTransaction({
        user_id: paymentRequest.userId,
        tenancy_id: paymentRequest.tenancyId,
        transaction_type: paymentRequest.transactionType,
        amount: paymentRequest.amount,
        status: 'pending',
        description: paymentRequest.description,
        payment_method: paymentRequest.paymentMethod
      })

      if (!transactionResult.success || !transactionResult.data) {
        return {
          success: false,
          message: 'Failed to create transaction record',
          error: transactionResult.error || 'Unknown error'
        }
      }

      const transaction = transactionResult.data

      // Process payment based on method
      let paymentResult: { success: boolean; reference?: string; error?: string }

      switch (paymentRequest.paymentMethod) {
        case 'tinympesa':
          paymentResult = await this.processMpesaPayment(
            paymentRequest.amount,
            paymentRequest.phone!,
            transaction.id
          )
          break
        case 'stripe':
          paymentResult = await this.processStripePayment(
            paymentRequest.amount,
            paymentRequest.cardDetails!,
            transaction.id
          )
          break
        case 'bank_transfer':
          paymentResult = await this.processBankTransfer(
            paymentRequest.amount,
            transaction.id
          )
          break
        default:
          return {
            success: false,
            message: 'Unsupported payment method'
          }
      }

      if (paymentResult.success) {
        // Update transaction status
        await Database.updateTransactionStatus(
          transaction.id,
          'completed',
          paymentRequest.userId
        )

        // Process agent commission automatically (handled by database trigger)
        // But we can also do it manually for better control
        await this.processAgentCommissionForPayment(
          transaction.id,
          paymentRequest.propertyId,
          paymentRequest.userId,
          paymentRequest.amount,
          paymentRequest.transactionType
        )

        return {
          success: true,
          transactionId: transaction.id,
          paymentReference: paymentResult.reference,
          message: 'Payment processed successfully'
        }
      } else {
        // Update transaction status to failed
        await Database.updateTransactionStatus(
          transaction.id,
          'rejected'
        )

        return {
          success: false,
          message: 'Payment processing failed',
          error: paymentResult.error
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      return {
        success: false,
        message: 'Payment processing failed',
        error: (error as Error).message
      }
    }
  }

  // Process agent commission for completed payment
  private static async processAgentCommissionForPayment(
    transactionId: UUID,
    propertyId: UUID,
    tenantId: UUID,
    amount: number,
    transactionType: TransactionType
  ) {
    try {
      // Get property details to find the agent
      const propertyResult = await Database.getPropertyById(propertyId)
      if (!propertyResult.success || !propertyResult.data) {
        console.error('Property not found for commission processing')
        return
      }

      const property = propertyResult.data
      const agentId = property.agent_id

      // Determine commission rate based on transaction type
      let commissionRate = 0.10 // Default 10%
      let earningType: 'commission' | 'booking_fee' | 'service_fee' = 'commission'

      switch (transactionType) {
        case 'rent_payment':
          commissionRate = 0.10 // 10% of rent
          earningType = 'commission'
          break
        case 'deposit_payment':
          commissionRate = 0.05 // 5% of deposit
          earningType = 'commission'
          break
        case 'booking_payment':
          commissionRate = 0.15 // 15% of booking fee
          earningType = 'booking_fee'
          break
        case 'maintenance_request':
          commissionRate = 0.05 // 5% for maintenance
          earningType = 'service_fee'
          break
        case 'lease_renewal':
          commissionRate = 0.08 // 8% for lease renewal
          earningType = 'service_fee'
          break
        case 'rent_termination':
          commissionRate = 0.03 // 3% for termination processing
          earningType = 'service_fee'
          break
        default:
          commissionRate = 0.08 // 8% for other payments
          earningType = 'service_fee'
      }

      // Process the commission
      await AgentPaymentService.processAgentCommission(
        transactionId,
        propertyId,
        agentId,
        tenantId,
        amount,
        commissionRate
      )

    } catch (error) {
      console.error('Error processing agent commission:', error)
      // Don't fail the main payment if commission processing fails
    }
  }

  // M-Pesa payment processing
  private static async processMpesaPayment(
    amount: number,
    phone: string,
    transactionId: UUID
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phone,
          transactionId,
          description: 'Property payment'
        })
      })

      const result = await response.json()

      if (result.success) {
        // Store the checkout request ID for callback matching
        await supabase
          .from('transactions')
          .update({
            payment_reference: result.checkoutRequestId,
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)

        return {
          success: true,
          reference: result.checkoutRequestId
        }
      } else {
        return {
          success: false,
          error: result.error || 'M-Pesa payment failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'M-Pesa payment processing error'
      }
    }
  }

  // Stripe payment processing
  private static async processStripePayment(
    amount: number,
    cardDetails: {
      number: string
      expiry: string
      cvv: string
      name: string
    },
    transactionId: UUID
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          cardDetails,
          transactionId,
          description: 'Property payment'
        })
      })

      const result = await response.json()

      if (result.success) {
        return {
          success: true,
          reference: result.reference
        }
      } else {
        return {
          success: false,
          error: result.error || 'Stripe payment failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Stripe payment processing error'
      }
    }
  }

  // Bank transfer processing
  private static async processBankTransfer(
    amount: number,
    transactionId: UUID
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    try {
      // Bank transfers are usually manual verification
      // Mark as pending and require admin approval

      return {
        success: true,
        reference: `BT-${transactionId.slice(0, 8)}`
      }
    } catch (error) {
      return {
        success: false,
        error: 'Bank transfer processing error'
      }
    }
  }

  // Get payment history for user
  static async getPaymentHistory(userId: UUID) {
    try {
      const result = await Database.getUserTransactions(userId)
      return result
    } catch (error) {
      console.error('Error fetching payment history:', error)
      return {
        success: false,
        error: 'Failed to fetch payment history',
        data: null
      }
    }
  }

  // Verify payment status
  static async verifyPayment(transactionId: UUID) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (error) throw error

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      return {
        success: false,
        error: 'Failed to verify payment',
        data: null
      }
    }
  }

  // Refund payment (admin function)
  static async refundPayment(
    transactionId: UUID,
    refundAmount: number,
    reason: string,
    processedBy: UUID
  ) {
    try {
      // Get original transaction details
      const { data: originalTransaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (txError || !originalTransaction) {
        return {
          success: false,
          error: 'Original transaction not found'
        }
      }

      // Create refund transaction
      const refundResult = await Database.createTransaction({
        user_id: processedBy, // Admin user processing the refund
        tenancy_id: originalTransaction.tenancy_id,
        transaction_type: 'rent_termination', // Using termination type for refunds
        amount: -refundAmount, // Negative amount for refund
        status: 'completed',
        description: `Refund: ${reason}`,
        payment_method: 'bank_transfer' // Default for refunds
      })

      if (!refundResult.success) {
        return {
          success: false,
          error: 'Failed to create refund record'
        }
      }

      // Update original transaction
      await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      return {
        success: true,
        message: 'Refund processed successfully'
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      return {
        success: false,
        error: 'Failed to process refund'
      }
    }
  }
}