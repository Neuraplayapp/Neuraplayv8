// Use built-in fetch (available in Node 18+)

exports.handler = async (event, context) => {
  // Handle CORS preflight
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { task_type, input_data } = JSON.parse(event.body);
    
    if (!task_type || !input_data) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing task_type or input_data' })
      };
    }

    // Model configuration for different task types
    let modelId;
    let apiUrl;
    let modelType = 'gpt'; // Default model type for response processing
    
    switch (task_type) {
      case 'summarization':
      case 'text':
      case 'chat':
      case 'conversation':
      case 'story':
      case 'report':
        // Use Llama 3 8B Chat from TogetherAI for text tasks
        modelId = 'meta-llama/Llama-3-8b-chat-hf';
        modelType = 'together';
        apiUrl = 'https://api.together.xyz/v1/chat/completions';
        break;
      case 'image':
        modelId = 'black-forest-labs/FLUX.1-schnell-Free';
        modelType = 'together';
        apiUrl = 'https://api.together.xyz/v1/images/generations';
        break;
      case 'voice':
        modelId = 'facebook/fastspeech2-en-ljspeech';
        modelType = 'tts';
        apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;
        break;
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid task_type. Supported types: summarization, text, chat, conversation, story, report, image, voice' })
        };
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    const TOGETHER_TOKEN = process.env.together_token;
    
    // Use TogetherAI token for text and image tasks, HF token for voice
    const tokenToUse = (task_type === 'summarization' || task_type === 'text' || task_type === 'chat' || task_type === 'conversation' || task_type === 'story' || task_type === 'report' || task_type === 'image') 
      ? TOGETHER_TOKEN 
      : HF_TOKEN;
    
    console.log('Token check:', tokenToUse ? 'Token exists' : 'No token found');
    console.log('Token length:', tokenToUse ? tokenToUse.length : 0);
    console.log('Using token for:', task_type, 'Token type:', (task_type === 'summarization' || task_type === 'text' || task_type === 'chat' || task_type === 'conversation' || task_type === 'story' || task_type === 'report' || task_type === 'image') ? 'TogetherAI' : 'HuggingFace');
    
    if (!tokenToUse || tokenToUse === 'your_token_here' || tokenToUse.length < 1) {
      // Return a fallback response instead of an error
      if (task_type === 'summarization' || task_type === 'text' || task_type === 'chat' || task_type === 'conversation' || task_type === 'story' || task_type === 'report') {
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
      } else if (task_type === 'image') {
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
      } else if (task_type === 'voice') {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            contentType: 'audio/wav'
          })
        };
      }
    }
    
    // Prepare request body based on task type and model
    let requestBody;
    if (task_type === 'summarization' || task_type === 'text' || task_type === 'chat' || task_type === 'conversation' || task_type === 'story' || task_type === 'report') {
      // Llama 3.1 uses chat format
      let chatInput;
      
      if (typeof input_data === 'object' && input_data.messages) {
        // Frontend sent chat format
        chatInput = input_data.messages;
      } else if (typeof input_data === 'object' && input_data.past_user_inputs) {
        // Convert DialoGPT format to Llama chat format
        const messages = [];
        for (let i = 0; i < input_data.past_user_inputs.length; i++) {
          messages.push({ role: 'user', content: input_data.past_user_inputs[i] });
          if (input_data.generated_responses[i]) {
            messages.push({ role: 'assistant', content: input_data.generated_responses[i] });
          }
        }
        messages.push({ role: 'user', content: input_data.text });
        chatInput = messages;
      } else {
        // Simple string input - create basic chat format
        chatInput = [
          { role: 'system', content: 'You are a helpful AI learning assistant for children. Provide educational guidance, explain concepts clearly, and be encouraging and supportive.' },
          { role: 'user', content: input_data }
        ];
      }
      
      requestBody = JSON.stringify({
        model: modelId,
        messages: chatInput,
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });
    } else if (task_type === 'image') {
      // Enhanced prompt for better image generation
      let enhancedPrompt = input_data;
      
      // Add quality enhancements for better results
      if (!enhancedPrompt.includes('high quality') && !enhancedPrompt.includes('detailed')) {
        enhancedPrompt = `${enhancedPrompt}, high quality, detailed, 4k`;
      }
      
      // Special handling for common requests
      if (enhancedPrompt.toLowerCase().includes('make an image') || enhancedPrompt.toLowerCase().includes('generate')) {
        enhancedPrompt = 'a beautiful colorful illustration, high quality, detailed, 4k';
      }
      
      console.log('Image generation prompt:', enhancedPrompt);
      
      requestBody = JSON.stringify({
        model: modelId,
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024"
      });
      
      console.log('Image generation request body:', requestBody);
    } else if (task_type === 'voice') {
      requestBody = JSON.stringify({
        inputs: input_data,
        options: {
          wait_for_model: true,
          use_cache: false
        }
      });
    }
    
    console.log(`Making request to: ${apiUrl}`);
    console.log(`Using model: ${modelId}`);
    console.log(`Request body: ${requestBody}`);
    
    // Add timeout to avoid Netlify 10-second limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500); // 9.5 second timeout for image generation
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Neuraplay/1.0'
      },
      body: requestBody,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      
      if (response.status === 503) {
        try {
          const errorData = JSON.parse(errorText);
          return {
            statusCode: 503,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              error: 'Model is loading, please try again in a few moments',
              estimated_time: errorData.estimated_time || 20
            })
          };
        } catch (e) {
          return {
            statusCode: 503,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              error: 'Model is loading, please try again in a few moments'
            })
          };
        }
      }
      
      if (response.status === 404) {
        // Handle model not found errors gracefully
        console.error('Model not found:', modelId);
        if (task_type === 'summarization' || task_type === 'text' || task_type === 'chat' || task_type === 'conversation' || task_type === 'story' || task_type === 'report') {
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
        } else if (task_type === 'image') {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              contentType: 'image/png'
            })
          };
        } else if (task_type === 'voice') {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              contentType: 'audio/wav'
            })
          };
        }
      }
      
      if (response.status === 401) {
        // Handle authentication errors gracefully
        if (task_type === 'summarization' || task_type === 'text' || task_type === 'chat' || task_type === 'conversation' || task_type === 'story' || task_type === 'report') {
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
        } else if (task_type === 'image') {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              contentType: 'image/png'
            })
          };
        } else if (task_type === 'voice') {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              contentType: 'audio/wav'
            })
          };
        }
      }
      
      if (response.status === 429) {
        return {
          statusCode: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Rate limit exceeded, please try again later'
          })
        };
      }
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `API error: ${response.status} - ${errorText}`,
          details: errorText
        })
      };
    }

    // Handle different response types with model-specific processing
    if (task_type === 'summarization' || task_type === 'text' || task_type === 'chat' || task_type === 'conversation' || task_type === 'story' || task_type === 'report') {
      const result = await response.json();
      console.log('TogetherAI result:', result);
      
      // Helper function to extract assistant response from TogetherAI
      const extractAssistantResponse = (result) => {
        if (result && result.choices && result.choices[0] && result.choices[0].message) {
          return result.choices[0].message.content;
        } else if (Array.isArray(result) && result[0] && result[0].generated_text) {
          return result[0].generated_text;
        } else if (result && result.generated_text) {
          return result.generated_text;
        } else if (typeof result === 'string') {
          return result;
        } else {
          return "I'm here to help with your learning journey!";
        }
      };
      
      const assistantResponse = extractAssistantResponse(result);
      
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
      
    } else if (task_type === 'image') {
      try {
        console.log('Processing image generation response...');
        const result = await response.json();
        console.log('TogetherAI image result:', result);
        
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
          throw new Error('Invalid response format from TogetherAI');
        }
      } catch (error) {
        console.error('Image generation processing error:', error);
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
    } else if (task_type === 'voice') {
      try {
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
        // Return a silent audio file as fallback
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

  } catch (error) {
    console.error('Function error:', error);
    
    // Handle timeout specifically for image generation
    if (error.name === 'AbortError' && task_type === 'image') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          contentType: 'image/png',
          error: 'Image generation timed out. Please try again with a simpler prompt.'
        })
      };
    }
    
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