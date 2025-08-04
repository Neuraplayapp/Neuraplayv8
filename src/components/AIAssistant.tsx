import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAIAgent } from '../contexts/AIAgentContext';
import { useUser } from '../contexts/UserContext';
import { ElevenLabsConversation } from './ElevenLabsConversation';
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

type AssistantMode = 'idle' | 'conversing' | 'single_recording';

const AIAssistant: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const { agent } = useAIAgent();
    const { user } = useUser();

    // Conversations state
    const [conversations, setConversations] = useState<Record<string, Conversation>>({
        'default': {
            id: 'default',
            title: 'New Conversation',
            messages: [],
            timestamp: new Date()
        }
    });
    const [activeConversation, setActiveConversation] = useState('default');
    
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<AssistantMode>('idle');
    
    // ElevenLabs conversation state (this is now our main conversation mode)
    const [useElevenLabs, setUseElevenLabs] = useState(false);
    
    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
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

    // ElevenLabs event handlers
    const handleElevenLabsMessage = (message: any) => {
        console.log('🎯 ElevenLabs message received:', message);
        if (message.type === 'agent_response' && message.agent_response_event?.agent_response) {
            addMessageToConversation(activeConversation, { 
                text: message.agent_response_event.agent_response,
                isUser: false, 
                timestamp: new Date() 
            });
        } else if (message.type === 'user_transcript' && message.user_transcription_event?.user_transcript) {
                addMessageToConversation(activeConversation, { 
                text: message.user_transcription_event.user_transcript,
                isUser: true,
                    timestamp: new Date() 
                });
            }
    };
        
    const handleElevenLabsError = (error: any) => {
        console.error('❌ ElevenLabs error:', error);
                addMessageToConversation(activeConversation, { 
            text: `⚠️ ElevenLabs error: ${error.message || 'Connection failed'}. Please try again.`,
                    isUser: false, 
                    timestamp: new Date() 
                });
        setUseElevenLabs(false);
    };

    const handleElevenLabsConnect = () => {
        console.log('🎯 ElevenLabs connected');
            addMessageToConversation(activeConversation, { 
            text: "🌊 ElevenLabs voice conversation started! Speak naturally with me! ✨",
                isUser: false, 
                timestamp: new Date() 
            });
        setUseElevenLabs(true);
    };

    const handleElevenLabsDisconnect = () => {
        console.log('🔌 ElevenLabs disconnected');
                        addMessageToConversation(activeConversation, {
            text: "🎤 ElevenLabs voice conversation ended! You can still chat via text. ✨",
                            isUser: false,
                            timestamp: new Date()
                        });
        setUseElevenLabs(false);
    };

    // Voice recording functions (restored original functionality)
    const startVoiceRecording = async () => {
        try {
            console.log('🎤 Starting voice recording...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            const audioChunks: Blob[] = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    // Convert to base64 for transcription
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                    
        setIsLoading(true);
                    addMessageToConversation(activeConversation, { 
                        text: "🎤 Processing your voice...",
                isUser: false, 
                timestamp: new Date() 
            });
                    
                    try {
                        // Use AssemblyAI for transcription
                        const transcriptionResult = await fetch('/.netlify/functions/assemblyai-transcribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ audio: base64Audio })
                        });
                        
                        if (transcriptionResult.ok) {
                            const { text: transcribedText } = await transcriptionResult.json();
                            
                            if (transcribedText && transcribedText.trim()) {
                                // Add transcribed text as user message
            addMessageToConversation(activeConversation, { 
                                    text: transcribedText,
                                    isUser: true,
                timestamp: new Date() 
            });
            
                                // Process the transcribed message
                                await handleSendMessage(transcribedText);
                            } else {
            addMessageToConversation(activeConversation, { 
                                    text: "🎤 I couldn't understand that. Please try speaking again! 🌟",
                isUser: false, 
                timestamp: new Date() 
            });
                            }
                        } else {
                            throw new Error('Transcription failed');
                        }
                    } catch (error) {
                        console.error('Voice processing error:', error);
                    addMessageToConversation(activeConversation, { 
                            text: "🎤 Sorry, I couldn't process that voice message. Please try again! 🌟",
                        isUser: false, 
                        timestamp: new Date() 
                    });
                    } finally {
                        setIsLoading(false);
                    }
                }
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            console.log('✅ Voice recording started');
            
        } catch (error) {
            console.error('❌ Failed to start voice recording:', error);
                    addMessageToConversation(activeConversation, { 
                text: "🎤 Couldn't access microphone. Please check permissions! 🌟",
                        isUser: false, 
                        timestamp: new Date() 
                    });
                }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
                    mediaRecorderRef.current.stop();
            setIsRecording(false);
            
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                
            console.log('🛑 Voice recording stopped');
        }
    };

    const toggleVoiceRecording = () => {
        if (isRecording) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    };

    // Helper function to check if message is an image request
    const isImageRequest = (text: string): boolean => {
        const imageKeywords = [
            'generate image', 'create image', 'draw', 'make image', 'picture of',
            'generate a picture', 'create a picture', 'show me image', 'make picture'
        ];
        return imageKeywords.some(keyword => text.toLowerCase().includes(keyword));
    };

    // Handle image generation requests
    const handleImageRequest = async (text: string) => {
        try {
            // Add a thinking message
                addMessageToConversation(activeConversation, { 
                text: "🎨 Creating your image... This might take a moment! ✨",
                    isUser: false, 
                    timestamp: new Date() 
                });

            // Simulate image generation (replace with actual API call)
            setTimeout(() => {
            addMessageToConversation(activeConversation, { 
                    text: `🎨 I would generate an image for: "${text}". Image generation feature coming soon! 🖼️`,
                isUser: false, 
                timestamp: new Date() 
            });
                setIsLoading(false);
            }, 2000);
        } catch (error) {
            console.error('Image generation error:', error);
            addMessageToConversation(activeConversation, { 
                text: "🎨 Sorry, I couldn't create that image right now. Please try again later! 🌟",
                isUser: false, 
                timestamp: new Date() 
            });
            setIsLoading(false);
        }
    };

    // Handle text message sending with full functionality
    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;
        
        // Add user message to UI immediately
        const userMessage: Message = { text, isUser: true, timestamp: new Date() };
        addMessageToConversation(activeConversation, userMessage);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Check for image requests first
            if (isImageRequest(text)) {
                await handleImageRequest(text);
                return;
            }
            
            // If ElevenLabs is active, acknowledge text but encourage voice
            if (useElevenLabs) {
                setTimeout(() => {
                    addMessageToConversation(activeConversation, {
                        text: `🎯 I see your text message! For the best experience, try speaking directly - I'm listening through ElevenLabs voice chat! 🗣️`,
                isUser: false,
                timestamp: new Date()
                    });
                    setIsLoading(false);
                }, 500);
                return;
            }

            // Regular text conversation - simulate AI response
            setTimeout(() => {
                const responses = [
                    `🤖 I received: "${text}". Try the conversation modes below for more interactive chat! 🌊`,
                    `💬 Thanks for your message: "${text}". Click the plasma ball for voice conversation! 🎤`,
                    `✨ I understand: "${text}". For real-time chat, try the ElevenLabs conversation mode! 🚀`
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                addMessageToConversation(activeConversation, {
                    text: randomResponse,
                    isUser: false,
                    timestamp: new Date()
                });
                setIsLoading(false);
            }, 1000);

        } catch (error) {
            console.error('Error sending message:', error);
                addMessageToConversation(activeConversation, {
                text: `Oops! Something went wrong. Let's try again! 🌟`, 
                    isUser: false,
                    timestamp: new Date()
                });
            setIsLoading(false);
        }
    };

    // Handle text input
    const handleSendText = () => {
        handleSendMessage(inputMessage);
    };

    return (
        <div className="ai-assistant-container">
            <div className="chat-area">
                {/* ElevenLabs Conversation Mode Indicator */}
                {useElevenLabs && (
                    <div className="mx-4 mb-2 p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-300 text-sm">
                            <PlasmaBall size={24} className="animate-pulse" />
                            <div className="flex flex-col">
                                <span className="font-semibold">🎯 ElevenLabs Conversation Mode Active</span>
                                <span className="text-xs opacity-80">Real-time voice conversation with official ElevenLabs AI</span>
                </div>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            </div>
                        </div>
                    )}

                {/* Messages */}
                <div className="messages-container">
                    {conversations[activeConversation]?.messages.map((message, index) => (
                        <div key={index} className={`message ${message.isUser ? 'user' : 'assistant'}`}>
                            <div className="message-content">
                                {message.text}
                                    </div>
                            <div className="message-timestamp">
                                {message.timestamp.toLocaleTimeString()}
                                </div>
                        </div>
                    ))}
                        {isLoading && (
                        <div className="message assistant">
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                {/* Input */}
                <div className="p-4">
                    <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                            placeholder="Type your message..."
                            className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-purple-400"
                            disabled={isLoading}
                        />
                        
                        {/* Send Button */}
                            <button
                                onClick={handleSendText}
                            disabled={isLoading || !inputMessage.trim()}
                            className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-all"
                            >
                                <Send size={16} />
                            </button>
                            
                        {/* Enhanced Plasma Ball with ElevenLabs Conversation Mode */}
                        <div className={`plasma-ball-conversation-container ${useElevenLabs ? 'active streaming' : ''}`}>
                            <div className="relative">
                                <ElevenLabsConversation
                                    onMessage={handleElevenLabsMessage}
                                    onError={handleElevenLabsError}
                                    onConnect={handleElevenLabsConnect}
                                    onDisconnect={handleElevenLabsDisconnect}
                                />
                            </div>
                            </div>
                            
                            {/* Voice Recording Button */}
                            <button
                            onClick={toggleVoiceRecording}
                            className={`ai-mode-button flex-1 ${isRecording ? 'recording' : ''}`}
                            title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                            disabled={isLoading}
                        >
                            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                            <span>{isRecording ? 'Stop' : 'Record'}</span>
                            </button>
                        </div>
                            </div>
                    </div>
                </div>
    );
};

export default AIAssistant;