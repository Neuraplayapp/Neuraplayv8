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
    const { text, voiceId, modelId = 'eleven_turbo_v2_5', conversationId } = JSON.parse(event.body);
    
    console.log('ElevenLabs Streaming TTS request received');
    console.log('Text:', text);
    console.log('Voice ID:', voiceId);
    console.log('Model ID:', modelId);
    console.log('Conversation ID:', conversationId);

    // Get ElevenLabs API key
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 
                               process.env.elven_labs_api_key ||
                               process.env.VITE_ELVEN_LABS_API_KEY ||
                               process.env.ELEVEN_LABS_API_KEY;

    console.log('API Key found:', !!ELEVENLABS_API_KEY);
    console.log('API Key length:', ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.length : 0);

    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not found in environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'ElevenLabs API key not configured. Checked: ELEVENLABS_API_KEY, elven_labs_api_key, VITE_ELVEN_LABS_API_KEY, ELEVEN_LABS_API_KEY'
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

    // For Netlify Functions, we can't do true streaming, so we'll use the regular endpoint
    // and return the complete audio file, but simulate streaming by sending it in chunks
    console.log('Calling ElevenLabs API (non-streaming for Netlify compatibility)...');
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
        },
        output_format: 'mp3_44100_128'
      })
    });

    console.log('ElevenLabs API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS API error:', response.status, errorText);
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

    // Get the complete audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('TTS conversion successful, audio size:', audioBuffer.byteLength);

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
        text_length: text.length,
        streaming: false, // We're not actually streaming due to Netlify limitations
        audio_size_bytes: audioBuffer.byteLength,
        content_type: 'audio/mpeg'
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