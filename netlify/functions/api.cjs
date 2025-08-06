// Use built-in fetch (available in Node 18+)

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
  }
];

// Tool execution functions
async function executeTool(toolCall) {
  const { name, arguments: args } = toolCall;
  const parsedArgs = JSON.parse(args);
  
  console.log(`Executing tool: ${name} with args:`, parsedArgs);
  
  switch (name) {
    case 'navigate_to_page':
      return {
        success: true,
        message: `Navigating to ${parsedArgs.page} page`,
        data: { page: parsedArgs.page, reason: parsedArgs.reason }
      };
      
    case 'update_settings':
      return {
        success: true,
        message: `Updated ${parsedArgs.setting} to ${parsedArgs.value}`,
        data: { setting: parsedArgs.setting, value: parsedArgs.value }
      };
      
    case 'recommend_game':
      return {
        success: true,
        message: `Recommended games for ${parsedArgs.topic}`,
        data: { topic: parsedArgs.topic, age_group: parsedArgs.age_group, difficulty: parsedArgs.difficulty }
      };
      
    case 'web_search':
      return await performWebSearch(parsedArgs.query);
      
    case 'get_weather':
      return await getWeatherData(parsedArgs.location);
      
    case 'accessibility_support':
      return {
        success: true,
        message: `Applied ${parsedArgs.type} accessibility support`,
        data: { type: parsedArgs.type, subtype: parsedArgs.subtype }
      };
      
    default:
      return {
        success: false,
        message: `Unknown tool: ${name}`
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

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      // Add timeout to prevent 504 errors - increased timeout for image generation
      const controller = new AbortController();
      const timeout = url.includes('images/generations') ? 60000 : 30000; // 60s for images, 30s for others
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      console.log(`Making request to ${url} with ${timeout}ms timeout (attempt ${i + 1}/${retries})`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 429 && i < retries - 1) {
        console.log(`Rate limited, retrying in ${delay * Math.pow(2, i)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }
      
      if (response.status === 504 && i < retries - 1) {
        console.log(`Gateway timeout (504), retrying in ${delay * Math.pow(2, i)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }
      
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request timeout on attempt ${i + 1}`);
        if (i === retries - 1) {
          throw new Error('Request timeout after all retries');
        }
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { task_type, input_data } = JSON.parse(event.body);
    
    console.log('Task type:', task_type);
    console.log('Input data:', input_data);

    // Get environment variables
    const TOGETHER_TOKEN = process.env.together_token;
    const HF_TOKEN = process.env.hf_token;

    console.log('Together token exists:', !!TOGETHER_TOKEN);
    console.log('HF token exists:', !!HF_TOKEN);
    console.log('Together token length:', TOGETHER_TOKEN ? TOGETHER_TOKEN.length : 0);

         // Handle different task types
     switch (task_type) {
       case 'test':
         return await handleTestGeneration(TOGETHER_TOKEN);
      case 'summarization':
      case 'text':
      case 'chat':
      case 'conversation':
      case 'story':
      case 'report':
        console.log(`Processing ${task_type} request`);
        return await handleTextGeneration(input_data, TOGETHER_TOKEN);
      
      case 'image':
        return await handleImageGeneration(input_data, TOGETHER_TOKEN);
      
      case 'voice':
        return await handleVoiceGeneration(input_data, HF_TOKEN);
      
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Invalid task_type. Supported types: summarization, text, chat, conversation, story, report, image, voice' 
          })
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

async function handleTextGeneration(input_data, token) {
  if (!token) {
    console.log('No Together AI token provided, using fallback response');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: "Hello! I'm Synapse, your AI learning assistant! 🌟 I'm here to help you with your educational journey. What would you like to learn about today? We could explore numbers, science, or play some brain games together! ✨" 
      }])
    };
  }

  try {
    // Prepare chat messages
    let messages;
    let userInput = '';
    if (typeof input_data === 'object' && input_data.messages) {
      messages = input_data.messages;
      // Ensure the first message is always the Synapse system prompt
      if (messages.length > 0 && messages[0].role !== 'system') {
        messages.unshift({
          role: 'system',
          content: 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed. You have access to tools for navigation, settings, game recommendations, web search, weather, and accessibility support. Use these tools when appropriate to help users.'
        });
      } else if (messages.length === 0 || messages[0].role === 'system') {
        // Update existing system message to ensure Synapse identity
        if (messages.length > 0 && messages[0].role === 'system') {
          messages[0].content = 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed. You have access to tools for navigation, settings, game recommendations, web search, weather, and accessibility support. Use these tools when appropriate to help users.';
        }
      }
      userInput = input_data.messages[input_data.messages.length - 1]?.content || '';
    } else {
      userInput = input_data;
      messages = [
        { role: 'system', content: 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed. You have access to tools for navigation, settings, game recommendations, web search, weather, and accessibility support. Use these tools when appropriate to help users.' },
        { role: 'user', content: input_data }
      ];
    }

    // Check for inappropriate language
    const inappropriateWords = [
      'fuck', 'shit', 'damn', 'bitch', 'ass', 'piss', 'crap', 'hell', 'dick', 'cock', 'pussy', 'vagina', 'penis',
      'bastard', 'whore', 'slut', 'fucker', 'motherfucker', 'fucking', 'shitty', 'damned', 'goddamn',
      'kill', 'murder', 'suicide', 'death', 'die', 'dead', 'blood', 'gore', 'violence', 'weapon', 'gun', 'knife',
      'drug', 'alcohol', 'beer', 'wine', 'drunk', 'high', 'stoned', 'cocaine', 'heroin', 'marijuana',
      'sex', 'sexual', 'nude', 'naked', 'porn', 'pornography', 'adult', 'explicit'
    ];

    const userInputLower = userInput.toLowerCase();
    const containsInappropriateLanguage = inappropriateWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(userInputLower);
    });

    if (containsInappropriateLanguage) {
      console.log('Inappropriate language detected, redirecting to learning focus');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ 
          generated_text: "I understand you might be frustrated, but let's keep our conversation focused on learning! 🌟 I'm here to help you discover amazing things and have fun while learning. What would you like to explore today? Maybe we could learn about numbers, letters, or play some brain games together! ✨" 
        }])
      };
    }

    // NEW GPT-OSS TOOL CALLING SYSTEM
    console.log('Making initial call to GPT-OSS with tools...');
    
    // Step 1: Initial call to GPT-OSS with tools
    const initialResponse = await fetchWithRetry('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const initialData = await initialResponse.json();
    console.log('Initial response finish_reason:', initialData.choices[0].finish_reason);

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
      messages.push({
        role: 'assistant',
        tool_calls: toolCalls
      });

      // Add tool results to messages
      messages.push(...toolResults);

      // Step 3: Final call to GPT-OSS with tool results
      console.log('Making final call with tool results...');
      
      const finalResponse = await fetchWithRetry('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const finalData = await finalResponse.json();
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          generated_text: finalData.choices[0].message.content,
          tool_calls: toolCalls,
          tool_results: toolResults
        }])
      };
    } else {
      // No tool calls, return direct response
      console.log('No tool calls, returning direct response');
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          generated_text: initialData.choices[0].message.content
        }])
      };
    }

  } catch (error) {
    console.error('Text generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        generated_text: "I'm having trouble connecting right now, but I'm here to help! 🌟 Let's try again in a moment. What would you like to learn about today? ✨"
      }])
    };
  }
}

async function handleImageGeneration(input_data, token) {
  const prompt = (typeof input_data === 'object' && input_data.prompt) ? input_data.prompt : String(input_data);

  console.log('Starting image generation with token:', !!token);
  console.log('Received input data for image generation:', JSON.stringify(input_data));
  console.log('Extracted prompt for image generation:', prompt);
  
  if (!token) {
    console.log('No token provided, returning placeholder');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        error: 'No API token configured'
      })
    };
  }

  try {
    // Enhance the prompt for better results
    let enhancedPrompt = prompt;
    if (enhancedPrompt && !enhancedPrompt.includes('high quality') && !enhancedPrompt.includes('detailed')) {
      enhancedPrompt = `${enhancedPrompt}, high quality, detailed, 4k`;
    }

    console.log('Image generation prompt:', enhancedPrompt);
    console.log('Using token length:', token.length);

    // Try multiple models for better reliability, with faster models first
    const models = [
      'black-forest-labs/FLUX.1-schnell-Free',
      'stability-ai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5',
      'CompVis/stable-diffusion-v1-4'
    ];

    let lastError = null;
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        // Use different parameters for faster models
        const isFastModel = model.includes('schnell') || model.includes('flux');
        const steps = isFastModel ? 4 : 20;
        const width = 512;
        const height = 512;
        
        const response = await fetchWithRetry('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            prompt: enhancedPrompt,
            n: 1,
            width: width,
            height: height,
            steps: steps,
            response_format: 'b64_json'
          })
        });

        console.log(`Model ${model} response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model ${model} error:`, errorText);
          
          // Handle specific error cases
          if (response.status === 504) {
            lastError = new Error(`Model ${model} timed out (504) - server overloaded`);
          } else if (response.status === 429) {
            lastError = new Error(`Model ${model} rate limited (429) - too many requests`);
          } else {
            lastError = new Error(`Model ${model} failed: ${response.status} - ${errorText}`);
          }
          continue; // Try next model
        }

        const result = await response.json();
        console.log(`Model ${model} response:`, JSON.stringify(result, null, 2));
        console.log('Response has data property:', !!result.data);
        console.log('Response data is array:', Array.isArray(result.data));
        console.log('Response data length:', result.data ? result.data.length : 'no data');

        if (result.data && result.data[0] && result.data[0].b64_json) {
          const base64 = result.data[0].b64_json;
          console.log('Base64 image length:', base64.length);
          console.log('Base64 starts with:', base64.substring(0, 50));

          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: base64,
              contentType: 'image/png'
            })
          };
        } else {
          console.error(`Model ${model} unexpected response format:`, result);
          console.error('Result keys:', Object.keys(result));
          if (result.data) {
            console.error('Data structure:', typeof result.data, Array.isArray(result.data));
            if (Array.isArray(result.data) && result.data.length > 0) {
              console.error('First data item keys:', Object.keys(result.data[0]));
            }
          }
          lastError = new Error(`Model ${model} unexpected response format: ${JSON.stringify(result)}`);
          continue; // Try next model
        }
      } catch (error) {
        console.error(`Model ${model} failed:`, error);
        lastError = error;
        continue; // Try next model
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All image generation models failed');
  } catch (error) {
    console.error('Image generation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tokenExists: !!token,
      tokenLength: token ? token.length : 0
    });
    
    // Generate a simple fallback image - a colored circle with the prompt text
    console.log('Generating fallback image...');
    const fallbackImage = generateFallbackImage(prompt);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: fallbackImage,
        contentType: 'image/png',
        error: error.message,
        fallback: true
      })
    };
  }
}

// Generate a simple fallback image
function generateFallbackImage(prompt) {
  // Create a simple SVG that we'll convert to base64
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)"/>
      <circle cx="256" cy="256" r="150" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="4"/>
      <text x="256" y="280" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${prompt.substring(0, 20)}</text>
    </svg>
  `;
  
  // Convert SVG to base64
  const base64 = Buffer.from(svg).toString('base64');
  return base64;
}

async function handleVoiceGeneration(text, token) {
  console.log('Voice generation requested for text:', text.substring(0, 50) + '...');
  
  // Get ElevenLabs API key - try multiple possible environment variable names
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY || 
                        process.env.elven_labs_api_key ||
                        process.env.VITE_ELVEN_LABS_API_KEY;
  console.log('ElevenLabs API key exists:', !!elevenLabsKey);
  
  if (!elevenLabsKey) {
    console.log('No ElevenLabs API key provided, returning fallback response');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'No ElevenLabs API key configured',
        useBrowserTTS: true,
        text: text
      })
    };
  }

  try {
    console.log('Generating voice for text:', text.substring(0, 50) + '...');
    
    // Clean the text for TTS (remove markdown, emojis, etc.)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/[🎮🌟✨🔍🔢🔤🎯🧩🏔️🏗️🚗📚🌳🚦]/g, '') // Remove emojis
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .trim();

    console.log('Cleaned text for TTS:', cleanText.substring(0, 100) + '...');

    // Use ElevenLabs TTS with specific voice
    console.log('Trying ElevenLabs TTS with voice ID: 8LVfoRdkh4zgjr8v5ObE');
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/8LVfoRdkh4zgjr8v5ObE`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      console.log('ElevenLabs Response status:', response.status);
      console.log('ElevenLabs Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        console.log('Voice generation successful, audio length:', base64.length);

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: base64,
            contentType: 'audio/mpeg'
          })
        };
      } else {
        const errorText = await response.text();
        console.error('ElevenLabs TTS error:', response.status, errorText);
        throw new Error(`ElevenLabs TTS error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Hugging Face TTS failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Voice generation error:', error);
    
    // Return error with fallback option
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        useBrowserTTS: true,
        text: text
      })
    };
  }
}

