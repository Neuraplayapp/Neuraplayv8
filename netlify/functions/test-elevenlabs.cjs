const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get ElevenLabs API key
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 
                               process.env.elven_labs_api_key ||
                               process.env.VITE_ELVEN_LABS_API_KEY ||
                               process.env.ELEVEN_LABS_API_KEY;

    console.log('API Key found:', !!ELEVENLABS_API_KEY);
    console.log('API Key length:', ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.length : 0);

    if (!ELEVENLABS_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'ElevenLabs API key not configured',
          checked_vars: ['ELEVENLABS_API_KEY', 'elven_labs_api_key', 'VITE_ELVEN_LABS_API_KEY', 'ELEVEN_LABS_API_KEY']
        })
      };
    }

    // Test the API with a simple request
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (response.ok) {
      const voices = await response.json();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'ElevenLabs API key is working',
          voices_count: voices.length,
          sample_voice: voices[0] ? voices[0].name : null
        })
      };
    } else {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'ElevenLabs API test failed',
          status: response.status,
          details: errorText
        })
      };
    }

  } catch (error) {
    console.error('Test function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
}; 