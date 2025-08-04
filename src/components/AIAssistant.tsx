import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
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

const AIAssistant: React.FC = () => {
    // Modal state for the floating interface
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Conversations state
    const [conversations, setConversations] = useState<Record<string, Conversation>>({
        'default': {
            id: 'default',
            title: 'New Conversation',
            messages: [],
            timestamp: new Date()
        }
    });
    const activeConversation = 'default';
    
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // ElevenLabs conversation state (this is now our main conversation mode)
    const [useElevenLabs, setUseElevenLabs] = useState(false);

    // Tab state for fullscreen mode
    const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'tools' | 'settings'>('chat');

    // Language state
    const [selectedLanguage, setSelectedLanguage] = useState('english');

    // Mute state for voice responses
    const [isMuted, setIsMuted] = useState(false);
    
    // Complete language support (40+ languages as per AssemblyAI integration)
    const languages = [
        // Primary High-Accuracy Languages
        { code: 'english', name: 'English', flag: '🇺🇸' },
        { code: 'spanish', name: 'Español', flag: '🇪🇸' },
        { code: 'french', name: 'Français', flag: '🇫🇷' },
        { code: 'german', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'italian', name: 'Italiano', flag: '🇮🇹' },
        { code: 'portuguese', name: 'Português', flag: '🇵🇹' },
        { code: 'russian', name: 'Русский', flag: '🇷🇺' },
        { code: 'japanese', name: '日本語', flag: '🇯🇵' },
        { code: 'chinese', name: '中文', flag: '🇨🇳' },
        { code: 'korean', name: '한국어', flag: '🇰🇷' },
        
        // European Languages
        { code: 'dutch', name: 'Nederlands', flag: '🇳🇱' },
        { code: 'polish', name: 'Polski', flag: '🇵🇱' },
        { code: 'swedish', name: 'Svenska', flag: '🇸🇪' },
        { code: 'norwegian', name: 'Norsk', flag: '🇳🇴' },
        { code: 'danish', name: 'Dansk', flag: '🇩🇰' },
        { code: 'finnish', name: 'Suomi', flag: '🇫🇮' },
        { code: 'czech', name: 'Čeština', flag: '🇨🇿' },
        { code: 'hungarian', name: 'Magyar', flag: '🇭🇺' },
        { code: 'romanian', name: 'Română', flag: '🇷🇴' },
        { code: 'bulgarian', name: 'Български', flag: '🇧🇬' },
        { code: 'croatian', name: 'Hrvatski', flag: '🇭🇷' },
        { code: 'slovak', name: 'Slovenčina', flag: '🇸🇰' },
        { code: 'ukrainian', name: 'Українська', flag: '🇺🇦' },
        { code: 'greek', name: 'Ελληνικά', flag: '🇬🇷' },
        
        // Middle East & Africa
        { code: 'arabic', name: 'العربية', flag: '🇸🇦' },
        { code: 'turkish', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'hebrew', name: 'עברית', flag: '🇮🇱' },
        
        // Central Asia
        { code: 'kazakh', name: 'Қазақша', flag: '🇰🇿' },
        { code: 'uzbek', name: 'Oʻzbekcha', flag: '🇺🇿' },
        { code: 'tajik', name: 'Тоҷикӣ', flag: '🇹🇯' },
        { code: 'azerbaijani', name: 'Azərbaycan', flag: '🇦🇿' },
        
        // South & Southeast Asia
        { code: 'hindi', name: 'हिन्दी', flag: '🇮🇳' },
        { code: 'urdu', name: 'اردو', flag: '🇵🇰' },
        { code: 'thai', name: 'ไทย', flag: '🇹🇭' },
        { code: 'vietnamese', name: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'indonesian', name: 'Bahasa Indonesia', flag: '🇮🇩' },
        { code: 'malay', name: 'Bahasa Melayu', flag: '🇲🇾' },
        { code: 'filipino', name: 'Filipino', flag: '🇵🇭' },
        
        // Other Languages  
        { code: 'catalan', name: 'Català', flag: '🇪🇸' },
        { code: 'galician', name: 'Galego', flag: '🇪🇸' },
        { code: 'basque', name: 'Euskera', flag: '🇪🇸' },
        { code: 'estonian', name: 'Eesti', flag: '🇪🇪' },
        { code: 'latvian', name: 'Latviešu', flag: '🇱🇻' },
        { code: 'lithuanian', name: 'Lietuvių', flag: '🇱🇹' },
        { code: 'slovenian', name: 'Slovenščina', flag: '🇸🇮' },
        { code: 'macedonian', name: 'Македонски', flag: '🇲🇰' },
        { code: 'bosnian', name: 'Bosanski', flag: '🇧🇦' },
        { code: 'cantonese', name: '粵語', flag: '🇭🇰' },

        // Auto-detection
        { code: 'auto', name: '🌐 Auto-Detect', flag: '🌍' }
    ];
    
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

    // Modal control functions
    const toggleModal = () => {
        setIsOpen(!isOpen);
    };

    const closeModal = () => {
        setIsOpen(false);
        setIsFullscreen(false);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Mute/Unmute function for voice responses
    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (!isMuted) {
            // If we're muting, stop any current ElevenLabs conversation
            if (useElevenLabs) {
                setUseElevenLabs(false);
                addMessageToConversation(activeConversation, { 
                    text: "🔇 Voice responses muted. ElevenLabs conversation ended.",
                    isUser: false, 
                    timestamp: new Date() 
                });
            }
        } else {
            // If we're unmuting, we can trigger ElevenLabs if desired
            addMessageToConversation(activeConversation, { 
                text: "🔊 Voice responses unmuted. You can now use ElevenLabs voice chat!",
                isUser: false, 
                timestamp: new Date() 
            });
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
                            body: JSON.stringify({ 
                                audio: base64Audio,
                                language: selectedLanguage // Pass the selected language to transcription
                            })
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
        <>
            {/* Floating Plasma Ball Trigger Button */}
            <div 
                className="fixed bottom-6 right-6 z-50 cursor-pointer group"
                onClick={toggleModal}
                title="Open AI Assistant"
            >
                <div className="relative">
                    <PlasmaBall 
                        size={56}
                        className="transition-transform group-hover:scale-110"
                        intensity={useElevenLabs ? 1.5 : 0.8}
                    />
                    {useElevenLabs && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/70 whitespace-nowrap">
                        💬 AI Chat
                    </div>
                </div>
            </div>

            {/* Glasomorphic Modal Interface */}
            <div 
                id="ai-teacher-menu" 
                className={`${isOpen ? 'open' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
            >
                <div className="inner">
                    {/* Header - Different styles for fullscreen vs normal */}
                    {isFullscreen ? (
                        <div className="ai-fullscreen-header">
                            <div className="ai-fullscreen-title">
                                <PlasmaBall size={32} className="animate-pulse" />
                                <span>AI Assistant</span>
                            </div>
                            <div className="ai-plasma-central">
                                <div className={`plasma-fullscreen-container ${useElevenLabs ? 'conversation-active' : ''}`}>
                                    <PlasmaBall size={120} intensity={useElevenLabs ? 2.0 : 1.2} />
                                    {/* Smoke-like pulsation effects around the ball */}
                                    {useElevenLabs && (
                                        <>
                                            <div className="plasma-smoke smoke-ring-1"></div>
                                            <div className="plasma-smoke smoke-ring-2"></div>
                                            <div className="plasma-smoke smoke-ring-3"></div>
                                            <div className="plasma-smoke smoke-ring-4"></div>
                                            <div className="plasma-smoke smoke-ring-5"></div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="ai-fullscreen-controls">
                                {/* Language Selector for Fullscreen */}
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="ai-fullscreen-button"
                                    title="Select Language"
                                    style={{ minWidth: '140px' }}
                                >
                                    {languages.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.name}
                                        </option>
                                    ))}
                                </select>
                                {/* Mute/Unmute Button for Fullscreen */}
                                <button 
                                    className={`ai-fullscreen-button ${isMuted ? 'muted' : ''}`}
                                    onClick={toggleMute}
                                    title={isMuted ? 'Unmute Voice Responses' : 'Mute Voice Responses'}
                                    style={{ color: isMuted ? '#ef4444' : 'inherit' }}
                                >
                                    {isMuted ? '🔇 Muted' : '🔊 Voice'}
                                </button>
                                <button 
                                    className="ai-fullscreen-button"
                                    onClick={toggleFullscreen}
                                    title="Exit Fullscreen"
                                >
                                    ⤡ Exit Fullscreen
                                </button>
                                <button 
                                    className="ai-fullscreen-button"
                                    onClick={closeModal}
                                    title="Close"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="ai-header">
                            <div className="ai-header-title">
                                <PlasmaBall size={28} className="animate-pulse" />
                                <span>AI Assistant</span>
                            </div>
                            <div className="ai-header-controls">
                                {/* Language Selector */}
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="ai-language-selector"
                                    title="Select Language"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.name}
                                        </option>
                                    ))}
                                </select>
                                {/* Mute/Unmute Button for Small Mode */}
                                <button 
                                    className={`ai-control-btn ${isMuted ? 'muted' : ''}`}
                                    onClick={toggleMute}
                                    title={isMuted ? 'Unmute Voice Responses' : 'Mute Voice Responses'}
                                    style={{ color: isMuted ? '#ef4444' : 'inherit' }}
                                >
                                    {isMuted ? '🔇' : '🔊'}
                                </button>
                                <button 
                                    className="ai-control-btn"
                                    onClick={toggleFullscreen}
                                    title="Fullscreen"
                                >
                                    ⤢
                                </button>
                                <button 
                                    className="ai-control-btn"
                                    onClick={closeModal}
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tabs (only show in fullscreen mode) */}
                    {isFullscreen && (
                        <div className="ai-context-tabs">
                            <button 
                                className={`ai-context-tab ${activeTab === 'chat' ? 'active' : ''}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                💬 Chat
                            </button>
                            <button 
                                className={`ai-context-tab ${activeTab === 'voice' ? 'active' : ''}`}
                                onClick={() => setActiveTab('voice')}
                            >
                                🎤 Voice
                            </button>
                            <button 
                                className={`ai-context-tab ${activeTab === 'tools' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tools')}
                            >
                                🛠️ Tools
                            </button>
                            <button 
                                className={`ai-context-tab ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                ⚙️ Settings
                            </button>
                        </div>
                    )}

                    {/* Chat Area - Show different content based on active tab */}
                    <div className="ai-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        
                        {/* Tab Content */}
                        {isFullscreen && activeTab === 'voice' && (
                            <div className="tab-content-voice p-6 text-center">
                                <h3 className="text-xl font-bold mb-4">🎤 Voice Mode</h3>
                                <p className="text-sm opacity-80 mb-6">Advanced voice controls and conversation settings</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <h4 className="font-semibold mb-2">🗣️ ElevenLabs</h4>
                                        <p className="text-xs opacity-70">Real-time AI conversation</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <h4 className="font-semibold mb-2">🎧 Voice Recording</h4>
                                        <p className="text-xs opacity-70">Traditional voice messages</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {isFullscreen && activeTab === 'tools' && (
                            <div className="tab-content-tools p-6 text-center">
                                <h3 className="text-xl font-bold mb-4">🛠️ Tools & Features</h3>
                                <p className="text-sm opacity-80 mb-6">AI capabilities and utilities</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <h4 className="font-semibold mb-2">🎨 Image Generation</h4>
                                        <p className="text-xs opacity-70">Create images with AI</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <h4 className="font-semibold mb-2">💬 Text Analysis</h4>
                                        <p className="text-xs opacity-70">Advanced text processing</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {isFullscreen && activeTab === 'settings' && (
                            <div className="tab-content-settings p-6">
                                <h3 className="text-xl font-bold mb-4">⚙️ Settings</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <h4 className="font-semibold mb-2">🌐 Language Settings</h4>
                                        <p className="text-sm opacity-80 mb-3">Current: {languages.find(lang => lang.code === selectedLanguage)?.flag} {languages.find(lang => lang.code === selectedLanguage)?.name}</p>
                                        <select
                                            value={selectedLanguage}
                                            onChange={(e) => setSelectedLanguage(e.target.value)}
                                            className="w-full p-2 bg-white/10 rounded-lg border border-white/20"
                                        >
                                            {languages.map(lang => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag} {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <h4 className="font-semibold mb-2">🔊 Audio Settings</h4>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!isMuted}
                                                onChange={toggleMute}
                                                className="rounded"
                                            />
                                            <span>Enable voice responses</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Enhanced ElevenLabs Conversation Mode Indicator */}
                        {useElevenLabs && !isFullscreen && (
                            <div className="conversation-mode-indicator">
                                <PlasmaBall size={24} className="animate-pulse" />
                                <div className="flex flex-col">
                                    <span className="font-semibold">🎯 ElevenLabs Conversation Mode Active</span>
                                    <span className="text-xs opacity-80">Real-time voice conversation with official ElevenLabs AI</span>
                                </div>
                                {/* Animated Waveform for non-fullscreen */}
                                <div className={`conversation-waveform ${useElevenLabs ? 'active' : ''}`}>
                                    <div className="waveform-bar"></div>
                                    <div className="waveform-bar"></div>
                                    <div className="waveform-bar"></div>
                                    <div className="waveform-bar"></div>
                                    <div className="waveform-bar"></div>
                                    <div className="waveform-bar"></div>
                                    <div className="waveform-bar"></div>
                                    <div className="waveform-bar"></div>
                                </div>
                            </div>
                        )}
                        
                        {/* Fullscreen conversation status */}
                        {useElevenLabs && isFullscreen && (
                            <div className="fullscreen-conversation-status">
                                <div className="status-text">
                                    <h3 className="text-xl font-bold text-center mb-2">🎯 Live AI Conversation</h3>
                                    <p className="text-center opacity-80">Speak naturally - the AI is listening and will respond with voice</p>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="messages-container" style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
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

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                                    placeholder="Type your message..."
                                    className="flex-1 p-3 ai-input-field rounded-lg"
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
                                
                                {/* ElevenLabs Conversation Button */}
                                <div className={`plasma-ball-conversation-container ${useElevenLabs ? 'active streaming' : ''} ${isMuted ? 'muted' : ''}`}>
                                    {!isMuted ? (
                                        <ElevenLabsConversation
                                            onMessage={handleElevenLabsMessage}
                                            onError={handleElevenLabsError}
                                            onConnect={handleElevenLabsConnect}
                                            onDisconnect={handleElevenLabsDisconnect}
                                            selectedLanguage={selectedLanguage}
                                        />
                                    ) : (
                                        <div 
                                            className="plasma-ball-muted"
                                            onClick={() => {
                                                addMessageToConversation(activeConversation, { 
                                                    text: "🔇 Voice responses are muted. Click the mute button in the header to enable voice chat.",
                                                    isUser: false, 
                                                    timestamp: new Date() 
                                                });
                                            }}
                                            title="Voice responses are muted"
                                        >
                                            <PlasmaBall 
                                                size={36}
                                                className="muted-plasma-ball"
                                                intensity={0.2}
                                            />
                                            <span className="plasma-label text-red-400">🔇 Muted</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Voice Recording Button */}
                                <button
                                    onClick={toggleVoiceRecording}
                                    className={`ai-mode-button ${isRecording ? 'recording' : ''}`}
                                    title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                                    disabled={isLoading}
                                >
                                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AIAssistant;