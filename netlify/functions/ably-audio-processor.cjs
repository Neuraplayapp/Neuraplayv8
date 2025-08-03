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
    const { audio, language_code = 'auto', speech_model = 'universal' } = JSON.parse(event.body);
    
    console.log('Ably Audio Processor request received');
    console.log('Audio length:', audio ? audio.length : 0);
    console.log('Language code:', language_code);
    console.log('Speech model:', speech_model);

    if (!audio) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Audio data is required'
        })
      };
    }

    // Get AssemblyAI API key
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_API_KEY || 
                               process.env.ASSEMBLYAI_API_KEY ||
                               process.env.Assemblyai_api_key || 
                               process.env.assemblyai_api_key ||
                               process.env.assembly_ai_api_key;

    console.log('AssemblyAI API key found:', !!ASSEMBLYAI_API_KEY);

    if (!ASSEMBLYAI_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'AssemblyAI API key not configured'
        })
      };
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('Audio buffer size:', audioBuffer.length, 'bytes');

    // Upload audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: audioBuffer,
    });

    console.log('Upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', errorText);
      return {
        statusCode: uploadResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Failed to upload audio to AssemblyAI',
          details: errorText
        })
      };
    }

    const { upload_url } = await uploadResponse.json();
    console.log('Upload URL:', upload_url);

    // Transcribe audio
    const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: language_code === 'auto' ? undefined : language_code,
        speech_model: speech_model
      })
    });

    console.log('Transcription response status:', transcriptionResponse.status);

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('Transcription failed:', errorText);
      return {
        statusCode: transcriptionResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Failed to transcribe audio',
          details: errorText
        })
      };
    }

    const { id } = await transcriptionResponse.json();
    console.log('Transcription ID:', id);

    // Poll for completion
    let transcript = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      attempts++;

      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        },
      });

      if (!pollResponse.ok) {
        console.error('Poll failed:', pollResponse.status);
        break;
      }

      const pollResult = await pollResponse.json();
      console.log('Poll result status:', pollResult.status);

      if (pollResult.status === 'completed') {
        transcript = pollResult.text;
        break;
      } else if (pollResult.status === 'error') {
        console.error('Transcription error:', pollResult.error);
        break;
      }
    }

    if (!transcript) {
      return {
        statusCode: 408,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Transcription timeout or failed'
        })
      };
    }

    console.log('Transcription successful:', transcript);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        text: transcript,
        language_code: language_code,
        audio_length: audioBuffer.length
      })
    };

  } catch (error) {
    console.error('Ably Audio Processor function error:', error);
    
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