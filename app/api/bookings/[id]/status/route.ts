import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()
    const bookingId = params.id

    // Update booking status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select(`
        *,
        property:properties(*),
        tenant:profiles!bookings_tenant_id_fkey(id, full_name, email),
        agent:profiles!bookings_agent_id_fkey(id, full_name, email, company)
      `)
      .single()

    if (error) {
      console.error('Error updating booking status:', error)
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: booking,
      message: 'Booking status updated successfully' 
    })

  } catch (error) {
    console.error('Booking status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}