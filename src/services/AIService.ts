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
  async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiBase}${endpoint}`;
    if (import.meta.env.DEV) {
      console.log(`🚨 DEBUG: API construction:`, {
        apiBase: this.apiBase,
        endpoint: endpoint,
        finalURL: url
      });
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

  // Get tool definitions for the AI model
  private getToolDefinitions() {
    return [
      {
        "type": "function",
        "function": {
          "name": "navigate_to_page",
          "description": "Navigate the user to a different page within the NeuraPlay application. Use this when users want to go to specific sections like playground, dashboard, forum, or profile.",
          "parameters": {
            "type": "object",
            "properties": {
              "page": {
                "type": "string",
                "enum": ["playground", "dashboard", "forum", "profile", "home", "about"],
                "description": "The page to navigate to"
              },
              "reason": {
                "type": "string",
                "description": "Optional reason for navigation"
              }
            },
            "required": ["page"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "update_settings",
          "description": "Update user settings like theme, accessibility, or preferences. Use this when users want to change their experience.",
          "parameters": {
            "type": "object",
            "properties": {
              "setting": {
                "type": "string",
                "enum": ["theme", "accessibility", "notifications", "language"],
                "description": "The setting to update"
              },
              "value": {
                "type": "string",
                "description": "The new value for the setting"
              }
            },
            "required": ["setting", "value"]
          }
        }
      }
    ];
  }

  // Enhanced AI Message with Tool Calling Support
  async sendMessage(text: string, context?: any, enableToolCalling: boolean = true): Promise<{
    generated_text: string;
    tool_calls: any[];
    tool_results: any[];
  }> {
    console.log('🔍 AI Service Debug - Input:', { text, enableToolCalling, context });
    
    // Image generation is now handled by the intelligent agentic tool-calling system
    // The GPT-OSS model decides when to call generate_image tool

    // Use correct endpoint - server has /api/api route, but apiBase handles /api prefix
    const apiEndpoint = '/api';
    
    console.log('🔍 AI Service Debug - API Endpoint:', apiEndpoint);
    
    // Prepare system prompt with tool calling instructions and language context
    let systemPrompt = enableToolCalling 
      ? this.getToolCallingSystemPrompt(context)
      : this.getStandardSystemPrompt();
    
    // Add language context if provided
    if (context?.language) {
      console.log('🔍 AI Service Debug - Language Context:', context.language);
      systemPrompt += `\n\nIMPORTANT: The user is speaking in ${context.language}. Please respond in the same language unless they specifically ask you to translate or respond in another language.`;
    }

    try {
      console.log('🔍 AI Service Debug - Sending request with tool calling:', enableToolCalling);
      
      const response = await this.apiCall(apiEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          task_type: 'chat',
          input_data: {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            tools: enableToolCalling ? this.getToolDefinitions() : undefined,
            tool_choice: enableToolCalling ? 'auto' : undefined,
            max_tokens: 1000,
            temperature: 0.7
          }
        })
      });

      console.log('🔍 AI Service Debug - Raw Response:', response);

      // Handle the response format from the server
      if (Array.isArray(response) && response.length > 0) {
        const firstResponse = response[0];
        console.log('🔍 AI Service Debug - Tool Calls Found:', firstResponse.tool_calls?.length || 0);
        console.log('🔍 AI Service Debug - Tool Results Found:', firstResponse.tool_results?.length || 0);
        
        return {
          generated_text: firstResponse.generated_text || 'No response received',
          tool_calls: firstResponse.tool_calls || [],
          tool_results: firstResponse.tool_results || []
        };
      } else if (typeof response === 'string') {
        console.log('🔍 AI Service Debug - String response, no tool calls');
        return {
          generated_text: response,
          tool_calls: [],
          tool_results: []
        };
      } else if (response && typeof response === 'object') {
        console.log('🔍 AI Service Debug - Object response');
        return {
          generated_text: response.generated_text || response.text || 'No response received',
          tool_calls: response.tool_calls || [],
          tool_results: response.tool_results || []
        };
      } else {
        console.log('🔍 AI Service Debug - No valid response');
        return {
          generated_text: 'No response received',
          tool_calls: [],
          tool_results: []
        };
      }
    } catch (error) {
      console.error('🔍 AI Service Debug - Error:', error);
      throw error;
    }
  }

  // REMOVED: Image detection is now handled by the intelligent agentic system
  // The GPT-OSS model will decide when to call the generate_image tool

  // Handle image generation
  private async handleImageGeneration(text: string): Promise<string> {
    // Extract the image prompt from the text
    const prompt = this.extractImagePrompt(text);
    
    // Use the correct API endpoint for each platform
    const apiEndpoint = '/api';

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

      // Return structured response with image data
      if (response.image_url) {
        return `IMAGE_GENERATED:${response.image_url}:Here's your generated image!`;
      } else if (response.url) {
        return `IMAGE_GENERATED:${response.url}:Here's your generated image!`;
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

  // Enhanced pedagogical system prompt with tool calling instructions
  private getToolCallingSystemPrompt(context?: any): string {
    return `You are Neural AI, NeuraPlay's advanced educational AI teacher specializing in pedagogical excellence. You combine cognitive science research with engaging, visual learning approaches.

🧠 PEDAGOGICAL CORE PRINCIPLES:
- **Multi-Modal Learning**: Use text, visuals, and interactive elements together
- **Scaffolded Understanding**: Build from simple concepts to complex ones
- **Visual Mathematics**: Always create diagrams, graphs, and illustrations for mathematical concepts
- **Memory Enhancement**: Provide memorable examples, analogies, and visual mnemonics
- **Cognitive Load Management**: Break complex topics into digestible chunks

🛠️ TOOL CALLING BEHAVIOR:
- **Proactive Visual Creation**: For ANY math/science question, immediately generate illustrative diagrams/graphs
- **Context-Aware Tools**: Use conversation history to provide more relevant responses
- **Educational Enhancement**: When explaining concepts, create visual aids automatically
- **Accessibility First**: Use accessibility tools preemptively when needed

📊 VISUAL LEARNING SPECIALIZATION:
- **Mathematical Illustrations**: Distance calculations → orbital diagrams with scale comparisons
- **Data Visualization**: Always create charts/graphs for numerical data
- **Step-by-Step Visuals**: Break complex processes into illustrated steps
- **Pedagogical Graphics**: Use colors, labels, and clear formatting for educational impact

🎯 CONVERSATION MEMORY:
- Remember previous conversation context: ${context?.conversationHistory ? 'YES - ' + context.conversationHistory.length + ' messages' : 'NO'}
- Reference earlier topics and build upon them
- Connect new concepts to previously discussed material
- Maintain learning progression throughout the conversation

🌟 RESPONSE STYLE:
- **Enthusiastic Educator**: Show excitement for learning and discovery
- **Clear Explanations**: Use analogies, real-world examples, and step-by-step breakdowns
- **Visual-First Approach**: "Let me show you..." instead of just "Let me tell you..."
- **Encouraging**: Celebrate understanding and curiosity

Current context: ${JSON.stringify(context || {})}`;
  }

  // Enhanced standard system prompt for pedagogical excellence
  private getStandardSystemPrompt(): string {
    return `You are Neural AI, NeuraPlay's advanced educational AI teacher with expertise in cognitive science and visual learning.

🎓 PEDAGOGICAL APPROACH:
- **Visual Learning**: Describe concepts with rich, detailed imagery and step-by-step illustrations
- **Mathematical Clarity**: Break down formulas, calculations, and concepts with clear explanations
- **Multi-Sensory Teaching**: Use analogies, real-world examples, and memorable comparisons
- **Progressive Difficulty**: Start simple and gradually build complexity

🧮 MATHEMATICAL EXPERTISE:
- Always show calculation steps clearly
- Provide intuitive explanations for mathematical concepts
- Use real-world examples (like distance to moon = X football fields)
- Create memorable mnemonics and analogies

💡 TEACHING PRINCIPLES:
- **Curiosity-Driven**: Encourage questions and exploration
- **Patient Guidance**: Never rush, always explain thoroughly
- **Positive Reinforcement**: Celebrate understanding and progress
- **Adaptive Learning**: Adjust explanations based on comprehension level

🎯 RESPONSE FORMATTING:
- Use **bold** for key concepts and important information
- Create clear section breaks and organized information
- Include practical examples and applications
- Make complex topics accessible and engaging`;
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
    const apiEndpoint = '/api';
    
    try {
      const response = await this.apiCall(apiEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          task_type: 'chat',
          input_data: {
            messages: [
              { role: 'system', content: 'You are Neural AI, an advanced educational AI teacher specializing in visual learning and mathematical concepts. Always provide clear, step-by-step explanations with rich examples and analogies.' },
              { role: 'user', content: text }
            ],
            max_tokens: 1000,
            temperature: 0.7
          }
        })
      });
      
      console.log('🔧 DEBUG: Raw AI service response:', response);
      console.log('🔧 DEBUG: Response type:', typeof response);
      console.log('🔧 DEBUG: Is array:', Array.isArray(response));
      
      // Handle the response format from the server
      if (Array.isArray(response) && response.length > 0) {
        console.log('🔧 DEBUG: Processing array response:', response[0]);
        return response[0].generated_text || 'No response received';
      } else if (typeof response === 'string') {
        console.log('🔧 DEBUG: Processing string response');
        return response;
      } else if (response.response) {
        console.log('🔧 DEBUG: Processing object response with .response');
        return response.response;
      } else {
        console.log('🔧 DEBUG: No valid response format found');
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