# Agent Payment System

This document explains how the agent payment system works in the Nestie platform, where agents receive commissions when tenants make payments for properties they've listed.

## Overview

The agent payment system automatically processes commissions for agents when tenants make payments. The system supports:

- **Automatic commission calculation** based on payment type
- **Multiple payment account types** (Bank, M-Pesa, PayPal)
- **Payout request management** for agents
- **Real-time earnings tracking**
- **Admin approval workflow** for payouts

## System Components

### 1. Database Tables

#### `agent_payment_accounts`
Stores agent payment account information:
- Bank accounts (account number, bank name, account holder name)
- Mobile money accounts (phone number)
- PayPal accounts (email address)

#### `agent_earnings`
Tracks all agent earnings:
- Commission from rent payments (10%)
- Commission from deposit payments (5%)
- Booking fees (15%)
- Service fees (8%)

#### `payout_requests`
Manages payout requests from agents:
- Pending, approved, rejected, completed statuses
- Links to specific payment accounts
- Admin approval workflow

### 2. Core Services

#### `AgentPaymentService`
Main service for handling agent payments:
```typescript
// Add payment account
await AgentPaymentService.addPaymentAccount(agentId, accountData)

// Process commission
await AgentPaymentService.processAgentCommission(
  transactionId, propertyId, agentId, tenantId, amount, commissionRate
)

// Request payout
await AgentPaymentService.requestPayout(agentId, accountId, amount)
```

#### `PaymentService`
Handles tenant payments and triggers agent commissions:
```typescript
// Process payment (automatically triggers agent commission)
await PaymentService.processPayment(paymentRequest)
```

### 3. React Components

#### `PaymentAccountManager`
Allows agents to manage their payment accounts:
- Add new accounts (Bank, M-Pesa, PayPal)
- Set primary account
- View verification status

#### `EarningsDashboard`
Shows agent earnings and payout history:
- Earnings summary (total, pending, paid)
- Detailed earnings history
- Payout request management

#### `PaymentForm`
Tenant payment form that triggers agent commissions:
- Multiple payment methods (M-Pesa, Stripe, Bank Transfer)
- Real-time payment processing
- Automatic commission calculation

## Commission Structure

| Payment Type | Commission Rate | Earning Type |
|-------------|----------------|--------------|
| Rent Payment | 10% | commission |
| Deposit Payment | 5% | commission |
| Booking Payment | 15% | booking_fee |
| Other Payments | 8% | service_fee |

## Setup Instructions

### 1. Database Migration

Run the migration to create the necessary tables:

```sql
-- Run the migration file
psql -d your_database < migrations/add_agent_payments.sql
```

### 2. Environment Variables

Add the following to your `.env.local`:

```env
# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=628125
MPESA_PASSKEY=Passkey20250725
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox
```

### 3. M-Pesa Daraja Setup

