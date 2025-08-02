const Ably = require('ably');

exports.handler = async (event, context) => {
  // Set CORS headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get Ably API key from environment variables
    const ABLY_API_KEY = process.env.ABLY_API;
    
    console.log('ABLY_API key exists:', !!ABLY_API_KEY);
    console.log('ABLY_API key length:', ABLY_API_KEY ? ABLY_API_KEY.length : 0);
    
    if (!ABLY_API_KEY) {
      console.error('Ably API key not found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Ably API key not configured'
        })
      };
    }

    // Create Ably client with API key
    const ably = new Ably.Rest(ABLY_API_KEY);
    
    // Generate a token directly instead of a token request
    const tokenDetails = await ably.auth.requestToken({
      clientId: 'neuraplay-user-' + Math.random().toString(36).substr(2, 9),
      capability: {
        'neuraplay-chat': ['publish', 'subscribe', 'presence'],
        'elevenlabs-stream': ['publish', 'subscribe'],
        'conversation:*': ['publish', 'subscribe']
      }
    });

    console.log('Generated tokenDetails:', tokenDetails);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenDetails)
    };

  } catch (error) {
    console.error('Ably auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate Ably token',
        details: error.message
      })
    };
  }
}; 