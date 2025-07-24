// Test script to verify Supabase authentication is working
// Run with: node scripts/test-auth.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://szdkhgmseyzyxvqvltjn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZGtoZ21zZXl6eXh2cXZsdGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTUxMDcsImV4cCI6MjA2ODkzMTEwN30.is6rNfQg4wq_UM0auM1ZDuObsuH7Nl6z4LrzGU1bkM4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('Testing Supabase Authentication...')
  
  try {
    // Test 1: Create demo tenant user
    console.log('\n1. Creating demo tenant user...')
    const { data: tenantData, error: tenantError } = await supabase.auth.signUp({
      email: 'tenant@demo.com',
      password: 'demo123',
      options: {
        data: {
          full_name: 'Demo Tenant',
          phone: '+254700000001',
          role: 'tenant'
        }
      }
    })
    
    if (tenantError && tenantError.message !== 'User already registered') {
      console.error('Tenant signup error:', tenantError.message)
    } else {
      console.log('✅ Tenant user created/exists:', tenantData?.user?.email)
    }

    // Test 2: Create demo agent user
    console.log('\n2. Creating demo agent user...')
    const { data: agentData, error: agentError } = await supabase.auth.signUp({
      email: 'agent@demo.com',
      password: 'demo123',
      options: {
        data: {
          full_name: 'Demo Agent',
          phone: '+254700000002',
          role: 'agent'
        }
      }
    })
    
    if (agentError && agentError.message !== 'User already registered') {
      console.error('Agent signup error:', agentError.message)
    } else {
      console.log('✅ Agent user created/exists:', agentData?.user?.email)
    }

    // Test 3: Test login with tenant credentials
    console.log('\n3. Testing tenant login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'tenant@demo.com',
      password: 'demo123'
    })
    
    if (loginError) {
      console.error('Login error:', loginError.message)
    } else {
      console.log('✅ Tenant login successful:', loginData.user?.email)
      console.log('   User role:', loginData.user?.user_metadata?.role)
    }

    // Test 4: Sign out
    console.log('\n4. Testing sign out...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('Sign out error:', signOutError.message)
    } else {
      console.log('✅ Sign out successful')
    }

    console.log('\n🎉 All authentication tests completed!')
    console.log('\nYou can now use these credentials in your app:')
    console.log('Tenant: tenant@demo.com / demo123')
    console.log('Agent: agent@demo.com / demo123')
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testAuth()