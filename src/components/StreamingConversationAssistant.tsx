import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, X, Send, Volume2, VolumeX, Mic, MicOff, Settings, Play, Pause } from 'lucide-react';
import './AIAssistant.css';
import { StreamingConversationService, ConversationEvent, StreamingConversationConfig } from '../services/StreamingConversationService';

interface Message {
    text: string;
    isUser: boolean;
    timestamp: Date;
    audio?: string;
    type?: 'speech' | 'text' | 'llm' | 'tts';
}

const StreamingConversationAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [recordingStatus, setRecordingStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'russian' | 'arabic'>('english');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    
    const conversationService = useRef<StreamingConversationService>(StreamingConversationService.getInstance());
    const menuRef = useRef<HTMLDivElement>(null);

    // Handle conversation events
    useEffect(() => {
        const handleEvent = (event: ConversationEvent) => {
            console.log('Conversation event:', event);
            
            switch (event.type) {
                case 'user_speech':
                    if (event.data.status === 'started' || event.data.status === 'started_manual') {
                        setIsRecording(true);
                        setRecordingStatus('Recording...');
                    } else if (event.data.status === 'stopped' || event.data.status === 'stopped_manual') {
                        setIsRecording(false);
                        setRecordingStatus('Processing...');
                        setIsProcessing(true);
                    }
                    if (event.data.audioLevel !== undefined) {
                        setAudioLevel(event.data.audioLevel);
                    }
                    break;
                    
                case 'user_text':
                    setMessages(prev => [...prev, {
                        text: event.data.text,
                        isUser: true,
                        timestamp: event.timestamp,
                        type: 'text'
                    }]);
                    setIsProcessing(false);
                    setRecordingStatus('');
                    break;
                    
                case 'llm_response':
                    setMessages(prev => [...prev, {
                        text: event.data.text,
                        isUser: false,
                        timestamp: event.timestamp,
                        type: 'llm'
                    }]);
                    break;
                    
                case 'tts_audio':
                    setMessages(prev => [...prev, {
                        text: event.data.text,
                        isUser: false,
                        timestamp: event.timestamp,
                        type: 'tts',
                        audio: event.data.audioBase64
                    }]);
                    break;
                    
                case 'error':
                    setError(event.data.message);
                    setIsProcessing(false);
                    setRecordingStatus('');
                    break;
            }
        };

        conversationService.addEventListener(handleEvent);
        return () => conversationService.removeEventListener(handleEvent);
    }, [conversationService]);

    // Initialize conversation service
    useEffect(() => {
        const service = conversationService.current;
        
        // Configure the service
        service.configure({
            language: selectedLanguage,
            enableSTT: true,
            enableTTS: true,
            enableLLM: true
        });

        // Add event listener
        service.addEventListener(handleConversationEvent);

        return () => {
            service.removeEventListener(handleConversationEvent);
        };
    }, [selectedLanguage, handleConversationEvent]);

    // Start conversation
    const startConversation = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setMessages([]);

            await conversationService.current.startConversation();
            setIsConnected(true);
        } catch (error: any) {
            console.error('Failed to start conversation:', error);
            setError(`Failed to start conversation: ${error.message}`);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Stop conversation
    const stopConversation = async () => {
        try {
            await conversationService.current.stopConversation();
            setIsConnected(false);
            setIsRecording(false);
            setMessages([]);
            setError(null);
        } catch (error: any) {
            console.error('Failed to stop conversation:', error);
            setError(`Failed to stop conversation: ${error.message}`);
        }
    };

    // Send text message
    const sendTextMessage = async () => {
        if (!inputMessage.trim() || !isConnected) return;

        try {
            setIsLoading(true);
            await conversationService.current.sendTextMessage(inputMessage);
            setInputMessage('');
        } catch (error: any) {
            console.error('Failed to send message:', error);
            setError(`Failed to send message: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Start voice recording
    const startVoiceRecording = () => {
        if (!isConnected) return;
        
        try {
            conversationService.current.startVoiceRecording();
            setIsRecording(true);
        } catch (error: any) {
            console.error('Failed to start recording:', error);
            setError(`Failed to start recording: ${error.message}`);
        }
    };

    // Stop voice recording
    const stopVoiceRecording = () => {
        try {
            conversationService.current.stopVoiceRecording();
            setIsRecording(false);
        } catch (error: any) {
            console.error('Failed to stop recording:', error);
            setError(`Failed to stop recording: ${error.message}`);
        }
    };

    // Play audio
    const playAudio = (audioBase64: string) => {
        try {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }

            const audioBlob = new Blob([Buffer.from(audioBase64, 'base64')], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);
            audio.onpause = () => setIsPlaying(false);
            
            audio.play();
            setCurrentAudio(audio);
        } catch (error) {
            console.error('Failed to play audio:', error);
            setError('Failed to play audio');
        }
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendTextMessage();
        }
    };

    // Handle language change
    const handleLanguageChange = (language: 'english' | 'russian' | 'arabic') => {
        setSelectedLanguage(language);
        if (isConnected) {
            stopConversation().then(() => {
                setTimeout(() => startConversation(), 1000);
            });
        }
    };

    // Initialize conversation when component mounts
    useEffect(() => {
        if (isOpen && !isConnected && !isLoading) {
            startConversation();
        }
    }, [isOpen, isConnected, isLoading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (currentAudio) {
                currentAudio.pause();
            }
            if (isConnected) {
                stopConversation();
            }
        };
    }, []);

    // Handle outside clicks
    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, []);

    const toggleRecording = useCallback(() => {
        if (!isConnected) return;
        
        if (isRecording) {
            conversationService.stopVoiceRecording();
        } else {
            conversationService.startVoiceRecording();
        }
    }, [isRecording, isConnected, conversationService]);

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:from-violet-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-110 z-50"
                >
                    <Bot className="w-8 h-8" />
                </button>
            )}

            {/* Neon Glass Chat Interface */}
            <aside id="ai-teacher-menu" ref={menuRef} className={isOpen ? 'open' : ''}>
                <span className="shine shine-top"></span>
                <span className="shine shine-bottom"></span>
                <span className="glow glow-top"></span>
                <span className="glow glow-bottom"></span>

                <div className="inner">
                    <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Bot size={20}/> 
                            Streaming AI Assistant
                            {isConnected && (
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsOpen(false)}><X size={20}/></button>
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div className="p-3 border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-2">
                            <span className="text-white text-sm">Language:</span>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => handleLanguageChange(e.target.value as 'english' | 'russian' | 'arabic')}
                                className="bg-white/10 text-white border border-white/20 rounded px-2 py-1 text-sm"
                            >
                                <option value="english">English</option>
                                <option value="russian">Russian</option>
                                <option value="arabic">Arabic</option>
                            </select>
                        </div>
                    </div>

                    {/* Connection Status */}
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg mx-4 mt-2">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isUser ? 'bg-violet-500/50' : 'bg-white/10'}`}>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        {msg.type === 'tts' && msg.audio && (
                                            <button
                                                onClick={() => playAudio(msg.audio!)}
                                                disabled={isPlaying}
                                                className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                                            >
                                                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className={`text-xs ${msg.isUser ? 'text-violet-200' : 'text-slate-400'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {msg.type && (
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                msg.type === 'speech' ? 'bg-blue-500/30 text-blue-300' :
                                                msg.type === 'text' ? 'bg-green-500/30 text-green-300' :
                                                msg.type === 'llm' ? 'bg-purple-500/30 text-purple-300' :
                                                'bg-orange-500/30 text-orange-300'
                                            }`}>
                                                {msg.type.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 text-white p-3 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-xs text-white/70">Processing...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Voice Recording Controls */}
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={toggleRecording}
                            disabled={!isConnected || isProcessing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                isRecording 
                                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } ${!isConnected || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isRecording ? (
                                <>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${audioLevel > 0.3 ? 'bg-red-400' : 'bg-red-200'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ${audioLevel > 0.5 ? 'bg-red-400' : 'bg-red-200'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ${audioLevel > 0.7 ? 'bg-red-400' : 'bg-red-200'}`}></div>
                                    </div>
                                    <Mic className="w-4 h-4" />
                                </>
                            ) : (
                                <Mic className="w-4 h-4" />
                            )}
                            {isRecording ? 'Recording...' : 'Start Recording'}
                        </button>
                        
                        {/* Test TTS Button */}
                        <button
                            onClick={async () => {
                                if (!isConnected) return;
                                try {
                                    // Send a test message that will trigger TTS
                                    await conversationService.current.sendTextMessage("Hello there! This is a test of the ElevenLabs TTS system. How are you doing today?");
                                } catch (error) {
                                    console.error('TTS test failed:', error);
                                    setError('TTS test failed: ' + error.message);
                                }
                            }}
                            disabled={!isConnected}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isPlaying ? 'bg-green-600 text-white animate-pulse' : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                        >
                            <Volume2 className="w-4 h-4" />
                            {isPlaying ? 'Playing TTS...' : 'Test TTS'}
                        </button>
                        
                        {recordingStatus && (
                            <span className={`text-sm px-3 py-1 rounded-full ${
                                recordingStatus === 'Recording...' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {recordingStatus}
                            </span>
                        )}
                        
                        {isProcessing && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                Processing...
                            </div>
                        )}
                    </div>

                    {/* Text Input */}
                    <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            placeholder={isConnected ? "Type your message here..." : "Connecting..."}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={!isConnected || isLoading}
                            className="flex-1"
                        />
                        <button 
                            onClick={sendTextMessage}
                            disabled={!inputMessage.trim() || !isConnected || isLoading}
                            className="p-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
                        >
                            <Send size={18} className="text-white" />
                        </button>
                    </div>

                    {/* Connection Status */}
                    <div className="text-center text-xs mt-2">
                        {isConnected ? (
                            <span className="text-green-400">Connected - Streaming Active</span>
                        ) : isLoading ? (
                            <span className="text-yellow-400">Connecting...</span>
                        ) : (
                            <span className="text-red-400">Disconnected</span>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default StreamingConversationAssistant; 