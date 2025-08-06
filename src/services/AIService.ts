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
    
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.log(`🤖 AI Service initialized for platform: ${this.platform}`);
      console.log(`🔗 API Base: ${this.apiBase}`);
      console.log(`🔌 WebSocket Enabled: ${this.wsEnabled}`);
    }
  }

  // Generic API call method
  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiBase}${endpoint}`;
    if (import.meta.env.DEV) {
      console.log(`🌐 Making API call to: ${url}`);
    }
    
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
      if (import.meta.env.DEV) {
        console.error(`❌ API call error for ${endpoint}:`, error);
      }
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

  // Enhanced AI Message with Tool Calling Support
  async sendMessage(text: string, context?: any, enableToolCalling: boolean = true): Promise<string> {
    // Check if this is an image generation request
    if (this.isImageRequest(text)) {
      return this.handleImageGeneration(text);
    }

    // Use the correct API endpoint for each platform
    const apiEndpoint = this.platform === 'netlify' 
      ? '/api'
      : '/api/api';
    
    // Prepare system prompt with tool calling instructions
    const toolCallingsystemPrompt = enableToolCalling 
      ? this.getToolCallingSystemPrompt(context)
      : this.getStandardSystemPrompt();

    try {
      const response = await this.apiCall(apiEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          task_type: 'chat',
          input_data: {
            messages: [
              { role: 'system', content: toolCallingsystemPrompt },
              { role: 'user', content: text }
            ],
            max_tokens: 1000,
            temperature: 0.7
          }
        })
      });

      // Handle the response format from the server
      if (Array.isArray(response) && response.length > 0) {
        return response[0].generated_text || 'No response received';
      } else if (typeof response === 'string') {
        return response;
      } else if (response.response) {
        return response.response;
      } else {
        return 'No response received';
      }
    } catch (error) {
      console.error('AI Service error:', error);
      throw error;
    }
  }

  // Check if the request is for image generation
  private isImageRequest(text: string): boolean {
    const imageKeywords = [
      'generate', 'create', 'make', 'draw', 'show', 'picture', 'image', 'photo', 'art',
      'generate an image', 'create an image', 'make an image', 'draw a picture',
      'show me a picture', 'create a picture', 'generate a picture'
    ];
    
    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword));
  }

  // Handle image generation
  private async handleImageGeneration(text: string): Promise<string> {
    // Extract the image prompt from the text
    const prompt = this.extractImagePrompt(text);
    
    // Use the correct API endpoint for each platform
    const apiEndpoint = this.platform === 'netlify' 
      ? '/api'
      : '/api/api';

    try {
      const response = await this.apiCall(apiEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          task_type: 'image',
          input_data: {
            prompt: prompt,
            size: '512x512'
          }
        })
      });

      // Return the image URL or data URL
      if (response.image_url) {
        return `Here's your generated image: ${response.image_url}`;
      } else if (response.url) {
        return `Here's your generated image: ${response.url}`;
      } else {
        return 'I generated an image for you, but there was an issue displaying it.';
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      return 'Sorry, I encountered an error while generating the image. Please try again.';
    }
  }

  // Extract image prompt from user text
  private extractImagePrompt(text: string): string {
    // Remove common image generation phrases
    const phrasesToRemove = [
      'generate an image of',
      'create an image of',
      'make an image of',
      'draw a picture of',
      'show me a picture of',
      'generate an image',
      'create an image',
      'make an image',
      'draw a picture',
      'show me a picture',
      'generate a picture of',
      'create a picture of',
      'make a picture of'
    ];

    let prompt = text.toLowerCase();
    for (const phrase of phrasesToRemove) {
      prompt = prompt.replace(phrase, '').trim();
    }

    // If nothing remains, use the original text
    return prompt || text;
  }

  // Define available tools for the AI
  private getAvailableTools() {
    return [
      {
        name: 'navigate_to_page',
        description: 'Navigate to a specific page in the application',
        parameters: {
          type: 'object',
          properties: {
            page: { type: 'string', description: 'The page to navigate to (playground, dashboard, forum, etc.)' },
            reason: { type: 'string', description: 'Why you are navigating to this page' }
          },
          required: ['page']
        }
      },
      {
        name: 'update_setting',
        description: 'Update a user setting or preference',
        parameters: {
          type: 'object',
          properties: {
            setting: { type: 'string', description: 'The setting to update (theme, fontSize, accessibility, etc.)' },
            value: { type: 'string', description: 'The new value for the setting' },
            reason: { type: 'string', description: 'Why you are updating this setting' }
          },
          required: ['setting', 'value']
        }
      },
      {
        name: 'recommend_games',
        description: 'Recommend games based on learning goals or skills',
        parameters: {
          type: 'object',
          properties: {
            skill: { type: 'string', description: 'The skill to target (math, reading, memory, coordination, etc.)' },
            difficulty: { type: 'string', description: 'Preferred difficulty level' },
            reason: { type: 'string', description: 'Why you are recommending these games' }
          },
          required: ['skill']
        }
      },
      {
        name: 'create_content',
        description: 'Create personalized content like diary prompts or calendar entries',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Type of content (diary_prompt, calendar_entry, forum_post)' },
            content: { type: 'string', description: 'The content to create' },
            personalization: { type: 'string', description: 'How this is personalized for the user' }
          },
          required: ['type', 'content']
        }
      },
      {
        name: 'accessibility_support',
        description: 'Provide accessibility support and accommodations',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Type of accessibility need (color_blindness, dyslexia, motor_skills, etc.)' },
            action: { type: 'string', description: 'The action to take (test, configure, enable, disable)' },
            details: { type: 'string', description: 'Additional details about the accessibility need' }
          },
          required: ['type', 'action']
        }
      },
      {
        name: 'read_user_data',
        description: 'Read user data like notifications, progress, or activity',
        parameters: {
          type: 'object',
          properties: {
            data_type: { type: 'string', description: 'Type of data to read (notifications, progress, forum_posts, diary_entries)' },
            filter: { type: 'string', description: 'Optional filter for the data' }
          },
          required: ['data_type']
        }
      }
    ];
  }

  // System prompt with tool calling instructions
  private getToolCallingSystemPrompt(context?: any): string {
    return `You are Neural AI, NeuraPlay's proactive AI assistant. You have access to tools to help users effectively.

TOOL CALLING BEHAVIOR:
- When users express needs, desires, or problems, proactively use tools to help them
- Always explain what you're doing and why when using tools
- Use tools preemptively based on context clues (e.g., "I can't see colors well" → use accessibility_support tool)
- Combine multiple tools when needed to fully address user needs

AVAILABLE TOOLS: You can navigate pages, update settings, recommend games, create content, provide accessibility support, and read user data.

CONVERSATION STYLE:
- Be friendly, encouraging, and proactive
- Explain your tool usage in simple terms
- Always follow up tool actions with helpful next steps
- Keep responses concise (1-3 sentences unless specifically asked for more)

Current context: ${JSON.stringify(context || {})}`;
  }

  // Standard system prompt without tools
  private getStandardSystemPrompt(): string {
    return `You are Neural AI, NeuraPlay's friendly AI assistant for children. 
    
Keep responses:
- Encouraging and supportive
- Age-appropriate and engaging
- Concise (1-3 sentences)
- Helpful and educational`;
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
      if (import.meta.env.DEV) {
        console.log('⚠️ WebSocket not available on this platform');
      }
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

  // Test basic API call without tool calling
  async testBasicAPI(text: string): Promise<string> {
    const apiEndpoint = this.platform === 'netlify' 
      ? '/api'
      : '/api/api';
    
    try {
      const response = await this.apiCall(apiEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          task_type: 'chat',
          input_data: {
            messages: [
              { role: 'system', content: 'You are Synapse, a friendly AI learning assistant for children.' },
              { role: 'user', content: text }
            ],
            max_tokens: 1000,
            temperature: 0.7
          }
        })
      });

      console.log('Test API response:', response);

      if (Array.isArray(response) && response.length > 0) {
        return response[0].generated_text || 'No response received';
      } else {
        return 'No response received';
      }
    } catch (error) {
      console.error('Test API error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService; 