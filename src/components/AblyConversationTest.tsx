import React, { useState, useEffect, useRef } from 'react';
import { AblyConversationService } from '../services/AblyConversationService';
import { getVoiceId, getAgentId } from '../config/elevenlabs';

export const AblyConversationTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConversing, setIsConversing] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const conversationService = useRef(AblyConversationService.getInstance());

  useEffect(() => {
    // Set up event listeners
    const service = conversationService.current;
    
    service.on('connected', () => {
      console.log('✅ Ably conversation service connected');
      setIsConnected(true);
      setMessages(prev => [...prev, '✅ Connected to Ably']);
    });

    service.on('disconnected', () => {
      console.log('❌ Ably conversation service disconnected');
      setIsConnected(false);
      setMessages(prev => [...prev, '❌ Disconnected from Ably']);
    });

    service.on('error', (error) => {
      console.error('❌ Ably error:', error);
      setMessages(prev => [...prev, `❌ Error: ${error.error || error.message}`]);
    });

    service.on('aiResponse', (data) => {
      console.log('🤖 AI Response:', data);
      setMessages(prev => [...prev, `🤖 AI: ${JSON.stringify(data.data)}`]);
    });

    service.on('conversationStarted', (data) => {
      console.log('🎤 Conversation started:', data);
      setIsConversing(true);
      setMessages(prev => [...prev, '🎤 Conversation started!']);
    });

    service.on('audioChunk', (data) => {
      console.log('🎵 Audio chunk received');
      setMessages(prev => [...prev, '🎵 Audio chunk received']);
    });

    // Cleanup
    return () => {
      service.disconnect();
    };
  }, []);

  const connectToAbly = async () => {
    try {
      await conversationService.current.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      setMessages(prev => [...prev, `❌ Connection failed: ${error.message}`]);
    }
  };

  const startConversation = async () => {
    try {
      const config = {
        agentId: getAgentId(),
        voiceId: getVoiceId()
      };
      
      await conversationService.current.initConversation(config);
      setMessages(prev => [...prev, '🎤 Starting conversation...']);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setMessages(prev => [...prev, `❌ Failed to start: ${error.message}`]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;

    try {
      await conversationService.current.sendUserMessage(inputMessage);
      setMessages(prev => [...prev, `👤 You: ${inputMessage}`]);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, `❌ Send failed: ${error.message}`]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🚀 Ably Conversation Test
      </h2>

      {/* Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConversing ? 'bg-blue-500' : 'bg-gray-400'}`} />
          <span className="font-medium">
            Conversation: {isConversing ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={connectToAbly}
          disabled={isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Connect to Ably
        </button>
        
        <button
          onClick={startConversation}
          disabled={!isConnected || isConversing}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Start Conversation
        </button>
      </div>

      {/* Message Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!isConnected || !isConversing}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !isConversing || !inputMessage.trim()}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
        <h3 className="font-medium mb-2 text-gray-700">Activity Log:</h3>
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No activity yet. Connect to get started!</p>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => (
              <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                {message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <h4 className="font-medium text-yellow-800 mb-1">Instructions:</h4>
        <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
          <li>Click "Connect to Ably" to establish the WebSocket connection</li>
          <li>Click "Start Conversation" to initialize ElevenLabs conversation</li>
          <li>Type messages to test the conversation flow</li>
          <li>Check the activity log for real-time updates</li>
        </ol>
      </div>
    </div>
  );
}; 