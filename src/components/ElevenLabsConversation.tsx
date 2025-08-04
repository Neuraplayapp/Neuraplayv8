'use client';
import React, { useCallback, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import PlasmaBall from './PlasmaBall';

interface ElevenLabsConversationProps {
  agentId: string;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
}

export function ElevenLabsConversation({ 
  agentId, 
  onMessage, 
  onError 
}: ElevenLabsConversationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('🟢 ElevenLabs Connected');
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log('🔴 ElevenLabs Disconnected');
      setIsConnecting(false);
    },
    onMessage: (message) => {
      console.log('📨 ElevenLabs Message:', message);
      onMessage?.(message);
    },
    onError: (error) => {
      console.error('❌ ElevenLabs Error:', error);
      setIsConnecting(false);
      onError?.(error);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setIsConnecting(true);
      console.log('🚀 Starting ElevenLabs conversation with agent:', agentId);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with your agent
      await conversation.startSession({
        agentId: agentId,
        // user_id: 'neuraplay_user' // Optional field for tracking
      });
      
      console.log('✅ ElevenLabs conversation started successfully');
    } catch (error) {
      console.error('❌ Failed to start ElevenLabs conversation:', error);
      setIsConnecting(false);
      onError?.(error);
    }
  }, [conversation, agentId, onError]);

  const stopConversation = useCallback(async () => {
    try {
      console.log('🛑 Stopping ElevenLabs conversation...');
      await conversation.endSession();
      console.log('✅ ElevenLabs conversation stopped');
    } catch (error) {
      console.error('❌ Error stopping conversation:', error);
      onError?.(error);
    }
  }, [conversation, onError]);

  const isActive = conversation.status === 'connected';
  const isLoading = isConnecting || conversation.status === 'connecting';

  return (
    <div className="elevenlabs-conversation">
      {/* Enhanced Streaming Plasma Ball */}
      <div 
        className={`plasma-ball-conversation-container ${isActive ? 'active streaming' : ''}`}
        onClick={isActive ? stopConversation : startConversation}
        title={isActive ? 'Stop ElevenLabs Conversation' : 'Start ElevenLabs Conversation'}
      >
        <div className="relative">
          <PlasmaBall 
            size={36}
            className={`conversation-plasma-ball ${isActive ? 'active streaming-pulse' : ''}`}
            intensity={isActive ? 1.2 : 0.3}
          />
          {isActive && (
            <>
              {/* Streaming indicator rings */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-pulse"></div>
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            </>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
            </div>
          )}
        </div>
        <span className={`plasma-label ${isActive ? 'text-purple-300 font-bold animate-pulse' : ''}`}>
          {isLoading ? '⏳ ...' : isActive ? '🌊 Live' : '💬 Chat'}
        </span>
      </div>

      {/* Status Display */}
      <div className="text-center text-xs mt-2">
        <div className={`font-semibold ${
          isActive ? 'text-green-400' : 
          isLoading ? 'text-yellow-400' : 
          'text-gray-400'
        }`}>
          Status: {isLoading ? 'Connecting...' : conversation.status}
        </div>
        {isActive && (
          <div className="text-blue-400 mt-1">
            Agent is {conversation.isSpeaking ? '🗣️ speaking' : '👂 listening'}
          </div>
        )}
      </div>

      {/* Live Status Indicator */}
      {isActive && (
        <div className="mt-2 p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg">
          <div className="flex items-center gap-2 text-purple-300 text-sm">
            <PlasmaBall size={16} className="animate-pulse" />
            <div className="flex flex-col">
              <span className="font-semibold">🌊 ElevenLabs Live Conversation</span>
              <span className="text-xs opacity-80">
                Real-time AI agent • Voice enabled
              </span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}