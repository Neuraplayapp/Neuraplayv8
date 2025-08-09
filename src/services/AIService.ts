// Platform-aware AI Service
import { getIntelligentSearchDetector } from './IntelligentSearchDetector';

// Configuration: Conversation memory management  
const MAX_CONVERSATION_EXCHANGES = 10; // Number of user-assistant exchanges to remember (20 messages)
const MAX_CONVERSATION_MESSAGES = MAX_CONVERSATION_EXCHANGES * 2; // Total messages (user + assistant)

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

  // Enhanced API call method with streaming and cancellation support
  async apiCall(endpoint: string, options: RequestInit & { 
    streaming?: boolean; 
    abortController?: AbortController;
  } = {}): Promise<any | Response> {
    const { streaming = false, abortController, ...fetchOptions } = options;
    const url = `${this.apiBase}${endpoint}`;
    
    if (import.meta.env.DEV) {
      console.log(`🚨 DEBUG: API construction:`, {
        apiBase: this.apiBase,
        endpoint: endpoint,
        finalURL: url,
        streaming,
        hasAbortController: !!abortController
      });
      console.log(`🌐 Making API call to: ${url}`);
    }
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        signal: abortController?.signal, // Add abort signal
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      // For streaming responses, return the Response object directly
      if (streaming) {
        return response;
      }

      // For regular responses, parse JSON as before
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (import.meta.env.DEV) {
          console.log(`⚠️ API call cancelled for ${endpoint}`);
        }
        throw new Error('Request was cancelled');
      }
      
      if (import.meta.env.DEV) {
        console.error(`❌ API call error for ${endpoint}:`, error);
      }
      throw error;
    }
  }

  // Utility method to create abort controller for request cancellation
  createAbortController(timeoutMs?: number): AbortController {
    const controller = new AbortController();
    
    if (timeoutMs) {
      setTimeout(() => {
        controller.abort();
      }, timeoutMs);
    }
    
    return controller;
  }

  // ElevenLabs TTS
  async textToSpeech(text: string, voiceId: string = '8LVfoRdkh4zgjr8v5ObE') {
    return this.apiCall('/elevenlabs-tts', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
    });
  }

  // ElevenLabs Streaming TTS with enhanced streaming support
  async streamingTextToSpeech(
    text: string, 
    voiceId: string = '8LVfoRdkh4zgjr8v5ObE',
    abortController?: AbortController
  ): Promise<Response> {
    return this.apiCall('/elevenlabs-streaming-tts', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
      streaming: true, // Enable streaming mode
      abortController, // Allow request cancellation
    }) as Promise<Response>;
  }

  // Cancellable streaming TTS with timeout
  async streamingTextToSpeechWithTimeout(
    text: string, 
    voiceId: string = '8LVfoRdkh4zgjr8v5ObE',
    timeoutMs: number = 30000
  ): Promise<{ response: Response; cancel: () => void }> {
    const controller = this.createAbortController(timeoutMs);
    
    const response = await this.streamingTextToSpeech(text, voiceId, controller);
    
    return {
      response,
      cancel: () => controller.abort()
    };
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
      // CLIENT-SIDE TOOLS (handled by ToolExecutorService)
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
      },
      
      // SERVER-SIDE TOOLS (handled by server.cjs)
      {
        "type": "function",
        "function": {
          "name": "generate_image",
          "description": "Creates artistic images, illustrations, drawings, or photos based on textual descriptions. Use this ONLY for creative visual content like portraits, scenes, artwork, or photos. Do NOT use for charts, graphs, or data visualizations.",
          "parameters": {
            "type": "object",
            "properties": {
              "prompt": {
                "type": "string",
                "description": "A detailed text description of the image to be generated. For example, 'a futuristic city with flying cars'."
              },
              "style": {
                "type": "string",
                "enum": ["photorealistic", "cartoon", "watercolor", "3d-render", "pixel-art", "child-friendly"],
                "description": "Optional artistic style for the image."
              }
            },
            "required": ["prompt"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "web_search",
          "description": "Search the web for current information, news, or specific topics. Use this when users ask about current events, want to search for information, or need up-to-date data.",
          "parameters": {
            "type": "object",
            "properties": {
              "query": {
                "type": "string",
                "description": "The search query to look up on the web"
              }
            },
            "required": ["query"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get current weather information for a specific location. Use this when users ask about weather conditions.",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city, state/country, or location to get weather for"
              }
            },
            "required": ["location"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "create_math_diagram",
          "description": "Create mathematical diagrams, charts, graphs, or visualizations. Use this for any mathematical, statistical, or data visualization request.",
          "parameters": {
            "type": "object",
            "properties": {
              "concept": {
                "type": "string",
                "description": "The type of diagram to create (e.g., 'bar chart', 'pie chart', 'line graph', 'scatter plot', 'histogram')"
              },
              "data": {
                "type": "object",
                "description": "The data or mathematical concept to visualize"
              },
              "title": {
                "type": "string",
                "description": "Title for the diagram"
              }
            },
            "required": ["concept"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "get_wikipedia_summary",
          "description": "Fetch a concise Wikipedia summary (with thumbnail if available) for a topic or entity.",
          "parameters": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "Topic or entity to look up" }
            },
            "required": ["query"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "web_news_search",
          "description": "Search recent news using Serper and return a curated list of articles.",
          "parameters": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "News query" },
              "timeRange": { "type": "string", "enum": ["day", "week", "month"], "description": "Optional recency filter" }
            },
            "required": ["query"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "open_canvas_mindmap",
          "description": "Open the interactive canvas mindmap tool to plan, organize, and act on user prompts (ScribbleModule).",
          "parameters": {
            "type": "object",
            "properties": {
              "template": {
                "type": "string",
                "enum": ["mindMap", "projectPlan", "chartDashboard"],
                "description": "Optional template to load into the canvas"
              }
            }
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "create_chart",
          "description": "Create interactive data visualizations, charts, graphs, or plots on the visual canvas. Use this for ANY data-related request including: budgets, analytics, performance metrics, education data, project plans, sales data, financial analysis, or any visualization needs. NEVER use generate_image for data visualization.",
          "parameters": {
            "type": "object",
            "properties": {
              "title": {
                "type": "string",
                "description": "Title for the chart"
              },
              "type": {
                "type": "string",
                "enum": ["line", "bar", "area", "scatter", "pie", "3d-scenario"],
                "description": "Type of chart to create"
              },
              "scenario": {
                "type": "string",
                "enum": ["education", "budget", "projectPlan", "performance"],
                "description": "Pre-built 3D scenario for educational or business charts"
              },
              "data": {
                "type": "array",
                "description": "Chart data series",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {"type": "string"},
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "x": {"type": ["number", "string"]},
                          "y": {"type": "number"}
                        }
                      }
                    }
                  }
                }
              }
            },
            "required": ["title", "type"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "create_hypothesis",
          "description": "Create and test hypotheses, compare scenarios A vs B, or analyze competing ideas on the canvas. Use this for analytical thinking, testing ideas, comparing options, or running thought experiments.",
          "parameters": {
            "type": "object",
            "properties": {
              "prompt": {
                "type": "string",
                "description": "The hypothesis or question to test"
              },
              "scenarioA": {
                "type": "string",
                "description": "First scenario or hypothesis to test"
              },
              "scenarioB": {
                "type": "string",
                "description": "Alternative scenario or hypothesis to compare"
              },
              "context": {
                "type": "string",
                "description": "Additional context or constraints for the analysis"
              }
            },
            "required": ["prompt"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "cardclickingtool",
          "description": "Display expandable information cards with glassmorphic design and smooth animations. Use this for showing detailed information about news, articles, research results, Wikipedia entries, or any content that benefits from a beautiful card presentation.",
          "parameters": {
            "type": "object",
            "properties": {
              "title": {
                "type": "string",
                "description": "Main title for the card"
              },
              "subtitle": {
                "type": "string",
                "description": "Optional subtitle or category"
              },
              "content": {
                "type": "string",
                "description": "Main content text for the card (supports markdown)"
              },
              "cardType": {
                "type": "string",
                "enum": ["news", "wiki", "research", "info", "article", "results"],
                "description": "Type of card to determine styling and behavior"
              },
              "imageUrl": {
                "type": "string",
                "description": "Optional image URL for the card"
              },
              "actionUrl": {
                "type": "string",
                "description": "Optional URL for 'Read More' button"
              },
              "metadata": {
                "type": "object",
                "description": "Additional metadata like date, author, source, etc."
              }
            },
            "required": ["title", "content", "cardType"]
          }
        }
      }
    ];
  }

  // Enhanced AI Message with Tool Calling Support
  // ⚠️ IMPORTANT: This service requires Render environment with Fireworks API key (Neuraplay env var)
  // Local testing will fail with "unauthorized" - this is expected and normal
  async sendMessage(
    text: string, 
    context?: any, 
    enableToolCalling: boolean = true,
    options?: {
      streaming?: boolean;
      abortController?: AbortController;
      timeout?: number;
    }
  ): Promise<{
    generated_text: string;
    tool_calls: any[];
    tool_results: any[];
  } | Response> {
    const { streaming = false, abortController, timeout } = options || {};
    
    console.log('🔍 AI Service Debug - Input:', { 
      text, enableToolCalling, context, streaming, hasAbortController: !!abortController, timeout 
    });
    
    // 🧠 INTELLIGENT SEARCH DETECTION - RE-ENABLED
    if (enableToolCalling) {
      const intelligentSearchDetector = getIntelligentSearchDetector();
      const searchAnalysis = intelligentSearchDetector.shouldTriggerSearch(text);
      if (searchAnalysis.shouldSearch) {
        console.log('🔍 Intelligent Search Triggered:', searchAnalysis);
        
        // Enhance the user message to include search context
        const enhancedQuery = searchAnalysis.searchQuery || text;
        const searchPrompt = `The user asked: "${text}". This appears to be about ${searchAnalysis.category} (${(searchAnalysis.confidence * 100).toFixed(0)}% confidence). Please search for current information using: "${enhancedQuery}" and then provide a comprehensive answer.`;
        
        // Override the text with search-enhanced prompt
        text = searchPrompt;
        console.log('🔍 Enhanced query for AI:', text);
      }
    }
    
    // Image generation is now handled by the intelligent agentic tool-calling system
    // The GPT-OSS model decides when to call generate_image tool

    console.log('🔍 AI Service Debug - Will call apiBase + /api = /api/api');
    
    // Create timeout controller if specified
    const controller = abortController || (timeout ? this.createAbortController(timeout) : undefined);
    
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
      console.log('🔍 AI Service Debug - Sending request with tool calling:', enableToolCalling, 'streaming:', streaming);
      
      // Construct message history with conversation context
      const messages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history if available (for AI continuity)
      // Implement sliding window: keep only last 10 exchanges (20 messages max)
      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        const MAX_HISTORY_MESSAGES = MAX_CONVERSATION_MESSAGES;
        
        // Take only the most recent messages to prevent context pollution
        const recentHistory = context.conversationHistory.slice(-MAX_HISTORY_MESSAGES);
        
        console.log('🧠 AI Service Debug - Total history available:', context.conversationHistory.length, 'messages');
        console.log('🧠 AI Service Debug - Using recent history:', recentHistory.length, 'messages (20-message sliding window)');
        
        // Convert conversation history to proper message format
        const historyMessages = recentHistory.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content || msg.text || '',
          ...(msg.hasImage && { 
            // Note that this message contained an image
            content: (msg.content || msg.text || '') + ' [This message included an image]'
          })
        }));
        
        messages.push(...historyMessages);
      }

      // Add current user message
      messages.push({ role: 'user', content: text });

      console.log('🧠 AI Service Debug - Total messages being sent to AI:', messages.length);
      console.log('🧠 AI Service Debug - Message structure:', messages.map(m => ({ role: m.role, contentLength: m.content?.length || 0 })));

      const response = await this.apiCall('/api', {
        method: 'POST',
        body: JSON.stringify({
          task_type: 'chat',
          input_data: {
            messages,
            tools: enableToolCalling ? this.getToolDefinitions() : undefined,
            tool_choice: enableToolCalling ? 'auto' : undefined,
            max_tokens: 1500, // Increased for better responses with context
            temperature: 0.7
          }
        }),
        streaming, // Pass streaming option
        abortController: controller // Pass abort controller
      });

      console.log('🔍 AI Service Debug - Raw Response:', response);

      // For streaming responses, return the Response object directly
      if (streaming && response instanceof Response) {
        console.log('🔍 AI Service Debug - Returning streaming response');
        return response;
      }

      // Handle the response format from the server
      if (Array.isArray(response) && response.length > 0) {
        const firstResponse = response[0];
        console.log('🔍 AI Service Debug - Tool Calls Found:', firstResponse.tool_calls?.length || 0);
        console.log('🔍 AI Service Debug - Tool Results Found:', firstResponse.tool_results?.length || 0);
        
        // 🔍 COMPREHENSIVE IMAGE DEBUGGING IN AI SERVICE
        if (firstResponse.tool_results && firstResponse.tool_results.length > 0) {
          console.log('🔍 AI Service - Detailed tool results analysis:', {
            totalResults: firstResponse.tool_results.length,
            results: firstResponse.tool_results.map((result: any, index: number) => ({
              index,
              success: result?.success,
              hasData: !!result?.data,
              hasImageUrl: !!(result?.data?.image_url),
              imageUrlLength: result?.data?.image_url?.length || 0,
              imageUrlType: typeof result?.data?.image_url,
              message: result?.message,
              dataStructure: result?.data ? Object.keys(result.data) : []
            }))
          });
          
          // Check for image results specifically
          const imageResults = firstResponse.tool_results.filter((r: any) => r?.data?.image_url);
          if (imageResults.length > 0) {
            console.log('🔍 AI Service - Found images to pass to frontend:', imageResults.length);
            imageResults.forEach((result: any, index: number) => {
              console.log(`🔍 AI Service - Image ${index}:`, {
                isValidDataUrl: result.data.image_url.startsWith('data:image/'),
                size: result.data.image_url.length,
                preview: result.data.image_url.substring(0, 100) + '...'
              });
            });
          } else {
            console.log('🔍 AI Service - No image URLs found in tool results');
          }
        }
        
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

  // Streaming sendMessage with timeout and cancellation
  async streamingMessageWithTimeout(
    text: string,
    context?: any,
    enableToolCalling: boolean = true,
    timeoutMs: number = 30000
  ): Promise<{ response: Response; cancel: () => void }> {
    const controller = this.createAbortController(timeoutMs);
    
    const response = await this.sendMessage(text, context, enableToolCalling, {
      streaming: true,
      abortController: controller
    }) as Response;
    
    return {
      response,
      cancel: () => controller.abort()
    };
  }

  // Image generation is now handled by the intelligent agentic tool-calling system
  // The GPT-OSS model will decide when to call the generate_image tool and the server handles execution

  // Enhanced pedagogical system prompt with tool calling instructions
  private getToolCallingSystemPrompt(context?: any): string {
    return `You are Synapse, a warm and empathic psychoeducational AI teacher inspired by Montessori principles. You understand that every learner is unique and deserves patience, kindness, and respect.

🌱 YOUR MONTESSORI HEART:
- **Follow the Child**: Let learners guide their own discovery journey
- **Prepared Environment**: Use tools thoughtfully to create rich learning experiences
- **Respect for the Child**: Honor each person's natural curiosity and learning pace
- **Mixed Age Learning**: Adapt to any age or learning level with gentle understanding
- **Intrinsic Motivation**: Foster love of learning rather than external rewards

💝 YOUR EMPATHIC APPROACH:
- Speak with warmth and genuine care in every interaction
- Listen deeply to understand what someone truly needs
- Celebrate every small step and moment of understanding
- Be patient with mistakes - they're beautiful learning opportunities
- Create a safe space where people feel comfortable exploring and asking questions

🧠 PSYCHOEDUCATIONAL WISDOM:
- Recognize different learning styles and cognitive needs
- Support executive function development through gentle structure
- Help build emotional regulation through understanding
- Address learning differences with compassion and creativity
- Foster metacognition - help learners understand how they learn best

🛠️ THOUGHTFUL TOOL USAGE:
Use your tools as Montessori materials - purposefully and when they truly serve learning:

- **Visual Arts** (generate_image): When imagination needs expression or concepts need illustration
- **Data Exploration** (create_chart): When patterns and relationships want to be discovered
- **Information Discovery** (cardclickingtool): When curiosity seeks beautiful, organized knowledge
- **Hypothesis Testing** (create_hypothesis): When minds are ready to explore "what if" questions
- **Research** (web_search): When questions reach beyond our immediate knowledge

🌟 YOUR GENTLE GUIDANCE:
- "I wonder..." instead of "You should..."
- "What do you think might happen if..." to encourage prediction
- "I notice you're curious about..." to validate interests
- "Let's explore this together..." to build partnership
- "What questions are arising for you?" to deepen inquiry

Remember: You are here to nurture the natural wonder in every learner, creating connections between hearts and minds.

LEARNING CONTEXT: ${context?.conversationHistory ? `Continuing our learning journey (${context.conversationHistory.length} exchanges)` : 'Beginning a new learning adventure'}`;
  }

  // Enhanced standard system prompt for pedagogical excellence
  private getStandardSystemPrompt(): string {
    return `You are Synapse, a gentle and wise psychoeducational teacher who draws from Montessori philosophy. You believe deeply in the natural curiosity and capability of every learner.

🌱 YOUR MONTESSORI SPIRIT:
- **Follow the Child**: Allow natural curiosity to guide our conversations
- **Respect**: Honor each person's unique learning journey and pace
- **Wonder**: Approach every question with genuine curiosity and excitement
- **Grace & Courtesy**: Respond with kindness, patience, and warmth

💝 YOUR CARING PRESENCE:
- Listen with your whole heart to understand what someone truly seeks
- Celebrate the beauty in every question and moment of discovery
- Hold space for confusion, mistakes, and "not knowing" - they're part of learning
- Speak as if you're sitting beside someone, sharing in their wonder

🧠 YOUR TEACHING WISDOM:
- Begin where the learner is, not where you think they should be
- Use rich, sensory language that helps concepts come alive
- Connect new learning to what feels familiar and meaningful
- Invite exploration rather than giving all the answers at once

🌟 YOUR GENTLE LANGUAGE:
- "I'm curious about your thinking on this..."
- "What do you notice when..."
- "I wonder what would happen if..."
- "That's such an interesting question because..."
- "Let's explore this beautiful idea together..."

Remember: You are here to kindle the light that is already within each learner, nurturing their natural love of discovery and understanding.`;
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
    try {
      const response = await this.apiCall('/api', {
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