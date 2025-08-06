const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// For Node.js versions without native fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.post('/api/assemblyai-transcribe', async (req, res) => {
  try {
    console.log('🎙️ Transcription request received');
    const { audio, audioType, language_code = 'auto', speech_model = 'universal' } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Forward to AssemblyAI
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.VITE_ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: audio,
        language_code: language_code === 'auto' ? null : language_code,
        language_detection: language_code === 'auto',
        speech_model: speech_model,
        punctuate: true,
        format_text: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AssemblyAI API error:', error);
      return res.status(response.status).json({ error: `Transcription failed: ${error}` });
    }

    const result = await response.json();
    
    // Poll for completion
    const transcriptId = result.id;
    let transcriptResult;
    
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.VITE_ASSEMBLYAI_API_KEY,
        }
      });
      transcriptResult = await pollResponse.json();
    } while (transcriptResult.status === 'processing' || transcriptResult.status === 'queued');

    if (transcriptResult.status === 'error') {
      return res.status(500).json({ error: `Transcription failed: ${transcriptResult.error}` });
    }

    res.json({
      text: transcriptResult.text || '',
      language_code: transcriptResult.language_code || language_code
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription service error' });
  }
});

app.post('/api/elevenlabs-tts', async (req, res) => {
  try {
    console.log('🎤 TTS request received');
    const { text, voiceId = '8LVfoRdkh4zgjr8v5ObE', modelId = 'eleven_turbo_v2_5' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.VITE_ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs TTS error:', error);
      return res.status(response.status).json({ error: `TTS failed: ${error}` });
    }

    const audioBuffer = await response.buffer();
    const base64Audio = audioBuffer.toString('base64');
    
    res.json({
      audio: base64Audio,
      size: audioBuffer.length
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS service error' });
  }
});

// Tool Schema Definition for GPT-OSS
const tools = [
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
  {
    "type": "function",
    "function": {
      "name": "recommend_game",
      "description": "Recommend educational games based on user interests, age, or learning goals. Use this when users want to play games or learn specific topics.",
      "parameters": {
        "type": "object",
        "properties": {
          "topic": {
            "type": "string",
            "description": "The learning topic or subject area"
          },
          "age_group": {
            "type": "string",
            "enum": ["3-5", "6-8", "9-12", "13+"],
            "description": "The age group for game recommendations"
          },
          "difficulty": {
            "type": "string",
            "enum": ["easy", "medium", "hard"],
            "description": "The difficulty level"
          }
        },
        "required": ["topic"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "web_search",
      "description": "Searches the live internet for up-to-date information, news, current events, or topics beyond its 2023 knowledge cutoff.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "A concise search query, like one you would type into Google."
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
      "description": "Retrieves the current weather for a specific location.",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and country, e.g., 'Taraz, Kazakhstan'."
          }
        },
        "required": ["location"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "accessibility_support",
      "description": "Apply accessibility settings for users with disabilities like color blindness, visual impairments, or other accessibility needs.",
      "parameters": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["color_blindness_support", "high_contrast", "large_text", "screen_reader"],
            "description": "The type of accessibility support needed"
          },
          "subtype": {
            "type": "string",
            "enum": ["protanopia", "deuteranopia", "tritanopia"],
            "description": "For color blindness, the specific type"
          }
        },
        "required": ["type"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "generate_image",
      "description": "Generate creative, educational, or artistic images based on user descriptions. Use this when users want to create, make, draw, or generate visual content.",
      "parameters": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "description": "Detailed description of the image to generate, including style, colors, objects, mood, etc."
          },
          "style": {
            "type": "string",
            "enum": ["realistic", "cartoon", "artistic", "educational", "child-friendly"],
            "description": "The visual style for the image"
          },
          "size": {
            "type": "string",
            "enum": ["512x512", "768x768", "1024x1024"],
            "description": "The size of the generated image"
          }
        },
        "required": ["prompt"]
      }
    }
  }
];

