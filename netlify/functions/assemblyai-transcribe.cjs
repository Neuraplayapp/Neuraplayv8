const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { audio, language_code = 'en_us', speech_model = 'universal' } = JSON.parse(event.body);

    if (!audio) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Audio data is required' }),
      };
    }

    // Use the correct environment variable name from Netlify
    const apiKey = process.env.ASSEMBLY_API_KEY ||
                   process.env.ASSEMBLYAI_API_KEY ||
                   process.env.Assemblyai_api_key || 
                   process.env.assemblyai_api_key ||
                   process.env.assembly_ai_api_key;

    // AGGRESSIVE DEBUGGING - FORCE CACHE REFRESH
    console.log('🚨 CACHE REFRESH DEBUGGING 🚨');
    console.log('Current timestamp:', new Date().toISOString());
    console.log('Function deployment ID:', process.env.NETLIFY_DEPLOY_ID || 'unknown');
    console.log('Raw ASSEMBLY_API_KEY value:', process.env.ASSEMBLY_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('API key length:', apiKey ? apiKey.length : 0);
    console.log('API key first 8 chars:', apiKey ? apiKey.substring(0, 8) + '...' : 'NONE');
    console.log('Expected key should start with: 6793b1c4...');
    console.log('🚨 END DEBUGGING 🚨');

    // Deep debugging: Log all available environment variables to see what the function receives
    console.log('--- Deep Environment Variable Debug ---');
    const availableVars = Object.keys(process.env);
    const assemblyVars = availableVars.filter(key => key.toLowerCase().includes('assembly'));
    console.log('Available AssemblyAI-related ENV VARS:', assemblyVars);
    console.log('--- End Debug ---');
                   
    console.log('AssemblyAI API key search results:');
    console.log('- ASSEMBLY_API_KEY:', !!process.env.ASSEMBLY_API_KEY);
    console.log('- ASSEMBLYAI_API_KEY:', !!process.env.ASSEMBLYAI_API_KEY);
    console.log('- Found API key:', !!apiKey);
    console.log('- API key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'none');
                   
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AssemblyAI API key not configured. Checked: ASSEMBLY_API_KEY, ASSEMBLYAI_API_KEY, Assemblyai_api_key, assemblyai_api_key, assembly_ai_api_key' }),
      };
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('Audio buffer size:', audioBuffer.length, 'bytes');

    // Upload audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,  // AssemblyAI doesn't use "Bearer" prefix
        'Content-Type': 'application/octet-stream',
      },
      body: audioBuffer,
    });

    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', errorText);
      return {
        statusCode: uploadResponse.status,
        headers,
        body: JSON.stringify({ error: 'Failed to upload audio to AssemblyAI', details: errorText }),
      };
    }

    const uploadResult = await uploadResponse.json();
    const audioUrl = uploadResult.upload_url;

    // OFFICIAL AssemblyAI Universal Model Language Support (from documentation)
    const supportedLanguages = {
      // High accuracy languages (≤ 10% WER)
      'en': 'en',              // English 
      'en_us': 'en',           // English (US)
      'en_uk': 'en_uk',        // English (UK)
      'es': 'es',              // Spanish
      'fr': 'fr',              // French
      'de': 'de',              // German
      'id': 'id',              // Indonesian
      'it': 'it',              // Italian
      'ja': 'ja',              // Japanese
      'nl': 'nl',              // Dutch
      'pl': 'pl',              // Polish
      'pt': 'pt',              // Portuguese
      'ru': 'ru',              // Russian
      'tr': 'tr',              // Turkish
      'uk': 'uk',              // Ukrainian
      'ca': 'ca',              // Catalan
      
      // Good accuracy languages (>10% to ≤25% WER)
      'ar': 'ar',              // Arabic
      'az': 'az',              // Azerbaijani
      'bg': 'bg',              // Bulgarian
      'bs': 'bs',              // Bosnian
      'zh': 'zh',              // Mandarin Chinese
      'cs': 'cs',              // Czech
      'da': 'da',              // Danish
      'el': 'el',              // Greek
      'et': 'et',              // Estonian
      'fi': 'fi',              // Finnish
      'fil': 'fil',            // Filipino
      'gl': 'gl',              // Galician
      'hi': 'hi',              // Hindi
      'hr': 'hr',              // Croatian
      'hu': 'hu',              // Hungarian
      'ko': 'ko',              // Korean
      'mk': 'mk',              // Macedonian
      'ms': 'ms',              // Malay
      'nb': 'nb',              // Norwegian Bokmål
      'ro': 'ro',              // Romanian
      'sk': 'sk',              // Slovak
      'sv': 'sv',              // Swedish
      'th': 'th',              // Thai
      'ur': 'ur',              // Urdu
      'vi': 'vi',              // Vietnamese
      'yue': 'yue',            // Cantonese
      
      // Auto-detection
      'auto': null             // Automatic language detection
    };

    // Use language code or enable auto-detection
    const requestedLanguage = language_code?.toLowerCase();
    const validLanguageCode = requestedLanguage === 'auto' ? null : supportedLanguages[requestedLanguage];
    
    // Enable automatic language detection if no specific language or 'auto' is requested
    const enableLanguageDetection = !validLanguageCode;

    // Validate speech model
    const validSpeechModel = ['universal', 'slam-1'].includes(speech_model) ? speech_model : 'universal';

    // Request transcription with simplified, supported parameters
    const transcriptionConfig = {
      audio_url: audioUrl,
      speech_model: validSpeechModel,
      punctuate: true,
      format_text: true,
      language_detection: enableLanguageDetection
    };

    // Add language_code only if we have a valid one
    if (validLanguageCode) {
      transcriptionConfig.language_code = validLanguageCode;
    }

    console.log('Transcription config:', JSON.stringify(transcriptionConfig, null, 2));

    const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,  // AssemblyAI doesn't use "Bearer" prefix
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transcriptionConfig),
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error('Transcription request failed:', errorText);
      return {
        statusCode: transcribeResponse.status,
        headers,
        body: JSON.stringify({ error: 'Failed to request transcription from AssemblyAI' }),
      };
    }

    const transcribeResult = await transcribeResponse.json();
    const transcriptId = transcribeResult.id;

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey,  // AssemblyAI doesn't use "Bearer" prefix
        },
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error('Polling failed:', errorText);
        return {
          statusCode: pollResponse.status,
          headers,
          body: JSON.stringify({ error: 'Failed to poll transcription status' }),
        };
      }

      const pollResult = await pollResponse.json();
      
      if (pollResult.status === 'completed') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            text: pollResult.text || '',
            confidence: pollResult.confidence || 0,
            language_code: validLanguageCode,
            speech_model: validSpeechModel,
            words: pollResult.words || [],
            audio_duration: pollResult.audio_duration || 0
          }),
        };
      }
      
      if (pollResult.status === 'error') {
        console.error('Transcription error:', pollResult.error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Transcription failed: ' + pollResult.error }),
        };
      }
      
      attempts++;
    }

    // Timeout
    return {
      statusCode: 408,
      headers,
      body: JSON.stringify({ error: 'Transcription timeout' }),
    };

  } catch (error) {
    console.error('Error in assemblyai-transcribe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message }),
    };
  }
}; 