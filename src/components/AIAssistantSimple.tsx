import React, { useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAIAgent } from '../contexts/AIAgentContext';
import { useUser } from '../contexts/UserContext';
import { ElevenLabsConversation } from './ElevenLabsConversation';
import { getAgentId } from '../config/elevenlabs';
import PlasmaBall from './PlasmaBall';
import './AIAssistant.css';

interface Message {
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    timestamp: Date;
}

const AIAssistantSimple: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { user, isDemoUser } = useUser();
    const { showAgent, hideAgent } = useAIAgent();
    
    const [isOpen, setIsOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState<string>('current');
    const [conversations, setConversations] = useState<{ [key: string]: Conversation }>({
        current: {
            id: 'current',
            title: 'Current Chat',
            messages: [
                { 
                    text: "🌟 Hi there! I'm Synapse, your friendly AI teacher! Click the plasma ball to start real-time ElevenLabs conversation! 🚀", 
                    isUser: false, 
                    timestamp: new Date() 
                }
            ],
            timestamp: new Date()
        }
    });
    
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Helper function to add messages to conversation
    const addMessageToConversation = (conversationId: string, message: Message) => {
        setConversations(prev => ({
            ...prev,
            [conversationId]: {
                ...prev[conversationId],
                messages: [...prev[conversationId].messages, message],
                timestamp: new Date()
            }
        }));
    };

    // Current messages getter
    const currentMessages = conversations[activeConversation]?.messages || [];
    
    // ElevenLabs conversation handlers
    const handleElevenLabsMessage = useCallback((message: any) => {
        console.log('📨 ElevenLabs message received:', message);
        
        // Add the message to our conversation
        if (message.type === 'agent_response' && message.content) {
            addMessageToConversation(activeConversation, {
                text: message.content,
                isUser: false,
                timestamp: new Date()
            });
        } else if (message.type === 'user_transcript' && message.content) {
            addMessageToConversation(activeConversation, {
                text: message.content,
                isUser: true,
                timestamp: new Date()
            });
        }
    }, [activeConversation]);

    const handleElevenLabsError = useCallback((error: any) => {
        console.error('❌ ElevenLabs error:', error);
        addMessageToConversation(activeConversation, {
            text: `🤖 Sorry, I encountered an error with ElevenLabs: ${error.message || 'Unknown error'}. Please try again! 🌟`,
            isUser: false,
            timestamp: new Date()
        });
    }, [activeConversation]);

    // Handle regular AI messages (for text input when not using ElevenLabs voice)
    const simulateAIResponse = useCallback((userText: string) => {
        // Simulate AI response for text-based chat
        const responses = [
            `🤖 I heard you say: "${userText}". Try the ElevenLabs voice conversation for real-time chat!`,
            `📝 Text message received: "${userText}". For the full experience, use the plasma ball voice chat!`,
            `💬 Thanks for your message: "${userText}". The voice conversation mode is much more interactive!`,
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setTimeout(() => {
            addMessageToConversation(activeConversation, {
                text: randomResponse,
                isUser: false,
                timestamp: new Date()
            });
            setIsLoading(false);
        }, 1000);
    }, [activeConversation]);

    // Handle text message sending
    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;
        
        // Add user message to UI
        const userMessage: Message = { text, isUser: true, timestamp: new Date() };
        addMessageToConversation(activeConversation, userMessage);
        setInputMessage('');
        setIsLoading(true);

        // Simulate AI response for text input
        simulateAIResponse(text);
    }, [isLoading, activeConversation, simulateAIResponse]);

    // Handle text input
    const handleSendText = useCallback(() => {
        handleSendMessage(inputMessage);
    }, [handleSendMessage, inputMessage]);

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    }, [handleSendText]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center group z-50"
            >
                <PlasmaBall size={32} />
            </button>
        );
    }

    return (
        <aside id="ai-teacher-menu" className="open">
            <div className="flex-1 flex flex-col h-full">
                {/* Header */}
                <div className="ai-header">
                    <div className="flex items-center gap-3">
                        <PlasmaBall size={24} />
                        <div>
                            <h2 className="text-lg font-bold text-white">Synapse AI</h2>
                            <p className="text-xs text-purple-300">Your Learning Assistant</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                        ×
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                msg.isUser 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-white/10 text-white'
                            }`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs mt-1 opacity-70">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 px-4 py-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-xs text-gray-300">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Panel */}
                <div className="mx-4 mb-2 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg">
                    <div className="text-center text-sm text-blue-300">
                        <span className="font-semibold">💬 Text Chat & 🌊 Voice Conversation Available</span>
                        <div className="text-xs mt-1 opacity-80">
                            Type messages or click the plasma ball for real-time voice chat with ElevenLabs AI
                        </div>
                    </div>
                </div>

                {/* Input */}
                <div className="p-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            placeholder="Type a message or use voice conversation! 🚀"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                            disabled={isLoading}
                        />
                        
                        <button
                            onClick={handleSendText}
                            disabled={!inputMessage.trim() || isLoading}
                            className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-all"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    
                    {/* ElevenLabs Conversation Component */}
                    <div className="mt-4 flex justify-center">
                        <ElevenLabsConversation
                            agentId={getAgentId()}
                            onMessage={handleElevenLabsMessage}
                            onError={handleElevenLabsError}
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AIAssistantSimple;

// Also export as AIAssistant for compatibility
export { AIAssistantSimple as AIAssistant };