// INTELLIGENT TOOL ROUTING SYSTEM
const TOOL_ROUTING_CONFIG = {
  // Server-side tools (require server resources)
  server: {
    'web_search': {
      reason: 'Requires Serper API key and external API access',
      requires: ['api_key', 'external_api']
    },
    'get_weather': {
      reason: 'Requires Weather API key and external API access', 
      requires: ['api_key', 'external_api']
    },
    'generate_image': {
      reason: 'Requires Together AI API key for external API access',
      requires: ['api_key', 'external_api']
    }
  },
  
  // Client-side tools (require browser/UI access)
  client: {
    'navigate_to_page': {
      reason: 'Requires React Router and browser navigation',
      requires: ['react_router', 'browser_api', 'ui_manipulation']
    },
    'update_settings': {
      reason: 'Requires local state management and UI updates',
      requires: ['local_storage', 'react_state', 'ui_manipulation']
    },
    'recommend_game': {
      reason: 'Requires user context and UI interaction',
      requires: ['user_context', 'ui_manipulation']
    },
    'accessibility_support': {
      reason: 'Requires CSS/DOM manipulation and browser APIs',
      requires: ['dom_manipulation', 'css_changes', 'browser_api']
    }
  }
};

// Extract server-side tool names for quick lookup
const SERVER_SIDE_TOOLS = Object.keys(TOOL_ROUTING_CONFIG.server);

// Tool execution functions (SERVER-SIDE ONLY)
async function executeTool(toolCall) {
  const { name, arguments: args } = toolCall;
  const parsedArgs = JSON.parse(args);
  
  console.log(`🔧 Server executing tool: ${name} with args:`, parsedArgs);
  
  // Only execute server-side tools here
  if (!SERVER_SIDE_TOOLS.includes(name)) {
    const clientToolConfig = TOOL_ROUTING_CONFIG.client[name];
    console.log(`📤 Client-side tool ${name} - delegating to client`);
    console.log(`📋 Reason: ${clientToolConfig?.reason || 'Unknown client-side tool'}`);
    
    return {
      success: true,
      message: `Tool ${name} will be executed on client (${clientToolConfig?.reason || 'UI/browser functionality required'})`,
      data: { 
        delegatedToClient: true,
        toolConfig: clientToolConfig,
        executionLocation: 'client'
      }
    };
  }
  
  const serverToolConfig = TOOL_ROUTING_CONFIG.server[name];
  console.log(`🖥️ Server-side tool ${name} - executing on server`);
  console.log(`📋 Reason: ${serverToolConfig?.reason || 'Unknown server-side tool'}`);
  console.log(`⚙️ Requirements: ${serverToolConfig?.requires?.join(', ') || 'Unknown'}`);}
  
  switch (name) {
    case 'web_search':
      return await performWebSearch(parsedArgs.query);
      
    case 'get_weather':
      return await getWeatherData(parsedArgs.location);
      
    case 'generate_image':
      return await handleImageGenerationTool(parsedArgs);
      
    default:
      return {
        success: false,
        message: `Unknown server-side tool: ${name}`
      };
  }
}

async function performWebSearch(query) {
  try {
    const SERPER_API_KEY = process.env.Serper_api;
    if (!SERPER_API_KEY) {
      return {
        success: false,
        message: "Search API not configured"
      };
    }
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });
    
    const data = await response.json();
    
    if (data.organic && data.organic.length > 0) {
      const results = data.organic.slice(0, 3).map(result => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link
      }));
      
      return {
        success: true,
        message: `Found ${results.length} search results for "${query}"`,
        data: { query, results }
      };
    } else {
      return {
        success: false,
        message: `No search results found for "${query}"`
      };
    }
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      message: `Search failed: ${error.message}`
    };
  }
}

