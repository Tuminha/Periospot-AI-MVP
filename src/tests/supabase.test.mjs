import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key type:', supabaseAnonKey.substring(0, 20) + '...');
    
    // Test auth endpoint
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    console.log('📡 Auth Status:', {
      hasSession: !!session,
      error: authError?.message || null
    });

    // Test database connection
    const { data, error: dbError } = await supabase
      .from('todos')
      .select('*')
      .limit(1);

    if (dbError) {
      // If we get a permission error, that's actually good - it means we connected
      if (dbError.message.includes('permission denied')) {
        console.log('📥 Supabase DB response:', {
          success: true,
          info: 'Connected successfully (permission denied is expected with RLS)'
        });
        console.log('✅ Supabase connection successful');
        return true;
      }
      throw dbError;
    }

    console.log('📥 Supabase DB response:', {
      success: true,
      info: 'Connected successfully',
      rowCount: data?.length || 0
    });

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase Error Details:', {
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    });
    return false;
  }
}

// Immediately execute the test
console.log('\n🔍 Starting Supabase connection test...\n');
testSupabaseConnection().then(() => {
  console.log('\n✨ Test completed\n');
}); 