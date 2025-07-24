import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const tenancyData = await request.json()

    // Create tenancy record
    const { data: tenancy, error } = await supabase
      .from('tenancies')
      .insert([{
        property_id: tenancyData.property_id,
        tenant_id: tenancyData.tenant_id,
        agent_id: tenancyData.agent_id,
        monthly_rent: tenancyData.monthly_rent,
        start_date: tenancyData.start_date,
        lease_period: tenancyData.lease_period,
        status: tenancyData.status || 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Tenancy creation error:', error)
      return NextResponse.json({ error: 'Failed to create tenancy' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: tenancy,
      message: 'Tenancy created successfully' 
    })

  } catch (error) {
    console.error('Tenancy API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const agentId = searchParams.get('agent_id')

    let query = supabase
      .from('tenancies')
      .select(`
        *,
        property:properties(*),
        tenant:profiles!tenancies_tenant_id_fkey(id, full_name, email, phone),
        agent:profiles!tenancies_agent_id_fkey(id, full_name, email, phone, company)
      `)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tenancies:', error)
      return NextResponse.json({ error: 'Failed to fetch tenancies' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Tenancies GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}