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
      // Generate a unique conversation ID
      this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Set up Ably channel for this conversation
      this.channel = this.ably.channels.get(`conversation:${this.conversationId}`);
      
      // Set up event listeners
      this.setupChannelListeners();
      
      // Initialize the conversation with ElevenLabs config
      await this.channel.publish('init_conversation', config);
      
      console.log(`🎤 Started conversation: ${this.conversationId}`);
      return this.conversationId;
      
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
      console.error('❌ Ably error:', message.data);
      this.emit('error', message.data);
    });

    // Listen for conversation initialization
    this.channel.subscribe('init_conversation', (message: any) => {
      console.log('🎯 Conversation initialized:', message.data);
      this.handleConversationInit(message.data);
    });
  }

  private async handleConversationInit(config: ElevenLabsConfig): Promise<void> {
    try {
      console.log('🎤 Handling conversation initialization with config:', config);
      
      // Send initial greeting
      const greeting = "🌟 Hi! I'm Synapse, your AI learning assistant! How can I help you today?";
      
      // Send text response immediately
      this.channel.publish('ai_response', {
        type: 'text_response',
        text: greeting,
        timestamp: Date.now()
      });
      
      // Generate TTS for greeting
      await this.generateAndSendTTS(greeting, config.voiceId);
      
      // Notify frontend that connection is ready
      this.channel.publish('status', {
        type: 'connected',
        conversationId: this.conversationId
      });
      
      console.log('✅ Conversation initialization complete');
      
    } catch (error) {
      console.error('❌ Failed to initialize conversation:', error);
      this.emit('error', { error: 'Failed to initialize conversation' });
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.channel || !this.conversationId) {
      throw new Error('No active conversation. Call startConversation() first.');
    }

    try {
      // Send message to Ably channel
      await this.channel.publish('user_message', {
        text,
        timestamp: Date.now()
      });
      
      console.log('📤 Sent message:', text);
      this.emit('message_sent', { text });
      
      // Process the message and generate response
      await this.processMessageAndRespond(text);
      
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  private async processMessageAndRespond(text: string): Promise<void> {
    try {
      // Send to AI API for processing
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'chat',
          input_data: {
            messages: [
              { role: 'system', content: 'You are Synapse, a friendly AI learning assistant for children. Keep responses concise and engaging.' },
              { role: 'user', content: text }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API failed: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse = this.parseAPIResponse(result);
      
      // Send AI response via Ably
      await this.channel.publish('ai_response', {
        type: 'text_response',
        text: aiResponse,
        timestamp: Date.now()
      });
      
      // Generate TTS for the response
      await this.generateAndSendTTS(aiResponse, '8LVfoRdkh4zgjr8v5ObE');
      
    } catch (error) {
      console.error('Error processing message:', error);
      this.emit('error', { error: 'Failed to process message' });
    }
  }

  private parseAPIResponse(result: any): string {
    try {
      if (Array.isArray(result)) {
        if (result.length > 0) {
          const firstItem = result[0];
          if (typeof firstItem === 'string') {
            return firstItem;
          }
          if (firstItem && typeof firstItem === 'object') {
            return firstItem.generated_text || firstItem.text || firstItem.response || firstItem.message || 'I received an unexpected response format.';
          }
        }
        return 'I received an unexpected response format.';
      }
      
      if (result && typeof result === 'object') {
        if (result.error) {
          throw new Error(result.error);
        }
        return result.response || result.text || result.message || result.generated_text || 'I received an unexpected response format.';
      }
      
      if (typeof result === 'string') {
        return result;
      }
      
      return 'I received an unexpected response format.';
    } catch (error) {
      console.error('Error parsing API response:', error);
      return 'I received an unexpected response format.';
    }
  }

  private async generateAndSendTTS(text: string, voiceId: string): Promise<void> {
    try {
      console.log(`🎤 Generating TTS for: ${text.substring(0, 50)}...`);
      
      // Don't send audio via Ably (size limit issue)
      // Instead, send text response and let frontend handle TTS
      this.channel.publish('ai_response', {
        type: 'text_response',
        text: text,
        timestamp: Date.now(),
        needsTTS: true, // Flag for frontend to generate TTS
        voiceId: voiceId
      });
      
      console.log(`✅ Text response sent for: ${this.conversationId}`);
      
    } catch (error) {
      console.error('Error generating TTS:', error);
      this.emit('error', { error: 'Failed to generate TTS' });
    }
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.channel || !this.conversationId) {
      throw new Error('No active conversation. Call startConversation() first.');
    }

    try {
      // Convert ArrayBuffer to base64 for transmission
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      // Send audio chunk to Ably channel for processing
      await this.channel.publish('user_audio_chunk', {
        audio: base64Audio,
        timestamp: Date.now()
      });
      
      console.log('🎵 Sent audio chunk via Ably');
      this.emit('audio_sent', { size: audioData.byteLength });
      
      // Process the audio immediately (since we're not using a bridge service)
      await this.processAudioChunk(base64Audio);
      
    } catch (error: any) {
      console.error('❌ Failed to send audio:', error);
      throw error;
    }
  }

  private async processAudioChunk(audioBase64: string): Promise<void> {
    try {
      // Send to AssemblyAI for transcription
                  // Platform-aware API endpoint
            const apiEndpoint = window.location.hostname.includes('netlify') || 
                               window.location.hostname.includes('localhost') ||
                               window.location.hostname.includes('127.0.0.1')
                ? '/.netlify/functions/assemblyai-transcribe'
                : '/api/assemblyai-transcribe';
            
            const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioBase64 // Correct parameter name
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription failed:', response.status, errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const result = await response.json();
      const transcribedText = result.text;

      if (transcribedText && transcribedText.trim()) {
        console.log('🎤 Transcribed text:', transcribedText);
        
        // Process the transcribed text with direct API call
        await this.processMessageWithDirectAPI(transcribedText);
      }

    } catch (error) {
      console.error('Error processing audio chunk:', error);
      this.emit('error', { error: 'Failed to process audio' });
    }
  }

  private async processMessageWithDirectAPI(text: string): Promise<void> {
    try {
      // Send to AI API for processing (direct call, no Ably)
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'chat',
          input_data: {
            messages: [
              { role: 'system', content: 'You are Synapse, a friendly AI learning assistant for children. Keep responses concise and engaging.' },
              { role: 'user', content: text }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API failed: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse = this.parseAPIResponse(result);
      
      // Send AI response via Ably (text only)
      await this.channel.publish('ai_response', {
        type: 'text_response',
        text: aiResponse,
        timestamp: Date.now(),
        needsTTS: true,
        voiceId: '8LVfoRdkh4zgjr8v5ObE'
      });
      
    } catch (error) {
      console.error('Error processing message:', error);
      this.emit('error', { error: 'Failed to process message' });
    }
  }

  async endConversation(): Promise<void> {
    if (!this.conversationId) {
      console.warn('⚠️ No active conversation to end');
      return;
    }

    try {
      // Notify channel to end conversation
      if (this.channel) {
        await this.channel.publish('end_conversation', {
          conversationId: this.conversationId,
          timestamp: Date.now()
        });
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