// Use built-in fetch (available in Node 18+)

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
          content: 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed.'
        });
      } else if (messages.length === 0 || messages[0].role === 'system') {
        // Update existing system message to ensure Synapse identity
        if (messages.length > 0 && messages[0].role === 'system') {
          messages[0].content = 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed.';
        }
      }
      userInput = input_data.messages[input_data.messages.length - 1]?.content || '';
    } else {
      userInput = input_data;
      messages = [
        { role: 'system', content: 'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors. Be creative, engaging, and vary your responses. Ask follow-up questions to encourage learning and exploration. When appropriate, suggest educational games or activities from NeuraPlay that relate to the topic being discussed.' },
        { role: 'user', content: input_data }
      ];
    }

    // Step 1: Check user input for inappropriate language (more precise matching)
    const inappropriateWords = [
      'fuck', 'shit', 'damn', 'bitch', 'ass', 'piss', 'crap', 'hell', 'dick', 'cock', 'pussy', 'vagina', 'penis',
      'bastard', 'whore', 'slut', 'fucker', 'motherfucker', 'fucking', 'shitty', 'damned', 'goddamn',
      'kill', 'murder', 'suicide', 'death', 'die', 'dead', 'blood', 'gore', 'violence', 'weapon', 'gun', 'knife',
      'drug', 'alcohol', 'beer', 'wine', 'drunk', 'high', 'stoned', 'cocaine', 'heroin', 'marijuana',
      'sex', 'sexual', 'nude', 'naked', 'porn', 'pornography', 'adult', 'explicit'
    ];

    const userInputLower = userInput.toLowerCase();
    // More precise matching - check for word boundaries to avoid false positives
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

    // Step 2: Comprehensive game recognition system
    const neuraplayGames = {
      // Memory Games
      'memory galaxy': {
        name: 'Memory Galaxy',
        aliases: ['memory', 'galaxy', 'memory game', 'galaxy game', 'sequence game'],
        description: '🌟 **Memory Galaxy** helps your brain remember sequences and patterns - like a workout for your memory muscles! It teaches you to hold information in your mind and recall it when needed.',
        skills: 'Working Memory, Sequential Processing',
        age: '6-12 years',
        category: 'Memory'
      },
      'starbloom': {
        name: 'Starbloom Forest Adventure',
        aliases: ['starbloom', 'forest', 'adventure', 'starbloom game', 'forest game', 'adventure game'],
        description: '🌳 **Starbloom Forest Adventure** is a magical journey that helps you remember patterns and make good choices! It builds your memory and decision-making skills.',
        skills: 'Working Memory, Decision Making',
        age: '6-12 years',
        category: 'Memory'
      },
      // Focus Games
      'inhibition': {
        name: 'Stop & Go Adventure',
        aliases: ['stop go', 'stop and go', 'inhibition', 'stop go adventure', 'stop and go adventure', 'inhibition game'],
        description: '🚦 **Stop & Go Adventure** teaches you to control your impulses and focus! It helps you resist the urge to act quickly and think before you respond.',
        skills: 'Inhibitory Control, Attention',
        age: '7-14 years',
        category: 'Focus'
      },
      'berry blaster': {
        name: 'Berry Blaster',
        aliases: ['berry', 'blaster', 'berry blaster game', 'shooting game', 'target game'],
        description: '🎯 **Berry Blaster** improves your focus and hand-eye coordination while having fun! It helps you aim accurately and react quickly.',
        skills: 'Focus, Hand-Eye Coordination',
        age: '8-15 years',
        category: 'Focus'
      },
      // Logic Games
      'pattern detective': {
        name: 'Pattern Detective',
        aliases: ['pattern', 'detective', 'pattern detective game', 'pattern game', 'detective game'],
        description: '🔍 **Pattern Detective** makes you a master at finding patterns and solving puzzles! It helps you recognize sequences and predict what comes next.',
        skills: 'Pattern Recognition, Logic',
        age: '9-16 years',
        category: 'Logic'
      },
      'number quest': {
        name: 'Number Quest',
        aliases: ['number', 'quest', 'number quest game', 'counting game', 'math game'],
        description: '🔢 **Number Quest** makes math fun with counting adventures! It helps you recognize numbers and understand basic math concepts.',
        skills: 'Number Recognition, Counting',
        age: '5-10 years',
        category: 'Logic'
      },
      'fuzzling': {
        name: 'Fuzzling Games',
        aliases: ['fuzzling', 'puzzle', 'fuzzling game', 'puzzle game', 'advanced puzzle'],
        description: '🧩 **Fuzzling Games** are advanced puzzles that make you think creatively and logically! They help you solve complex problems step by step.',
        skills: 'Problem Solving, Logic',
        age: '10-16 years',
        category: 'Logic'
      },
      // Language Games
      'letter safari': {
        name: 'Letter Safari',
        aliases: ['letter', 'safari', 'letter safari game', 'letter game', 'reading game'],
        description: '🔤 **Letter Safari** helps you learn letters and reading in a jungle adventure! It improves your letter recognition and reading skills.',
        skills: 'Letter Recognition, Reading',
        age: '4-8 years',
        category: 'Language'
      },
      // Motor Skills Games
      'mountain climber': {
        name: 'Mountain Climber',
        aliases: ['mountain', 'climber', 'mountain climber game', 'climbing game', 'coordination game'],
        description: '🏔️ **Mountain Climber** builds coordination and motor skills through climbing challenges! It helps you control your movements precisely.',
        skills: 'Motor Coordination, Balance',
        age: '6-12 years',
        category: 'Motor Skills'
      },
      'stacker': {
        name: 'Block Stacker',
        aliases: ['stacker', 'block', 'stacker game', 'block game', 'stacking game'],
        description: '🏗️ **Block Stacker** helps you build towers with perfect timing! It develops your motor skills and spatial awareness.',
        skills: 'Motor Skills, Spatial Awareness',
        age: '5-10 years',
        category: 'Motor Skills'
      },
      // Creativity Games
      'happy builder': {
        name: 'Happy Builder',
        aliases: ['happy', 'builder', 'happy builder game', 'building game', 'creative game'],
        description: '🏗️ **Happy Builder** lets you create and build whatever you imagine! It develops your creativity and spatial thinking skills.',
        skills: 'Creativity, Spatial Reasoning',
        age: '6-12 years',
        category: 'Creativity'
      },
      'ai story creator': {
        name: 'AI Story Creator',
        aliases: ['story', 'creator', 'ai story', 'story creator', 'story game', 'ai game'],
        description: '📚 **AI Story Creator** helps you create magical stories with AI help! It develops your imagination and language skills.',
        skills: 'Creativity, Language Development',
        age: '6-14 years',
        category: 'Creativity'
      },
      // Logic Games
      'crossroad fun': {
        name: 'Crossroad Fun',
        aliases: ['crossroad', 'crossroad fun', 'crossroad game', 'road game', 'traffic game', 'crossing game'],
        description: '🚗 **Crossroad Fun** teaches planning and attention while crossing roads safely! It helps you think ahead and make safe decisions.',
        skills: 'Planning, Attention',
        age: '7-14 years',
        category: 'Logic'
      }
    };

    // Advanced game recognition with aliases
    let recognizedGame = null;
    for (const [key, game] of Object.entries(neuraplayGames)) {
      // Check main key
      if (userInputLower.includes(key)) {
        recognizedGame = game;
        break;
      }
      // Check aliases
      for (const alias of game.aliases) {
        if (userInputLower.includes(alias)) {
          recognizedGame = game;
          break;
        }
      }
      if (recognizedGame) break;
    }

    if (recognizedGame) {
      const gameResponse = `${recognizedGame.description}\n\n**Skills it helps:** ${recognizedGame.skills}\n**Best for ages:** ${recognizedGame.age}\n\nWould you like to try this game? 🌟`;
      
      console.log(`Game recognized: ${recognizedGame.name}`);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ 
          generated_text: gameResponse
        }])
      };
    }

    // Step 2.5: Check if user is asking for game recommendations
    const recommendationKeywords = [
      'what games', 'which games', 'games to play', 'recommend', 'suggestion', 
      'what should i play', 'what can i play', 'show me games', 'game options',
      'que juegos', 'que juegos hay', 'recomienda', 'sugerencia', 'que puedo jugar',
      'quels jeux', 'quels jeux y a-t-il', 'recommandation', 'suggestion', 'que puis-je jouer',
      'welche spiele', 'welche spiele gibt es', 'empfehlung', 'vorschlag', 'was kann ich spielen'
    ];

    const isAskingForRecommendations = recommendationKeywords.some(keyword => 
      userInputLower.includes(keyword)
    );

    if (isAskingForRecommendations) {
      // Get user's played games from the conversation context or default
      let userPlayedGames = [];
      if (typeof input_data === 'object' && input_data.messages) {
        // Try to extract user info from conversation context
        const userMessages = input_data.messages.filter(msg => msg.role === 'user');
        // This is a simplified approach - in a real implementation, you'd get this from user profile
        userPlayedGames = ['memory galaxy', 'berry blaster']; // Default for demo
      }

      // Get user's age for age-appropriate recommendations
      let userAge = 8; // Default age
      
      // Filter games by age appropriateness and not recently played
      const ageAppropriateGames = Object.entries(neuraplayGames).filter(([key, game]) => {
        const ageRange = game.age.split('-');
        const minAge = parseInt(ageRange[0]);
        const maxAge = parseInt(ageRange[1]);
        return userAge >= minAge && userAge <= maxAge && !userPlayedGames.includes(key);
      });

      // Select 1-2 games to recommend
      const recommendedGames = ageAppropriateGames.slice(0, 2);
      
      if (recommendedGames.length > 0) {
        let recommendationResponse = "🎮 Here are some great games for you to try:\n\n";
        
        recommendedGames.forEach(([key, game], index) => {
          recommendationResponse += `${index + 1}. **${game.name}** - ${game.description}\n\n`;
        });
        
        recommendationResponse += "These games are perfect for your age and will help you learn new skills! 🌟";
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{ 
            generated_text: recommendationResponse
          }])
        };
      } else {
        // Fallback if no age-appropriate games found
        const fallbackGames = Object.entries(neuraplayGames).slice(0, 2);
        let fallbackResponse = "🎮 Here are some fun games you might enjoy:\n\n";
        
        fallbackGames.forEach(([key, game], index) => {
          fallbackResponse += `${index + 1}. **${game.name}** - ${game.description}\n\n`;
        });
        
        fallbackResponse += "Try these games and see which ones you like best! 🌟";
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{ 
            generated_text: fallbackResponse
          }])
        };
      }
    }

    // Step 3: Generate response with conversational model
    console.log('Using model: Qwen/Qwen3-235B-A22B-Instruct-2507-tput');
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
        messages: messages,
        max_tokens: 100, // Reduced by 50% from 200
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`Together AI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Together AI text result:', result);

    const assistantResponse = result.choices?.[0]?.message?.content || "I'm here to help with your learning journey!";

    // Step 4: Check response safety with Llama Guard
    const safetyCheck = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-Guard-4-12B',
        messages: [
          { 
            role: 'user', 
            content: `Please classify this response for a children's learning platform as either "safe" or "unsafe": ${assistantResponse}` 
          }
        ],
        max_tokens: 5, // Reduced from 10
        temperature: 0.1
      })
    });

    if (safetyCheck.ok) {
      const safetyResult = await safetyCheck.json();
      const safetyClassification = safetyResult.choices?.[0]?.message?.content?.toLowerCase() || '';
      
      console.log('Safety classification:', safetyClassification);
      
      // If unsafe, return a safe alternative
      if (safetyClassification.includes('unsafe')) {
        console.log('Content flagged as unsafe, returning safe alternative');
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{ 
            generated_text: "I'm here to help you learn! Let's explore something fun and educational together. 🌟✨" 
          }])
        };
      }
    }

    // Step 5: Return the safe response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: assistantResponse
      }])
    };
  } catch (error) {
    console.error('Text generation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tokenExists: !!token,
      tokenLength: token ? token.length : 0
    });
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: "I'm here to help with your learning journey! Please try again in a moment. 🌟" 
      }])
    };
  }
}

async function handleImageGeneration(prompt, token) {
  console.log('Starting image generation with token:', !!token);
  console.log('Prompt:', prompt);
  
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
    if (!enhancedPrompt.includes('high quality') && !enhancedPrompt.includes('detailed')) {
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
  
  // Get ElevenLabs API key
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
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