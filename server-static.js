import express from 'express';
import path from 'path';
import { WebSocketServer } from 'ws';
import http from 'http';
import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware for parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Routes to replace Netlify Functions

// AssemblyAI Transcription Helper Function
async function transcribeWithAssemblyAI(audioBuffer, apiKey, language_code = 'auto', speech_model = 'universal') {
  console.log('Transcribing with language:', language_code, 'model:', speech_model);
  
  // Upload to AssemblyAI
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/octet-stream'
    },
    body: audioBuffer
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('AssemblyAI Upload Error:', errorText);
    throw new Error(`Failed to upload audio to AssemblyAI: ${uploadResponse.status} - ${errorText}`);
  }

  const { upload_url } = await uploadResponse.json();
  console.log('Audio uploaded successfully to:', upload_url);

  // Prepare transcription config
  const transcriptionConfig = {
    audio_url: upload_url,
    punctuate: true,
    format_text: true
  };

  // Handle language detection vs specific language
  if (language_code === 'auto') {
    transcriptionConfig.language_detection = true;
  } else {
    transcriptionConfig.language_code = language_code;
  }

  // Add speech model if supported
  if (speech_model && ['universal', 'nano'].includes(speech_model)) {
    transcriptionConfig.speech_model = speech_model;
  }

  console.log('Transcription config:', transcriptionConfig);

  // Start transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transcriptionConfig)
  });

  if (!transcriptResponse.ok) {
    throw new Error('Failed to start transcription');
  }

  const transcriptData = await transcriptResponse.json();
  const transcriptId = transcriptData.id;
  
  // Poll for completion
  let transcript;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max
  
  while (attempts < maxAttempts) {
    const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'Authorization': apiKey
      }
    });
    
    if (!pollResponse.ok) {
      throw new Error('Failed to poll transcription status');
    }
    
    transcript = await pollResponse.json();
    
    if (transcript.status === 'completed') {
      console.log('✅ Transcription completed:', transcript.text);
      break;
    } else if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }
    
    console.log(`⏳ Transcription status: ${transcript.status}, attempt ${attempts + 1}/${maxAttempts}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    attempts++;
  }
  
  if (transcript.status !== 'completed') {
    throw new Error('Transcription timeout');
  }
  
  return { 
    text: transcript.text || '', 
    id: transcript.id,
    language_code: transcript.language_code,
    confidence: transcript.confidence,
    audio_duration: transcript.audio_duration
  };
}

// AssemblyAI Transcription - Netlify endpoint
app.post('/.netlify/functions/assemblyai-transcribe', async (req, res) => {
  try {
    console.log('🎤 AssemblyAI transcription request received');
    const { audio } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    const ASSEMBLYAI_API_KEY = process.env.VITE_ASSEMBLYAI_API_KEY || process.env.ASSEMBLYAI_API_KEY;
    
    if (!ASSEMBLYAI_API_KEY) {
      return res.status(500).json({ error: 'AssemblyAI API key not configured' });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    const result = await transcribeWithAssemblyAI(audioBuffer, ASSEMBLYAI_API_KEY);
    res.json(result);
    
  } catch (error) {
    console.error('❌ AssemblyAI transcription error:', error);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
});

// Also add the /api route for Render compatibility
app.post('/api/assemblyai-transcribe', async (req, res) => {
  try {
    console.log('🎤 AssemblyAI transcription request received via /api');
    const { audio, audioType, language_code, speech_model } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    console.log('Audio type received:', audioType);
    console.log('Language code:', language_code);
    console.log('Speech model:', speech_model);

    const ASSEMBLYAI_API_KEY = process.env.VITE_ASSEMBLYAI_API_KEY || 
                               process.env.ASSEMBLYAI_API_KEY || 
                               process.env.ASSEMBLY_API_KEY;
    
    if (!ASSEMBLYAI_API_KEY) {
      return res.status(500).json({ error: 'AssemblyAI API key not configured' });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('Audio buffer size:', audioBuffer.length);
    
    const result = await transcribeWithAssemblyAI(audioBuffer, ASSEMBLYAI_API_KEY, language_code, speech_model);
    res.json(result);
    
  } catch (error) {
    console.error('❌ AssemblyAI transcription error:', error);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
});

// ElevenLabs TTS
app.post('/.netlify/functions/elevenlabs-tts', async (req, res) => {
  try {
    console.log('🎤 ElevenLabs TTS request received');
    const { text, voiceId = '8LVfoRdkh4zgjr8v5ObE' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || 
                               process.env.ELEVENLABS_API_KEY ||
                               process.env.VITE_ELVEN_LABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not found. Checked: VITE_ELEVENLABS_API_KEY, ELEVENLABS_API_KEY, VITE_ELVEN_LABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log('✅ TTS completed, audio size:', audioBuffer.byteLength);
    res.json({ audio: base64Audio, size: audioBuffer.byteLength });
    
  } catch (error) {
    console.error('❌ ElevenLabs TTS error:', error);
    res.status(500).json({ error: 'TTS failed: ' + error.message });
  }
});

// Also add the /api route for Render compatibility
app.post('/api/elevenlabs-tts', async (req, res) => {
  try {
    console.log('🎤 ElevenLabs TTS request received via /api');
    const { text, voiceId = '8LVfoRdkh4zgjr8v5ObE' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    console.log('🔑 ElevenLabs API key found:', !!ELEVENLABS_API_KEY);
    console.log('🔑 API key length:', ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.length : 0);
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not found. Checked: VITE_ELEVENLABS_API_KEY, ELEVENLABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    console.log('🎵 Making TTS request to ElevenLabs API...');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    console.log('📡 ElevenLabs API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs TTS API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `ElevenLabs API error: ${response.status}`, 
        details: errorText 
      });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log('✅ TTS completed, audio size:', audioBuffer.byteLength);
    res.json({ audio: base64Audio, size: audioBuffer.byteLength });
    
  } catch (error) {
    console.error('❌ ElevenLabs TTS error:', error);
    res.status(500).json({ error: 'TTS failed: ' + error.message });
  }
});

// ElevenLabs Streaming TTS
app.post('/.netlify/functions/elevenlabs-streaming-tts', async (req, res) => {
  try {
    console.log('🎤 ElevenLabs streaming TTS request received');
    const { text, voiceId = '8LVfoRdkh4zgjr8v5ObE' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not found. Checked: VITE_ELEVENLABS_API_KEY, ELEVENLABS_API_KEY, VITE_ELVEN_LABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log('✅ Streaming TTS completed, audio size:', audioBuffer.byteLength);
    res.json({ audio: base64Audio, size: audioBuffer.byteLength });
    
  } catch (error) {
    console.error('❌ ElevenLabs streaming TTS error:', error);
    res.status(500).json({ error: 'Streaming TTS failed: ' + error.message });
  }
});

// Also add the /api route for Render compatibility
app.post('/api/elevenlabs-streaming-tts', async (req, res) => {
  try {
    console.log('🎤 ElevenLabs streaming TTS request received via /api');
    const { text, voiceId = '8LVfoRdkh4zgjr8v5ObE' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not found. Checked: VITE_ELEVENLABS_API_KEY, ELEVENLABS_API_KEY, VITE_ELVEN_LABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log('✅ Streaming TTS completed, audio size:', audioBuffer.byteLength);
    res.json({ audio: base64Audio, size: audioBuffer.byteLength });
    
  } catch (error) {
    console.error('❌ ElevenLabs streaming TTS error:', error);
    res.status(500).json({ error: 'Streaming TTS failed: ' + error.message });
  }
});

// Test ElevenLabs
app.get('/.netlify/functions/test-elevenlabs', async (req, res) => {
  try {
    console.log('🧪 Testing ElevenLabs API');
    const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not found. Checked: VITE_ELEVENLABS_API_KEY, ELEVENLABS_API_KEY, VITE_ELVEN_LABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const voices = await response.json();
    console.log('✅ ElevenLabs API test successful');
    res.json({ 
      success: true, 
      message: 'ElevenLabs API key is working', 
      voices_count: voices.length 
    });
    
  } catch (error) {
    console.error('❌ ElevenLabs API test error:', error);
    res.status(500).json({ error: 'ElevenLabs API test failed: ' + error.message });
  }
});

// Also add the /api route for Render compatibility
app.get('/api/test-elevenlabs', async (req, res) => {
  try {
    console.log('🧪 Testing ElevenLabs API via /api');
    const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not found. Checked: VITE_ELEVENLABS_API_KEY, ELEVENLABS_API_KEY, VITE_ELVEN_LABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const voices = await response.json();
    console.log('✅ ElevenLabs API test successful');
    res.json({ 
      success: true, 
      message: 'ElevenLabs API key is working', 
      voices_count: voices.length 
    });
    
  } catch (error) {
    console.error('❌ ElevenLabs API test error:', error);
    res.status(500).json({ error: 'ElevenLabs API test failed: ' + error.message });
  }
});

// Ably Auth
app.get('/.netlify/functions/ably-auth', async (req, res) => {
  try {
    console.log('🔐 Ably auth request received');
    const Ably = (await import('ably')).default;
    
    const ABLY_API_KEY = process.env.VITE_ABLY_API_KEY;
    
    if (!ABLY_API_KEY) {
      return res.status(500).json({ error: 'Ably API key not configured' });
    }

    const ably = new Ably.Rest(ABLY_API_KEY);
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: 'neuraplay-client'
    });
    
    console.log('✅ Ably auth token generated');
    res.json(tokenRequest);
    
  } catch (error) {
    console.error('❌ Ably auth error:', error);
    res.status(500).json({ error: 'Ably auth failed: ' + error.message });
  }
});

// Also add the /api route for Render compatibility
app.get('/api/ably-auth', async (req, res) => {
  try {
    console.log('🔐 Ably auth request received via /api');
    const Ably = (await import('ably')).default;
    
    const ABLY_API_KEY = process.env.VITE_ABLY_API_KEY;
    
    if (!ABLY_API_KEY) {
      return res.status(500).json({ error: 'Ably API key not configured' });
    }

    const ably = new Ably.Rest(ABLY_API_KEY);
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: 'neuraplay-client'
    });
    
    console.log('✅ Ably auth token generated');
    res.json(tokenRequest);
    
  } catch (error) {
    console.error('❌ Ably auth error:', error);
    res.status(500).json({ error: 'Ably auth failed: ' + error.message });
  }
});

// Generic API endpoint
app.post('/.netlify/functions/api', async (req, res) => {
  try {
    console.log('🌐 Generic API request received');
    const { message, model = 'gpt-3.5-turbo' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // This would need your actual OpenAI API key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'API endpoint available but OpenAI key not set'
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API response generated');
    res.json({ response: data.choices[0].message.content });
    
  } catch (error) {
    console.error('❌ Generic API error:', error);
    res.status(500).json({ error: 'API failed: ' + error.message });
  }
});

// Also add the /api route for Render compatibility - RESTORE ORIGINAL TOGETHER AI SETUP
app.post('/api/api', async (req, res) => {
  try {
    console.log('🌐 API request received via /api');
    const { task_type, input_data } = req.body;
    
    console.log('Task type:', task_type);
    console.log('Input data:', input_data);

    // Get environment variables - RESTORE ORIGINAL TOGETHER AI
    const TOGETHER_TOKEN = process.env.together_token || process.env.TOGETHER_TOKEN;
    const HF_TOKEN = process.env.hf_token;

    console.log('Together token exists:', !!TOGETHER_TOKEN);
    console.log('HF token exists:', !!HF_TOKEN);
    console.log('Together token length:', TOGETHER_TOKEN ? TOGETHER_TOKEN.length : 0);

    // Handle different task types - Fixed for Express
    switch (task_type) {
      case 'test':
        const testResult = await handleTestGeneration(TOGETHER_TOKEN);
        return res.status(testResult.statusCode).json(JSON.parse(testResult.body));
      case 'summarization':
      case 'text':
      case 'chat':
      case 'conversation':
      case 'story':
      case 'report':
        console.log(`Processing ${task_type} request`);
        const textResult = await handleTextGeneration(input_data, TOGETHER_TOKEN);
        return res.status(textResult.statusCode).json(JSON.parse(textResult.body));
      
      case 'image':
        const imageResult = await handleImageGeneration(input_data, TOGETHER_TOKEN);
        return res.status(imageResult.statusCode).json(JSON.parse(imageResult.body));
      
      case 'voice':
        const voiceResult = await handleVoiceGeneration(input_data, HF_TOKEN);
        return res.status(voiceResult.statusCode).json(JSON.parse(voiceResult.body));
      
      default:
        return res.status(400).json({ 
          error: 'Invalid task_type. Supported types: summarization, text, chat, conversation, story, report, image, voice' 
        });
    }
  } catch (error) {
    console.error('❌ API error:', error);
    res.status(500).json({ error: 'API failed: ' + error.message });
  }
});

// RESTORE ORIGINAL TOGETHER AI FUNCTIONS
async function handleTextGeneration(input_data, token) {
  if (!token) {
    console.log('No Together AI token provided, using fallback response');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: "Hello! I'm Synapse, your AI learning assistant! 🌟 I'm here to help you with your educational journey. What would you like to learn about today? We could explore numbers, science, or play some brain games together! ✨" 
      }])
    };
  }

  try {
    // Prepare chat messages
    let messages;
    let userInput = '';
    if (typeof input_data === 'object' && input_data.messages) {
      messages = input_data.messages;
      // Ensure the first message is always the Synapse system prompt
      if (messages.length > 0 && messages[0].role !== 'system') {
        messages.unshift({
          role: 'system',
          content: 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed.'
        });
      }
      userInput = input_data.messages[input_data.messages.length - 1]?.content || '';
    } else {
      userInput = input_data;
      messages = [
        { role: 'system', content: 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed.' },
        { role: 'user', content: input_data }
      ];
    }

    // Generate response with ORIGINAL Qwen model
    console.log('Using model: Qwen/Qwen3-235B-A22B-Instruct-2507-tput');
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
        messages: messages,
        max_tokens: 100,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`Together AI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Together AI text result:', result);

    const assistantResponse = result.choices?.[0]?.message?.content || "I'm here to help with your learning journey!";

    // Return the response in proper format for Express
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: assistantResponse
      }])
    };
  } catch (error) {
    console.error('Text generation error:', error);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: "I'm here to help with your learning journey! Please try again in a moment. 🌟" 
      }])
    };
  }
}

