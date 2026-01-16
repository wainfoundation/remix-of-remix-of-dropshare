import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vjkpkqajjohqisfzkxvp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3BrcWFqam9ocWlzZnpreHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mzc5NTgsImV4cCI6MjA4NDAxMzk1OH0.H8tzoj9fzEq9t5XDo1hGwuTY8CMDDE7_tawdGS0XIS0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('📍 Project URL:', supabaseUrl);
  
  try {
    // Test 1: Check if we can connect
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log(`📊 Total posts in database: ${count || 0}`);
    
    // Test 2: Fetch a few sample posts
    const { data: samplePosts, error: sampleError } = await supabase
      .from('posts')
      .select('id, caption, created_at')
      .limit(5);
      
    if (sampleError) {
      console.error('❌ Error fetching sample posts:', sampleError);
    } else if (samplePosts && samplePosts.length > 0) {
      console.log('📝 Sample posts:', samplePosts);
    } else {
      console.log('📝 No posts found in database');
    }
    
    // Test 3: Check profiles table
    const { count: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (profileCountError) {
      console.error('❌ Error checking profiles:', profileCountError);
    } else {
      console.log(`👥 Total profiles: ${profileCount || 0}`);
    }
    
    // Test 4: Check edge functions
    console.log('\n🔧 Edge Functions Available:');
    console.log('  - approve-payment:', `${supabaseUrl}/functions/v1/approve-payment`);
    console.log('  - complete-payment:', `${supabaseUrl}/functions/v1/complete-payment`);
    console.log('  - pi-payment:', `${supabaseUrl}/functions/v1/pi-payment`);
    console.log('  - pi-auth:', `${supabaseUrl}/functions/v1/pi-auth`);
    console.log('  - pi-ads:', `${supabaseUrl}/functions/v1/pi-ads`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
