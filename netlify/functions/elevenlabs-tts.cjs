const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text, voiceId, modelId = 'eleven_turbo_v2_5' } = JSON.parse(event.body);
    
    console.log('ElevenLabs TTS request received');
    console.log('Text:', text);
    console.log('Voice ID:', voiceId);
    console.log('Model ID:', modelId);

    // Get ElevenLabs API key - try multiple possible environment variable names
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 
                               process.env.elven_labs_api_key ||
                               process.env.VITE_ELVEN_LABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'ElevenLabs API key not configured. Checked: ELEVENLABS_API_KEY, elven_labs_api_key, VITE_ELVEN_LABS_API_KEY'
        })
      };
    }

    if (!text || !voiceId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Text and voiceId are required'
        })
      };
    }

    // Call ElevenLabs TTS API with Turbo model
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS API error:', errorText);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: `ElevenLabs TTS failed: ${response.status}`,
          details: errorText
        })
      };
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('TTS conversion successful');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        audio_base64: audioBase64,
        model_used: modelId,
        voice_id: voiceId,
        text_length: text.length
      })
    };

  } catch (error) {
    console.error('ElevenLabs TTS function error:', error);
    
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