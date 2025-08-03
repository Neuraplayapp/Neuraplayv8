import Ably from 'ably';

export interface FlyBridgeConfig {
  conversationId: string;
  voiceId?: string;
  modelId?: string;
  enableSTT: boolean;
  enableTTS: boolean;
  enableLLM: boolean;
}

export interface ConversationEvent {
  type: 'user_speech' | 'user_text' | 'llm_response' | 'tts_audio' | 'error' | 'status';
  data: any;
  timestamp: Date;
}

export class FlyBridgeService {
  private static instance: FlyBridgeService;
  private ably: Ably.Realtime | null = null;
  private channel: Ably.Types.RealtimeChannelPromise | null = null;
  private config: FlyBridgeConfig;
  private isConnected: boolean = false;
  private eventListeners: ((event: ConversationEvent) => void)[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private isRecording: boolean = false;
  private stream: MediaStream | null = null;

  private constructor() {
    this.config = {
      conversationId: '',
      voiceId: '8LVfoRdkh4zgjr8v5ObE', // English voice
      modelId: 'eleven_turbo_v2_5',
      enableSTT: true,
      enableTTS: true,
      enableLLM: true
    };
  }

  static getInstance(): FlyBridgeService {
    if (!FlyBridgeService.instance) {
      FlyBridgeService.instance = new FlyBridgeService();
    }
    return FlyBridgeService.instance;
  }

  // Configure the service
  configure(config: Partial<FlyBridgeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Add event listener
  addEventListener(callback: (event: ConversationEvent) => void): void {
    this.eventListeners.push(callback);
  }

  // Remove event listener
  removeEventListener(callback: (event: ConversationEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
  }

  // Emit event to all listeners
  private emitEvent(event: ConversationEvent): void {
    this.eventListeners.forEach(callback => callback(event));
  }

  // Connect to Fly.io bridge service
  async connect(): Promise<void> {
    try {
      // Get Ably API key from environment
      const ablyApiKey = import.meta.env.VITE_ABLY_API_KEY;
      if (!ablyApiKey) {
        throw new Error('Ably API key not configured');
      }

      // Initialize Ably
      this.ably = new Ably.Realtime(ablyApiKey);
      
      // Create channel for this conversation
      this.channel = this.ably.channels.get(`conversation:${this.config.conversationId}`);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize conversation
      await this.initializeConversation();
      
      this.isConnected = true;
      console.log('✅ Connected to Fly.io bridge service');
      
    } catch (error) {
      console.error('❌ Failed to connect to Fly.io bridge:', error);
      throw error;
    }
  }

  // Set up Ably event listeners
  private setupEventListeners(): void {
    if (!this.channel) return;

    // Listen for AI responses
    this.channel.subscribe('ai_response', (message) => {
      const { type, text, audio, streaming } = message.data;
      
      if (type === 'text_response') {
        this.emitEvent({
          type: 'llm_response',
          data: { text },
          timestamp: new Date()
        });
      } else if (type === 'audio_response') {
        this.emitEvent({
          type: 'tts_audio',
          data: { audio, text, streaming },
          timestamp: new Date()
        });
        
        // Play the audio
        this.playAudio(audio);
      }
    });

    // Listen for status updates
    this.channel.subscribe('status', (message) => {
      const { type, conversationId } = message.data;
      
      this.emitEvent({
        type: 'status',
        data: { type, conversationId },
        timestamp: new Date()
      });
    });
  }

  // Initialize conversation with the bridge
  private async initializeConversation(): Promise<void> {
    if (!this.channel) return;

    await this.channel.publish('init_conversation', {
      voiceId: this.config.voiceId,
      modelId: this.config.modelId,
      enableSTT: this.config.enableSTT,
      enableTTS: this.config.enableTTS,
      enableLLM: this.config.enableLLM
    });
  }

  // Send text message
  async sendTextMessage(text: string): Promise<void> {
    if (!this.channel || !this.isConnected) {
      throw new Error('Not connected to bridge service');
    }

    // Emit user text event
    this.emitEvent({
      type: 'user_text',
      data: { text },
      timestamp: new Date()
    });

    // Send to bridge
    await this.channel.publish('user_message', {
      text,
      timestamp: Date.now()
    });
  }

  // Start voice recording
  async startVoiceRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });

      this.stream = stream;
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          await this.sendAudioToBridge(audioBlob);
        }
      };

      mediaRecorder.start(1000); // 1 second chunks
      this.mediaRecorder = mediaRecorder;
      this.isRecording = true;

      console.log('✅ Voice recording started');

    } catch (error) {
      console.error('Failed to start voice recording:', error);
      throw error;
    }
  }

  // Stop voice recording
  async stopVoiceRecording(): Promise<void> {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      console.log('🛑 Voice recording stopped');
    }
  }

  // Send audio to bridge service
  private async sendAudioToBridge(audioBlob: Blob): Promise<void> {
    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      if (!this.channel) return;

      // Send to bridge
      await this.channel.publish('user_audio', {
        audio: base64Audio,
        timestamp: Date.now()
      });

      console.log('✅ Audio sent to bridge service');

    } catch (error) {
      console.error('Error sending audio to bridge:', error);
      this.emitEvent({
        type: 'error',
        data: { error: 'Failed to send audio to bridge' },
        timestamp: new Date()
      });
    }
  }

  // Play audio from base64
  private async playAudio(audioBase64: string): Promise<void> {
    try {
      // Convert base64 to audio
      const audioData = atob(audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Play audio
      await audio.play();
      
      // Clean up URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

      console.log('✅ Audio played successfully');

    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  // Disconnect from bridge service
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.publish('end_conversation', {});
    }
    
    if (this.ably) {
      this.ably.close();
    }
    
    await this.stopVoiceRecording();
    
    this.isConnected = false;
    console.log('🛑 Disconnected from Fly.io bridge service');
  }

  // Check if connected
  isConnectedToBridge(): boolean {
    return this.isConnected;
  }

  // Check if currently recording
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  // Get current configuration
  getConfiguration(): FlyBridgeConfig {
    return { ...this.config };
  }
} 