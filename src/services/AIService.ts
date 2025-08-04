// Platform-aware AI Service
class AIService {
  private platform: string;
  private apiBase: string;
  private wsEnabled: boolean;

  constructor() {
    // Detect platform from environment or default to local
    this.platform = import.meta.env.VITE_PLATFORM || 'local';
    this.apiBase = import.meta.env.VITE_API_BASE || 
                   (this.platform === 'netlify' ? '/.netlify/functions' : '/api');
    this.wsEnabled = import.meta.env.VITE_WS_ENABLED === 'true' || this.platform === 'render';
    
    console.log(`🤖 AI Service initialized for platform: ${this.platform}`);
    console.log(`🔗 API Base: ${this.apiBase}`);
    console.log(`🔌 WebSocket Enabled: ${this.wsEnabled}`);
  }

  // Generic API call method
  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiBase}${endpoint}`;
    console.log(`🌐 Making API call to: ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API call error for ${endpoint}:`, error);
      throw error;
    }
  }

  // ElevenLabs TTS
  async textToSpeech(text: string, voiceId: string = '8LVfoRdkh4zgjr8v5ObE') {
    return this.apiCall('/elevenlabs-tts', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
    });
  }

  // ElevenLabs Streaming TTS
  async streamingTextToSpeech(text: string, voiceId: string = '8LVfoRdkh4zgjr8v5ObE') {
    return this.apiCall('/elevenlabs-streaming-tts', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
    });
  }

  // AssemblyAI Transcription
  async transcribeAudio(audioData: string) {
    return this.apiCall('/assemblyai-transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio: audioData }),
    });
  }

  // Ably Auth
  async getAblyToken() {
    return this.apiCall('/ably-auth', {
      method: 'GET',
    });
  }

  // Generic OpenAI API
  async openAICall(message: string, model: string = 'gpt-3.5-turbo') {
    return this.apiCall('/api', {
      method: 'POST',
      body: JSON.stringify({ message, model }),
    });
  }

  // Contact Form
  async submitContactForm(data: { name: string; email: string; message: string }) {
    return this.apiCall('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Test ElevenLabs API
  async testElevenLabs() {
    return this.apiCall('/test-elevenlabs', {
      method: 'GET',
    });
  }

  // WebSocket connection (only available on Render)
  getWebSocketUrl(): string | null {
    if (!this.wsEnabled) {
      console.log('⚠️ WebSocket not available on this platform');
      return null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }

  // Platform information
  getPlatformInfo() {
    return {
      platform: this.platform,
      apiBase: this.apiBase,
      wsEnabled: this.wsEnabled,
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService; 