1. **Get Daraja API Credentials**:
   - Visit [Daraja Portal](https://developer.safaricom.co.ke/)
   - Create an app and get Consumer Key & Secret
   - Configure your callback URL

2. **Test Credentials** (Sandbox):
   - Business Shortcode: `628125`
   - Passkey: `Passkey20250725`
   - Test Phone: `254792813814`

3. **Callback URL Configuration**:
   - Set your callback URL to: `https://yourdomain.com/api/payments/mpesa/callback`
   - Ensure your domain is accessible by Safaricom servers

### 3. Component Integration

Add the components to your agent dashboard:

```tsx
// Agent Dashboard
import PaymentAccountManager from '@/components/agent/PaymentAccountManager'
import EarningsDashboard from '@/components/agent/EarningsDashboard'

export default function AgentDashboard() {
  return (
    <div className="space-y-8">
      <EarningsDashboard />
      <PaymentAccountManager />
    </div>
  )
}
```

Add the payment form to tenant pages:

```tsx
// Tenant Payment Page
import PaymentForm from '@/components/payments/PaymentForm'

export default function PaymentPage() {
  return (
    <PaymentForm
      propertyId="property-id"
      tenancyId="tenancy-id"
      amount={50000}
      transactionType="rent_payment"
      description="Monthly rent payment"
      onSuccess={(result) => console.log('Payment successful:', result)}
      onError={(error) => console.error('Payment failed:', error)}
    />
  )
}
```

## Usage Flow

### For Agents

1. **Add Payment Account**
   - Navigate to Payment Accounts section
   - Add bank account, M-Pesa, or PayPal details
   - Set primary account for payouts

2. **Monitor Earnings**
   - View earnings dashboard
   - Track pending and paid commissions
   - See detailed transaction history

3. **Request Payouts**
   - Click "Request Payout" when earnings are available
   - Select amount (up to pending earnings)
   - Submit request for admin approval

### For Tenants

1. **Make Payment**
   - Use the payment form on property pages
   - Choose payment method (M-Pesa, Card, Bank Transfer)
   - Complete payment process

2. **Automatic Commission**
   - System automatically calculates agent commission
   - Commission is added to agent's pending earnings
   - Agent receives notification

### For Admins

1. **Review Payout Requests**
   - Access admin panel for payout management
   - Review agent payout requests
   - Approve or reject with reasons

2. **Process Payouts**
   - Execute approved payouts
   - Update payment references
   - Mark as completed

## API Endpoints

### Payment Processing
- `POST /api/payments/mpesa` - Process M-Pesa payments
- `POST /api/payments/stripe` - Process card payments
- `PUT /api/payments/mpesa` - M-Pesa callback handler
- `PUT /api/payments/stripe` - Stripe webhook handler

### Agent Payments (Internal Services)
- `AgentPaymentService.addPaymentAccount()`
- `AgentPaymentService.getAgentEarnings()`
- `AgentPaymentService.requestPayout()`
- `AgentPaymentService.processAgentCommission()`

## Security Considerations

1. **Row Level Security (RLS)**
   - Agents can only access their own payment accounts and earnings
   - Tenants can only make payments for their own tenancies
   - Admins have elevated access for payout processing

2. **Payment Validation**
   - All payments are validated before processing
   - Commission calculations are server-side only
   - Payout requests require sufficient pending earnings

3. **Audit Trail**
   - All transactions are logged with timestamps
   - Commission calculations are tracked
   - Payout approvals include admin user ID

## Testing

### Test Agent Commission Flow

1. Create a test property with an agent
2. Create a test tenancy
3. Make a payment as tenant
4. Verify commission is created in agent_earnings
5. Check agent can see earnings in dashboard
6. Test payout request process

### Test Payment Methods

1. **M-Pesa**: Use test phone numbers
2. **Stripe**: Use test card numbers
3. **Bank Transfer**: Test manual verification flow

## Troubleshooting

### Common Issues

1. **Commission not created**
   - Check if property has valid agent_id
   - Verify transaction status is 'completed'
   - Check database trigger is working

2. **Payout request failed**
   - Ensure agent has sufficient pending earnings
   - Verify payment account exists and is verified
   - Check for duplicate payout requests

3. **Payment processing failed**
   - Check API credentials for payment providers
   - Verify network connectivity
   - Review error logs for specific issues

### Debug Commands

```sql
-- Check agent earnings
SELECT * FROM agent_earnings WHERE agent_id = 'agent-uuid';

-- Check payout requests
SELECT * FROM payout_requests WHERE agent_id = 'agent-uuid';

-- Check transaction status
SELECT * FROM transactions WHERE id = 'transaction-uuid';
```

## Future Enhancements

1. **Multi-currency Support**
   - Support for USD, EUR payments
   - Currency conversion for commissions

2. **Advanced Commission Rules**
   - Tiered commission rates
   - Performance-based bonuses
   - Custom commission agreements

3. **Automated Payouts**
   - Scheduled automatic payouts
   - Minimum payout thresholds
   - Instant payout options

4. **Analytics Dashboard**
   - Agent performance metrics
   - Commission trend analysis
   - Revenue forecasting

## Support

For technical support or questions about the agent payment system:

1. Check the troubleshooting section above
2. Review the database logs for errors
3. Contact the development team with specific error messages
4. Provide transaction IDs for payment-related issues