async function handleImageGeneration(input_data, token) {
  const prompt = (typeof input_data === 'object' && input_data.prompt) ? input_data.prompt : String(input_data);

  console.log('Starting image generation with token:', !!token);
  console.log('Extracted prompt for image generation:', prompt);
  
  if (!token) {
    console.log('No token provided, returning placeholder');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        error: 'No API token configured'
      })
    };
  }

  try {
    // Enhance the prompt for better results
    let enhancedPrompt = prompt;
    if (enhancedPrompt && !enhancedPrompt.includes('high quality') && !enhancedPrompt.includes('detailed')) {
      enhancedPrompt = `${enhancedPrompt}, high quality, detailed, 4k`;
    }

    console.log('Image generation prompt:', enhancedPrompt);

    // Try multiple models for better reliability, with faster models first
    const models = [
      'black-forest-labs/FLUX.1-schnell-Free',
      'stability-ai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5'
    ];

    let lastError = null;
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        // Use different parameters for faster models
        const isFastModel = model.includes('schnell') || model.includes('flux');
        const steps = isFastModel ? 4 : 20;
        
        const response = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            prompt: enhancedPrompt,
            n: 1,
            width: 512,
            height: 512,
            steps: steps,
            response_format: 'b64_json'
          })
        });

        console.log(`Model ${model} response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model ${model} error:`, errorText);
          lastError = new Error(`Model ${model} failed: ${response.status} - ${errorText}`);
          continue; // Try next model
        }

        const result = await response.json();
        console.log(`Model ${model} response received`);

        if (result.data && result.data[0] && result.data[0].b64_json) {
          const base64 = result.data[0].b64_json;
          console.log('Base64 image length:', base64.length);

          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: base64,
              contentType: 'image/png'
            })
          };
        } else {
          console.error(`Model ${model} unexpected response format:`, result);
          lastError = new Error(`Model ${model} unexpected response format`);
          continue; // Try next model
        }
      } catch (error) {
        console.error(`Model ${model} failed:`, error);
        lastError = error;
        continue; // Try next model
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All image generation models failed');
  } catch (error) {
    console.error('Image generation error:', error);
    
    // Generate a simple fallback image
    const fallbackImage = generateFallbackImage(prompt);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: fallbackImage,
        contentType: 'image/png',
        error: error.message,
        fallback: true
      })
    };
  }
}