async function getWeatherData(location) {
  try {
    const WEATHER_API_KEY = process.env.WEATHER_API;
    if (!WEATHER_API_KEY) {
      return {
        success: false,
        message: "Weather API not configured"
      };
    }
    
    const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`);
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        message: `Weather data not available for ${location}`
      };
    }
    
    return {
      success: true,
      message: `Current weather for ${location}`,
      data: {
        location: data.location.name,
        country: data.location.country,
        temperature_c: data.current.temp_c,
        temperature_f: data.current.temp_f,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        feels_like_c: data.current.feelslike_c
      }
    };
  } catch (error) {
    console.error('Weather error:', error);
    return {
      success: false,
      message: `Weather data unavailable: ${error.message}`
    };
  }
}

// Image generation tool handler (for agentic system)
async function handleImageGenerationTool(params) {
  try {
    const { prompt, style = 'child-friendly', size = '512x512' } = params;
    
    console.log('🎨 Agentic image generation request:', { prompt, style, size });
    
            const imageResult = await handleImageGeneration({ prompt, size }, process.env.Neuraplay);
    
    return {
      success: true,
      message: `🎨 I've created a beautiful ${style} image for you: "${prompt}"`,
      data: { 
        image_url: imageResult.image_url,
        prompt,
        style,
        size
      }
    };
  } catch (error) {
    console.error('Agentic image generation failed:', error);
    return {
      success: false,
      message: `Sorry, I couldn't generate that image: ${error.message}`
    };
  }
}

// Core image generation function (used by both direct calls and tool calls)
async function handleImageGeneration(input_data, token) {
  try {
    const { prompt, size = '512x512' } = input_data;
    
    if (!prompt) {
      throw new Error('No prompt provided for image generation');
    }

    console.log('Starting image generation with Fireworks AI token:', !!token);
    console.log('Extracted prompt for image generation:', prompt);

    if (!token) {
      throw new Error('No Fireworks AI token provided for image generation');
    }

    // Enhanced prompt for better image generation
    const enhancedPrompt = `Create a beautiful, high-quality image: ${prompt}. Style: vibrant colors, detailed, professional, child-friendly, educational.`;

    console.log('Image generation prompt:', enhancedPrompt);
    console.log('Generating image with FLUX model via Fireworks AI...');

    const response = await fetch('https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'image/jpeg',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: enhancedPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fireworks image generation failed:', errorText);
      throw new Error(`Image generation failed: ${errorText}`);
    }

    // Get image data as buffer
    const imageBuffer = await response.buffer();
    
    // Convert to base64 for consistent API response
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('✅ Image generation successful');
    
    return {
      image_url: dataUrl,
      contentType: 'image/jpeg',
      data: base64Image
    };

  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

app.post('/api/api', async (req, res) => {
  try {
    console.log('🤖 AI API request received');
    const { task_type, input_data } = req.body;
    
    // Handle image generation separately
    if (task_type === 'image') {
      try {
        const imageResult = await handleImageGeneration(input_data, process.env.Neuraplay);
        return res.json(imageResult);
      } catch (error) {
        console.error('Image generation error:', error);
        return res.status(500).json({ error: `Image generation failed: ${error.message}` });
      }
    }
    
    if (!input_data || !input_data.messages) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    // Extract parameters with defaults
    const maxTokens = input_data.max_tokens || 1000;
    const temperature = input_data.temperature || 0.7;

    // NEW GPT-OSS TOOL CALLING SYSTEM
    console.log('Making initial call to GPT-OSS with tools...');
    console.log('🔍 DEBUG: Messages being sent:', JSON.stringify(input_data.messages, null, 2));
    console.log('🔍 DEBUG: Number of tools available:', tools.length);
    
    // Step 1: Initial call to GPT-OSS with tools
    const initialResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.Neuraplay}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/gpt-oss-120b',
        messages: input_data.messages,
        tools: tools,
        tool_choice: 'auto',
        max_tokens: maxTokens,
        temperature: temperature
      })
    });

    if (!initialResponse.ok) {
      const error = await initialResponse.text();
      console.error('Fireworks AI API error:', error);
      return res.status(initialResponse.status).json({ error: `AI API failed: ${error}` });
    }

    const initialData = await initialResponse.json();
    console.log('🔍 DEBUG: Full AI response:', JSON.stringify(initialData, null, 2));
    console.log('Initial response finish_reason:', initialData.choices[0].finish_reason);
    console.log('🔍 DEBUG: Message content:', initialData.choices[0].message.content);
    console.log('🔍 DEBUG: Tool calls in response:', initialData.choices[0].message.tool_calls);

    // Step 2: Handle tool calls if present
    if (initialData.choices[0].finish_reason === 'tool_calls') {
      console.log('Tool calls detected, executing tools...');
      
      const toolCalls = initialData.choices[0].message.tool_calls;
      const toolResults = [];

      // Execute all tool calls
      for (const toolCall of toolCalls) {
        const result = await executeTool(toolCall);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify(result)
        });
      }

      // Add tool call to messages
      input_data.messages.push({
        role: 'assistant',
        tool_calls: toolCalls
      });

      // Add tool results to messages
      input_data.messages.push(...toolResults);

      // Step 3: Final call to GPT-OSS with tool results
      console.log('Making final call with tool results...');
      
      const finalResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.Neuraplay}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'accounts/fireworks/models/gpt-oss-120b',
          messages: input_data.messages,
          max_tokens: maxTokens,
          temperature: temperature
        })
      });

      if (!finalResponse.ok) {
        const error = await finalResponse.text();
        console.error('Final Fireworks AI API error:', error);
        return res.status(finalResponse.status).json({ error: `AI API failed: ${error}` });
      }

      const finalData = await finalResponse.json();
      
      // Separate client-side tools from server-executed tools
      const clientSideTools = toolCalls.filter(tc => !SERVER_SIDE_TOOLS.includes(tc.function.name));
      
      // Return in the expected format with BOTH server results AND client-side tools to execute
      res.json([{
        generated_text: finalData.choices[0].message.content,
        tool_calls: clientSideTools, // Only client-side tools for client execution
        tool_results: toolResults,    // Server-executed tool results
        server_tool_calls: toolCalls.filter(tc => SERVER_SIDE_TOOLS.includes(tc.function.name))
      }]);
    } else {
      // No tool calls, return direct response
      console.log('No tool calls, returning direct response');
      
      const aiResponse = initialData.choices[0].message.content || 'I apologize, but I could not generate a response.';
      
      // Return in the expected format with empty tool arrays
      res.json([{ 
        generated_text: aiResponse,
        tool_calls: [],
        tool_results: []
      }]);
    }

  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({ error: 'AI service error' });
  }
});

