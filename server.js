const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// For Node.js versions without native fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.post('/api/assemblyai-transcribe', async (req, res) => {
  try {
    console.log('🎙️ Transcription request received');
    const { audio, audioType, language_code = 'auto', speech_model = 'universal' } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Forward to AssemblyAI
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.VITE_ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: audio,
        language_code: language_code === 'auto' ? null : language_code,
        speech_model: speech_model
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AssemblyAI API error:', error);
      return res.status(response.status).json({ error: `Transcription failed: ${error}` });
    }

    const result = await response.json();
    
    // Poll for completion
    const transcriptId = result.id;
    let transcriptResult;
    
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.VITE_ASSEMBLYAI_API_KEY,
        }
      });
      transcriptResult = await pollResponse.json();
    } while (transcriptResult.status === 'processing' || transcriptResult.status === 'queued');

    if (transcriptResult.status === 'error') {
      return res.status(500).json({ error: `Transcription failed: ${transcriptResult.error}` });
    }

    res.json({
      text: transcriptResult.text || '',
      language_code: transcriptResult.language_code || language_code
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription service error' });
  }
});

app.post('/api/elevenlabs-tts', async (req, res) => {
  try {
    console.log('🎤 TTS request received');
    const { text, voiceId = '8LVfoRdkh4zgjr8v5ObE', modelId = 'eleven_turbo_v2_5' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.VITE_ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs TTS error:', error);
      return res.status(response.status).json({ error: `TTS failed: ${error}` });
    }

    const audioBuffer = await response.buffer();
    const base64Audio = audioBuffer.toString('base64');
    
    res.json({
      audio: base64Audio,
      size: audioBuffer.length
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS service error' });
  }
});

app.post('/api/api', async (req, res) => {
  try {
    console.log('🤖 AI API request received');
    const { task_type, input_data } = req.body;
    
    if (!input_data || !input_data.messages) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    // Use Together AI API for chat completion
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.together_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: input_data.messages,
        max_tokens: 512,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Together AI API error:', error);
      return res.status(response.status).json({ error: `AI API failed: ${error}` });
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    
    // Return in the expected format
    res.json([{ generated_text: aiResponse }]);

  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({ error: 'AI service error' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Store ElevenLabs WebSocket connections per client
const elevenLabsConnections = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔗 WebSocket client connected');
  const clientId = Math.random().toString(36).substring(7);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📥 Received WebSocket message:', data.type);
      
      // Handle different message types
      switch (data.type) {
        case 'connect_elevenlabs':
          await handleElevenLabsConnection(ws, clientId);
          break;
          
        case 'audio_chunk':
          await handleAudioChunk(ws, clientId, data.audio);
          break;
          
        case 'tts_request':
          await handleTTSRequest(ws, data.text, data.voiceId, data.modelId);
          break;
          
        default:
          console.log('📥 Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    // Clean up ElevenLabs connection
    const elevenLabsWs = elevenLabsConnections.get(clientId);
    if (elevenLabsWs) {
      elevenLabsWs.close();
      elevenLabsConnections.delete(clientId);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Handle ElevenLabs WebSocket connection
async function handleElevenLabsConnection(clientWs, clientId) {
  try {
    console.log('🎯 Connecting to ElevenLabs Conversational AI...');
    
    const ElevenLabsWS = require('ws');
    const agentId = process.env.ELEVENLABS_AGENT_ID || 'your-agent-id';
    
    const elevenLabsWs = new ElevenLabsWS(
      `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`,
      {
        headers: {
          'xi-api-key': process.env.VITE_ELEVENLABS_API_KEY,
        }
      }
    );
    
    elevenLabsWs.on('open', () => {
      console.log('✅ Connected to ElevenLabs');
      elevenLabsConnections.set(clientId, elevenLabsWs);
      
      clientWs.send(JSON.stringify({
        type: 'elevenlabs_connected',
        message: 'Connected to ElevenLabs Conversational AI'
      }));
    });
    
    elevenLabsWs.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        console.log('📥 ElevenLabs response:', response.type);
        
        // Forward response to client
        if (response.type === 'audio') {
          clientWs.send(JSON.stringify({
            type: 'audio_chunk',
            audio: response.audio_event?.audio_base_64
          }));
        } else if (response.type === 'agent_response') {
          clientWs.send(JSON.stringify({
            type: 'ai_response',
            text: response.agent_response?.message
          }));
        }
      } catch (error) {
        console.error('❌ Error processing ElevenLabs response:', error);
      }
    });
    
    elevenLabsWs.on('error', (error) => {
      console.error('❌ ElevenLabs WebSocket error:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'ElevenLabs connection error'
      }));
    });
    
    elevenLabsWs.on('close', () => {
      console.log('🔌 ElevenLabs WebSocket closed');
      elevenLabsConnections.delete(clientId);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to ElevenLabs:', error);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'Failed to connect to ElevenLabs'
    }));
  }
}

// Handle audio chunk forwarding to ElevenLabs
async function handleAudioChunk(clientWs, clientId, audioBase64) {
  try {
    const elevenLabsWs = elevenLabsConnections.get(clientId);
    
    if (!elevenLabsWs || elevenLabsWs.readyState !== WebSocket.OPEN) {
      console.log('⚠️ ElevenLabs connection not ready');
      return;
    }
    
    console.log('🎤 Forwarding audio chunk to ElevenLabs');
    
    // Forward audio chunk to ElevenLabs
    elevenLabsWs.send(JSON.stringify({
      user_audio_chunk: audioBase64
    }));
    
  } catch (error) {
    console.error('❌ Error forwarding audio chunk:', error);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process audio'
    }));
  }
}

// Handle direct TTS requests
async function handleTTSRequest(clientWs, text, voiceId = '8LVfoRdkh4zgjr8v5ObE', modelId = 'eleven_turbo_v2_5') {
  try {
    console.log('🎤 Processing TTS request:', text?.substring(0, 50));
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.VITE_ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }
    
    const audioBuffer = await response.buffer();
    const base64Audio = audioBuffer.toString('base64');
    
    clientWs.send(JSON.stringify({
      type: 'audio_chunk',
      audio: base64Audio
    }));
    
  } catch (error) {
    console.error('❌ TTS request error:', error);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'TTS generation failed'
    }));
  }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 WebSocket server ready on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 