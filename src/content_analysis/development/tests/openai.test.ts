require('dotenv').config({ 
  path: '/Users/franciscoteixeirabarbosa/Dropbox/Random scripts/Periospot AI Dentistry Science Analysis/.env' 
});
const OpenAI = require('openai');
const axios = require('axios');

// Define error types
interface APIError {
  response?: {
    data?: any;
  };
  message?: string;
}

async function checkAPIStatus(apiKey: string) {
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    console.log('Available Models:', response.data.data.map((model: any) => model.id).slice(0, 5));
    return response.data;
  } catch (error: unknown) {
    const apiError = error as APIError;
    console.error('Error checking API status:', 
      apiError.response?.data || apiError.message || 'Unknown error'
    );
    return null;
  }
}

async function testOpenAI() {
  try {
    // Add a small delay before making the request
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    console.log('Using OpenAI API Key:', process.env.OPENAI_API_KEY.substring(0, 5) + '...');

    // Check API status and quota before making the request
    console.log('Checking API status and available models...');
    await checkAPIStatus(process.env.OPENAI_API_KEY);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Testing OpenAI API connection...');
    console.log('Using model:', "gpt-3.5-turbo");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Please respond with 'OpenAI API is working!' if you receive this message."
        }
      ],
      temperature: 0,
      max_tokens: 20,  // Limit response size
      user: "test-user-" + Date.now()  // Add unique user tag
    });

    console.log('API Response:', completion.choices[0].message.content);
    console.log('Response Details:', {
      model: completion.model,
      usage: completion.usage,
      created: new Date(completion.created * 1000).toISOString(),
    });
    
    return true;
  } catch (error: unknown) {
    const apiError = error as any;  // We can use any here since we're logging all properties
    console.error('OpenAI API Test Error:', {
      message: apiError.message,
      status: apiError.status,
      type: apiError.type,
      code: apiError.code,
      param: apiError.param,
      headers: apiError.headers,
      response: apiError.response?.data,
    });
    return false;
  }
}

// Run the test
console.log('Starting OpenAI API test...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
testOpenAI().then(success => {
  if (success) {
    console.log('✅ OpenAI API test passed successfully!');
  } else {
    console.log('❌ OpenAI API test failed!');
  }
}); 