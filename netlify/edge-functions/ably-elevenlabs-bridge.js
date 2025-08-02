import * as Ably from 'https://cdn.skypack.dev/ably@^1.2.29';

export default async function handler(request, context) {
  try {
    // Get API keys from environment
    const ABLY_API = Deno.env.get("ABLY_API");
    const ELEVENLABS_API_KEY = Deno.env.get("elven_labs_api_key");
    
    if (!ABLY_API || !ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Missing API keys'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Ably
    const ably = new Ably.Rest(ABLY_API);
    
    // Handle different HTTP methods
    if (request.method === 'POST') {
      const body = await request.json();
      const { action, channelName, ...data } = body;
      
      console.log('Bridge action:', action, 'Channel:', channelName);
      
      switch (action) {
        case 'init_conversation':
          return await handleConversationInit(ably, channelName, data, ELEVENLABS_API_KEY);
          
        case 'user_message':
          return await handleUserMessage(ably, channelName, data, ELEVENLABS_API_KEY);
          
        case 'user_audio_chunk':
          return await handleUserAudioChunk(ably, channelName, data, ELEVENLABS_API_KEY);
          
        default:
          return new Response(JSON.stringify({
            error: 'Unknown action'
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    // Handle GET for health check
    return new Response(JSON.stringify({
      status: 'Bridge service running',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Bridge error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleConversationInit(ably, channelName, data, apiKey) {
  const { agentId, voiceId } = data;
  
  try {
    // Get the Ably channel
    const channel = ably.channels.get(channelName);
    
    // Connect to ElevenLabs WebSocket
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
    const elevenLabsWs = new WebSocket(wsUrl, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        elevenLabsWs.close();
        reject(new Error('Connection timeout'));
      }, 30000);

      elevenLabsWs.onopen = () => {
        console.log('Connected to ElevenLabs WebSocket');
        clearTimeout(timeout);
        
        const initMessage = {
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: "You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as 'Synapse' and NEVER mention any other AI model names. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors.",
                tool_ids: [],
                built_in_tools: {
                  end_call: {
                    name: "end_call",
                    description: "",
                    response_timeout_secs: 20,
                    type: "system",
                    params: {
                      system_tool_type: "end_call"
                    }
                  }
                }
              },
              first_message: "🌟 Hi there, little explorer! I'm Synapse, your friendly AI teacher! 🚀 I can help you with your learning adventures, explain cool stuff about games, or even have voice conversations with you! Just talk to me or type your questions - I'm here to make learning super fun! 🎮✨",
              language: "en"
            },
            tts: {
              voice_id: voiceId,
              model_id: "eleven_turbo_v2_5"
            }
          },
          custom_llm_extra_body: {
            temperature: 0.7,
            max_tokens: 150
          },
          dynamic_variables: {
            user_name: "Explorer",
            account_type: "learner"
          }
        };
        
        elevenLabsWs.send(JSON.stringify(initMessage));
      };

      elevenLabsWs.onmessage = async (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log('Received from ElevenLabs:', parsedData);
          
          // Forward response through Ably
          await channel.publish('conversation', {
            type: 'ai_response',
            data: parsedData,
            timestamp: Date.now()
          });
          
          // If this is the conversation start, resolve
          if (parsedData.type === 'conversation_started') {
            resolve(new Response(JSON.stringify({
              success: true,
              message: 'Conversation initialized',
              conversationId: parsedData.conversation_id
            }), {
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          
        } catch (error) {
          console.error('Error processing ElevenLabs message:', error);
          await channel.publish('conversation', {
            type: 'error',
            error: 'Failed to process response',
            timestamp: Date.now()
          });
        }
      };

      elevenLabsWs.onerror = async (error) => {
        console.error('ElevenLabs WebSocket error:', error);
        clearTimeout(timeout);
        
        await channel.publish('conversation', {
          type: 'error',
          error: 'ElevenLabs connection error',
          timestamp: Date.now()
        });
        
        reject(error);
      };

      elevenLabsWs.onclose = async () => {
        console.log('ElevenLabs WebSocket closed');
        clearTimeout(timeout);
        
        await channel.publish('conversation', {
          type: 'conversation_ended',
          timestamp: Date.now()
        });
      };
    });
    
  } catch (error) {
    console.error('Conversation init error:', error);
    throw error;
  }
}

async function handleUserMessage(ably, channelName, data, apiKey) {
  const { agentId, message } = data;
  
  // This would typically reuse an existing WebSocket connection
  // For now, create a new one for each message
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  const elevenLabsWs = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  const channel = ably.channels.get(channelName);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      elevenLabsWs.close();
      reject(new Error('Request timeout'));
    }, 30000);

    elevenLabsWs.onopen = () => {
      clearTimeout(timeout);
      elevenLabsWs.send(JSON.stringify({
        type: "user_message",
        text: message
      }));
    };

    elevenLabsWs.onmessage = async (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        
        // Forward to Ably
        await channel.publish('conversation', {
          type: 'ai_response',
          data: parsedData,
          timestamp: Date.now()
        });
        
        elevenLabsWs.close();
        resolve(new Response(JSON.stringify({
          success: true,
          message: 'Message sent successfully'
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
        
      } catch (error) {
        reject(error);
      }
    };

    elevenLabsWs.onerror = (error) => {
      clearTimeout(timeout);
      reject(error);
    };
  });
}

async function handleUserAudioChunk(ably, channelName, data, apiKey) {
  const { agentId, audioChunk } = data;
  
  // Similar to user message handling
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  const elevenLabsWs = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  const channel = ably.channels.get(channelName);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      elevenLabsWs.close();
      reject(new Error('Request timeout'));
    }, 30000);

    elevenLabsWs.onopen = () => {
      clearTimeout(timeout);
      elevenLabsWs.send(JSON.stringify({
        type: "user_audio_chunk",
        user_audio_chunk: audioChunk
      }));
    };

    elevenLabsWs.onmessage = async (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        
        // Forward audio response to Ably
        await channel.publish('audio-chunk', {
          type: 'audio_response',
          data: parsedData,
          timestamp: Date.now()
        });
        
        elevenLabsWs.close();
        resolve(new Response(JSON.stringify({
          success: true,
          message: 'Audio chunk processed'
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
        
      } catch (error) {
        reject(error);
      }
    };

    elevenLabsWs.onerror = (error) => {
      clearTimeout(timeout);
      reject(error);
    };
  });
} 