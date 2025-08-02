import { AIService } from './AIService';
import { getVoiceId, getAgentId, getApiKey, getModelId } from '../config/elevenlabs';
import { base64ToBinary } from '../utils/videoUtils';
import { WebSocketService } from './WebSocketService';

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
  private webSocketService: WebSocketService;
  private config: StreamingConversationConfig;
  private isActive: boolean = false;
  private eventListeners: ((event: ConversationEvent) => void)[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private lastAudioLevel: number = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;

  private constructor() {
    this.aiService = AIService.getInstance();
    this.webSocketService = WebSocketService.getInstance();
    this.config = {
      language: 'english',
      modelId: getModelId('turbo'), // Use Turbo model by default
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
    
    // Connect to WebSocket service
    try {
      await this.webSocketService.connect();
      
      // Set up WebSocket event listeners
      this.setupWebSocketListeners();
      
      // Initialize conversation with ElevenLabs
      if (this.config.enableTTS) {
        await this.webSocketService.initConversation(this.config.voiceId);
      }
      
      // Generate a dynamic greeting
      const greetings = [
        "🌟 Hi there! I'm Synapse, your AI learning assistant! How are you doing today? 🚀",
        "👋 Hello! I'm Synapse, ready to help with your learning adventures! What would you like to explore? ✨",
        "🎮 Hey there! I'm Synapse, your friendly AI teacher! How can I assist you today? 🌟",
        "🚀 Hi! I'm Synapse, your learning companion! What exciting things shall we discover together? ✨",
        "🌟 Hello there! I'm Synapse, your AI assistant! I hope you're having a great day! What can I help you with? 🎯"
      ];
      
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      
      this.emitEvent({
        type: 'llm_response',
        data: { text: randomGreeting },
        timestamp: new Date()
      });

      // Start STT if enabled
      if (this.config.enableSTT) {
        await this.startSpeechToText();
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      this.emitEvent({
        type: 'error',
        data: { message: 'Failed to connect to conversation service' },
        timestamp: new Date()
      });
    }
  }

  // Stop the streaming conversation
  async stopConversation(): Promise<void> {
    this.isActive = false;
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
    }

    // Disconnect WebSocket service
    this.webSocketService.disconnect();

    this.audioChunks = [];
  }

  // Send text message through the streaming pipeline
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

    // Send message through WebSocket
    if (this.config.enableTTS) {
      await this.webSocketService.sendUserMessage(text);
    }

    // Process through LLM
    if (this.config.enableLLM) {
      await this.processWithLLM(text);
    }
  }

  // Set up WebSocket event listeners
  private setupWebSocketListeners(): void {
    // Handle conversation initiation
    this.webSocketService.addEventListener('conversation_initiated', (data) => {
      console.log('Conversation initiated:', data);
    });

    // Handle user transcript
    this.webSocketService.addEventListener('user_transcript', (data) => {
      console.log('User transcript received:', data);
      if (data.text) {
        this.emitEvent({
          type: 'user_text',
          data: { text: data.text },
          timestamp: new Date()
        });
      }
    });

    // Handle agent response
    this.webSocketService.addEventListener('agent_response', (data) => {
      console.log('Agent response received:', data);
      if (data.text) {
        this.emitEvent({
          type: 'llm_response',
          data: { text: data.text },
          timestamp: new Date()
        });
      }
    });

    // Handle audio received
    this.webSocketService.addEventListener('audio_received', (data) => {
      console.log('Audio received:', data);
      if (data.audio) {
        this.emitEvent({
          type: 'tts_audio',
          data: { 
            text: data.text || '',
            audioBase64: data.audio 
          },
          timestamp: new Date()
        });
      }
    });

    // Handle VAD score
    this.webSocketService.addEventListener('vad_score', (data) => {
      console.log('VAD score received:', data);
    });

    // Handle ping
    this.webSocketService.addEventListener('ping_received', (data) => {
      console.log('Ping received:', data);
      // Respond to ping
      this.webSocketService.sendPing(data.event_id);
    });
  }



  // Start voice recording with voice activity detection
  private async startSpeechToText(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });

      // Create audio context for voice activity detection
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.microphone.connect(this.analyser);

      // Create MediaRecorder for audio capture
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = false;

      // Set up voice activity detection
      this.setupVoiceActivityDetection();

      // Set up MediaRecorder events
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          await this.processAudioChunk();
        }
      };

      console.log('Speech-to-text initialized successfully');

    } catch (error) {
      console.error('Failed to initialize speech-to-text:', error);
      this.emitEvent({
        type: 'error',
        data: { message: 'Failed to access microphone' },
        timestamp: new Date()
      });
    }
  }

  // Set up voice activity detection
  private setupVoiceActivityDetection(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const detectVoice = () => {
      if (!this.analyser || !this.isActive) return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const audioLevel = average / 255;

      // Voice activity detection logic
      if (audioLevel > 0.1) { // Voice detected
        this.lastAudioLevel = audioLevel;
        
        // Clear silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // Start recording if not already recording
        if (!this.isRecording && this.mediaRecorder) {
          this.isRecording = true;
          this.audioChunks = [];
          this.mediaRecorder.start(100);
          console.log('Voice detected, starting recording');
          
          this.emitEvent({
            type: 'user_speech',
            data: { status: 'started', audioLevel },
            timestamp: new Date()
          });
        }
      } else if (this.isRecording) { // Silence detected
        // Set silence timer to stop recording after 1.5 seconds
        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            if (this.isRecording && this.mediaRecorder) {
              this.isRecording = false;
              this.mediaRecorder.stop();
              console.log('Silence detected, stopping recording');
              
              this.emitEvent({
                type: 'user_speech',
                data: { status: 'stopped', audioLevel: 0 },
                timestamp: new Date()
              });
            }
          }, 1500);
        }
      }

      // Continue monitoring
      requestAnimationFrame(detectVoice);
    };

    detectVoice();
  }

  // Process audio chunk through AssemblyAI and ElevenLabs
  private async processAudioChunk(): Promise<void> {
    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send audio chunk to ElevenLabs if TTS is enabled
        if (this.config.enableTTS) {
          try {
            await this.webSocketService.sendUserAudioChunk(base64Audio);
          } catch (error) {
            console.error('Failed to send audio chunk to ElevenLabs:', error);
          }
        }
        
        // Send to AssemblyAI for transcription
        const formData = new FormData();
        formData.append('audio', audioBlob);

        const response = await fetch('/.netlify/functions/assemblyai-transcribe', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Transcription failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.text && result.text.trim()) {
          // Emit user speech event
          this.emitEvent({
            type: 'user_speech',
            data: { text: result.text },
            timestamp: new Date()
          });

          // Process through LLM
          if (this.config.enableLLM) {
            await this.processWithLLM(result.text);
          }
        }
      };
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Audio processing error:', error);
      this.emitEvent({
        type: 'error',
        data: { message: 'Failed to process audio' },
        timestamp: new Date()
      });
    }
  }

  // Process text through LLM
  private async processWithLLM(text: string): Promise<void> {
    try {
      // Get LLM response
      const llmResponse = await this.aiService.sendMessage(text);
      
      // Emit LLM response event
      this.emitEvent({
        type: 'llm_response',
        data: { text: llmResponse },
        timestamp: new Date()
      });

      // Send LLM response to ElevenLabs via WebSocket if enabled
      if (this.config.enableTTS) {
        await this.webSocketService.sendUserMessage(llmResponse);
      }

    } catch (error) {
      console.error('LLM processing error:', error);
      this.emitEvent({
        type: 'error',
        data: { message: 'Failed to process with AI' },
        timestamp: new Date()
      });
    }
  }



  // Start voice recording (manual trigger)
  startVoiceRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.isRecording = true;
      this.audioChunks = [];
      this.mediaRecorder.start(100);
      console.log('Manual recording started');
      
      this.emitEvent({
        type: 'user_speech',
        data: { status: 'started_manual', audioLevel: 0 },
        timestamp: new Date()
      });
    }
  }

  // Stop voice recording (manual trigger)
  stopVoiceRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.isRecording = false;
      this.mediaRecorder.stop();
      console.log('Manual recording stopped');
      
      this.emitEvent({
        type: 'user_speech',
        data: { status: 'stopped_manual', audioLevel: 0 },
        timestamp: new Date()
      });
    }
  }

  // Get recording status
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  // Get current audio level for UI feedback
  getCurrentAudioLevel(): number {
    return this.lastAudioLevel;
  }

  // Get conversation status
  isConversationActive(): boolean {
    return this.isActive;
  }

  // Get current configuration
  getConfiguration(): StreamingConversationConfig {
    return { ...this.config };
  }
} 