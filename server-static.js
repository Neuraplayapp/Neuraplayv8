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
          // In production, you'd integrate with ElevenLabs API here
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