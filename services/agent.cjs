// For Node.js versions without native fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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

// Import the math diagram and image generation functions (these would be moved here)
const { createMathDiagram } = require('./mathDiagrams.cjs');
const { handleImageGeneration } = require('./imageGeneration.cjs');

// Image generation tool handler (for agentic system)
async function handleImageGenerationTool(params) {
  console.log('🔍 IMAGE GENERATION TOOL EXECUTION STARTED');
  console.log('🔍 Input params:', params);
  console.log('🔍 Environment check - Neuraplay API key exists:', !!process.env.Neuraplay);
  
  try {
    const { prompt, style = 'child-friendly', size = '512x512' } = params;
    
    console.log('🎨 Agentic image generation request:', { prompt, style, size });
    console.log('🔍 About to call handleImageGeneration...');
    
    const imageResult = await handleImageGeneration({ prompt, size }, process.env.Neuraplay);
    
    console.log('🔍 handleImageGeneration returned:', {
      success: !!imageResult,
      hasImageUrl: !!(imageResult?.image_url),
      imageUrlType: typeof imageResult?.image_url,
      imageUrlLength: imageResult?.image_url?.length || 0,
      imageUrlStartsWith: imageResult?.image_url?.substring(0, 30) + '...',
      hasContentType: !!(imageResult?.contentType),
      contentType: imageResult?.contentType
    });
    
    const finalResult = {
      success: true,
      message: `🎨 I've created a beautiful ${style} image for you: "${prompt}"`,
      data: { 
        image_url: imageResult.image_url,
        prompt,
        style,
        size
      }
    };
    
    console.log('🔍 Final tool result structure:', {
      success: finalResult.success,
      messageLength: finalResult.message?.length || 0,
      hasData: !!finalResult.data,
      dataKeys: finalResult.data ? Object.keys(finalResult.data) : [],
      dataImageUrlExists: !!(finalResult.data?.image_url),
      dataImageUrlLength: finalResult.data?.image_url?.length || 0
    });
    
    console.log('🔍 IMAGE GENERATION TOOL EXECUTION COMPLETED SUCCESSFULLY');
    return finalResult;
    
  } catch (error) {
    console.error('🔍 IMAGE GENERATION TOOL EXECUTION FAILED');
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    const errorResult = {
      success: false,
      message: `Sorry, I couldn't generate that image: ${error.message}`
    };
    
    console.log('🔍 Error result structure:', errorResult);
    return errorResult;
  }
}

module.exports = {
  tools,
  TOOL_ROUTING_CONFIG,
  SERVER_SIDE_TOOLS,
  executeTool,
  performWebSearch,
  getWeatherData,
  handleImageGenerationTool
};
