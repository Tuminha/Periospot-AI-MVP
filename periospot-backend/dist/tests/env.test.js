"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testOpenAI = testOpenAI;
exports.testSupabase = testSupabase;
exports.testPort = testPort;
exports.runTests = runTests;
const config_1 = require("../config");
const openai_1 = __importDefault(require("openai"));
const supabase_js_1 = require("@supabase/supabase-js");
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Force reload environment variables
const envPath = path_1.default.resolve(__dirname, '../../.env');
dotenv_1.default.config({ path: envPath });
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
        console.log('API Key length:', config_1.config.openai.apiKey?.length || 0);
        console.log('API Key prefix:', config_1.config.openai.apiKey?.substring(0, 7));
        const openai = new openai_1.default({
            apiKey: config_1.config.openai.apiKey
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
    }
    catch (error) {
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
        console.log('URL:', config_1.config.supabase.url);
        console.log('Key type:', config_1.config.supabase.key?.includes('service_role') ? 'service_role' : 'anon');
        const supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
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
    }
    catch (error) {
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
async function testPort(port) {
    return new Promise((resolve) => {
        console.log(`🔄 Testing port ${port} availability...`);
        const server = http_1.default.createServer();
        server.once('error', (err) => {
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
    console.log(`PORT: ${config_1.config.port ? '✅' : '❌'}`);
    console.log(`FRONTEND_URL: ${config_1.config.cors.origin ? '✅' : '❌'}`);
    console.log(`SUPABASE_URL: ${config_1.config.supabase.url ? '✅' : '❌'}`);
    console.log(`SUPABASE_SERVICE_KEY: ${config_1.config.supabase.key ? '✅' : '❌'}`);
    console.log(`OPENAI_API_KEY: ${config_1.config.openai.apiKey ? '✅' : '❌'}\n`);
    // Test services
    console.log('Testing services:');
    await testPort(config_1.config.port);
    await testSupabase();
    await testOpenAI();
    console.log('\n✨ Environment tests completed\n');
}
// Run tests if file is executed directly
if (require.main === module) {
    runTests();
}
