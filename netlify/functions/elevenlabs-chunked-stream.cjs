const fetch = require('node-fetch');
const Ably = require('ably');

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
    const { text, voiceId, modelId = 'eleven_turbo_v2_5', conversationId, ablyToken } = JSON.parse(event.body);
    
    console.log('ElevenLabs Chunked Stream request received');
    console.log('Text:', text);
    console.log('Voice ID:', voiceId);
    console.log('Conversation ID:', conversationId);

    // Get API keys
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 
                               process.env.elven_labs_api_key ||
                               process.env.VITE_ELVEN_LABS_API_KEY ||
                               process.env.ELEVEN_LABS_API_KEY;
    
    const ABLY_API_KEY = process.env.ABLY_API;

    if (!ELEVENLABS_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'ElevenLabs API key not configured'
        })
      };
    }

    if (!text || !voiceId || !conversationId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Text, voiceId, and conversationId are required'
        })
      };
    }

    // Generate complete audio first
    console.log('Generating complete audio...');
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: `ElevenLabs API failed: ${response.status}`,
          details: errorText
        })
      };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    console.log('Audio generated successfully, size:', audioBuffer.byteLength);

    // If Ably is configured, send audio chunks via Ably
    if (ABLY_API_KEY && conversationId) {
      try {
        const ably = new Ably.Realtime(ABLY_API_KEY);
        const channel = ably.channels.get(`conversation:${conversationId}`);
        
        // Send audio in chunks to simulate streaming
        const chunkSize = 8192; // 8KB chunks
        const totalChunks = Math.ceil(audioBase64.length / chunkSize);
        
        console.log(`Sending ${totalChunks} audio chunks via Ably...`);
        
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, audioBase64.length);
          const chunk = audioBase64.substring(start, end);
          
          await channel.publish('ai_response', {
            type: 'audio_chunk',
            audio: chunk,
            chunkIndex: i,
            totalChunks: totalChunks,
            text: text,
            timestamp: Date.now(),
            streaming: true
          });
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Send final chunk marker
        await channel.publish('ai_response', {
          type: 'audio_complete',
          text: text,
          timestamp: Date.now(),
          totalChunks: totalChunks
        });
        
        console.log('Audio chunks sent successfully via Ably');
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            message: 'Audio sent via Ably in chunks',
            totalChunks: totalChunks,
            audio_size_bytes: audioBuffer.byteLength
          })
        };
        
      } catch (ablyError) {
        console.error('Ably error:', ablyError);
        // Fall back to returning complete audio
      }
    }

    // Fallback: return complete audio
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
        streaming: false,
        audio_size_bytes: audioBuffer.byteLength,
        content_type: 'audio/mpeg'
      })
    };

  } catch (error) {
    console.error('ElevenLabs Chunked Stream function error:', error);
    
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