import Ably from 'ably';

export interface ConversationMessage {
  type: 'init_conversation' | 'user_message' | 'user_audio_chunk' | 'ai_response' | 'audio_chunk' | 'status' | 'error' | 'conversation_initiation_metadata';
  data: any;
  timestamp: number;
  clientId?: string;
}

export interface ElevenLabsConfig {
  agentId: string;
  voiceId: string;
  // 2025 updates: Add dynamic variables and conversation config
  dynamicVariables?: Record<string, any>;
  conversationConfig?: {
    agent?: {
      prompt?: string;
      firstMessage?: string;
      language?: string;
    };
    tts?: {
      voiceId?: string;
    };
  };
}

export class AblyConversationService {
  private static instance: AblyConversationService;
  private ably: Ably.Realtime | null = null;
  private channel: any | null = null;
  private isConnected: boolean = false;
  private conversationId: string = '';
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();
  private bridgeServiceUrl: string = import.meta.env.VITE_BRIDGE_SERVICE_URL || 'https://neuraplay-bridge-service.fly.dev';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {}

  static getInstance(): AblyConversationService {
    if (!AblyConversationService.instance) {
      AblyConversationService.instance = new AblyConversationService();
    }
    return AblyConversationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Close existing connection if any
      if (this.ably) {
        console.log('🔌 Closing existing Ably connection...');
        this.ably.close();
        this.ably = null;
        this.isConnected = false;
      }

      console.log('🔗 Initializing fresh Ably connection...', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 50)
      });
      
      // Initialize Ably with simpler, more reliable settings
      this.ably = new Ably.Realtime({ 
        authUrl: '/.netlify/functions/ably-auth',
        autoConnect: false, // We'll connect manually after setting up listeners
        closeOnUnload: true,
        queueMessages: true
      });
      
      // Return a promise that resolves when connected
      return new Promise((resolve, reject) => {
        let resolved = false;
        
        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
        };

        const resolveOnce = () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve();
          }
        };

        const rejectOnce = (error: Error) => {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(error);
          }
        };

        // Set up event listeners
        this.ably!.connection.on('connected', () => {
          console.log('✅ Connected to Ably successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected', { status: 'connected' });
          resolveOnce();
        });
        
        this.ably!.connection.on('disconnected', (stateChange: any) => {
          console.log('❌ Disconnected from Ably', stateChange?.reason);
          this.isConnected = false;
          this.emit('disconnected', { status: 'disconnected' });
          
          // Let Ably handle reconnections automatically during normal operation
          if (resolved && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Auto-reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          }
        });
        
        this.ably!.connection.on('failed', (stateChange: any) => {
          console.error('❌ Ably connection failed:', stateChange?.reason);
          this.emit('error', { error: stateChange?.reason?.message || 'Connection failed' });
          rejectOnce(new Error(`Ably connection failed: ${stateChange?.reason?.message || 'Unknown error'}`));
        });

        this.ably!.connection.on('suspended', (stateChange: any) => {
          console.log('⚠️ Ably connection suspended', stateChange?.reason);
          this.isConnected = false;
        });

        this.ably!.connection.on('connecting', () => {
          console.log('🔄 Connecting to Ably...');
        });

        this.ably!.connection.on('closing', () => {
          console.log('🔄 Closing Ably connection...');
        });

        this.ably!.connection.on('closed', () => {
          console.log('🔄 Ably connection closed');
          this.isConnected = false;
        });
        
        // Start connection
        console.log('🚀 Starting Ably connection...');
        this.ably!.connection.connect();
        
        // Timeout for initial connection
        const timeoutId = setTimeout(() => {
          console.error('❌ Ably connection timeout after 30 seconds');
          rejectOnce(new Error('Ably connection timeout'));
        }, 30000);
      });
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Ably:', error);
      throw error;
    }
  }

  async startConversation(config: ElevenLabsConfig): Promise<string> {
    if (!this.ably || !this.isConnected) {
      throw new Error('Ably not connected. Call initialize() first.');
    }

    try {
      // Enhanced 2025 conversation payload
      const conversationPayload = {
        type: "conversation_initiation_client_data",
        conversation_config_override: config.conversationConfig || {
          agent: {
            prompt: "You are a helpful AI assistant.",
            first_message: "Hi! How can I help you today?",
            language: "en"
          },
          tts: {
            voice_id: config.voiceId
          }
        },
        dynamic_variables: config.dynamicVariables || {},
        // 2025 standard: Include metadata for better conversation tracking
        conversation_metadata: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          platform: "web"
        }
      };

      // Start conversation on bridge service with enhanced payload
      const response = await fetch(`${this.bridgeServiceUrl}/conversation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId: this.conversationId || undefined,
          elevenlabsConfig: conversationPayload // Pass full 2025 config
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Bridge service not available. The conversation mode requires the bridge service to be deployed. Regular voice recording and text chat still work perfectly!`);
        }
        throw new Error(`Failed to start conversation: ${response.statusText}`);
      }

      const { conversationId } = await response.json();
      this.conversationId = conversationId;

      // Set up Ably channel for this conversation
      this.channel = this.ably.channels.get(`conversation:${conversationId}`);
      
      // Set up event listeners
      this.setupChannelListeners();
      
      // Initialize the ElevenLabs connection via bridge with 2025 standards
      await this.channel.publish('init_conversation', conversationPayload);
      
      console.log(`🎤 Started conversation: ${conversationId}`);
      
      // 2025 Fix: Emit proper conversation ready state immediately
      setTimeout(() => {
        this.emit('conversation_ready', { 
          conversationId: this.conversationId,
          status: 'ready',
          type: 'connected'
        });
      }, 100);
      
      return conversationId;
      
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error);
      throw error;
    }
  }

  private setupChannelListeners(): void {
    if (!this.channel) return;

    // Listen for conversation initiation metadata (2025 standard)
    this.channel.subscribe('conversation_initiation_metadata', (message: any) => {
      console.log('📥 Received conversation initiation metadata:', message.data);
      this.emit('conversation_initiation_metadata', message.data);
      
      // 2025 Fix: This is the key event that should trigger 'conversing' mode
      this.emit('status', { 
        type: 'connected', 
        conversationId: this.conversationId,
        metadata: message.data
      });
    });

    // Listen for AI responses
    this.channel.subscribe('ai_response', (message: any) => {
      console.log('📥 Received AI response:', message.data);
      this.emit('ai_response', message.data);
    });

    // Enhanced status handling for 2025
    this.channel.subscribe('status', (message: any) => {
      console.log('📊 Status update:', message.data);
      this.emit('status', message.data);
      
      // 2025 Fix: Handle different connection states properly
      if (message.data.type === 'connected' || message.data.type === 'conversation_ready') {
        console.log('🎯 Conversation ready with ElevenLabs');
        this.emit('conversation_ready', { 
          conversationId: this.conversationId,
          status: message.data.type,
          data: message.data
        });
      }
    });

    // Listen for user transcripts (2025 addition)
    this.channel.subscribe('user_transcript', (message: any) => {
      console.log('📝 User transcript:', message.data);
      this.emit('user_transcript', message.data);
    });

    // Listen for agent responses (2025 distinction from ai_response)
    this.channel.subscribe('agent_response', (message: any) => {
      console.log('🤖 Agent response:', message.data);
      this.emit('agent_response', message.data);
    });

    // Listen for audio chunks (enhanced for 2025)
    this.channel.subscribe('audio', (message: any) => {
      console.log('🔊 Audio response received');
      this.emit('audio_response', message.data);
    });

    // Listen for interruptions (2025 addition)
    this.channel.subscribe('interruption', (message: any) => {
      console.log('⚡ Conversation interrupted:', message.data);
      this.emit('interruption', message.data);
    });

    // Listen for VAD (Voice Activity Detection) scores (2025 addition)
    this.channel.subscribe('vad_score', (message: any) => {
      console.log('🎙️ VAD Score:', message.data);
      this.emit('vad_score', message.data);
    });

    // Enhanced error handling
    this.channel.subscribe('error', (message: any) => {
      console.error('❌ Bridge error:', message.data);
      this.emit('error', message.data);
    });

    // Listen for ping/pong to maintain connection (2025 standard)
    this.channel.subscribe('ping', (message: any) => {
      console.log('🏓 Ping received');
      // Auto-respond with pong
      this.channel.publish('pong', { 
        event_id: message.data.event_id,
        timestamp: Date.now()
      });
    });
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.channel || !this.conversationId) {
      throw new Error('No active conversation. Call startConversation() first.');
    }

    try {
      await this.channel.publish('user_message', {
        text,
        timestamp: Date.now()
      });
      
      console.log('📤 Sent message:', text);
      this.emit('message_sent', { text });
      
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.channel || !this.conversationId) {
      throw new Error('No active conversation. Call startConversation() first.');
    }

    try {
      // 2025 Standard: Convert ArrayBuffer to base64 for transmission
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      // Enhanced payload for 2025 ElevenLabs format
      const audioPayload = {
        user_audio_chunk: base64Audio, // 2025 standard field name
        timestamp: Date.now(),
        audio_format: "pcm_16000", // Standard format for 2025
        chunk_size: audioData.byteLength
      };
      
      await this.channel.publish('user_audio_chunk', audioPayload);
      
      console.log(`🔊 Audio data available: ${audioData.byteLength} bytes`);
      this.emit('audio_sent', { size: audioData.byteLength });
      
    } catch (error: any) {
      console.error('❌ Failed to send audio:', error);
      throw error;
    }
  }

  async endConversation(): Promise<void> {
    if (!this.conversationId) {
      console.warn('⚠️ No active conversation to end');
      return;
    }

    try {
      // Notify bridge service to end conversation
      if (this.channel) {
        await this.channel.publish('end_conversation', {
          conversationId: this.conversationId,
          timestamp: Date.now()
        });
      }

      // End conversation on bridge service (gracefully handle if service is down)
      try {
        await fetch(`${this.bridgeServiceUrl}/conversation/${this.conversationId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.log('🔌 Bridge service unavailable for cleanup, continuing with local cleanup');
      }

      // Clean up local state
      this.cleanup();
      
      console.log('🛑 Conversation ended');
      this.emit('conversation_ended', { conversationId: this.conversationId });
      
    } catch (error: any) {
      console.error('❌ Failed to end conversation:', error);
      // Clean up anyway
      this.cleanup();
    }
  }

  private cleanup(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    
    this.conversationId = '';
    this.eventListeners.clear();
  }

  // Event system
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected && this.ably?.connection.state === 'connected';
  }

  get currentConversationId(): string {
    return this.conversationId;
  }

  get hasActiveConversation(): boolean {
    return !!this.conversationId && !!this.channel;
  }
} 