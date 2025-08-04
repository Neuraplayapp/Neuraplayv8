import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAIAgent } from '../contexts/AIAgentContext';
import { useUser } from '../contexts/UserContext';
import { StreamingConversationService, type ConversationEvent } from '../services/StreamingConversationService';
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
                    text: "🌟 Hi there! I'm Synapse, your friendly AI teacher! Click the plasma ball to start streaming conversation! 🚀", 
                    isUser: false, 
                    timestamp: new Date() 
                }
            ],
            timestamp: new Date()
        }
    });
    
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<AssistantMode>('idle');
    
    // ElevenLabs conversation state (this is now our main conversation mode)
    const [useElevenLabs, setUseElevenLabs] = useState(false);
    
    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Streaming service ref
    const streamingService = useRef<StreamingConversationService>(StreamingConversationService.getInstance());
    
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
    const handleElevenLabsMessage = (message: any) => {
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
    };

    const handleElevenLabsError = (error: any) => {
        console.error('❌ ElevenLabs error:', error);
        addMessageToConversation(activeConversation, {
            text: `🤖 Sorry, I encountered an error with ElevenLabs: ${error.message || 'Unknown error'}. Please try again! 🌟`,
            isUser: false,
            timestamp: new Date()
        });
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
    
    // Streaming conversation event handler
    const handleStreamingEvent = (event: ConversationEvent) => {
        console.log('🌊 Streaming event:', event.type, event.data);
        
        switch (event.type) {
            case 'llm_response':
                const response = event.data.text;
                addMessageToConversation(activeConversation, {
                    text: response,
                    isUser: false,
                    timestamp: new Date()
                });
                break;
                
            case 'user_speech':
                addMessageToConversation(activeConversation, {
                    text: event.data.text,
                    isUser: true,
                    timestamp: new Date()
                });
                break;
                
            case 'error':
                console.error('Streaming conversation error:', event.data.error);
                addMessageToConversation(activeConversation, {
                    text: `🤖 Sorry, I encountered an error: ${event.data.error}. Let's try again! 🌟`,
                    isUser: false,
                    timestamp: new Date()
                });
                break;
        }
    };

    // Initialize streaming service event listener
    useEffect(() => {
        streamingService.current.addEventListener(handleStreamingEvent);
        
        return () => {
            streamingService.current.removeEventListener(handleStreamingEvent);
        };
    }, [activeConversation]);

    // Start streaming conversation
    const activateConversationMode = async () => {
        try {
            console.log('🚀 Starting streaming conversation mode...');
            setMode('conversing');
            setIsStreaming(true);
            
            // Configure streaming service
            streamingService.current.configure({
                language: 'english',
                enableSTT: true,
                enableTTS: true,
                enableLLM: true
            });
            
            // Start streaming conversation
            await streamingService.current.startConversation();
            
            addMessageToConversation(activeConversation, {
                text: "🌊 Streaming conversation started! Speak or type to chat with me in real-time! ✨",
                isUser: false,
                timestamp: new Date()
            });
            
            console.log('✅ Streaming conversation started successfully');
        } catch (error) {
            console.error('❌ Failed to start streaming conversation:', error);
            setMode('idle');
            setIsStreaming(false);
            
            addMessageToConversation(activeConversation, {
                text: "🤖 Sorry, I couldn't start the streaming conversation. Let's try regular chat instead! 🌟",
                isUser: false,
                timestamp: new Date()
            });
        }
    };

    // Stop streaming conversation
    const stopConversationMode = async () => {
        try {
            console.log('🔄 Ending streaming conversation mode...');
            
            await streamingService.current.stopConversation();
            setIsStreaming(false);
            setMode('idle');
            
            addMessageToConversation(activeConversation, { 
                text: "🎤 Streaming conversation ended! The plasma is calm now. You can still chat with me via text! ✨", 
                isUser: false, 
                timestamp: new Date() 
            });
            
            console.log('✅ Streaming conversation ended successfully');
        } catch (error) {
            console.error('❌ Error ending streaming conversation:', error);
            setMode('idle');
            setIsStreaming(false);
        }
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

            // ElevenLabs voice conversation handles its own messages
            // Text input when ElevenLabs is active just acknowledges and encourages voice

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
                    `✨ I understand: "${text}". For real-time chat, try the ElevenLabs or streaming modes below! 🚀`
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

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

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

                {/* Input */}
                <div className="p-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            placeholder={mode === 'conversing' ? "Talk to Synapse in streaming mode! 🗣️" : "Ask me anything! 🚀"}
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
                        
                        {/* Enhanced Plasma Ball with ElevenLabs Conversation Mode */}
                        <div 
                            className={`plasma-ball-conversation-container ${useElevenLabs ? 'active streaming' : ''}`}
                            title={useElevenLabs ? 'Stop ElevenLabs Conversation' : 'Start ElevenLabs Conversation'}
                        >
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
                    
                    {useElevenLabs && (
                        <div className="text-center mt-2">
                            <div className="text-purple-400 text-xs font-bold animate-pulse mb-1">
                                🎯 ElevenLabs Voice Conversation Active 🔊
                            </div>
                            <div className="text-blue-400 text-xs">
                                Speak naturally with the AI - no buttons needed! ✨
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default AIAssistantSimple;

// Also export as AIAssistant for compatibility
export { AIAssistantSimple as AIAssistant };