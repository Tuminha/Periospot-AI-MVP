import { config } from '../config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';

// Force reload environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Add environment variable logging
function logEnvironmentVariables() {
  console.log('\n📋 Environment Variables:');
  console.log('ENV Path:', envPath);
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_SERVICE_KEY (length):', process.env.SUPABASE_SERVICE_KEY?.length);
  console.log('OPENAI_API_KEY (length):', process.env.OPENAI_API_KEY?.length);
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
  console.log('');
}

async function testOpenAI() {
  try {
    console.log('🔄 Testing OpenAI connection...');
    console.log('API Key length:', config.openai.apiKey?.length || 0);
    console.log('API Key prefix:', config.openai.apiKey?.substring(0, 7));
    
    const openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    
    console.log('📡 Making test request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "test successful"' }]
    });
    
    console.log('📥 Response received:', {
      id: response.id,
      model: response.model,
      created: new Date(response.created * 1000).toISOString()
    });
    
    console.log('✅ OpenAI API Key is valid and working');
    return true;
  } catch (error: any) {
    console.error('❌ OpenAI API Error Details:', {
      message: error.message,
      type: error.type,
      status: error.status,
      stack: error.stack
    });
    return false;
  }
}

async function testSupabase() {
  try {
    console.log('🔄 Testing Supabase connection...');
    console.log('URL:', config.supabase.url);
    console.log('Key type:', config.supabase.key?.includes('service_role') ? 'service_role' : 'anon');
    
    const supabase = createClient(
      config.supabase.url!,
      config.supabase.key!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('📡 Testing Supabase connection...');
    
    // Simple connection test by checking todos table
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .limit(1);
    
    if (error) {
      // If we get a permission error, that's actually good - it means we connected
      if (error.message.includes('permission denied')) {
        console.log('📥 Supabase response:', {
          success: true,
          info: 'Connected successfully (permission denied is expected with RLS)'
        });
        console.log('✅ Supabase connection successful');
        return true;
      }
      throw new Error(`Database Error: ${error.message}`);
    }
    
    console.log('📥 Supabase response:', {
      success: true,
      info: 'Connected successfully',
      rowCount: data?.length || 0
    });
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error: any) {
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

async function testPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`🔄 Testing port ${port} availability...`);
    const server = http.createServer();
    
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
        console.log('💡 Tip: Run "lsof -i :${port}" to see which process is using it');
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      console.log(`✅ Port ${port} is available`);
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

async function runTests() {
  console.log('\n🔍 Starting environment tests...\n');
  
  // Log environment variables
  logEnvironmentVariables();
  
  // Test environment variables presence
  console.log('Testing environment variables:');
  console.log(`PORT: ${config.port ? '✅' : '❌'}`);
  console.log(`FRONTEND_URL: ${config.cors.origin ? '✅' : '❌'}`);
  console.log(`SUPABASE_URL: ${config.supabase.url ? '✅' : '❌'}`);
  console.log(`SUPABASE_SERVICE_KEY: ${config.supabase.key ? '✅' : '❌'}`);
  console.log(`OPENAI_API_KEY: ${config.openai.apiKey ? '✅' : '❌'}\n`);
  
  // Test services
  console.log('Testing services:');
  await testPort(config.port);
  await testSupabase();
  await testOpenAI();
  
  console.log('\n✨ Environment tests completed\n');
}

// Run tests if file is executed directly
if (require.main === module) {
  runTests();
}

export { testOpenAI, testSupabase, testPort, runTests }; 