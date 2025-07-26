import { Buffer } from 'buffer'

export interface MpesaConfig {
  consumerKey: string
  consumerSecret: string
  businessShortcode: string
  passkey: string
  callbackUrl: string
  environment: 'sandbox' | 'production'
}

export interface STKPushRequest {
  phoneNumber: string
  amount: number
  accountReference: string
  transactionDesc: string
}

export interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export interface STKCallbackResponse {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value: string | number
        }>
      }
    }
  }
}

export class MpesaDarajaService {
  private config: MpesaConfig
  private baseUrl: string

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY!,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
      businessShortcode: process.env.MPESA_BUSINESS_SHORTCODE!,
      passkey: process.env.MPESA_PASSKEY!,
      callbackUrl: process.env.MPESA_CALLBACK_URL!,
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    }

    this.baseUrl = this.config.environment === 'sandbox' 
      ? 'https://sandbox.safaricom.co.ke' 
      : 'https://api.safaricom.co.ke'
  }

  // Generate access token
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')
    
    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  }

  // Generate password for STK Push
  private generatePassword(): { password: string; timestamp: string } {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(
      `${this.config.businessShortcode}${this.config.passkey}${timestamp}`
    ).toString('base64')

    return { password, timestamp }
  }

  // Format phone number to required format (254XXXXXXXXX)
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      return cleaned
    } else if (cleaned.startsWith('0')) {
      return `254${cleaned.substring(1)}`
    } else if (cleaned.length === 9) {
      return `254${cleaned}`
    }
    
    throw new Error('Invalid phone number format')
  }

  // Initiate STK Push
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      const accessToken = await this.getAccessToken()
      const { password, timestamp } = this.generatePassword()
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber)

      const payload = {
        BusinessShortCode: this.config.businessShortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount), // Ensure integer
        PartyA: formattedPhone,
        PartyB: this.config.businessShortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.config.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc
      }

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`STK Push failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      
      // Check if the response indicates success
      if (data.ResponseCode !== '0') {
        throw new Error(`STK Push failed: ${data.ResponseDescription || 'Unknown error'}`)
      }

      return data
    } catch (error) {
      console.error('STK Push error:', error)
      throw error
    }
  }

  // Query STK Push status
  async querySTKPushStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const { password, timestamp } = this.generatePassword()

      const payload = {
        BusinessShortCode: this.config.businessShortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      }

      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`STK Push query failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('STK Push query error:', error)
      throw error
    }
  }

  // Process callback data
  static processCallback(callbackData: STKCallbackResponse): {
    success: boolean
    transactionId?: string
    amount?: number
    phoneNumber?: string
    mpesaReceiptNumber?: string
    error?: string
  } {
    const callback = callbackData.Body.stkCallback

    if (callback.ResultCode === 0) {
      // Payment successful
      const metadata = callback.CallbackMetadata?.Item || []
      
      const getMetadataValue = (name: string) => {
        const item = metadata.find(item => item.Name === name)
        return item?.Value
      }

      return {
        success: true,
        transactionId: callback.CheckoutRequestID,
        amount: Number(getMetadataValue('Amount')),
        phoneNumber: String(getMetadataValue('PhoneNumber')),
        mpesaReceiptNumber: String(getMetadataValue('MpesaReceiptNumber'))
      }
    } else {
      // Payment failed or cancelled
      return {
        success: false,
        error: callback.ResultDesc
      }
    }
  }

  // Validate callback authenticity (optional security measure)
  static validateCallback(callbackData: any): boolean {
    // Add your validation logic here
    // You might want to verify the callback is from Safaricom
    // This could include checking IP addresses, signatures, etc.
    return true
  }
}