async function handleTestGeneration(token) {
   if (!token) {
     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ 
         error: 'No Together AI token configured'
       })
     };
   }

   try {
     console.log('Testing Together AI image generation...');
     
     // Test with the same models as the main image generation
     const models = [
       'black-forest-labs/FLUX.1-schnell-Free',
       'black-forest-labs/FLUX.1-schnell',
       'runwayml/stable-diffusion-v1-5'
     ];

     let lastError = null;
     
     for (const model of models) {
       try {
         console.log(`Testing model: ${model}`);
         
                  const response = await fetchWithRetry('https://api.together.xyz/v1/images/generations', {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             model: model,
             prompt: 'A simple red circle on white background',
             n: 1,
             width: 512,
             height: 512,
             steps: 4,
             response_format: 'b64_json'
           })
         });

         console.log(`Test model ${model} response status:`, response.status);

         if (!response.ok) {
           const errorText = await response.text();
           console.error(`Test model ${model} error:`, errorText);
           lastError = new Error(`Test model ${model} failed: ${response.status} - ${errorText}`);
           continue; // Try next model
         }

         const result = await response.json();
         console.log(`Test model ${model} response:`, JSON.stringify(result, null, 2));

         if (result.data && result.data[0] && result.data[0].b64_json) {
           return {
             statusCode: 200,
             headers: {
               'Access-Control-Allow-Origin': '*',
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({ 
               success: true,
               message: `API test successful with model ${model}`,
               response: result
             })
           };
         } else {
           console.error(`Test model ${model} unexpected response format:`, result);
           lastError = new Error(`Test model ${model} unexpected response format: ${JSON.stringify(result)}`);
           continue; // Try next model
         }
       } catch (error) {
         console.error(`Test model ${model} failed:`, error);
         lastError = error;
         continue; // Try next model
       }
     }

     // If all test models failed, return error
     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ 
         error: `All test models failed: ${lastError?.message || 'Unknown error'}`
       })
     };
   } catch (error) {
     console.error('Test generation error:', error);
     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ 
         error: `Test failed: ${error.message}`
       })
     };
   }
 }