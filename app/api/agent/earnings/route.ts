import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const earningsData = await request.json()

    // Create agent earnings record
    const { data: earnings, error: earningsError } = await supabase
      .from('agent_earnings')
      .insert([{
        agent_id: earningsData.agent_id,
        booking_id: earningsData.booking_id,
        property_id: earningsData.property_id,
        amount: earningsData.amount,
        type: earningsData.type,
        status: earningsData.status,
        description: earningsData.description,
        created_at: earningsData.created_at
      }])
      .select()
      .single()

    if (earningsError) {
      console.error('Agent earnings creation error:', earningsError)
      return NextResponse.json({ error: 'Failed to create earnings record' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: earnings,
      message: 'Earnings record created successfully' 
    })

  } catch (error) {
    console.error('Agent earnings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')
    const status = searchParams.get('status')

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('agent_earnings')
      .select(`
        *,
        booking:bookings(*),
        property:properties(title, location)
      `)
      .eq('agent_id', agentId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agent earnings:', error)
      return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
    }

    // Calculate totals
    const totalEarnings = data?.reduce((sum, earning) => sum + (earning.amount || 0), 0) || 0
    const pendingEarnings = data?.filter(e => e.status === 'pending_approval').reduce((sum, earning) => sum + (earning.amount || 0), 0) || 0
    const availableEarnings = data?.filter(e => e.status === 'available').reduce((sum, earning) => sum + (earning.amount || 0), 0) || 0

    return NextResponse.json({ 
      data,
      summary: {
        total: totalEarnings,
        pending: pendingEarnings,
        available: availableEarnings
      }
    })

  } catch (error) {
    console.error('Agent earnings GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const earningsId = searchParams.get('id')
    const { status } = await request.json()

    if (!earningsId) {
      return NextResponse.json({ error: 'Earnings ID is required' }, { status: 400 })
    }

    // Update earnings status (e.g., from pending_approval to available)
    const { data, error } = await supabase
      .from('agent_earnings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', earningsId)
      .select()
      .single()

    if (error) {
      console.error('Error updating earnings status:', error)
      return NextResponse.json({ error: 'Failed to update earnings' }, { status: 500 })
    }

    return NextResponse.json({ 
      data,
      message: 'Earnings status updated successfully' 
    })

  } catch (error) {
    console.error('Agent earnings PATCH API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}