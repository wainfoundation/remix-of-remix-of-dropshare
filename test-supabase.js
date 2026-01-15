import { supabase } from './src/integrations/supabase/client';

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    
    // Test authentication
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Auth check:', { session, error });
    
    // Test database connection with a simple query
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    console.log('Database connection test:', { data, dbError });
    
    if (!dbError) {
      console.log('✅ Supabase connection successful!');
    } else {
      console.log('❌ Database error:', dbError);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test
testSupabaseConnection();