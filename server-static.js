const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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

// AssemblyAI Transcription
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
    
    // Upload to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: audioBuffer
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio to AssemblyAI');
    }

    const { upload_url } = await uploadResponse.json();

    // Transcribe
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: 'en'
      })
    });

    if (!transcriptResponse.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const transcript = await transcriptResponse.json();
    
    console.log('✅ Transcription completed:', transcript.text);
    res.json({ text: transcript.text, id: transcript.id });
    
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

    const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
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
    const Ably = require('ably');
    
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
  console.log(`🔗 API endpoints available at http://0.0.0.0:${port}/.netlify/functions/`);
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