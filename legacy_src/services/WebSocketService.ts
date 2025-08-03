import { getVoiceId, getAgentId } from '../config/elevenlabs';

export interface WebSocketMessage {
  type: 'init_conversation' | 'user_message' | 'user_audio_chunk' | 'ping';
  data: any;
}

export interface WebSocketResponse {
  type: 'elevenlabs_response';
  data: any;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Connect to WebSocket
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use the Netlify WebSocket function URL
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/.netlify/functions/elevenlabs-websocket`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
              this.sendMessage(message);
            }
          }
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const response: WebSocketResponse = JSON.parse(event.data);
            this.handleResponse(response);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send message to WebSocket
  sendMessage(message: WebSocketMessage): void {
    if (!this.isConnected || !this.socket) {
      // Queue message if not connected
      this.messageQueue.push(message);
      return;
    }

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  // Initialize conversation with ElevenLabs
  async initConversation(voiceId?: string): Promise<void> {
    const agentId = getAgentId();
    const finalVoiceId = voiceId || getVoiceId('synapse');

    const message: WebSocketMessage = {
      type: 'init_conversation',
      data: {
        agentId,
        voiceId: finalVoiceId
      }
    };

    this.sendMessage(message);
  }

  // Send user text message
  async sendUserMessage(text: string, agentId?: string): Promise<void> {
    const finalAgentId = agentId || getAgentId();

    const message: WebSocketMessage = {
      type: 'user_message',
      data: {
        agentId: finalAgentId,
        message: text
      }
    };

    this.sendMessage(message);
  }

  // Send user audio chunk
  async sendUserAudioChunk(audioChunk: string, agentId?: string): Promise<void> {
    const finalAgentId = agentId || getAgentId();

    const message: WebSocketMessage = {
      type: 'user_audio_chunk',
      data: {
        agentId: finalAgentId,
        audioChunk
      }
    };

    this.sendMessage(message);
  }

  // Send ping
  async sendPing(eventId: string, agentId?: string): Promise<void> {
    const finalAgentId = agentId || getAgentId();

    const message: WebSocketMessage = {
      type: 'ping',
      data: {
        agentId: finalAgentId,
        eventId
      }
    };

    this.sendMessage(message);
  }

  // Handle WebSocket responses
  private handleResponse(response: WebSocketResponse): void {
    const { type, data } = response;

    switch (data.type) {
      case 'conversation_initiation_metadata':
        this.emit('conversation_initiated', data.conversation_initiation_metadata_event);
        break;

      case 'user_transcript':
        this.emit('user_transcript', data.user_transcription_event);
        break;

      case 'agent_response':
        this.emit('agent_response', data.agent_response_event);
        break;

      case 'audio':
        this.emit('audio_received', data.audio_event);
        break;

      case 'vad_score':
        this.emit('vad_score', data.vad_score_event);
        break;

      case 'ping':
        this.emit('ping_received', data.ping_event);
        break;

      default:
        console.log('Unknown response type:', data.type);
    }
  }

  // Event listener management
  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: (data: any) => void): void {
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
      listeners.forEach(callback => callback(data));
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get reconnect attempts
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
} 