// Generate a simple fallback image
function generateFallbackImage(prompt) {
  // Create a simple SVG that we'll convert to base64
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)"/>
      <circle cx="256" cy="256" r="150" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="4"/>
      <text x="256" y="280" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${prompt.substring(0, 20)}</text>
    </svg>
  `;
  
  // Convert SVG to base64
  const base64 = Buffer.from(svg).toString('base64');
  return base64;
}

async function handleVoiceGeneration(input_data, token) {
  console.log('Voice generation not implemented yet, returning placeholder');
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      audio_base64: '', // Placeholder
      message: 'Voice generation not implemented yet'
    })
  };
}

async function handleTestGeneration(token) {
  if (!token) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'No Together AI token configured'
      })
    };
  }

  try {
    console.log('Testing Together AI...');
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      throw new Error(`Test failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Together AI test successful',
        response: result
      })
    };
  } catch (error) {
    console.error('Test error:', error);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: `Test failed: ${error.message}`
      })
    };
  }
}

// Contact form
app.post('/.netlify/functions/contact', async (req, res) => {
  try {
    console.log('📧 Contact form submission received');
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, just log the contact form data
    console.log('Contact form data:', { name, email, message });
    
    console.log('✅ Contact form processed');
    res.json({ success: true, message: 'Contact form submitted successfully' });
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ error: 'Contact form failed: ' + error.message });
  }
});

