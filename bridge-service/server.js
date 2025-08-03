import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Ably from 'ably';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const ABLY_API_KEY = process.env.ABLY_API;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.elven_labs_api_key;
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_API_KEY || process.env.ASSEMBLYAI_API_KEY;

if (!ABLY_API_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('  - ABLY_API:', !!ABLY_API_KEY);
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
    this.ablyChannel = null;
    this.isConnected = false;
    
    console.log(`🔗 Creating bridge for conversation: ${conversationId}`);
    this.initialize();
  }

  initialize() {
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
        this.initializeConversation(message.data);
      });
      
      this.ablyChannel.subscribe('end_conversation', () => {
        this.cleanup();
      });
      
      console.log(`✅ Ably channel setup complete for: ${this.conversationId}`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize bridge for ${this.conversationId}:`, error);
    }
  }

  async initializeConversation(config) {
    try {
      console.log(`🎤 Initializing conversation for: ${this.conversationId}`);
      console.log(`🎤 Config received:`, JSON.stringify(config, null, 2));
      
      // Send initial greeting
      const greeting = "🌟 Hi! I'm Synapse, your AI learning assistant! How can I help you today?";
      
      // Generate TTS for greeting
      if (ELEVENLABS_API_KEY) {
        await this.generateAndSendTTS(greeting, config.voiceId || '8LVfoRdkh4zgjr8v5ObE');
      }
      
      // Send text response
      this.ablyChannel.publish('ai_response', {
        type: 'text_response',
        text: greeting,
        timestamp: Date.now()
      });
      
      this.isConnected = true;
      
      // Notify frontend that connection is ready
      this.ablyChannel.publish('status', {
        type: 'connected',
        conversationId: this.conversationId
      });
      
    } catch (error) {
      console.error(`❌ Failed to initialize conversation for ${this.conversationId}:`, error);
      
      if (this.ablyChannel) {
        this.ablyChannel.publish('error', {
          type: 'conversation_init_error',
          conversationId: this.conversationId,
          error: error.message
        });
      }
    }
  }

  async handleUserMessage(data) {
    console.log(`📤 Received user message for: ${this.conversationId}`, data.text);
    
    try {
      // Process the message (you can add your own LLM logic here)
      const response = await this.processMessage(data.text);
      
      // Send text response
      this.ablyChannel.publish('ai_response', {
        type: 'text_response',
        text: response,
        timestamp: Date.now()
      });
      
      // Generate TTS for response
      if (ELEVENLABS_API_KEY) {
        await this.generateAndSendTTS(response, data.voiceId || '8LVfoRdkh4zgjr8v5ObE');
      }
      
    } catch (error) {
      console.error(`❌ Error handling user message for ${this.conversationId}:`, error);
      
      this.ablyChannel.publish('error', {
        type: 'message_processing_error',
        conversationId: this.conversationId,
        error: error.message
      });
    }
  }

  async handleUserAudio(data) {
    console.log(`🎵 Received user audio for: ${this.conversationId}`);
    
    try {
      // Convert audio to text using AssemblyAI
      if (ASSEMBLYAI_API_KEY) {
        const transcribedText = await this.transcribeAudio(data.audio);
        
        if (transcribedText) {
          // Process the transcribed text
          await this.handleUserMessage({ text: transcribedText });
        }
      } else {
        console.warn('⚠️ AssemblyAI API key not configured, skipping audio transcription');
      }
      
    } catch (error) {
      console.error(`❌ Error handling user audio for ${this.conversationId}:`, error);
      
      this.ablyChannel.publish('error', {
        type: 'audio_processing_error',
        conversationId: this.conversationId,
        error: error.message
      });
    }
  }

  async processMessage(text) {
    // Simple response logic - you can replace this with your own LLM API
    const responses = [
      "That's a great question! Let me help you with that.",
      "I'm here to help you learn and explore!",
      "That's interesting! Tell me more about what you'd like to know.",
      "I'm excited to help you with your learning journey!",
      "What a wonderful question! Let's explore this together."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async generateAndSendTTS(text, voiceId) {
    try {
      console.log(`🎤 Generating TTS for: ${text.substring(0, 50)}...`);
      
      // Use ElevenLabs streaming endpoint for better performance
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          },
          output_format: 'mp3_44100_128'
        })
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        
        // Send audio response
        this.ablyChannel.publish('ai_response', {
          type: 'audio_response',
          audio: audioBase64,
          text: text,
          timestamp: Date.now(),
          streaming: true,
          content_type: 'audio/mpeg'
        });
        
        console.log(`✅ TTS generated successfully for: ${this.conversationId} (${audioBuffer.byteLength} bytes)`);
      } else {
        console.error(`❌ TTS generation failed: ${response.status}`);
        const errorText = await response.text();
        console.error(`❌ TTS error details: ${errorText}`);
      }
      
    } catch (error) {
      console.error(`❌ Error generating TTS for ${this.conversationId}:`, error);
    }
  }

  async transcribeAudio(audioBase64) {
    try {
      console.log(`🎤 Transcribing audio for: ${this.conversationId}`);
      
      // Upload audio to AssemblyAI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/octet-stream',
        },
        body: Buffer.from(audioBase64, 'base64'),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio to AssemblyAI');
      }

      const uploadResult = await uploadResponse.json();
      const audioUrl = uploadResult.upload_url;

      // Request transcription
      const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speech_model: 'universal',
          punctuate: true,
          format_text: true
        }),
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to request transcription');
      }

      const transcribeResult = await transcribeResponse.json();
      const transcriptId = transcribeResult.id;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
          },
        });

        if (!pollResponse.ok) {
          throw new Error('Failed to poll transcription status');
        }

        const pollResult = await pollResponse.json();
        
        if (pollResult.status === 'completed') {
          console.log(`✅ Transcription completed: ${pollResult.text}`);
          return pollResult.text;
        }
        
        if (pollResult.status === 'error') {
          throw new Error(`Transcription failed: ${pollResult.error}`);
        }
        
        attempts++;
      }

      throw new Error('Transcription timeout');
      
    } catch (error) {
      console.error(`❌ Error transcribing audio for ${this.conversationId}:`, error);
      return null;
    }
  }

  cleanup() {
    console.log(`🧹 Cleaning up conversation: ${this.conversationId}`);
    
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
    timestamp: new Date().toISOString(),
    environment: {
      ablyConfigured: !!ABLY_API_KEY,
      elevenLabsConfigured: !!ELEVENLABS_API_KEY,
      assemblyAIConfigured: !!ASSEMBLYAI_API_KEY
    }
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
    
    console.log(`🚀 Starting conversation: ${conversationId}`);
    
    // Create new conversation bridge
    const bridge = new ConversationBridge(conversationId, ably);
    activeConversations.set(conversationId, bridge);
    
    console.log(`✅ Conversation bridge created successfully: ${conversationId}`);
    
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
      // Conversation already cleaned up - this is OK, return success
      console.log(`🧹 Conversation ${conversationId} already cleaned up`);
      return res.json({
        success: true,
        conversationId,
        message: 'Conversation already ended (cleaned up)'
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
  console.log(`🎤 AssemblyAI API: ${ASSEMBLYAI_API_KEY ? 'configured' : 'missing'}`);
});