import { WebSocket } from 'ws';

export default async function handler(request, context) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response("Request isn't trying to upgrade to WebSocket.", { 
      status: 400 
    });
  }

  // Get ElevenLabs API key
  const ELEVENLABS_API_KEY = process.env.elven_labs_api_key;
  
  if (!ELEVENLABS_API_KEY) {
    return new Response('ElevenLabs API key not configured', { 
      status: 500 
    });
  }

  // Create the WebSocket connection
  const { socket, response } = Deno.upgradeWebSocket(request);

  // Handle WebSocket events
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received WebSocket message:', message);

      const { type, data } = message;

      // Handle different message types
      switch (type) {
        case 'init_conversation':
          await handleConversationInit(socket, data, ELEVENLABS_API_KEY);
          break;
          
        case 'user_message':
          await handleUserMessage(socket, data, ELEVENLABS_API_KEY);
          break;
          
        case 'user_audio_chunk':
          await handleUserAudioChunk(socket, data, ELEVENLABS_API_KEY);
          break;
          
        case 'ping':
          await handlePing(socket, data, ELEVENLABS_API_KEY);
          break;
          
        default:
          socket.send(JSON.stringify({
            type: 'error',
            error: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Internal server error',
        details: error.message
      }));
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return response;
}

// Updated handler functions to work with WebSocket directly
async function handleConversationInit(socket, data, apiKey) {
  const { agentId, voiceId } = data;
  
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  const elevenLabsWs = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  elevenLabsWs.onopen = () => {
    console.log('Connected to ElevenLabs WebSocket');
    
    const initMessage = {
      type: "conversation_initiation_client_data",
      conversation_config_override: {
        agent: {
          prompt: {
            prompt: "You are Synapse, a friendly AI learning assistant for children. ALWAYS introduce yourself as 'Synapse' and NEVER mention any other AI model names like 'Qwen', 'GPT', 'Claude', etc. Provide educational guidance, explain concepts clearly, and be encouraging and supportive. Use child-friendly language with emojis and metaphors.",
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
              },
              language_detection: null,
              transfer_to_agent: null,
              transfer_to_number: null,
              skip_turn: null
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

  elevenLabsWs.onmessage = (event) => {
    try {
      const parsedData = JSON.parse(event.data);
      console.log('Received from ElevenLabs:', parsedData);
      
      // Forward the response to the client
      socket.send(JSON.stringify({
        type: 'elevenlabs_response',
        data: parsedData
      }));
    } catch (error) {
      console.error('Error parsing ElevenLabs message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Error parsing ElevenLabs response'
      }));
    }
  };

  elevenLabsWs.onerror = (error) => {
    console.error('ElevenLabs WebSocket error:', error);
    socket.send(JSON.stringify({
      type: 'error',
      error: 'ElevenLabs connection error'
    }));
  };
}

async function handleUserMessage(socket, data, apiKey) {
  const { agentId, message } = data;
  
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  const elevenLabsWs = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  elevenLabsWs.onopen = () => {
    elevenLabsWs.send(JSON.stringify({
      type: "user_message",
      text: message
    }));
  };

  elevenLabsWs.onmessage = (event) => {
    try {
      const parsedData = JSON.parse(event.data);
      socket.send(JSON.stringify({
        type: 'elevenlabs_response',
        data: parsedData
      }));
    } catch (error) {
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Error parsing response'
      }));
    }
  };
}

async function handleUserAudioChunk(socket, data, apiKey) {
  const { agentId, audioChunk } = data;
  
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  const elevenLabsWs = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  elevenLabsWs.onopen = () => {
    elevenLabsWs.send(JSON.stringify({
      type: "user_audio_chunk",
      user_audio_chunk: audioChunk
    }));
  };

  elevenLabsWs.onmessage = (event) => {
    try {
      const parsedData = JSON.parse(event.data);
      socket.send(JSON.stringify({
        type: 'elevenlabs_response',
        data: parsedData
      }));
    } catch (error) {
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Error parsing response'
      }));
    }
  };
}

async function handlePing(socket, data, apiKey) {
  const { agentId, eventId } = data;
  
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  const elevenLabsWs = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  elevenLabsWs.onopen = () => {
    elevenLabsWs.send(JSON.stringify({
      type: "pong",
      event_id: eventId
    }));
  };

  elevenLabsWs.onmessage = (event) => {
    try {
      const parsedData = JSON.parse(event.data);
      socket.send(JSON.stringify({
        type: 'elevenlabs_response',
        data: parsedData
      }));
    } catch (error) {
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Error parsing response'
      }));
    }
  };
} 