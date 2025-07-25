import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TINYMPESA_API_KEY
    const apiSecret = process.env.TINYMPESA_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'TinyMpesa credentials not configured' },
        { status: 500 }
      )
    }

    // Test TinyMpesa API connection
    const response = await fetch('https://tinympesa.com/api/v1/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: 'TinyMpesa API connection failed',
          details: errorText,
          status: response.status
        },
        { status: 500 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'TinyMpesa connection successful',
      status: data
    })

  } catch (error: any) {
    console.error('TinyMpesa test error:', error)
    
    return NextResponse.json(
      { 
        error: 'TinyMpesa connection failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}