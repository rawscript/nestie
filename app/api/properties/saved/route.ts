import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch user's saved properties
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_properties')
      .select('property_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching saved properties:', error)
      return NextResponse.json({ error: 'Failed to fetch saved properties' }, { status: 500 })
    }

    const savedProperties = data?.map(item => item.property_id) || []

    return NextResponse.json({ 
      savedProperties,
      success: true 
    })

  } catch (error) {
    console.error('Saved properties API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

// POST - Save a property
export async function POST(request: NextRequest) {
  try {
    const { userId, propertyId } = await request.json()

    if (!userId || !propertyId) {
      return NextResponse.json({ 
        error: 'User ID and Property ID are required' 
      }, { status: 400 })
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .single()

    if (existing) {
      return NextResponse.json({ 
        message: 'Property already saved',
        success: true 
      })
    }

    const { data, error } = await supabase
      .from('saved_properties')
      .insert([{
        user_id: userId,
        property_id: propertyId,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) {
      console.error('Error saving property:', error)
      return NextResponse.json({ error: 'Failed to save property' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Property saved successfully',
      success: true,
      data 
    })

  } catch (error) {
    console.error('Save property API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

// DELETE - Remove a saved property
export async function DELETE(request: NextRequest) {
  try {
    const { userId, propertyId } = await request.json()

    if (!userId || !propertyId) {
      return NextResponse.json({ 
        error: 'User ID and Property ID are required' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId)

    if (error) {
      console.error('Error removing saved property:', error)
      return NextResponse.json({ error: 'Failed to remove saved property' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Property removed from saved',
      success: true 
    })

  } catch (error) {
    console.error('Remove saved property API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}