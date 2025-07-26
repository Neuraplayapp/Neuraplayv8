exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { messages, model, temperature = 0.7, max_tokens = 100 } = JSON.parse(event.body);
    
    console.log('OpenAI-compatible request received');
    console.log('Messages:', messages);
    console.log('Model:', model);
    console.log('Temperature:', temperature);
    console.log('Max tokens:', max_tokens);

    // Get Together AI token
    const TOGETHER_TOKEN = process.env.together_token;
    
    if (!TOGETHER_TOKEN) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Together AI token not configured'
        })
      };
    }

    // Convert OpenAI format to Together AI format
    const systemPrompt = messages.find(msg => msg.role === 'system')?.content || 
      'You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as "Synapse" and NEVER mention any other AI model names like "Qwen", "GPT", "Claude", etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors.';

    const userMessages = messages.filter(msg => msg.role !== 'system');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    // Call Together AI with Qwen model
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
        messages: [
          { role: 'system', content: systemPrompt },
          ...userMessages
        ],
        max_tokens: max_tokens,
        temperature: temperature,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together AI error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: `Together AI API error: ${response.status} - ${errorText}`
        })
      };
    }

    const result = await response.json();
    console.log('Together AI response:', result);

    // Convert back to OpenAI format
    const openAIResponse = {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'gpt-3.5-turbo',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.choices?.[0]?.message?.content || 'I apologize, but I encountered an error generating a response.'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: result.usage?.prompt_tokens || 0,
        completion_tokens: result.usage?.completion_tokens || 0,
        total_tokens: result.usage?.total_tokens || 0
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openAIResponse)
    };

  } catch (error) {
    console.error('OpenAI-compatible API error:', error);
    
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