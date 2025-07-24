import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all available properties created by verified agents
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        agent:profiles!properties_agent_id_fkey(
          id,
          full_name,
          email,
          phone,
          company,
          verified,
          avatar_url
        )
      `)
      .eq('created_by_agent', true)
      .eq('status', 'available')
      .not('agent_id', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agent listings:', error)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    // Filter to only include properties from verified agents
    const verifiedAgentProperties = data?.filter(property => 
      property.agent && property.agent.verified === true
    ) || []

    return NextResponse.json({ 
      data: verifiedAgentProperties,
      count: verifiedAgentProperties.length 
    })

  } catch (error) {
    console.error('Agent listings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}