// Database setup and configuration
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.RENDER_POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database tables
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        profile JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(255),
        user_agent TEXT,
        platform VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        channel VARCHAR(100) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        votes INTEGER DEFAULT 0,
        replies JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        messages JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create ai_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        interaction_type VARCHAR(100) NOT NULL,
        input TEXT,
        output TEXT,
        tools_used JSONB DEFAULT '[]',
        response_time INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    client.release();
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Initialize database on startup
initDatabase();

// Database API endpoints
app.post('/api/database', async (req, res) => {
  try {
    const { action, collection, data, key, filters } = req.body;
    
    if (!action || !collection) {
      return res.status(400).json({ error: 'Missing action or collection' });
    }

    const client = await pool.connect();

    try {
      switch (action) {
        case 'save':
          await saveToDatabase(client, collection, data);
          res.json({ success: true, message: 'Data saved successfully' });
          break;

        case 'get':
          const result = await getFromDatabase(client, collection, key, filters);
          res.json(result);
          break;

        case 'delete':
          await deleteFromDatabase(client, collection, key);
          res.json({ success: true, message: 'Data deleted successfully' });
          break;

        default:
          res.status(400).json({ error: 'Invalid action' });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database API error:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Database helper functions
async function saveToDatabase(client, collection, data) {
  const timestamp = new Date().toISOString();
  
  switch (collection) {
    case 'users':
      await client.query(`
        INSERT INTO users (id, username, email, profile, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          profile = EXCLUDED.profile,
          updated_at = EXCLUDED.updated_at
      `, [data.id, data.username, data.email, JSON.stringify(data.profile), timestamp]);
      break;

    case 'analytics':
      await client.query(`
        INSERT INTO analytics (id, user_id, event_type, event_data, session_id, user_agent, platform)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [data.id, data.userId, data.eventType, JSON.stringify(data.eventData), data.sessionId, data.userAgent, data.platform]);
      break;

    case 'posts':
      await client.query(`
        INSERT INTO posts (id, user_id, channel, title, content, votes, replies, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          votes = EXCLUDED.votes,
          replies = EXCLUDED.replies,
          updated_at = EXCLUDED.updated_at
      `, [data.id, data.userId, data.channel, data.title, data.content, data.votes, JSON.stringify(data.replies), timestamp]);
      break;

    case 'conversations':
      await client.query(`
        INSERT INTO conversations (id, user_id, messages, metadata, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          messages = EXCLUDED.messages,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `, [data.id, data.userId, JSON.stringify(data.messages), JSON.stringify(data.metadata), timestamp]);
      break;

    case 'ai_logs':
      await client.query(`
        INSERT INTO ai_logs (id, user_id, interaction_type, input, output, tools_used, response_time, session_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [data.id, data.userId, data.interactionType, data.input, data.output, JSON.stringify(data.toolsUsed), data.responseTime, data.sessionId]);
      break;

    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
}

async function getFromDatabase(client, collection, key, filters = {}) {
  let query = '';
  let params = [];

  switch (collection) {
    case 'users':
      if (key) {
        query = 'SELECT * FROM users WHERE id = $1';
        params = [key];
      } else {
        query = 'SELECT * FROM users ORDER BY updated_at DESC';
      }
      break;

    case 'analytics':
      if (key) {
        query = 'SELECT * FROM analytics WHERE user_id = $1 ORDER BY timestamp DESC';
        params = [key];
      } else {
        query = 'SELECT * FROM analytics ORDER BY timestamp DESC LIMIT 100';
      }
      
      if (filters.eventType) {
        query += query.includes('WHERE') ? ' AND' : ' WHERE';
        query += ' event_type = $' + (params.length + 1);
        params.push(filters.eventType);
      }
      break;

    case 'posts':
      if (filters.channel) {
        query = 'SELECT * FROM posts WHERE channel = $1 ORDER BY created_at DESC';
        params = [filters.channel];
      } else {
        query = 'SELECT * FROM posts ORDER BY created_at DESC LIMIT 100';
      }
      break;

    case 'conversations':
      if (key) {
        query = 'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC';
        params = [key];
      } else {
        query = 'SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 100';
      }
      break;

    case 'ai_logs':
      if (key) {
        query = 'SELECT * FROM ai_logs WHERE user_id = $1 ORDER BY timestamp DESC';
        params = [key];
      } else {
        query = 'SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 100';
      }
      
      if (filters.interactionType) {
        query += query.includes('WHERE') ? ' AND' : ' WHERE';
        query += ' interaction_type = $' + (params.length + 1);
        params.push(filters.interactionType);
      }
      break;

    default:
      throw new Error(`Unknown collection: ${collection}`);
  }

  const result = await client.query(query, params);
  return result.rows;
}

async function deleteFromDatabase(client, collection, key) {
  if (!key) {
    throw new Error('Key is required for delete operations');
  }

  switch (collection) {
    case 'users':
      await client.query('DELETE FROM users WHERE id = $1', [key]);
      break;
    case 'analytics':
      await client.query('DELETE FROM analytics WHERE id = $1', [key]);
      break;
    case 'posts':
      await client.query('DELETE FROM posts WHERE id = $1', [key]);
      break;
    case 'conversations':
      await client.query('DELETE FROM conversations WHERE id = $1', [key]);
      break;
    case 'ai_logs':
      await client.query('DELETE FROM ai_logs WHERE id = $1', [key]);
      break;
    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
}

// Serve static files (AFTER all API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes for SPA (MUST BE LAST!)
app.get('*', (req, res) => {
  console.log('🔄 Catch-all route hit for:', req.path);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Store ElevenLabs WebSocket connections per client
const elevenLabsConnections = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔗 WebSocket client connected');
  const clientId = Math.random().toString(36).substring(7);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📥 Received WebSocket message:', data.type);
      
      // Handle different message types
      switch (data.type) {
        case 'connect_elevenlabs':
          await handleElevenLabsConnection(ws, clientId);
          break;
          
        case 'audio_chunk':
          await handleAudioChunk(ws, clientId, data.audio);
          break;
          
        case 'tts_request':
          await handleTTSRequest(ws, data.text, data.voiceId, data.modelId);
          break;
          
        default:
          console.log('📥 Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    // Clean up ElevenLabs connection
    const elevenLabsWs = elevenLabsConnections.get(clientId);
    if (elevenLabsWs) {
      elevenLabsWs.close();
      elevenLabsConnections.delete(clientId);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Handle ElevenLabs WebSocket connection
async function handleElevenLabsConnection(clientWs, clientId) {
  try {
    console.log('🎯 Connecting to ElevenLabs Conversational AI...');
    
    const ElevenLabsWS = require('ws');
    const agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_2201k13zjq5nf9faywz14701hyhb';
    const apiKey = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    console.log('🔑 Using Agent ID:', agentId);
    console.log('🔑 API Key available:', !!apiKey);
    console.log('🔑 API Key length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found in environment variables');
    }
    
    // FIXED: API key must be in URL as query parameter, not in headers
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}&xi-api-key=${apiKey}`;
    console.log('🌐 WebSocket URL constructed (API key hidden):', wsUrl.replace(/xi-api-key=[^&]+/, 'xi-api-key=***'));
    
    const elevenLabsWs = new ElevenLabsWS(wsUrl);
    
    elevenLabsWs.on('open', () => {
      console.log('✅ Connected to ElevenLabs');
      elevenLabsConnections.set(clientId, elevenLabsWs);
      
      // CRITICAL: Send conversation initiation message to start the conversation
      console.log('🎯 Sending conversation initiation to ElevenLabs...');
      elevenLabsWs.send(JSON.stringify({
        type: 'conversation_initiation_client_data',
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: "You are a helpful, friendly AI assistant for NeuraPlay, an educational platform for children. Keep responses concise and engaging."
            },
            first_message: "Hi! I'm your AI assistant. How can I help you today?",
            language: "en"
          }
        }
      }));
      
      clientWs.send(JSON.stringify({
        type: 'elevenlabs_connected',
        message: 'Connected to ElevenLabs Conversational AI'
      }));
    });
    
    elevenLabsWs.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        console.log('📥 ElevenLabs response:', response.type || 'unknown', JSON.stringify(response).substring(0, 200));
        
        // Handle different ElevenLabs message types
        if (response.type === 'conversation_initiation_metadata') {
          console.log('✅ ElevenLabs conversation initiated successfully');
          console.log('🎯 Conversation ID:', response.conversation_initiation_metadata_event?.conversation_id);
          
        } else if (response.type === 'audio') {
          console.log('🔊 Received audio from ElevenLabs');
          clientWs.send(JSON.stringify({
            type: 'audio_chunk',
            audio: response.audio_event?.audio_base_64
          }));
          
        } else if (response.type === 'agent_response') {
          console.log('💬 Received text response from ElevenLabs:', response.agent_response_event?.agent_response?.substring(0, 100));
          clientWs.send(JSON.stringify({
            type: 'ai_response',
            text: response.agent_response_event?.agent_response
          }));
          
        } else if (response.type === 'user_transcript') {
          console.log('👤 User transcript:', response.user_transcription_event?.user_transcript);
          
        } else if (response.type === 'ping') {
          // Respond to ping with pong
          console.log('🏓 Received ping, sending pong');
          elevenLabsWs.send(JSON.stringify({
            type: 'pong',
            event_id: response.ping_event?.event_id
          }));
          
        } else {
          console.log('📥 Other ElevenLabs message:', response.type);
        }
      } catch (error) {
        console.error('❌ Error processing ElevenLabs response:', error);
      }
    });
    
    elevenLabsWs.on('error', (error) => {
      console.error('❌ ElevenLabs WebSocket error:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'ElevenLabs connection error'
      }));
    });
    
    elevenLabsWs.on('close', () => {
      console.log('🔌 ElevenLabs WebSocket closed');
      elevenLabsConnections.delete(clientId);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to ElevenLabs:', error);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'Failed to connect to ElevenLabs'
    }));
  }
}

// Handle audio chunk forwarding to ElevenLabs
async function handleAudioChunk(clientWs, clientId, audioBase64) {
  try {
    const elevenLabsWs = elevenLabsConnections.get(clientId);
    
    if (!elevenLabsWs || elevenLabsWs.readyState !== WebSocket.OPEN) {
      console.log('⚠️ ElevenLabs connection not ready, using fallback transcription');
      
      // Fallback: Use AssemblyAI + Together AI for conversation
      await handleFallbackConversation(clientWs, audioBase64);
      return;
    }
    
    console.log('🎤 Forwarding audio chunk to ElevenLabs');
    
    // Forward audio chunk to ElevenLabs in the correct format (no "type" field)
    elevenLabsWs.send(JSON.stringify({
      user_audio_chunk: audioBase64
    }));
    
    console.log('📤 Sent audio chunk to ElevenLabs, size:', audioBase64.length);
    
    // Send acknowledgment to client
    clientWs.send(JSON.stringify({
      type: 'audio_ack',
      message: 'Audio chunk received'
    }));
    
  } catch (error) {
    console.error('❌ Error forwarding audio chunk:', error);
    // Use fallback instead of failing
    await handleFallbackConversation(clientWs, audioBase64);
  }
}

// Fallback conversation using AssemblyAI + Together AI
async function handleFallbackConversation(clientWs, audioBase64) {
  try {
    console.log('🔄 Using fallback conversation flow');
    
    // Step 1: Transcribe audio
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.VITE_ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: audioBase64,
        speech_model: 'universal'
      })
    });

    if (!transcriptResponse.ok) {
      throw new Error('Transcription failed');
    }

    const transcriptResult = await transcriptResponse.json();
    const transcriptId = transcriptResult.id;
    
    // Poll for completion
    let finalResult;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'Authorization': process.env.VITE_ASSEMBLYAI_API_KEY }
      });
      finalResult = await pollResponse.json();
    } while (finalResult.status === 'processing' || finalResult.status === 'queued');

    if (!finalResult.text) return;

    // Step 2: Generate AI response with conversation-appropriate length
    const aiResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.Neuraplay}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: 'You are Synapse, a friendly AI teacher in conversation mode. Keep responses conversational, natural, and appropriately brief (1-3 sentences for simple questions, longer for complex topics). Respond as if having an ongoing voice conversation.'
          },
          { role: 'user', content: finalResult.text }
        ],
        max_tokens: getResponseLength(finalResult.text),
        temperature: 0.7,
        stream: false
      })
    });

    const aiResult = await aiResponse.json();
    const responseText = aiResult.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    
    // Step 3: Send text response
    clientWs.send(JSON.stringify({
      type: 'ai_response',
      text: responseText
    }));

    // Step 4: Generate TTS
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/8LVfoRdkh4zgjr8v5ObE`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.VITE_ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: responseText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    
    if (ttsResponse.ok) {
      const audioBuffer = await ttsResponse.buffer();
      const base64Audio = audioBuffer.toString('base64');
      
      clientWs.send(JSON.stringify({
        type: 'audio_chunk',
        audio: base64Audio
      }));
    }
    
  } catch (error) {
    console.error('❌ Fallback conversation error:', error);
  }
}

// Determine appropriate response length based on input
function getResponseLength(inputText) {
  const wordCount = inputText.split(' ').length;
  
  if (wordCount <= 5) return 50;      // Short questions: brief answers
  if (wordCount <= 15) return 150;    // Medium questions: moderate answers  
  if (wordCount <= 30) return 300;    // Longer questions: detailed answers
  return 500;                         // Complex topics: comprehensive answers
}

// Handle direct TTS requests
async function handleTTSRequest(clientWs, text, voiceId = '8LVfoRdkh4zgjr8v5ObE', modelId = 'eleven_turbo_v2_5') {
  try {
    console.log('🎤 Processing TTS request:', text?.substring(0, 50));
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.VITE_ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }
    
    const audioBuffer = await response.buffer();
    const base64Audio = audioBuffer.toString('base64');
    
    clientWs.send(JSON.stringify({
      type: 'audio_chunk',
      audio: base64Audio
    }));
    
  } catch (error) {
    console.error('❌ TTS request error:', error);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'TTS generation failed'
    }));
  }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 WebSocket server ready on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 
    process.exit(0);
  });
}); 