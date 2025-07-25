import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')
    const agent_id = searchParams.get('agent_id')
    const property_id = searchParams.get('property_id')

    if (!tenant_id || !agent_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name, email),
        receiver:profiles!receiver_id(full_name, email)
      `)
      .or(`and(sender_id.eq.${tenant_id},receiver_id.eq.${agent_id}),and(sender_id.eq.${agent_id},receiver_id.eq.${tenant_id})`)
      .order('created_at', { ascending: true })

    if (property_id) {
      query = query.eq('property_id', property_id)
    }

    const { data: messages, error } = await query

    if (error) throw error

    return NextResponse.json({ data: messages })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const messageData = await request.json()

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: messageData.sender_id,
        receiver_id: messageData.recipient_id,
        property_id: messageData.property_id,
        content: messageData.message,
        message_type: 'text',
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:profiles!sender_id(full_name, email),
        receiver:profiles!receiver_id(full_name, email)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data: message })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}