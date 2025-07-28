const WebSocket = require('ws');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, xi-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { agentId, voiceId, message, messageType } = JSON.parse(event.body);
    
    console.log('ElevenLabs WebSocket request received');
    console.log('Agent ID:', agentId);
    console.log('Voice ID:', voiceId);
    console.log('Message type:', messageType);

    // Get ElevenLabs API key
    const ELEVENLABS_API_KEY = process.env.elven_labs_api_key;
    
    if (!ELEVENLABS_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'ElevenLabs API key not configured'
        })
      };
    }

    // Create WebSocket connection to ElevenLabs
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
    const ws = new WebSocket(wsUrl, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    return new Promise((resolve, reject) => {
      let responseData = null;
      let hasResponded = false;

      ws.on('open', () => {
        console.log('WebSocket connected to ElevenLabs');
        
        // Send the message to ElevenLabs
        if (messageType === 'conversation_initiation') {
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
                voice_id: voiceId
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
          ws.send(JSON.stringify(initMessage));
        } else if (messageType === 'user_message') {
          ws.send(JSON.stringify({
            type: "user_message",
            text: message
          }));
        } else if (messageType === 'user_audio_chunk') {
          ws.send(JSON.stringify({
            type: "user_audio_chunk",
            user_audio_chunk: message
          }));
        } else if (messageType === 'pong') {
          ws.send(JSON.stringify({
            type: "pong",
            event_id: message
          }));
        }
      });

      ws.on('message', (data) => {
        try {
          const parsedData = JSON.parse(data.toString());
          console.log('Received from ElevenLabs:', parsedData);

          // Handle different message types
          switch (parsedData.type) {
            case 'conversation_initiation_metadata':
              responseData = {
                type: 'conversation_initiation_metadata',
                data: parsedData.conversation_initiation_metadata_event
              };
              break;

            case 'user_transcript':
              responseData = {
                type: 'user_transcript',
                data: parsedData.user_transcription_event
              };
              break;

            case 'agent_response':
              responseData = {
                type: 'agent_response',
                data: parsedData.agent_response_event
              };
              break;

            case 'audio':
              responseData = {
                type: 'audio',
                data: parsedData.audio_event
              };
              break;

            case 'vad_score':
              responseData = {
                type: 'vad_score',
                data: parsedData.vad_score_event
              };
              break;

            case 'ping':
              responseData = {
                type: 'ping',
                data: parsedData.ping_event
              };
              break;

            default:
              responseData = {
                type: 'unknown',
                data: parsedData
              };
          }

          if (!hasResponded) {
            hasResponded = true;
            ws.close();
            
            resolve({
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(responseData)
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          if (!hasResponded) {
            hasResponded = true;
            ws.close();
            reject(error);
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (!hasResponded) {
          hasResponded = true;
          ws.close();
          reject(error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        if (!hasResponded) {
          hasResponded = true;
          resolve({
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'connection_closed',
              message: 'WebSocket connection closed'
            })
          });
        }
      });

      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (!hasResponded) {
          hasResponded = true;
          ws.close();
          resolve({
            statusCode: 408,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              error: 'Request timeout'
            })
          });
        }
      }, 30000); // 30 second timeout
    });

  } catch (error) {
    console.error('ElevenLabs WebSocket function error:', error);
    
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