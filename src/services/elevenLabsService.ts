// src/services/elevenLabsService.ts

export interface ElevenLabsMessage {
  type: 'conversation_initiation_client_data' | 'user_message' | 'user_audio_chunk' | 'pong';
  text?: string;
  user_audio_chunk?: string;
  event_id?: string;
  conversation_config_override?: any;
  custom_llm_extra_body?: any;
  dynamic_variables?: any;
}

export interface ElevenLabsResponse {
  type: 'conversation_initiation_metadata' | 'user_transcript' | 'agent_response' | 'audio' | 'vad_score' | 'ping' | 'unknown';
  data: any;
}

class ElevenLabsService {
  private isConnected: boolean = false;
  private agentId: string | null = null;
  private voiceId: string | null = null;

  // Event handlers
  public onOpen: ((event: Event) => void) | null = null;
  public onMessage: ((data: ElevenLabsResponse) => void) | null = null;
  public onClose: ((event: CloseEvent) => void) | null = null;
  public onError: ((event: Event) => void) | null = null;

  constructor() {
    this.isConnected = false;
  }

  // Connect to ElevenLabs via Netlify function
  public async connect(agentId: string, voiceId: string): Promise<void> {
    try {
      this.agentId = agentId;
      this.voiceId = voiceId;

      console.log("Connecting to ElevenLabs via Netlify function...");
      
      // Send initial conversation setup
      const response = await this.sendToNetlifyFunction({
        agentId,
        voiceId,
        message: '',
        messageType: 'conversation_initiation'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      this.isConnected = true;
      console.log("Successfully connected to ElevenLabs");

      // Trigger onOpen event
      if (this.onOpen) {
        this.onOpen(new Event('open'));
      }

      // Handle the response
      if (this.onMessage && response) {
        this.onMessage(response);
      }

    } catch (error) {
      console.error("Failed to connect to ElevenLabs:", error);
      this.isConnected = false;
      
      if (this.onError) {
        this.onError(new ErrorEvent('error', { error }));
      }
      throw error;
    }
  }

  // Send message to ElevenLabs via Netlify function
  private async sendToNetlifyFunction(data: any): Promise<ElevenLabsResponse> {
    try {
      const response = await fetch('/.netlify/functions/elevenlabs-websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error sending to Netlify function:", error);
      throw error;
    }
  }

  // Send a message to ElevenLabs
  public async sendMessage(message: ElevenLabsMessage): Promise<void> {
    if (!this.isConnected || !this.agentId || !this.voiceId) {
      throw new Error("Not connected to ElevenLabs");
    }

    try {
      let messageType = 'user_message';
      let messageContent = '';

      if (message.type === 'user_message') {
        messageType = 'user_message';
        messageContent = message.text || '';
      } else if (message.type === 'user_audio_chunk') {
        messageType = 'user_audio_chunk';
        messageContent = message.user_audio_chunk || '';
      } else if (message.type === 'pong') {
        messageType = 'pong';
        messageContent = message.event_id || '';
      }

      const response = await this.sendToNetlifyFunction({
        agentId: this.agentId,
        voiceId: this.voiceId,
        message: messageContent,
        messageType
      });

      // Handle the response
      if (this.onMessage && response) {
        this.onMessage(response);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      
      if (this.onError) {
        this.onError(new ErrorEvent('error', { error }));
      }
      throw error;
    }
  }

  // Send text message
  public async sendTextMessage(text: string): Promise<void> {
    await this.sendMessage({
      type: 'user_message',
      text: text
    });
  }

  // Send audio chunk
  public async sendAudioChunk(audioChunk: string): Promise<void> {
    await this.sendMessage({
      type: 'user_audio_chunk',
      user_audio_chunk: audioChunk
    });
  }

  // Disconnect from ElevenLabs
  public disconnect(): void {
    this.isConnected = false;
    this.agentId = null;
    this.voiceId = null;
    
    if (this.onClose) {
      this.onClose(new CloseEvent('close'));
    }
  }

  // Check if connected
  public get isConnectedState(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const elevenLabsService = new ElevenLabsService(); 