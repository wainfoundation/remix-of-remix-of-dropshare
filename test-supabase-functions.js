// Test script for Supabase Edge Functions
// Run this to test if your functions are properly deployed

const PROJECT_URL = 'https://vjkpkqajjohqisfzkxvp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMjczNjUsImV4cCI6MjA1MjYwMzM2NX0.oMI93g2zqCUNYUKCwrQ05WLqeFdlc7vC1kSrW0vXDpY';

async function testFunction(functionName, payload = {}) {
  const url = `${PROJECT_URL}/functions/v1/${functionName}`;
  
  try {
    console.log(`\n🧪 Testing ${functionName} function...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.text();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response: ${result}`);
    
    return { status: response.status, result };
  } catch (error) {
    console.error(`❌ Error testing ${functionName}:`, error);
    return { error: error.message };
  }
}

// Test all functions
async function runTests() {
  console.log('🚀 Testing Supabase Edge Functions...\n');
  
  // Test pi-auth function
  await testFunction('pi-auth', {
    accessToken: 'test_token',
    piUser: { uid: 'test_user', username: 'test_username' }
  });
  
  // Test pi-ads function
  await testFunction('pi-ads', {
    adId: 'test_ad_id'
  });
  
  // Test pi-payment function
  await testFunction('pi-payment', {
    action: 'approve',
    paymentId: 'test_payment_id'
  });
  
  console.log('\n✅ Function tests completed!');
  console.log('🌐 Dashboard: https://supabase.com/dashboard/project/vjkpkqajjohqisfzkxvp/functions');
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

export { testFunction, runTests };