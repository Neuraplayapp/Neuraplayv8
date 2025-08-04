import React, { useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { getAgentId } from '../config/elevenlabs';
import PlasmaBall from './PlasmaBall';

interface ElevenLabsConversationProps {
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  selectedLanguage?: string;
}

export const ElevenLabsConversation: React.FC<ElevenLabsConversationProps> = ({
  onMessage,
  onError,
  onConnect,
  onDisconnect,
  selectedLanguage = 'english'
}) => {
  const conversation = useConversation({
    onConnect: () => {
      console.log('🎯 ElevenLabs Connected');
      onConnect?.();
    },
    onDisconnect: () => {
      console.log('🔌 ElevenLabs Disconnected');
      onDisconnect?.();
    },
    onMessage: (message) => {
      console.log('📨 ElevenLabs Message:', message);
      onMessage?.(message);
    },
    onError: (error) => {
      console.error('❌ ElevenLabs Error:', error);
      onError?.(error);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      console.log('🚀 Starting ElevenLabs conversation...');
      
      // Check if we have proper configuration
      const agentId = getAgentId();
      if (!agentId || agentId === 'YOUR_AGENT_ID') {
        throw new Error('ElevenLabs Agent ID not configured. Please set your agent ID in the elevenlabs config.');
      }
      
      // Check if API key is available (this is handled by the @elevenlabs/react package)
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('ElevenLabs API key not found. Please set VITE_ELEVENLABS_API_KEY in your environment variables.');
      }
      
      console.log('🔑 Using Agent ID:', agentId);
      console.log('🔑 API Key configured:', apiKey ? 'Yes' : 'No');
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Microphone permission granted');
      
      // Start the conversation with your agent
      // Note: Language configuration would typically be handled in the agent setup
      // For now, we log the selected language for debugging
      console.log('🌐 Selected language:', selectedLanguage);
      
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
        // Add any language-specific configuration here if supported by ElevenLabs
        // This depends on your agent configuration in ElevenLabs  
      });
      
      console.log('✅ ElevenLabs conversation started successfully');
    } catch (error: any) {
      console.error('❌ Failed to start ElevenLabs conversation:', error);
      
      // Handle specific authorization errors
      if (error.code === 3000 || error.reason?.includes('authorize')) {
        const authError = new Error(
          '🔐 Authorization failed. This could be due to:\n' +
          '• Invalid or missing ElevenLabs API key\n' +
          '• Incorrect Agent ID\n' +
          '• Agent not accessible with current API key\n' +
          '• Domain not whitelisted for this agent\n' +
          'Please check your ElevenLabs configuration.'
        );
        onError?.(authError);
      } else if (error.message?.includes('Agent ID not configured')) {
        onError?.(error);
      } else if (error.message?.includes('API key not found')) {
        onError?.(error);
      } else {
        onError?.(error);
      }
    }
  }, [conversation, onError]);

  const stopConversation = useCallback(async () => {
    try {
      console.log('🛑 Stopping ElevenLabs conversation...');
      await conversation.endSession();
      console.log('✅ ElevenLabs conversation stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop ElevenLabs conversation:', error);
      onError?.(error);
    }
  }, [conversation, onError]);

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';

  return (
    <div 
      className={`plasma-ball-conversation-container ${isConnected ? 'active streaming' : ''} ${isConnecting ? 'connecting' : ''}`}
      onClick={isConnected ? stopConversation : startConversation}
      title={isConnected ? 'Stop ElevenLabs Conversation' : 'Start ElevenLabs Conversation'}
    >
      <div className="relative">
        <PlasmaBall 
          size={36}
          className={`conversation-plasma-ball ${isConnected ? 'active streaming-pulse' : ''}`}
          intensity={isConnected ? 1.5 : (isConnecting ? 0.8 : 0.3)}
        />
        {isConnected && (
          <>
            {/* Streaming indicator rings */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-pulse"></div>
            {/* Live status indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
          </>
        )}
        {isConnecting && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400/50 animate-spin"></div>
        )}
      </div>
      <span className={`plasma-label ${isConnected ? 'text-purple-300 font-bold animate-pulse' : isConnecting ? 'text-yellow-300 animate-pulse' : ''}`}>
        {isConnecting ? '🔄 Chat' : isConnected ? '🌊 Live' : '💬 Chat'}
      </span>
    </div>
  );
};

export default ElevenLabsConversation;