// Also add the /api route for Render compatibility
app.post('/api/contact', async (req, res) => {
  try {
    console.log('📧 Contact form submission received via /api');
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, just log the contact form data
    console.log('Contact form data:', { name, email, message });
    
    console.log('✅ Contact form processed');
    res.json({ success: true, message: 'Contact form submitted successfully' });
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ error: 'Contact form failed: ' + error.message });
  }
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 10000,
    platform: process.env.RENDER ? 'render' : 'local'
  });
});

// Server info endpoint for debugging
app.get('/api/server-info', (req, res) => {
  res.json({
    platform: process.env.RENDER ? 'render' : 'local',
    port: process.env.PORT || 10000,
    timestamp: new Date().toISOString(),
    environment_vars: {
      has_ably_key: !!process.env.VITE_ABLY_API_KEY,
      has_elevenlabs_key: !!process.env.VITE_ELEVENLABS_API_KEY || !!process.env.ELEVENLABS_API_KEY,
      has_assemblyai_key: !!process.env.VITE_ASSEMBLYAI_API_KEY || !!process.env.ASSEMBLYAI_API_KEY,
      has_openai_key: !!process.env.OPENAI_API_KEY
    }
  });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes for SPA (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔗 WebSocket client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📥 Received WebSocket message:', data.type);
      
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
          
        case 'tts_request':
          // For now, just acknowledge the TTS request
          console.log('🎤 TTS request received:', data.text);
          ws.send(JSON.stringify({ 
            type: 'tts_response', 
            text: data.text,
            message: 'TTS request received (ElevenLabs integration pending)'
          }));
          break;
          
        case 'audio_chunk':
          // Handle audio chunks from client (for STT)
          console.log('🎤 Audio chunk received, size:', data.audio?.length || 0);
          ws.send(JSON.stringify({ 
            type: 'audio_ack', 
            message: 'Audio chunk received'
          }));
          break;
          
        default:
          console.log('📥 Unknown message type:', data.type);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: 'WebSocket server ready',
    timestamp: Date.now()
  }));
});

// Bind to 0.0.0.0 and use PORT environment variable as required by Render
const port = process.env.PORT || 10000;

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 WebSocket server ready on ws://0.0.0.0:${port}`);
  console.log(`🔗 API endpoints available at http://0.0.0.0:${port}/api/`);
  console.log(`🔗 Server bound to 0.0.0.0:${port} (Render requirement)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});