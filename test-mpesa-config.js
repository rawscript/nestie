// Simple M-Pesa configuration validator
require('dotenv').config();

function validateMpesaEnvironment() {
  console.log('🔍 Validating M-Pesa Configuration...\n');
  
  const requiredEnvVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET', 
    'MPESA_BUSINESS_SHORTCODE',
    'MPESA_PASSKEY',
    'MPESA_CALLBACK_URL',
    'MPESA_ENVIRONMENT'
  ];

  const missing = [];
  const placeholder = [];
  
  console.log('📋 Environment Variables Check:');
  console.log('================================');
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
      console.log(`❌ ${envVar}: NOT SET`);
    } else if (value.includes('your_') || value === 'your_consumer_secret') {
      placeholder.push(envVar);
      console.log(`⚠️  ${envVar}: PLACEHOLDER VALUE`);
    } else {
      console.log(`✅ ${envVar}: SET`);
    }
  });
  
  console.log('\n📊 Configuration Summary:');
  console.log('=========================');
  console.log(`Environment: ${process.env.MPESA_ENVIRONMENT || 'NOT SET'}`);
  console.log(`Business Shortcode: ${process.env.MPESA_BUSINESS_SHORTCODE || 'NOT SET'}`);
  console.log(`Callback URL: ${process.env.MPESA_CALLBACK_URL || 'NOT SET'}`);
  
  console.log('\n🔍 Issues Found:');
  console.log('================');
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:');
    missing.forEach(envVar => console.log(`   - ${envVar}`));
  }
  
  if (placeholder.length > 0) {
    console.log('⚠️  Placeholder values that need to be replaced:');
    placeholder.forEach(envVar => console.log(`   - ${envVar}`));
  }
  
  // Specific validation checks
  const issues = [];
  
  // Check consumer secret
  if (process.env.MPESA_CONSUMER_SECRET === 'your_consumer_secret') {
    issues.push('MPESA_CONSUMER_SECRET is still set to placeholder value');
  }
  
  // Check callback URL format
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (callbackUrl && !callbackUrl.startsWith('https://')) {
    issues.push('MPESA_CALLBACK_URL must use HTTPS (required by Safaricom)');
  }
  
  // Check environment value
  const environment = process.env.MPESA_ENVIRONMENT;
  if (environment && !['sandbox', 'production'].includes(environment)) {
    issues.push('MPESA_ENVIRONMENT must be either "sandbox" or "production"');
  }
  
  // Check business shortcode format
  const shortcode = process.env.MPESA_BUSINESS_SHORTCODE;
  if (shortcode && !/^\d+$/.test(shortcode)) {
    issues.push('MPESA_BUSINESS_SHORTCODE should contain only numbers');
  }
  
  if (issues.length > 0) {
    console.log('🚨 Configuration Issues:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  
  if (missing.length > 0 || placeholder.length > 0 || issues.length > 0) {
    console.log('❌ M-Pesa configuration is NOT ready for use');
    console.log('\n📝 To fix:');
    console.log('1. Get your M-Pesa Daraja API credentials from https://developer.safaricom.co.ke/');
    console.log('2. Replace MPESA_CONSUMER_SECRET with your actual consumer secret');
    console.log('3. Ensure your callback URL is accessible via HTTPS');
    console.log('4. Test with sandbox environment first');
    return false;
  } else {
    console.log('✅ M-Pesa configuration appears to be complete!');
    console.log('\n🧪 You can now test the integration with:');
    console.log('   npm run dev');
    console.log('   Then test a payment in your application');
    return true;
  }
}

// Test M-Pesa API connectivity (basic check)
async function testMpesaConnectivity() {
  console.log('\n🌐 Testing M-Pesa API Connectivity...');
  console.log('====================================');
  
  const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
  const baseUrl = environment === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';
    
  try {
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        console.log('✅ Successfully connected to M-Pesa API');
        console.log(`   Token expires in: ${data.expires_in} seconds`);
        return true;
      } else {
        console.log('❌ Connected but no access token received');
        console.log('   Response:', data);
        return false;
      }
    } else {
      console.log(`❌ Failed to connect to M-Pesa API (${response.status})`);
      const errorText = await response.text();
      console.log('   Error:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Network error connecting to M-Pesa API');
    console.log('   Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 M-Pesa Configuration Validator');
  console.log('==================================\n');
  
  const configValid = validateMpesaEnvironment();
  
  if (configValid) {
    await testMpesaConnectivity();
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Validation complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateMpesaEnvironment, testMpesaConnectivity };