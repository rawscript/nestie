import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, pending_booking_id } = await request.json()
    const propertyId = params.id

    // Update property status
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }

    if (pending_booking_id) {
      updateData.pending_booking_id = pending_booking_id
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating property status:', error)
      return NextResponse.json({ error: 'Failed to update property status' }, { status: 500 })
    }

    return NextResponse.json({ 
      data,
      message: 'Property status updated successfully' 
    })

  } catch (error) {
    console.error('Property status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}