import { AIService } from './AIService';

export interface StreamingConversationConfig {
  language: 'english' | 'russian' | 'arabic';
  voiceId?: string;
  modelId?: string;
  enableSTT: boolean;
  enableTTS: boolean;
  enableLLM: boolean;
}

export interface ConversationEvent {
  type: 'user_speech' | 'user_text' | 'llm_response' | 'tts_audio' | 'error';
  data: any;
  timestamp: Date;
}

export class StreamingConversationService {
  private static instance: StreamingConversationService;
  private aiService: AIService;
  private config: StreamingConversationConfig;
  private isActive: boolean = false;
  private eventListeners: ((event: ConversationEvent) => void)[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  private constructor() {
    this.aiService = AIService.getInstance();
    this.config = {
      language: 'english',
      voiceId: '8LVfoRdkh4zgjr8v5ObE', // English voice
      modelId: 'eleven_turbo_v2_5',
      enableSTT: true,
      enableTTS: true,
      enableLLM: true
    };
  }

  static getInstance(): StreamingConversationService {
    if (!StreamingConversationService.instance) {
      StreamingConversationService.instance = new StreamingConversationService();
    }
    return StreamingConversationService.instance;
  }

  // Configure the conversation service
  configure(config: Partial<StreamingConversationConfig>): void {
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

  // Start the streaming conversation
  async startConversation(): Promise<void> {
    if (this.isActive) {
      throw new Error('Conversation already active');
    }

    this.isActive = true;
    
    // Generate a dynamic greeting
    const greetings = [
      "🌟 Hi there! I'm Synapse, your AI learning assistant! How are you doing today? 🚀",
      "👋 Hello! I'm Synapse, ready to help with your learning adventures! What would you like to explore? ✨",
      "🎮 Hey there! I'm Synapse, your friendly AI teacher! How can I assist you today? 🌟",
      "🚀 Welcome! I'm Synapse, your AI learning companion! What shall we discover together? 💫",
      "🎯 Hi! I'm Synapse, your AI study buddy! Ready for some learning fun? Let's go! 🌟"
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    // Emit greeting event
    this.emitEvent({
      type: 'llm_response',
      data: { text: greeting },
      timestamp: new Date()
    });

    // Play greeting audio
    if (this.config.enableTTS) {
      await this.generateAndPlayTTS(greeting);
    }
  }

  // Stop the streaming conversation
  async stopConversation(): Promise<void> {
    this.isActive = false;
    await this.stopVoiceRecording();
    
    // Clean up audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
    
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  // Send text message and get response
  async sendTextMessage(text: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('Conversation not active');
    }

    // Emit user text event
    this.emitEvent({
      type: 'user_text',
      data: { text },
      timestamp: new Date()
    });

    // Process with LLM
    await this.processWithLLM(text);
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
          await this.processAudioInput(audioBlob);
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

  // Process audio input (speech to text)
  private async processAudioInput(audioBlob: Blob): Promise<void> {
    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
          audio_base64: base64Audio
        })
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const result = await response.json();
      const transcribedText = result.text;

      if (transcribedText && transcribedText.trim()) {
        // Emit user speech event
        this.emitEvent({
          type: 'user_speech',
          data: { text: transcribedText },
          timestamp: new Date()
        });

        // Process with LLM
        await this.processWithLLM(transcribedText);
      }

    } catch (error) {
      console.error('Error processing audio input:', error);
      this.emitEvent({
        type: 'error',
        data: { error: 'Failed to process audio input' },
        timestamp: new Date()
      });
    }
  }

  // Process text with LLM and generate response
  private async processWithLLM(text: string): Promise<void> {
    try {
      // Get LLM response
      const response = await this.aiService.sendMessage(text);
      
      // Emit LLM response event
      this.emitEvent({
        type: 'llm_response',
        data: { text: response },
        timestamp: new Date()
      });

      // Generate and play TTS
      if (this.config.enableTTS) {
        await this.generateAndPlayTTS(response);
      }

    } catch (error) {
      console.error('Error processing with LLM:', error);
      this.emitEvent({
        type: 'error',
        data: { error: 'Failed to process with LLM' },
        timestamp: new Date()
      });
    }
  }

  // Generate and play TTS using streaming endpoint
  private async generateAndPlayTTS(text: string): Promise<void> {
    try {
      console.log('🎤 Generating streaming TTS for:', text.substring(0, 50) + '...');

      const response = await fetch('/.netlify/functions/elevenlabs-streaming-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voiceId: this.config.voiceId,
          modelId: this.config.modelId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming TTS API error:', response.status, errorText);
        throw new Error(`Failed to generate audio: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.audio_base64) {
        // Convert base64 to audio and play
        const audioData = atob(result.audio_base64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }

        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Emit TTS audio event
        this.emitEvent({
          type: 'tts_audio',
          data: { audioUrl, text },
          timestamp: new Date()
        });

        // Play audio
        await audio.play();
        
        // Clean up URL after playing
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };

        console.log('✅ Streaming TTS played successfully');
      }

    } catch (error) {
      console.error('Error generating TTS:', error);
      this.emitEvent({
        type: 'error',
        data: { error: 'Failed to generate TTS' },
        timestamp: new Date()
      });
    }
  }

  // Check if conversation is active
  isConversationActive(): boolean {
    return this.isActive;
  }

  // Check if currently recording
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  // Get current configuration
  getConfiguration(): StreamingConversationConfig {
    return { ...this.config };
  }
} 