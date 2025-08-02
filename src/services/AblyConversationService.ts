import Ably from 'ably';

export interface ConversationMessage {
  type: 'init_conversation' | 'user_message' | 'user_audio_chunk' | 'ai_response' | 'audio_chunk' | 'status' | 'error';
  data: any;
  timestamp: number;
  clientId?: string;
}

export interface ElevenLabsConfig {
  agentId: string;
  voiceId: string;
}

export class AblyConversationService {
  private static instance: AblyConversationService;
  private ably: Ably.Realtime | null = null;
  private channel: any | null = null;
  private isConnected: boolean = false;
  private conversationId: string = '';
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();
  private bridgeServiceUrl: string = import.meta.env.VITE_BRIDGE_SERVICE_URL || 'https://your-bridge-service.onrender.com';

  private constructor() {}

  static getInstance(): AblyConversationService {
    if (!AblyConversationService.instance) {
      AblyConversationService.instance = new AblyConversationService();
    }
    return AblyConversationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Get Ably token from Netlify function
      const response = await fetch('/.netlify/functions/ably-auth');
      if (!response.ok) {
        throw new Error(`Failed to get Ably token: ${response.statusText}`);
      }
      
      const { token } = await response.json();
      
      // Initialize Ably with token
      this.ably = new Ably.Realtime({ authUrl: '/.netlify/functions/ably-auth' });
      
      this.ably.connection.on('connected', () => {
        console.log('✅ Connected to Ably');
        this.isConnected = true;
        this.emit('connected', { status: 'connected' });
      });
      
      this.ably.connection.on('disconnected', () => {
        console.log('❌ Disconnected from Ably');
        this.isConnected = false;
        this.emit('disconnected', { status: 'disconnected' });
      });
      
      this.ably.connection.on('failed', (error: any) => {
        console.error('❌ Ably connection failed:', error);
        this.emit('error', { error: error.message });
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
      // Start conversation on bridge service
      const response = await fetch(`${this.bridgeServiceUrl}/conversation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: this.conversationId || undefined })
      });

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.statusText}`);
      }

      const { conversationId } = await response.json();
      this.conversationId = conversationId;

      // Set up Ably channel for this conversation
      this.channel = this.ably.channels.get(`conversation:${conversationId}`);
      
      // Set up event listeners
      this.setupChannelListeners();
      
      // Initialize the ElevenLabs connection via bridge
      await this.channel.publish('init_conversation', config);
      
      console.log(`🎤 Started conversation: ${conversationId}`);
      return conversationId;
      
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error);
      throw error;
    }
  }

  private setupChannelListeners(): void {
    if (!this.channel) return;

    // Listen for AI responses
    this.channel.subscribe('ai_response', (message: any) => {
      console.log('📥 Received AI response:', message.data);
      this.emit('ai_response', message.data);
    });

    // Listen for status updates
    this.channel.subscribe('status', (message: any) => {
      console.log('📊 Status update:', message.data);
      this.emit('status', message.data);
      
      if (message.data.type === 'connected') {
        this.emit('conversation_ready', { conversationId: this.conversationId });
      }
    });

    // Listen for errors
    this.channel.subscribe('error', (message: any) => {
      console.error('❌ Bridge error:', message.data);
      this.emit('error', message.data);
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
      // Convert ArrayBuffer to base64 for transmission
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      await this.channel.publish('user_audio', {
        audio: base64Audio,
        timestamp: Date.now()
      });
      
      console.log('🎵 Sent audio chunk');
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

      // End conversation on bridge service
      await fetch(`${this.bridgeServiceUrl}/conversation/${this.conversationId}`, {
        method: 'DELETE'
      });

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