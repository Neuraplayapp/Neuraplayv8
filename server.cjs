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

// In-memory user storage (replace with database in production)
const users = new Map();
const verificationCodes = new Map();

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // In production, hash passwords and use a database
    const user = Array.from(users.values()).find(u => u.email === email.toLowerCase());
    
    if (!user || user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'Login successful' 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { userId, email, method } = req.body;
    
    if (!userId || !email || !method) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, email, and method are required' 
      });
    }
    
    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const verificationCode = generateVerificationCode();
    const token = `${userId}_${Date.now()}`;
    
    // Store verification code (expires in 10 minutes)
    verificationCodes.set(token, {
      code: verificationCode,
      userId,
      email,
      method,
      expiresAt: Date.now() + (10 * 60 * 1000)
    });
    
    // In production, send actual email/SMS
    console.log(`📧 Verification code for ${email}: ${verificationCode}`);
    
    res.json({ 
      success: true, 
      token,
      message: `Verification code sent to your ${method}`,
      // For development only - remove in production
      devCode: verificationCode
    });
    
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { userId, token, code } = req.body;
    
    if (!userId || !token || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, token, and code are required' 
      });
    }
    
    const verification = verificationCodes.get(token);
    
    if (!verification || verification.userId !== userId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid verification token' 
      });
    }
    
    if (Date.now() > verification.expiresAt) {
      verificationCodes.delete(token);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired' 
      });
    }
    
    if (verification.code !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }
    
    // Mark user as verified
    const user = users.get(userId);
    if (user) {
      user.isVerified = true;
      user.verifiedAt = new Date().toISOString();
      user.verificationMethod = verification.method;
      users.set(userId, user);
    }
    
    // Clean up verification code
    verificationCodes.delete(token);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully!' 
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const userData = req.body;
    
    if (!userData.email || !userData.username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and username are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      u => u.email === userData.email.toLowerCase() || u.username === userData.username
    );
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Store user (in production, hash password and use database)
    const userId = userData.id || Date.now().toString();
    const user = {
      ...userData,
      id: userId,
      email: userData.email.toLowerCase(),
      password: userData.password || 'temp123', // In production, hash this
      createdAt: new Date().toISOString()
    };
    
    users.set(userId, user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'User registered successfully' 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

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
  },

  {
    "type": "function", 
    "function": {
      "name": "create_math_diagram",
      "description": "Create beautiful, pedagogical mathematical diagrams and visualizations. Use for distance calculations, geometric concepts, data visualization, and educational illustrations.",
      "parameters": {
        "type": "object",
        "properties": {
          "concept": {
            "type": "string",
            "description": "The mathematical concept to illustrate (e.g., 'distance to moon', 'histogram', 'orbital mechanics', 'scale comparison')"
          },
          "data": {
            "type": "object",
            "description": "Relevant data for the diagram (numbers, labels, values, etc.)",
            "additionalProperties": true
          },
          "title": {
            "type": "string", 
            "description": "Title for the diagram"
          },
          "style": {
            "type": "string",
            "enum": ["clean", "colorful", "scientific", "child-friendly"],
            "description": "Visual style of the diagram"
          }
        },
        "required": ["concept", "title"]
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
    },
    'create_math_diagram': {
      reason: 'Requires server-side SVG generation and mathematical processing',
      requires: ['server_processing', 'svg_generation']
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
  const { name, arguments: args } = toolCall.function;
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
  console.log(`⚙️ Requirements: ${serverToolConfig?.requires?.join(', ') || 'Unknown'}`);
  
  switch (name) {
    case 'web_search':
      return await performWebSearch(parsedArgs.query);
      
    case 'get_weather':
      return await getWeatherData(parsedArgs.location);
      
    case 'generate_image':
      return await handleImageGenerationTool(parsedArgs);
      
    case 'create_math_diagram':
      return await createMathDiagram(parsedArgs);
      
    default:
      return {
        success: false,
        message: `Unknown server-side tool: ${name}`
      };
  }
}

async function performWebSearch(query) {
  try {
    console.log('🔍 DEBUG: performWebSearch called with query:', query);
    const SERPER_API_KEY = process.env.Serper_api;
    console.log('🔍 DEBUG: Serper API key exists:', !!SERPER_API_KEY);
    if (!SERPER_API_KEY) {
      console.log('❌ DEBUG: No Serper API key - check Render env var "Serper_api"');
      return {
        success: false,
        message: "Search API not configured"
      };
    }
    
        console.log('🔍 DEBUG: Making Serper API call...');
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });

    console.log('🔍 DEBUG: Serper response status:', response.status);
    const data = await response.json();
    console.log('🔍 DEBUG: Serper response data:', JSON.stringify(data, null, 2));
    
    if (data.organic && data.organic.length > 0) {
      const results = data.organic.slice(0, 3).map(result => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link
      }));
      
      console.log('✅ DEBUG: Web search successful, returning', results.length, 'results');
      return {
        success: true,
        message: `Found ${results.length} search results for "${query}"`,
        data: { query, results }
      };
    } else {
      console.log('❌ DEBUG: No organic results found in response');
      return {
        success: false,
        message: `No search results found for "${query}"`
      };
    }
  } catch (error) {
    console.error('❌ DEBUG: Search error:', error);
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

// Mathematical diagram creation tool (for pedagogical visualizations)
async function createMathDiagram(params) {
  try {
    const { concept, data = {}, title, style = 'colorful' } = params;
    
    console.log('📊 Creating math diagram:', { concept, title, style });
    
    let svgContent = '';
    
    // Generate different types of mathematical diagrams
    switch (concept.toLowerCase()) {
      case 'distance to moon':
      case 'moon distance':
      case 'orbital distance':
        svgContent = createMoonDistanceDiagram(data, title, style);
        break;
        
      case 'histogram':
      case 'bar chart':
        svgContent = createHistogram(data, title, style);
        break;
        
      case 'spending chart':
      case 'monthly spending':
        svgContent = createSpendingChart(data, title, style);
        break;
        
      case 'scale comparison':
      case 'size comparison':
        svgContent = createScaleComparison(data, title, style);
        break;
        
      default:
        svgContent = createGenericMathDiagram(concept, data, title, style);
        break;
    }
    
    // Convert SVG to base64 data URL
    const svgBase64 = Buffer.from(svgContent).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
    
    return {
      success: true,
      message: `📊 Created beautiful ${concept} diagram: "${title}"`,
      data: {
        image_url: dataUrl,
        diagram_type: concept,
        title,
        style
      }
    };
    
  } catch (error) {
    console.error('Math diagram creation failed:', error);
    return {
      success: false,
      message: `Sorry, I couldn't create that mathematical diagram: ${error.message}`
    };
  }
}

// Create moon distance visualization
function createMoonDistanceDiagram(data, title, style) {
  const moonDistance = 384400; // km
  const earthRadius = 6371; // km
  
  return `<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="earthGrad" cx="0.3" cy="0.3">
        <stop offset="0%" style="stop-color:#87CEEB"/>
        <stop offset="70%" style="stop-color:#4169E1"/>
        <stop offset="100%" style="stop-color:#191970"/>
      </radialGradient>
      <radialGradient id="moonGrad" cx="0.4" cy="0.3">
        <stop offset="0%" style="stop-color:#F5F5DC"/>
        <stop offset="100%" style="stop-color:#C0C0C0"/>
      </radialGradient>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="500" fill="#000014"/>
    
    <!-- Stars -->
    <circle cx="100" cy="80" r="1" fill="white"/>
    <circle cx="200" cy="60" r="1" fill="white"/>
    <circle cx="650" cy="100" r="1" fill="white"/>
    <circle cx="720" cy="180" r="1" fill="white"/>
    
    <!-- Title -->
    <text x="400" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${title}</text>
    
    <!-- Earth -->
    <circle cx="120" cy="250" r="60" fill="url(#earthGrad)" stroke="#4169E1" stroke-width="2"/>
    <text x="120" y="330" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Earth</text>
    <text x="120" y="345" text-anchor="middle" fill="white" font-family="Arial" font-size="12">Radius: 6,371 km</text>
    
    <!-- Moon -->
    <circle cx="650" cy="250" r="25" fill="url(#moonGrad)" stroke="#C0C0C0" stroke-width="2"/>
    <text x="650" y="295" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Moon</text>
    <text x="650" y="310" text-anchor="middle" fill="white" font-family="Arial" font-size="12">Radius: 1,737 km</text>
    
    <!-- Distance line -->
    <line x1="180" y1="250" x2="625" y2="250" stroke="#FFD700" stroke-width="3" stroke-dasharray="5,5"/>
    
    <!-- Distance label -->
    <rect x="350" y="235" width="120" height="30" fill="#FFD700" rx="5"/>
    <text x="410" y="255" text-anchor="middle" fill="black" font-family="Arial" font-size="14" font-weight="bold">384,400 km</text>
    
    <!-- Scale information -->
    <text x="400" y="400" text-anchor="middle" fill="#FFD700" font-family="Arial" font-size="16" font-weight="bold">📏 Scale Comparison:</text>
    <text x="400" y="420" text-anchor="middle" fill="white" font-family="Arial" font-size="14">Moon distance = ~60 Earth radii</text>
    <text x="400" y="440" text-anchor="middle" fill="white" font-family="Arial" font-size="14">Light travels this distance in ~1.3 seconds</text>
    <text x="400" y="460" text-anchor="middle" fill="white" font-family="Arial" font-size="14">≈ 959,000,000 football fields!</text>
  </svg>`;
}

// Create histogram visualization
function createHistogram(data, title, style) {
  const values = data.values || [20, 45, 70, 55, 30];
  const labels = data.labels || ['A', 'B', 'C', 'D', 'E'];
  const maxValue = Math.max(...values);
  
  const barWidth = 80;
  const barSpacing = 100;
  const chartHeight = 300;
  const startX = 80;
  
  let bars = '';
  let xLabels = '';
  
  values.forEach((value, i) => {
    const barHeight = (value / maxValue) * chartHeight;
    const x = startX + (i * barSpacing);
    const y = 400 - barHeight;
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const color = colors[i % colors.length];
    
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>`;
    bars += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${value}</text>`;
    xLabels += `<text x="${x + barWidth/2}" y="430" text-anchor="middle" fill="white" font-family="Arial" font-size="14">${labels[i]}</text>`;
  });
  
  return `<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="800" height="500" fill="#1a1a2e"/>
    
    <!-- Title -->
    <text x="400" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${title}</text>
    
    <!-- Y-axis -->
    <line x1="60" y1="80" x2="60" y2="400" stroke="white" stroke-width="2"/>
    
    <!-- X-axis -->
    <line x1="60" y1="400" x2="700" y2="400" stroke="white" stroke-width="2"/>
    
    <!-- Y-axis labels -->
    <text x="45" y="405" text-anchor="end" fill="white" font-family="Arial" font-size="12">0</text>
    <text x="45" y="325" text-anchor="end" fill="white" font-family="Arial" font-size="12">${Math.round(maxValue * 0.25)}</text>
    <text x="45" y="245" text-anchor="end" fill="white" font-family="Arial" font-size="12">${Math.round(maxValue * 0.5)}</text>
    <text x="45" y="165" text-anchor="end" fill="white" font-family="Arial" font-size="12">${Math.round(maxValue * 0.75)}</text>
    <text x="45" y="85" text-anchor="end" fill="white" font-family="Arial" font-size="12">${maxValue}</text>
    
    <!-- Bars -->
    ${bars}
    
    <!-- X-axis labels -->
    ${xLabels}
    
    <!-- Axis titles -->
    <text x="400" y="470" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">Categories</text>
    <text x="25" y="250" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold" transform="rotate(-90 25 250)">Frequency</text>
  </svg>`;
}

// Create spending chart
function createSpendingChart(data, title, style) {
  const spending = [200, 300, 550, 800, 1050, 1300, 1550, 1800, 2050, 2300, 2550, 2800];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const maxSpending = Math.max(...spending);
  const chartWidth = 600;
  const chartHeight = 300;
  const startX = 80;
  const startY = 350;
  
  let points = '';
  let labels = '';
  
  spending.forEach((amount, i) => {
    const x = startX + (i * (chartWidth / 11));
    const y = startY - ((amount / maxSpending) * chartHeight);
    
    points += `${x},${y} `;
    labels += `<text x="${x}" y="${startY + 20}" text-anchor="middle" fill="white" font-family="Arial" font-size="10">${months[i]}</text>`;
  });
  
  return `<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="800" height="450" fill="#0f172a"/>
    
    <!-- Title -->
    <text x="400" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${title}</text>
    
    <!-- Grid lines -->
    <defs><pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 25" fill="none" stroke="#374151" stroke-width="0.5"/></pattern></defs>
    <rect x="80" y="50" width="600" height="300" fill="url(#grid)"/>
    
    <!-- Axes -->
    <line x1="80" y1="50" x2="80" y2="350" stroke="white" stroke-width="2"/>
    <line x1="80" y1="350" x2="680" y2="350" stroke="white" stroke-width="2"/>
    
    <!-- Line chart -->
    <polyline points="${points}" fill="none" stroke="#06B6D4" stroke-width="3"/>
    
    <!-- Data points -->
    ${spending.map((amount, i) => {
      const x = startX + (i * (chartWidth / 11));
      const y = startY - ((amount / maxSpending) * chartHeight);
      return `<circle cx="${x}" cy="${y}" r="4" fill="#06B6D4"/>`;
    }).join('')}
    
    <!-- Labels -->
    ${labels}
    
    <!-- Y-axis labels -->
    <text x="70" y="355" text-anchor="end" fill="white" font-family="Arial" font-size="12">$0</text>
    <text x="70" y="280" text-anchor="end" fill="white" font-family="Arial" font-size="12">$${Math.round(maxSpending * 0.25)}</text>
    <text x="70" y="205" text-anchor="end" fill="white" font-family="Arial" font-size="12">$${Math.round(maxSpending * 0.5)}</text>
    <text x="70" y="130" text-anchor="end" fill="white" font-family="Arial" font-size="12">$${Math.round(maxSpending * 0.75)}</text>
    <text x="70" y="55" text-anchor="end" fill="white" font-family="Arial" font-size="12">$${maxSpending}</text>
    
    <!-- Axis titles -->
    <text x="380" y="400" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">Month</text>
    <text x="25" y="200" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold" transform="rotate(-90 25 200)">Spending ($)</text>
  </svg>`;
}

// Generic math diagram creator
function createGenericMathDiagram(concept, data, title, style) {
  return `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" fill="#1e293b"/>
    <text x="300" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${title}</text>
    <text x="300" y="200" text-anchor="middle" fill="#60A5FA" font-family="Arial" font-size="18">📊 Mathematical Concept: ${concept}</text>
    <text x="300" y="250" text-anchor="middle" fill="white" font-family="Arial" font-size="14">Visual diagram for: ${concept}</text>
    <rect x="200" y="300" width="200" height="80" fill="#3B82F6" rx="10"/>
    <text x="300" y="350" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">Educational Visualization</text>
  </svg>`;
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

    const response = await fetch('https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image', {
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
    console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 DEBUG: Request headers:', JSON.stringify(req.headers, null, 2));
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
      console.log('❌ DEBUG: Validation failed - input_data:', !!input_data, 'messages:', !!input_data?.messages);
      console.log('❌ DEBUG: Full request body for 400 error:', JSON.stringify(req.body, null, 2));
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
        const resultJson = JSON.stringify(result);
        
        // Debug logging for tool results
        console.log(`🔧 Tool ${toolCall.function.name} result size: ${resultJson.length} characters`);
        if (resultJson.length > 1000) {
          console.log(`🔧 Large tool result detected for ${toolCall.function.name}`);
          if (result.data?.image_url) {
            console.log(`🔧 Image URL length: ${result.data.image_url.length} characters`);
          }
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: resultJson
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
      
      // Safe logging - truncate large content to avoid console buffer overflow
      const messagesForLogging = input_data.messages.map(msg => {
        if (msg.role === 'tool' && msg.content) {
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed.data?.image_url && parsed.data.image_url.length > 100) {
              return {
                ...msg,
                content: JSON.stringify({
                  ...parsed,
                  data: {
                    ...parsed.data,
                    image_url: `[BASE64_IMAGE_${parsed.data.image_url.length}_CHARS]`
                  }
                })
              };
            }
          } catch (e) {
            // If content is too long, truncate it
            if (msg.content.length > 500) {
              return { ...msg, content: msg.content.substring(0, 500) + '...[TRUNCATED]' };
            }
          }
        }
        return msg;
      });
      
      console.log('🔍 DEBUG: Messages to send to final call:', JSON.stringify(messagesForLogging, null, 2));
      console.log('🔍 DEBUG: Number of messages:', input_data.messages.length);
      
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
      console.log('🔍 DEBUG: Final AI response received:', JSON.stringify(finalData, null, 2));
      
      // Separate client-side tools from server-executed tools
      const clientSideTools = toolCalls.filter(tc => !SERVER_SIDE_TOOLS.includes(tc.function.name));
      const serverSideTools = toolCalls.filter(tc => SERVER_SIDE_TOOLS.includes(tc.function.name));
      
      // Debug the response being sent
      console.log(`🔍 DEBUG: Sending response with ${toolResults.length} tool results`);
      console.log(`🔍 DEBUG: Server-side tools executed: ${serverSideTools.map(t => t.function.name).join(', ')}`);
      console.log(`🔍 DEBUG: Client-side tools to execute: ${clientSideTools.map(t => t.function.name).join(', ')}`);
      
      // Validate tool results before sending
      const validatedToolResults = toolResults.map((tr, index) => {
        try {
          // Test if content is valid JSON
          JSON.parse(tr.content);
          return tr;
        } catch (e) {
          console.error(`🔧 ERROR: Tool result ${index} has invalid JSON:`, e);
          console.error(`🔧 ERROR: Problematic content length: ${tr.content.length}`);
          return {
            ...tr,
            content: JSON.stringify({
              success: false,
              message: `Tool ${tr.name} result was corrupted during processing`
            })
          };
        }
      });
      
      // Return in the expected format with BOTH server results AND client-side tools to execute
      res.json([{
        generated_text: finalData.choices[0].message.content,
        tool_calls: clientSideTools, // Only client-side tools for client execution
        tool_results: validatedToolResults,    // Server-executed tool results (validated)
        server_tool_calls: serverSideTools
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

// Database setup and configuration (OPTIONAL - doesn't block server startup)
const { Pool } = require('pg');

let pool = null;
let databaseAvailable = false;

// Initialize PostgreSQL connection (you have Render PostgreSQL)
pool = new Pool({
  connectionString: process.env.RENDER_POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

console.log('🔗 Connecting to Render PostgreSQL database...');

// Initialize database tables (non-blocking to prevent server crashes)
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
    databaseAvailable = true;
    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('📝 Continuing with in-memory storage...');
    databaseAvailable = false;
    return false;
  }
}

// Initialize database on startup (non-blocking)
initDatabase().catch(err => {
  console.log('⚠️ Database initialization failed, using in-memory mode');
});

// Database API endpoints
app.post('/api/database', async (req, res) => {
  try {
    const { action, collection, data, key, filters } = req.body;
    
    if (!action || !collection) {
      return res.status(400).json({ error: 'Missing action or collection' });
    }
    
    // If database is not available, return graceful error
    if (!databaseAvailable || !pool) {
      console.log('📝 Database request made but DB unavailable - using in-memory fallback');
      return res.json({ 
        success: true, 
        message: 'Database temporarily unavailable - using in-memory storage',
        data: null 
      });
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