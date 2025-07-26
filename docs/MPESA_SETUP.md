# M-Pesa Setup Guide

## Prerequisites

1. **Safaricom Daraja Account**: Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke/)
2. **Create an App** to get your credentials
3. **Business Shortcode** and **Passkey** from Safaricom

## Environment Variables Required

```env
MPESA_CONSUMER_KEY=your_consumer_key_from_daraja
MPESA_CONSUMER_SECRET=your_consumer_secret_from_daraja
MPESA_BUSINESS_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_passkey_from_safaricom
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox  # or 'production' for live
```

## Development Setup

### 1. For Local Testing (using ngrok)

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Update your .env with the ngrok URL
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/mpesa/callback
```

### 2. Test the Configuration

```bash
# Run the validation script
node -e "
const { validateMpesaEnvironment } = require('./utils/testMpesa.ts');
validateMpesaEnvironment();
"
```

## Production Setup

1. **Update Environment Variables** with production values
2. **Set MPESA_ENVIRONMENT=production**
3. **Update MPESA_CALLBACK_URL** to your production domain
4. **Test thoroughly** in sandbox before going live

## Testing

The project includes test utilities in `utils/testMpesa.ts`:

```typescript
import { testMpesaIntegration, validateMpesaEnvironment } from '@/utils/testMpesa'

// Validate environment
validateMpesaEnvironment()

// Test STK Push
testMpesaIntegration()
```

## Common Issues

1. **Invalid Consumer Secret**: Make sure it's from your Daraja app
2. **Callback URL not accessible**: Must be publicly accessible HTTPS URL
3. **Phone Number Format**: Must be in format 254XXXXXXXXX
4. **Amount**: Must be integer (no decimals)

## API Endpoints

- **STK Push**: `POST /api/payments/mpesa`
- **Callback**: `POST /api/payments/mpesa/callback`

## Security Notes

- Never commit real credentials to version control
- Use environment variables for all sensitive data
- Validate all callback data
- Implement proper error handling