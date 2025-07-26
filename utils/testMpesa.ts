import { MpesaDarajaService } from '@/lib/mpesaDaraja'

// Test M-Pesa integration
export async function testMpesaIntegration() {
  const mpesaService = new MpesaDarajaService()

  try {
    console.log('Testing M-Pesa STK Push...')
    
    const response = await mpesaService.initiateSTKPush({
      phoneNumber: '254792813814', // Test phone number
      amount: 100, // KES 100
      accountReference: 'TEST001',
      transactionDesc: 'Test payment'
    })

    console.log('STK Push Response:', response)
    
    if (response.ResponseCode === '0') {
      console.log('✅ STK Push initiated successfully')
      console.log('CheckoutRequestID:', response.CheckoutRequestID)
      
      // Wait a bit then query status
      setTimeout(async () => {
        try {
          const status = await mpesaService.querySTKPushStatus(response.CheckoutRequestID)
          console.log('Payment Status:', status)
        } catch (error) {
          console.error('Status query error:', error)
        }
      }, 10000) // Wait 10 seconds
      
    } else {
      console.log('❌ STK Push failed:', response.ResponseDescription)
    }
    
  } catch (error) {
    console.error('❌ M-Pesa test failed:', error)
  }
}

// Test callback processing
export function testCallbackProcessing() {
  const mockSuccessCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: "29115-34620561-1",
        CheckoutRequestID: "ws_CO_191220191020363925",
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: 100 },
            { Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" },
            { Name: "TransactionDate", Value: 20191219102115 },
            { Name: "PhoneNumber", Value: 254792813814 }
          ]
        }
      }
    }
  }

  const mockFailureCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: "29115-34620561-1",
        CheckoutRequestID: "ws_CO_191220191020363925",
        ResultCode: 1032,
        ResultDesc: "Request cancelled by user"
      }
    }
  }

  console.log('Testing success callback...')
  const successResult = MpesaDarajaService.processCallback(mockSuccessCallback)
  console.log('Success result:', successResult)

  console.log('Testing failure callback...')
  const failureResult = MpesaDarajaService.processCallback(mockFailureCallback)
  console.log('Failure result:', failureResult)
}

// Environment validation
export function validateMpesaEnvironment() {
  const requiredEnvVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_BUSINESS_SHORTCODE',
    'MPESA_PASSKEY',
    'MPESA_CALLBACK_URL',
    'MPESA_ENVIRONMENT'
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    console.error('❌ Missing M-Pesa environment variables:', missing)
    return false
  }

  console.log('✅ All M-Pesa environment variables are set')
  console.log('Environment:', process.env.MPESA_ENVIRONMENT)
  console.log('Business Shortcode:', process.env.MPESA_BUSINESS_SHORTCODE)
  console.log('Callback URL:', process.env.MPESA_CALLBACK_URL)
  
  return true
}