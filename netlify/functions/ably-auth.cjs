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
    
    if (!ABLY_API_KEY) {
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
    
    // Generate a token for the client
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: 'neuraplay-user-' + Math.random().toString(36).substr(2, 9),
      capability: {
        'neuraplay-chat': ['publish', 'subscribe', 'presence'],
        'elevenlabs-stream': ['publish', 'subscribe']
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(tokenRequest)
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