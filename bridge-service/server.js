import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Ably from 'ably';
import WebSocket from 'ws';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const ABLY_API_KEY = process.env.ABLY_API;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ABLY_API_KEY || !ELEVENLABS_API_KEY) {
  console.error('❌ Missing required environment variables: ABLY_API, ELEVENLABS_API_KEY');
  process.exit(1);
}

// Initialize Ably
const ably = new Ably.Realtime(ABLY_API_KEY);

// Track active conversations
const activeConversations = new Map();

class ConversationBridge {
  constructor(conversationId, ably) {
    this.conversationId = conversationId;
    this.ably = ably;
    this.elevenLabsWs = null;
    this.ablyChannel = null;
    this.isConnected = false;
    
    console.log(`🔗 Creating bridge for conversation: ${conversationId}`);
    this.initialize();
  }

  async initialize() {
    try {
      // Set up Ably channel for this conversation
      this.ablyChannel = this.ably.channels.get(`conversation:${this.conversationId}`);
      
      // Listen for messages from the frontend
      this.ablyChannel.subscribe('user_message', (message) => {
        this.handleUserMessage(message.data);
      });
      
      this.ablyChannel.subscribe('user_audio', (message) => {
        this.handleUserAudio(message.data);
      });
      
      this.ablyChannel.subscribe('init_conversation', (message) => {
        this.initializeElevenLabsConnection(message.data);
      });
      
      this.ablyChannel.subscribe('end_conversation', () => {
        this.cleanup();
      });
      
      console.log(`✅ Ably channel setup complete for: ${this.conversationId}`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize bridge for ${this.conversationId}:`, error);
    }
  }

  async initializeElevenLabsConnection(config) {
    try {
      console.log(`🎤 Initializing ElevenLabs connection for: ${this.conversationId}`);
      
      // Connect to ElevenLabs WebSocket API
      this.elevenLabsWs = new WebSocket('wss://api.elevenlabs.io/v1/voice-chat');
      
      this.elevenLabsWs.on('open', () => {
        console.log(`🔗 ElevenLabs WebSocket connected for: ${this.conversationId}`);
        
        // Authenticate with ElevenLabs
        this.elevenLabsWs.send(JSON.stringify({
          xi_api_key: ELEVENLABS_API_KEY
        }));
        
        // Send initial conversation config if provided
        if (config.agentId) {
          this.elevenLabsWs.send(JSON.stringify({
            type: 'init_conversation',
            agent_id: config.agentId,
            ...config
          }));
        }
        
        this.isConnected = true;
        
        // Notify frontend that connection is ready
        this.ablyChannel.publish('status', {
          type: 'connected',
          conversationId: this.conversationId
        });
      });
      
      this.elevenLabsWs.on('message', (data) => {
        this.handleElevenLabsMessage(data);
      });
      
      this.elevenLabsWs.on('close', (code, reason) => {
        console.log(`🔌 ElevenLabs connection closed for ${this.conversationId}: ${code} ${reason}`);
        this.isConnected = false;
        
        this.ablyChannel.publish('status', {
          type: 'disconnected',
          conversationId: this.conversationId,
          reason: `Connection closed: ${code} ${reason}`
        });
      });
      
      this.elevenLabsWs.on('error', (error) => {
        console.error(`❌ ElevenLabs WebSocket error for ${this.conversationId}:`, error);
        
        this.ablyChannel.publish('error', {
          type: 'websocket_error',
          conversationId: this.conversationId,
          error: error.message
        });
      });
      
    } catch (error) {
      console.error(`❌ Failed to initialize ElevenLabs connection for ${this.conversationId}:`, error);
      
      this.ablyChannel.publish('error', {
        type: 'connection_error',
        conversationId: this.conversationId,
        error: error.message
      });
    }
  }

  handleUserMessage(data) {
    if (!this.isConnected || !this.elevenLabsWs) {
      console.warn(`⚠️ Attempted to send message but ElevenLabs not connected for: ${this.conversationId}`);
      return;
    }
    
    console.log(`📤 Forwarding user message for: ${this.conversationId}`);
    
    try {
      this.elevenLabsWs.send(JSON.stringify({
        type: 'user_message',
        text: data.text,
        ...data
      }));
    } catch (error) {
      console.error(`❌ Error sending user message for ${this.conversationId}:`, error);
    }
  }

  handleUserAudio(data) {
    if (!this.isConnected || !this.elevenLabsWs) {
      console.warn(`⚠️ Attempted to send audio but ElevenLabs not connected for: ${this.conversationId}`);
      return;
    }
    
    console.log(`🎵 Forwarding user audio for: ${this.conversationId}`);
    
    try {
      this.elevenLabsWs.send(JSON.stringify({
        type: 'user_audio_chunk',
        audio: data.audio,
        ...data
      }));
    } catch (error) {
      console.error(`❌ Error sending user audio for ${this.conversationId}:`, error);
    }
  }

  handleElevenLabsMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      console.log(`📥 Received from ElevenLabs for ${this.conversationId}:`, message.type || 'unknown');
      
      // Forward all messages to the frontend via Ably
      this.ablyChannel.publish('ai_response', message);
      
    } catch (error) {
      console.error(`❌ Error handling ElevenLabs message for ${this.conversationId}:`, error);
      
      // Send raw data if JSON parsing fails
      this.ablyChannel.publish('ai_response', {
        type: 'raw_data',
        data: data.toString()
      });
    }
  }

  cleanup() {
    console.log(`🧹 Cleaning up conversation: ${this.conversationId}`);
    
    if (this.elevenLabsWs) {
      this.elevenLabsWs.close();
      this.elevenLabsWs = null;
    }
    
    if (this.ablyChannel) {
      this.ablyChannel.unsubscribe();
      this.ablyChannel = null;
    }
    
    this.isConnected = false;
    
    // Remove from active conversations
    activeConversations.delete(this.conversationId);
  }
}

// API Routes
app.get('/', (req, res) => {
  res.json({
    service: 'NeuraPlay Bridge Service',
    status: 'running',
    activeConversations: activeConversations.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeConversations: activeConversations.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.post('/conversation/start', (req, res) => {
  try {
    const conversationId = req.body.conversationId || uuidv4();
    
    if (activeConversations.has(conversationId)) {
      return res.status(400).json({
        error: 'Conversation already exists',
        conversationId
      });
    }
    
    // Create new conversation bridge
    const bridge = new ConversationBridge(conversationId, ably);
    activeConversations.set(conversationId, bridge);
    
    res.json({
      success: true,
      conversationId,
      message: 'Conversation bridge created'
    });
    
  } catch (error) {
    console.error('❌ Error starting conversation:', error);
    res.status(500).json({
      error: 'Failed to start conversation',
      details: error.message
    });
  }
});

app.delete('/conversation/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const bridge = activeConversations.get(conversationId);
    if (!bridge) {
      return res.status(404).json({
        error: 'Conversation not found',
        conversationId
      });
    }
    
    bridge.cleanup();
    
    res.json({
      success: true,
      conversationId,
      message: 'Conversation ended'
    });
    
  } catch (error) {
    console.error('❌ Error ending conversation:', error);
    res.status(500).json({
      error: 'Failed to end conversation',
      details: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  
  // Clean up all active conversations
  for (const [conversationId, bridge] of activeConversations) {
    console.log(`🧹 Cleaning up conversation: ${conversationId}`);
    bridge.cleanup();
  }
  
  // Close Ably connection
  ably.close();
  
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  
  // Clean up all active conversations
  for (const [conversationId, bridge] of activeConversations) {
    console.log(`🧹 Cleaning up conversation: ${conversationId}`);
    bridge.cleanup();
  }
  
  // Close Ably connection
  ably.close();
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NeuraPlay Bridge Service running on port ${PORT}`);
  console.log(`📡 Ably connection: ${ABLY_API_KEY ? 'configured' : 'missing'}`);
  console.log(`🎤 ElevenLabs API: ${ELEVENLABS_API_KEY ? 'configured' : 'missing'}`);
}); 