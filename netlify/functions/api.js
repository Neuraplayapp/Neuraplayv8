// Use built-in fetch (available in Node 18+)

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      console.log(`Rate limited, retrying in ${delay * Math.pow(2, i)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      continue;
    }
    return response;
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
    const HF_TOKEN = process.env.HF_TOKEN;

    console.log('Together token exists:', !!TOGETHER_TOKEN);
    console.log('HF token exists:', !!HF_TOKEN);

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
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: "Hello! I'm your AI learning assistant. I'm here to help you with your educational journey. What would you like to learn about today?" 
      }])
    };
  }

  try {
    // Prepare chat messages
    let messages;
    if (typeof input_data === 'object' && input_data.messages) {
      messages = input_data.messages;
    } else {
      messages = [
        { role: 'system', content: 'You are a helpful AI learning assistant for children. Provide educational guidance, explain concepts clearly, and be encouraging and supportive.' },
        { role: 'user', content: input_data }
      ];
    }

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-8b-chat-hf',
        messages: messages,
        max_tokens: 200,
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
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ 
        generated_text: "I'm here to help with your learning journey! Please try again in a moment." 
      }])
    };
  }
}

async function handleImageGeneration(prompt, token) {
  if (!token) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png'
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

     const response = await fetchWithRetry('https://api.together.xyz/v1/images/generations', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         model: 'black-forest-labs/FLUX.1-schnell-Free',
         prompt: enhancedPrompt,
         n: 1,
         width: 1024,
         height: 1024,
         steps: 4,
         response_format: 'b64_json'
       })
     });

         if (!response.ok) {
       const errorText = await response.text();
       console.error('Together AI image API error:', errorText);
       
       if (response.status === 429) {
         throw new Error('Rate limit exceeded. Please try again later.');
       } else if (response.status === 401) {
         throw new Error('Authentication failed. Please check your API token.');
       } else if (response.status === 400) {
         throw new Error(`Bad request: ${errorText}`);
       } else {
         throw new Error(`Together AI API error: ${response.status} - ${errorText}`);
       }
     }

         const result = await response.json();
     console.log('Full Together AI image response:', JSON.stringify(result, null, 2));

     if (result.data && result.data[0] && result.data[0].b64_json) {
       const base64 = result.data[0].b64_json;
       console.log('Base64 image length:', base64.length);

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
       console.error('Unexpected response format:', result);
       throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
     }
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        contentType: 'image/png'
      })
    };
  }
}

async function handleVoiceGeneration(text, token) {
  if (!token) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        contentType: 'audio/wav'
      })
    };
  }

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: base64,
        contentType: 'audio/wav'
      })
    };
  } catch (error) {
    console.error('Voice generation error:', error);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        contentType: 'audio/wav'
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
     
     const response = await fetchWithRetry('https://api.together.xyz/v1/images/generations', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         model: 'black-forest-labs/FLUX.1-schnell-Free',
         prompt: 'A simple red circle on white background',
         n: 1,
         width: 512,
         height: 512,
         steps: 4,
         response_format: 'b64_json'
       })
     });

     if (!response.ok) {
       const errorText = await response.text();
       console.error('Test API error:', errorText);
       return {
         statusCode: 200,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({ 
           error: `API test failed: ${response.status} - ${errorText}`
         })
       };
     }

     const result = await response.json();
     console.log('Test response:', JSON.stringify(result, null, 2));

     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ 
         success: true,
         message: 'API test successful',
         response: result
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