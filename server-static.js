const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes for SPA (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// WebSocket connection handling for ElevenLabs
wss.on('connection', (ws) => {
  console.log('🔗 WebSocket client connected');
  
  // Store ElevenLabs WebSocket connection
  let elevenLabsWs = null;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📥 Received WebSocket message:', data.type);
      
      switch (data.type) {
        case 'connect_elevenlabs':
          // Connect to ElevenLabs WebSocket
          const WebSocket = require('ws');
          elevenLabsWs = new WebSocket('wss://api.elevenlabs.io/v1/text-to-speech/stream', {
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY
            }
          });
          
          elevenLabsWs.on('open', () => {
            console.log('✅ Connected to ElevenLabs WebSocket');
            ws.send(JSON.stringify({ type: 'elevenlabs_connected' }));
          });
          
          elevenLabsWs.on('message', (elevenLabsData) => {
            // Forward ElevenLabs audio data to client
            ws.send(JSON.stringify({
              type: 'audio_chunk',
              data: elevenLabsData.toString('base64')
            }));
          });
          
          elevenLabsWs.on('error', (error) => {
            console.error('❌ ElevenLabs WebSocket error:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'ElevenLabs connection failed' }));
          });
          
          elevenLabsWs.on('close', () => {
            console.log('🔌 ElevenLabs WebSocket closed');
          });
          break;
          
        case 'tts_request':
          if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
            // Send TTS request to ElevenLabs
            const ttsRequest = {
              text: data.text,
              model_id: data.modelId || 'eleven_turbo_v2_5',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
              },
              output_format: 'mp3_44100_128'
            };
            
            elevenLabsWs.send(JSON.stringify(ttsRequest));
            console.log('🎤 TTS request sent to ElevenLabs');
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'ElevenLabs not connected' }));
          }
          break;
          
        case 'audio_chunk':
          // Handle audio chunks from client (for STT)
          console.log('🎤 Audio chunk received, size:', data.audio?.length || 0);
          // Forward to AssemblyAI or process locally
          break;
          
        default:
          console.log('📥 Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    if (elevenLabsWs) {
      elevenLabsWs.close();
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Bind to 0.0.0.0 and use PORT environment variable as required by Render
const port = process.env.PORT || 10000;

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 WebSocket server ready on ws://0.0.0.0:${port}`);
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