import React, { useState, useEffect, useRef } from 'react';
import * as Ably from 'ably';

interface Message {
  id: string;
  text: string;
  clientId: string;
  timestamp: number;
}

interface AblyChatProps {
  channelName?: string;
  className?: string;
}

export const AblyChat: React.FC<AblyChatProps> = ({ 
  channelName = 'neuraplay-chat',
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const ablyRef = useRef<Ably.Types.RealtimePromise | null>(null);
  const channelRef = useRef<Ably.Types.RealtimeChannelPromise | null>(null);

  useEffect(() => {
    // Initialize Ably connection
    const initializeAbly = async () => {
      try {
        // Get auth token from Netlify function
        const response = await fetch('/.netlify/functions/ably-auth');
        const tokenRequest = await response.json();

        if (!response.ok) {
          throw new Error(tokenRequest.error || 'Failed to get auth token');
        }

        // Initialize Ably with token
        const ably = new Ably.Realtime.Promise({
          authUrl: '/.netlify/functions/ably-auth'
        });

        ablyRef.current = ably;

        // Connection state listeners
        ably.connection.on('connected', () => {
          console.log('✅ Connected to Ably');
          setIsConnected(true);
          setConnectionError(null);
        });

        ably.connection.on('disconnected', () => {
          console.log('❌ Disconnected from Ably');
          setIsConnected(false);
        });

        ably.connection.on('failed', (error) => {
          console.error('❌ Ably connection failed:', error);
          setConnectionError(error.message);
          setIsConnected(false);
        });

        // Get channel and subscribe to messages
        const channel = ably.channels.get(channelName);
        channelRef.current = channel;

        channel.subscribe('message', (message) => {
          const newMessage: Message = {
            id: message.id || Math.random().toString(36),
            text: message.data.text,
            clientId: message.clientId || 'anonymous',
            timestamp: message.timestamp || Date.now()
          };

          setMessages(prev => [...prev, newMessage]);
        });

        // Join the channel
        await channel.attach();

      } catch (error) {
        console.error('Failed to initialize Ably:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      }
    };

    initializeAbly();

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.detach();
      }
      if (ablyRef.current) {
        ablyRef.current.close();
      }
    };
  }, [channelName]);

  const sendMessage = async () => {
    if (!messageText.trim() || !channelRef.current || !isConnected) return;

    try {
      await channelRef.current.publish('message', {
        text: messageText,
        timestamp: Date.now()
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`ably-chat ${className}`}>
      <div className="flex flex-col h-96 border border-gray-300 rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
          <h3 className="font-medium text-gray-800">Real-time Chat</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Connection Error */}
        {connectionError && (
          <div className="p-3 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">⚠️ {connectionError}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">No messages yet. Start chatting!</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="bg-gray-100 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-600">{message.clientId}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{message.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-gray-50 rounded-b-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              onClick={sendMessage}
              disabled={!isConnected || !messageText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 