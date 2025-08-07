const express = require('express');
const router = express.Router();

// For Node.js versions without native fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Import agent tools and functions
const { tools, executeTool, SERVER_SIDE_TOOLS } = require('../services/agent.cjs');
const { handleImageGeneration } = require('../services/imageGeneration.cjs');

// Store pending transcription requests for webhook callbacks
const pendingTranscriptions = new Map();

// AssemblyAI webhook endpoint for handling transcription completion
router.post('/assemblyai-webhook', async (req, res) => {
  try {
    console.log('📥 AssemblyAI webhook received:', req.body.transcript_id, req.body.status);
    
    const { transcript_id, status, text, error } = req.body;
    
    if (!transcript_id) {
      return res.status(400).json({ error: 'Missing transcript_id' });
    }
    
    // Find the pending transcription request
    const pendingRequest = pendingTranscriptions.get(transcript_id);
    
    if (!pendingRequest) {
      console.log('⚠️ Received webhook for unknown transcript_id:', transcript_id);
      return res.status(404).json({ error: 'Transcript not found' });
    }
    
    // Remove from pending requests
    pendingTranscriptions.delete(transcript_id);
    
    if (status === 'completed') {
      console.log('✅ Transcription completed:', transcript_id);
      
      // Send response to the original client
      pendingRequest.res.json({
        text: text || '',
        language_code: req.body.language_code || 'auto',
        transcript_id
      });
      
    } else if (status === 'error') {
      console.error('❌ Transcription failed:', error);
      
      pendingRequest.res.status(500).json({ 
        error: `Transcription failed: ${error}` 
      });
      
    } else {
      console.log('🔄 Transcription status:', status);
      // For 'processing' or 'queued' status, we just acknowledge but don't respond yet
    }
    
    // Always acknowledge the webhook
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// AssemblyAI transcription endpoint with webhook support
router.post('/assemblyai-transcribe', async (req, res) => {
  try {
    console.log('🎙️ Transcription request received');
    const { audio, audioType, language_code = 'auto', speech_model = 'universal' } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Generate webhook URL - in production, this would be your actual domain
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
    const webhookUrl = `${baseUrl}/api/assemblyai-webhook`;
    
    console.log('📡 Using webhook URL:', webhookUrl);

    // Forward to AssemblyAI with webhook URL
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
        format_text: true,
        webhook_url: webhookUrl
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AssemblyAI API error:', error);
      return res.status(response.status).json({ error: `Transcription failed: ${error}` });
    }

    const result = await response.json();
    const transcriptId = result.id;
    
    console.log('📋 Transcription submitted:', transcriptId, '- waiting for webhook callback');
    
    // Store the response object for later use when webhook is called
    pendingTranscriptions.set(transcriptId, {
      res: res,
      timestamp: Date.now(),
      language_code: language_code
    });

    // Set a timeout to cleanup stale requests (5 minutes)
    setTimeout(() => {
      const pendingRequest = pendingTranscriptions.get(transcriptId);
      if (pendingRequest) {
        console.log('⏰ Transcription timeout:', transcriptId);
        pendingTranscriptions.delete(transcriptId);
        
        if (!pendingRequest.res.headersSent) {
          pendingRequest.res.status(408).json({ 
            error: 'Transcription timeout - please try again' 
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Don't send response here - it will be sent by the webhook handler

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription service error' });
  }
});

// ElevenLabs TTS endpoint
router.post('/elevenlabs-tts', async (req, res) => {
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

// Main AI API endpoint with tool calling
router.post('/api', async (req, res) => {
  try {
    console.log('🤖 AI API request received');
    // Avoid logging full headers to prevent leaking cookies/auth
    console.log('🔍 DEBUG: Request body keys:', Object.keys(req.body || {}));
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

      // Execute all tool calls
      const toolResultsForAI = [];      // Summarized for AI context
      const toolResultsForClient = [];  // Full data for frontend display
      
      for (const toolCall of toolCalls) {
        const result = await executeTool(toolCall);
        let contentForAI = JSON.stringify(result);
        
        // Check if the result is from an image/diagram tool that produces large data
        if (result.success && result.data?.image_url) {
          console.log(`🔧 Separating AI context from client data for ${toolCall.function.name}`);
          
          // SUMMARIZED version for AI (prevents context overflow)
          const summaryForAI = {
            success: true,
            message: `Tool ${toolCall.function.name} executed successfully.`,
            data: {
              image_was_generated: true,
              title: result.data.title || 'Generated content',
              diagram_type: result.data.diagram_type || toolCall.function.name.replace('_', ' '),
              size: result.data.size || 'standard',
              style: result.data.style || 'default'
            }
          };
          contentForAI = JSON.stringify(summaryForAI);
          
          // FULL version for client (includes image_url)
          console.log(`🔧 Preserving full image data for client: ${result.data.image_url.length} chars`);
          toolResultsForClient.push(result); // Full data with image_url
        } else {
          // Non-image tools: same data for both AI and client
          toolResultsForClient.push(result);
        }
        
        // Debug logging for tool results
        console.log(`🔧 Tool ${toolCall.function.name} AI context size: ${contentForAI.length} characters`);
        
        // AI context (summarized)
        toolResultsForAI.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: contentForAI
        });
      }

      // Add tool call to messages
      input_data.messages.push({
        role: 'assistant',
        tool_calls: toolCalls
      });

      // Add SUMMARIZED tool results to messages for AI context
      input_data.messages.push(...toolResultsForAI);

      // Step 3: Final call to GPT-OSS with tool results
      console.log('Making final call with tool results...');
      
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
      console.log(`🔍 DEBUG: Sending response with ${toolResultsForClient.length} tool results`);
      console.log(`🔍 DEBUG: Server-side tools executed: ${serverSideTools.map(t => t.function.name).join(', ')}`);
      console.log(`🔍 DEBUG: Client-side tools to execute: ${clientSideTools.map(t => t.function.name).join(', ')}`);
      
      // Send FULL tool results to client (no validation needed, already structured)
      console.log('🔧 Sending FULL tool results to client (with image data)');
      
      // 🔍 COMPREHENSIVE IMAGE DEBUGGING
      toolResultsForClient.forEach((result, index) => {
        console.log(`🔍 DEBUG Tool Result ${index}:`, {
          success: result.success,
          hasData: !!result.data,
          hasImageUrl: !!(result.data?.image_url),
          imageUrlLength: result.data?.image_url?.length || 0,
          imageUrlPreview: result.data?.image_url?.substring(0, 50) + '...',
          message: result.message
        });
      });
      
      // Return in the expected format with BOTH server results AND client-side tools to execute
      const responseData = [{
        generated_text: finalData.choices[0].message.content,
        tool_calls: clientSideTools, // Only client-side tools for client execution
        tool_results: toolResultsForClient,    // FULL server-executed tool results (with image data)
        server_tool_calls: serverSideTools
      }];
      
      console.log('🔍 FINAL RESPONSE DEBUG:', {
        toolResultsCount: toolResultsForClient.length,
        hasImageResults: toolResultsForClient.some(r => r.data?.image_url),
        responseStructure: Object.keys(responseData[0])
      });
      
      res.json(responseData);
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

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Export the router and the pending transcriptions map
module.exports = {
  router,
  pendingTranscriptions
};
