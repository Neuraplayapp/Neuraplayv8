import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Volume2, VolumeX, Sparkles, Crown, Star, Settings, Home, Gamepad2, Users, FileText, User, BarChart3, Info, Brain, Zap, Target, TrendingUp, Lightbulb, RotateCcw, Play, Pause, HelpCircle, Award, Clock, Activity, Maximize2, Minimize2, MessageSquare, History, Mic, MicOff, Bell, Globe, Shield, Calculator, BookOpen, Palette, Music, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { AblyConversationService } from '../services/AblyConversationService';
import { getAgentId, getVoiceId } from '../config/elevenlabs';
import { useAIAgent } from '../contexts/AIAgentContext';
import { useUser } from '../contexts/UserContext';
import { base64ToBinary } from '../utils/videoUtils';

import PlasmaBall from './PlasmaBall';
import './AIAssistant.css';

interface Message {
    text: string;
    isUser: boolean;
    timestamp: Date;
    image?: string;
    action?: 'navigation' | 'settings' | 'info' | 'agent' | 'game';
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    timestamp: Date;
    context?: string;
}

// Define the assistant modes for cleaner state management
type AssistantMode = 'idle' | 'text_input' | 'single_recording' | 'conversing';

// Language selection states and constants
type LanguageCode = 'auto' | 'en' | 'en_us' | 'en_uk' | 'es' | 'fr' | 'de' | 'id' | 'it' | 'ja' | 'nl' | 'pl' | 'pt' | 'ru' | 'tr' | 'uk' | 'ca' | 'ar' | 'az' | 'bg' | 'bs' | 'zh' | 'cs' | 'da' | 'el' | 'et' | 'fi' | 'fil' | 'gl' | 'hi' | 'hr' | 'hu' | 'ko' | 'mk' | 'ms' | 'nb' | 'ro' | 'sk' | 'sv' | 'th' | 'ur' | 'vi' | 'yue';
const SUPPORTED_LANGUAGES: Record<LanguageCode, string> = {
    'auto': '🌍 Auto-Detect',
    // High accuracy languages (≤ 10% WER)
    'en': 'English',
    'en_us': 'English (US)',
    'en_uk': 'English (UK)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'id': 'Indonesian',
    'it': 'Italian',
    'ja': 'Japanese',
    'nl': 'Dutch',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'ca': 'Catalan',
    // Good accuracy languages (>10% to ≤25% WER)
    'ar': 'Arabic',
    'az': 'Azerbaijani',
    'bg': 'Bulgarian',
    'bs': 'Bosnian',
    'zh': 'Chinese (Mandarin)',
    'cs': 'Czech',
    'da': 'Danish',
    'el': 'Greek',
    'et': 'Estonian',
    'fi': 'Finnish',
    'fil': 'Filipino',
    'gl': 'Galician',
    'hi': 'Hindi',
    'hr': 'Croatian',
    'hu': 'Hungarian',
    'ko': 'Korean',
    'mk': 'Macedonian',
    'ms': 'Malay',
    'nb': 'Norwegian',
    'ro': 'Romanian',
    'sk': 'Slovak',
    'sv': 'Swedish',
    'th': 'Thai',
    'ur': 'Urdu',
    'vi': 'Vietnamese',
    'yue': 'Cantonese'
};

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeConversation, setActiveConversation] = useState<string>('current');
    const [conversations, setConversations] = useState<{ [key: string]: Conversation }>({
        current: {
            id: 'current',
            title: 'Current Chat',
            messages: [
                { 
                    text: "🌟 Hi there! I'm Synapse, your friendly AI teacher! 🚀 I can help you with learning, games, navigation, settings, AI agent control, and accessibility needs. What would you like to explore today? 🎮✨", 
                    isUser: false, 
                    timestamp: new Date() 
                }
            ],
            timestamp: new Date()
        }
    });
    
    const menuRef = useRef<HTMLDivElement>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const [promptCount, setPromptCount] = useState(0);
    const [isReadingLastMessage, setIsReadingLastMessage] = useState(false);
    
    // WebSocket service instance
    const conversationService = useRef<AblyConversationService>(AblyConversationService.getInstance());
    
    // NEW: Single mode state instead of multiple booleans
    const [mode, setMode] = useState<AssistantMode>('idle');
    const modeRef = useRef<AssistantMode>('idle'); // Add ref to track current mode
    
    // Voice recording states (simplified)
    const [isPlasmaPressed, setIsPlasmaPressed] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const streamingTranscriptionRef = useRef<any>(null);

    // Chunked voice generation system
    const [voiceChunks, setVoiceChunks] = useState<string[]>([]);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const voiceChunkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Language selection states and constants
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('auto'); // Default to auto-detect
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    // Language selection handlers
    const toggleLanguageDropdown = () => setShowLanguageDropdown(prev => !prev);
    const handleLanguageSelect = (code: LanguageCode) => {
        setSelectedLanguage(code);
        setShowLanguageDropdown(false);
    };
    
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { triggerAgent, showAgent, hideAgent, currentContext, updateContext } = useAIAgent();
    const { user } = useUser();
    
    // Remove limits for DemoUser
    const isDemoUser = user?.username === 'DemoUser';

    // Debug MediaRecorder on mount
    useEffect(() => {
        debugMediaRecorder();
    }, []);

    // Get current messages based on active conversation
    const currentMessages = conversations[activeConversation]?.messages || [];

    // Available pages and their descriptions
    const availablePages = {
        '/': { name: 'Home', icon: Home, description: 'Main landing page' },
        '/playground': { name: 'Playground', icon: Gamepad2, description: 'Games and activities' },
        '/dashboard': { name: 'Dashboard', icon: BarChart3, description: 'Your learning progress' },
        '/forum': { name: 'Forum', icon: Users, description: 'Community discussions' },
        '/forum-registration': { name: 'Forum Registration', icon: FileText, description: 'Join the forum' },
        '/registration': { name: 'Registration', icon: User, description: 'Create an account' },
        '/signin': { name: 'Sign In', icon: User, description: 'Login to your account' },
        '/ai-report': { name: 'AI Report', icon: BarChart3, description: 'AI learning analytics' },
        '/about': { name: 'About Us', icon: Info, description: 'Learn about NeuraPlay' },
        '/counting-test': { name: 'Counting Test', icon: Gamepad2, description: 'Math practice' },
        '/test': { name: 'Test Page', icon: Gamepad2, description: 'Testing features' },
        '/text-reveal': { name: 'Text Reveal', icon: Sparkles, description: 'Text animations' },
        '/old-home': { name: 'Old Home', icon: Home, description: 'Previous home page' },
        '/profile': { name: 'Profile', icon: User, description: 'Your user profile' },
        '/user-profile': { name: 'User Profile', icon: User, description: 'Detailed user profile' }
    };

    // Available settings and their descriptions - COMPLETE LIST
    const availableSettings = {
        'theme': { name: 'Theme', icon: Settings, description: 'Change light/dark mode' },
        'accessibility': { name: 'Accessibility', icon: Target, description: 'Accessibility settings' },
        'notifications': { name: 'Notifications', icon: Bell, description: 'Notification preferences' },
        'language': { name: 'Language', icon: Globe, description: 'Language settings' },
        'privacy': { name: 'Privacy', icon: Shield, description: 'Privacy settings' },
        'help': { name: 'Help', icon: HelpCircle, description: 'Help and support' },
        'about': { name: 'About', icon: Info, description: 'About NeuraPlay' }
    };

    // Environment detection functions
    const isNetlify = () => {
        return window.location.hostname.includes('netlify') ||
               window.location.hostname.includes('localhost') ||
               window.location.hostname.includes('127.0.0.1');
    };

    const isRender = () => {
        return window.location.hostname.includes('onrender');
    };

    // Available games and their descriptions
    const availableGames = {
        'counting': { name: 'Counting Adventure', icon: Gamepad2, description: 'Learn to count with fun games' },
        'memory': { name: 'Memory Match', icon: Brain, description: 'Test your memory skills' },
        'puzzle': { name: 'Puzzle Challenge', icon: Target, description: 'Solve brain teasers' },
        'math': { name: 'Math Fun', icon: Calculator, description: 'Practice math skills' },
        'spelling': { name: 'Spelling Bee', icon: BookOpen, description: 'Learn to spell' },
        'science': { name: 'Science Lab', icon: Lightbulb, description: 'Explore science experiments' },
        'art': { name: 'Art Studio', icon: Palette, description: 'Create digital art' },
        'music': { name: 'Music Maker', icon: Music, description: 'Make music and rhythms' }
    };

    // Available AI agent personalities
    const availablePersonalities = {
        'synapse-normal': { name: 'Synapse Normal', icon: Brain, description: 'Friendly and helpful AI teacher' },
        'coach': { name: 'Coach', icon: Target, description: 'Motivational and goal-oriented' },
        'mentor': { name: 'Mentor', icon: Lightbulb, description: 'Wise and guiding' },
        'friend': { name: 'Friend', icon: Heart, description: 'Supportive and casual' },
        'analyst': { name: 'Analyst', icon: BarChart3, description: 'Detailed and analytical' }
    };

    // AI Agent commands and their descriptions
    const aiAgentCommands = {
        'show': { name: 'Show AI Agent', description: 'Display the AI agent', keywords: ['show', 'open', 'display', 'bring', 'activate'] },
        'hide': { name: 'Hide AI Agent', description: 'Hide the AI agent', keywords: ['hide', 'close', 'remove', 'dismiss', 'stop'] },
        'trigger': { name: 'Trigger AI Agent', description: 'Activate AI agent with specific trigger', keywords: ['trigger', 'activate', 'start', 'begin', 'launch'] },
        'personality': { name: 'Change AI Personality', description: 'Change AI agent personality', keywords: ['personality', 'style', 'mood', 'character'] },
        'context': { name: 'Update Context', description: 'Update AI agent context', keywords: ['context', 'update', 'set', 'change'] },
        'coach': { name: 'Coach Mode', description: 'Set AI to coach personality', keywords: ['coach', 'teacher', 'instructor'] },
        'mentor': { name: 'Mentor Mode', description: 'Set AI to mentor personality', keywords: ['mentor', 'guide', 'advisor'] },
        'friend': { name: 'Friend Mode', description: 'Set AI to friend personality', keywords: ['friend', 'buddy', 'pal'] },
        'analyst': { name: 'Analyst Mode', description: 'Set AI to analyst personality', keywords: ['analyst', 'analyzer', 'researcher'] }
    };

    // Child-friendly prompt suggestions
    const childPrompts = [
        "Tell me a fun fact about space! 🌟",
        "What's the coolest animal you know? 🦁",
        "Can you help me with my homework? 📚",
        "Tell me a joke! 😄",
        "What's your favorite color? 🎨",
        "How do plants grow? 🌱",
        "What makes rainbows? 🌈",
        "Tell me about dinosaurs! 🦕",
        "How do computers work? 💻",
        "What's the biggest ocean? 🌊",
        "Can you teach me to count? 🔢",
        "What's the weather like? ☀️",
        "Tell me about the planets! 🪐",
        "How do birds fly? 🦅",
        "What's your favorite food? 🍕"
    ];

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Create new conversation
    const createNewConversation = () => {
        const newId = `conv_${Date.now()}`;
        const newConversation: Conversation = {
            id: newId,
            title: `Chat ${Object.keys(conversations).length}`,
            messages: [
                { 
                    text: "🌟 Hi there! I'm Synapse, your friendly AI teacher! 🚀 What would you like to explore today? 🎮✨", 
                    isUser: false, 
                    timestamp: new Date() 
                }
            ],
            timestamp: new Date()
        };
        
        setConversations(prev => ({
            ...prev,
            [newId]: newConversation
        }));
        setActiveConversation(newId);
    };

    // Update conversation title
    const updateConversationTitle = (conversationId: string, title: string) => {
        setConversations(prev => ({
            ...prev,
            [conversationId]: {
                ...prev[conversationId],
                title
            }
        }));
    };

    // Add message to current conversation
    const addMessageToConversation = (conversationId: string, message: Message) => {
        setConversations(prev => ({
            ...prev,
            [conversationId]: {
                ...prev[conversationId],
                messages: [...prev[conversationId].messages, message]
            }
        }));
    };

    useEffect(() => {
        // This effect handles closing the menu if clicked outside
        const handlePointerDown = (event: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, []);

    // Update ref whenever mode changes
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    // Conversation service event handlers
    useEffect(() => {
        const service = conversationService.current;
        
        // Handle conversation ready
        service.on('conversation_ready', (data) => {
            console.log('Conversation ready with ElevenLabs');
            addMessageToConversation(activeConversation, { 
                text: "Voice conversation ready! Start speaking! 🎤", 
                isUser: false, 
                timestamp: new Date() 
            });
        });

        // Handle AI responses
        service.on('ai_response', (data) => {
            console.log('📥 Received AI response:', data);
            console.log('📥 Response has text:', !!data.text);
            console.log('📥 Response has audio:', !!data.audio);
            console.log('📥 Response type:', data.type);
            console.log('📥 Full response keys:', Object.keys(data));
            
            if (data.text) {
                console.log('📝 Processing text response:', data.text);
                const aiMessage = { 
                    text: data.text, 
                    isUser: false, 
                    timestamp: new Date() 
                };
                addMessageToConversation(activeConversation, aiMessage);
                
                // Generate TTS if needed
                if (data.needsTTS) {
                    console.log('🎤 Generating TTS for response...');
                    generateAndPlayTTS(data.text, data.voiceId || '8LVfoRdkh4zgjr8v5ObE');
                }
            }
            
            // Handle different types of audio responses
            if (data.type === 'audio_chunk') {
                console.log(`🔊 Processing audio chunk ${data.chunkIndex + 1}/${data.totalChunks}`);
                // Store audio chunks for later assembly
                if (!(window as any).audioChunks) (window as any).audioChunks = [];
                (window as any).audioChunks.push(data.audio);
                
            } else if (data.type === 'audio_complete') {
                console.log('🔊 Audio complete, assembling chunks...');
                if ((window as any).audioChunks && (window as any).audioChunks.length > 0) {
                    const completeAudio = (window as any).audioChunks.join('');
                    (window as any).audioChunks = []; // Clear for next response
                    
                    try {
                        const audioBlob = new Blob(
                            [Uint8Array.from(atob(completeAudio), c => c.charCodeAt(0))], 
                            { type: 'audio/mpeg' }
                        );
                        console.log('🔊 Complete audio blob created, size:', audioBlob.size);
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        
                        audio.onloadstart = () => console.log('🔊 Audio loading started');
                        audio.oncanplay = () => console.log('🔊 Audio can play');
                        audio.onplay = () => console.log('🔊 Audio playback started');
                        audio.onended = () => {
                            console.log('🔊 Audio playback ended');
                            URL.revokeObjectURL(audioUrl);
                        };
                        audio.onerror = (e) => console.error('🔊 Audio error:', e);
                        
                        audio.play().then(() => {
                            console.log('🔊 Audio play() succeeded');
                        }).catch(error => {
                            console.error('❌ Failed to play audio:', error);
                        });
                    } catch (error) {
                        console.error('❌ Error processing complete audio:', error);
                    }
                }
                
            } else if (data.audio) {
                // Handle single audio response (non-streaming)
                console.log('🔊 Processing single audio response, length:', data.audio.length);
                try {
                    const audioBlob = new Blob(
                        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], 
                        { type: 'audio/mpeg' }
                    );
                    console.log('🔊 Audio blob created, size:', audioBlob.size);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    
                    audio.onloadstart = () => console.log('🔊 Audio loading started');
                    audio.oncanplay = () => console.log('🔊 Audio can play');
                    audio.onplay = () => console.log('🔊 Audio playback started');
                    audio.onended = () => {
                        console.log('🔊 Audio playback ended');
                        URL.revokeObjectURL(audioUrl);
                    };
                    audio.onerror = (e) => console.error('🔊 Audio error:', e);
                    
                    audio.play().then(() => {
                        console.log('🔊 Audio play() succeeded');
                    }).catch(error => {
                        console.error('❌ Failed to play audio:', error);
                    });
                } catch (error) {
                    console.error('❌ Error processing audio response:', error);
                }
            } else {
                console.log('⚠️ No audio in response');
            }
        });

        // Handle status updates
        service.on('status', (data) => {
            console.log('📊 Status update:', data);
            console.log('📊 Current mode during status update:', mode);
            console.log('📊 Active conversation ID:', activeConversation);
            console.log('📊 Service has active conversation:', service.hasActiveConversation);
            
            if (data.type === 'connected') {
                console.log('✅ Service connected - conversation ready');
                console.log('✅ Mode should be conversing:', mode === 'conversing');
            } else if (data.type === 'disconnected') {
                console.log('❌ Service disconnected');
            } else if (data.type === 'error') {
                console.log('❌ Service error:', data);
            }
        });

        // Handle errors
        service.on('error', (data) => {
            console.error('Conversation error:', data);
            addMessageToConversation(activeConversation, { 
                text: "Connection error. Please try again.", 
                isUser: false, 
                timestamp: new Date() 
            });
        });

        // Cleanup on unmount
        return () => {
            if (service.hasActiveConversation) {
                service.endConversation();
            }
        };
    }, [activeConversation]);

    // Enhanced AI Agency Functions
    const analyzeCommand = (text: string): { type: 'navigation' | 'settings' | 'chat' | 'info' | 'agent' | 'game', action?: any } => {
        const lowerText = text.toLowerCase();
        
        // ENHANCED AI Agent commands with better natural language processing
        const agentKeywords = [
            'ai agent', 'agent', 'ai assistant', 'assistant', 'brain', 'synapse', 
            'ai teacher', 'teacher', 'ai', 'bot', 'helper', 'guide', 'tutor'
        ];
        
        const agentActionKeywords = [
            'show', 'open', 'display', 'bring', 'activate', 'hide', 'close', 'remove', 
            'dismiss', 'stop', 'trigger', 'start', 'begin', 'launch', 'wake', 'call',
            'summon', 'appear', 'disappear', 'go away', 'leave', 'come', 'help'
        ];
        
        const agentIntentKeywords = [
            'want', 'need', 'like', 'would like', 'can you', 'please', 'help me',
            'i want', 'i need', 'i would like', 'make it', 'put it', 'set it'
        ];
        
        // Enhanced agent detection - MUCH MORE SPECIFIC
        const hasAgentIntent = (
            // Must have explicit agent keywords AND action words
            (agentKeywords.some(keyword => lowerText.includes(keyword)) && 
             agentActionKeywords.some(action => lowerText.includes(action))) ||
            // OR very specific command patterns
            lowerText.includes('ai agent') || 
            lowerText.includes('ai assistant') ||
            lowerText.includes('show agent') ||
            lowerText.includes('hide agent') ||
            lowerText.includes('trigger agent')
        );
        
        if (hasAgentIntent) {
            // Show/hide agent commands with enhanced variations
            if (lowerText.includes('show') || lowerText.includes('open') || lowerText.includes('display') || 
                lowerText.includes('bring') || lowerText.includes('activate') || lowerText.includes('wake') ||
                lowerText.includes('summon') || lowerText.includes('appear') || lowerText.includes('come') ||
                lowerText.includes('help') || lowerText.includes('start')) {
                return { type: 'agent', action: { command: 'show' } };
            }
            
            if (lowerText.includes('hide') || lowerText.includes('close') || lowerText.includes('remove') || 
                lowerText.includes('dismiss') || lowerText.includes('stop') || lowerText.includes('go away') ||
                lowerText.includes('leave') || lowerText.includes('disappear')) {
                return { type: 'agent', action: { command: 'hide' } };
            }
            
            // Enhanced trigger agent commands with more variations
            if (lowerText.includes('trigger') || lowerText.includes('start') || lowerText.includes('begin') || 
                lowerText.includes('launch') || lowerText.includes('activate')) {
                let triggerType = 'manual';
                if (lowerText.includes('achievement') || lowerText.includes('success') || lowerText.includes('win')) {
                    triggerType = 'achievement';
                } else if (lowerText.includes('struggle') || lowerText.includes('difficulty') || lowerText.includes('problem') || lowerText.includes('stuck')) {
                    triggerType = 'struggle';
                } else if (lowerText.includes('milestone') || lowerText.includes('progress') || lowerText.includes('step')) {
                    triggerType = 'milestone';
                } else if (lowerText.includes('auto') || lowerText.includes('automatic')) {
                    triggerType = 'auto';
                } else if (lowerText.includes('stuck') || lowerText.includes('repeating')) {
                    triggerType = 'stuck';
                } else if (lowerText.includes('rapid') || lowerText.includes('fast') || lowerText.includes('quick')) {
                    triggerType = 'rapid';
                }
                
                return { type: 'agent', action: { command: 'trigger', triggerType } };
            }
            
            // Enhanced personality commands with more natural language
            const personalityKeywords = [
                'coach', 'mentor', 'friend', 'analyst', 'teacher', 'guide', 'buddy', 'pal',
                'instructor', 'advisor', 'companion', 'helper', 'tutor', 'trainer'
            ];
            
            const personality = personalityKeywords.find(keyword => lowerText.includes(keyword));
            if (personality) {
                let personalityType = personality;
                if (personality === 'teacher' || personality === 'instructor' || personality === 'trainer') {
                    personalityType = 'coach';
                } else if (personality === 'guide' || personality === 'advisor') {
                    personalityType = 'mentor';
                } else if (personality === 'buddy' || personality === 'pal' || personality === 'companion') {
                    personalityType = 'friend';
                }
                
                return { type: 'agent', action: { command: 'personality', personality: personalityType } };
            }
            
            // Default agent command - show agent if no specific action detected
            if (agentKeywords.some(keyword => lowerText.includes(keyword))) {
                return { type: 'agent', action: { command: 'show' } };
            }
        }
        
        // Enhanced Navigation commands - MUCH MORE SPECIFIC
        const navigationKeywords = ['go to', 'take me to', 'navigate to', 'open', 'get', 'list', 'show', 'search', 'bring', 'go', 'take me', 'remove', 'edit', 'visit', 'access'];
        
        // Common greetings and casual phrases that should NEVER be commands
        const casualPhrases = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'how are you doing', 'what\'s up', 'sup', 'yo', 'greetings', 'goodbye', 'bye', 'see you', 'thanks', 'thank you', 'cool', 'awesome', 'nice', 'ok', 'okay', 'yes', 'no', 'maybe', 'sure', 'alright', 'fine', 'good', 'bad', 'great', 'wow', 'omg', 'lol', 'haha', 'lmao'];
        
        // If it's a casual phrase, treat as chat
        if (casualPhrases.some(phrase => lowerText.includes(phrase))) {
            return { type: 'chat' };
        }
        
        // Only detect navigation if there's a VERY clear intent with specific patterns
        const hasNavigationIntent = (
            // Must have explicit navigation action AND page name
            (navigationKeywords.some(keyword => lowerText.includes(keyword)) && 
             Object.keys(availablePages).some(path => {
                const pageNameLower = availablePages[path as keyof typeof availablePages].name.toLowerCase();
                const pathName = path.replace('/', '');
                return lowerText.includes(pageNameLower) || lowerText.includes(pathName);
             })) ||
            // OR very specific command patterns
            lowerText.includes('go to dashboard') ||
            lowerText.includes('go to playground') ||
            lowerText.includes('go to forum') ||
            lowerText.includes('take me to dashboard') ||
            lowerText.includes('take me to playground') ||
            lowerText.includes('open dashboard') ||
            lowerText.includes('open playground')
        );
        
        if (hasNavigationIntent) {
            console.log('Navigation intent detected for:', lowerText);
            
            // Check for specific page matches - ALL PAGES
            for (const [path, page] of Object.entries(availablePages)) {
                const pageNameLower = page.name.toLowerCase();
                const pathName = path.replace('/', '');
                
                if (lowerText.includes(pageNameLower) || lowerText.includes(pathName)) {
                    console.log('Found page match:', path, page.name);
                    return { type: 'navigation', action: { path, page } };
                }
            }
            
            // Enhanced special navigation cases - ALL PAGES
            if (lowerText.includes('home') || lowerText.includes('main') || lowerText.includes('landing')) {
                return { type: 'navigation', action: { path: '/', page: availablePages['/'] } };
            }
            
            if (lowerText.includes('playground') || lowerText.includes('games') || lowerText.includes('activities')) {
                return { type: 'navigation', action: { path: '/playground', page: availablePages['/playground'] } };
            }
            
            if (lowerText.includes('learning central') || lowerText.includes('progress') || lowerText.includes('dashboard') || lowerText.includes('stats') || lowerText.includes('statistics')) {
                return { type: 'navigation', action: { path: '/dashboard', page: availablePages['/dashboard'] } };
            }
            
            if (lowerText.includes('forum') || lowerText.includes('community') || lowerText.includes('discussions')) {
                return { type: 'navigation', action: { path: '/forum', page: availablePages['/forum'] } };
            }
            
            if (lowerText.includes('register') || lowerText.includes('sign up') || lowerText.includes('create account')) {
                return { type: 'navigation', action: { path: '/registration', page: availablePages['/registration'] } };
            }
            
            if (lowerText.includes('sign in') || lowerText.includes('login') || lowerText.includes('log in')) {
                return { type: 'navigation', action: { path: '/signin', page: availablePages['/signin'] } };
            }
            
            if (lowerText.includes('ai report') || lowerText.includes('analytics') || lowerText.includes('ai analytics')) {
                return { type: 'navigation', action: { path: '/ai-report', page: availablePages['/ai-report'] } };
            }
            
            if (lowerText.includes('about') || lowerText.includes('about us')) {
                return { type: 'navigation', action: { path: '/about', page: availablePages['/about'] } };
            }
            
            if (lowerText.includes('counting') || lowerText.includes('math') || lowerText.includes('numbers')) {
                return { type: 'navigation', action: { path: '/counting-test', page: availablePages['/counting-test'] } };
            }
            
            if (lowerText.includes('test') || lowerText.includes('testing')) {
                return { type: 'navigation', action: { path: '/test', page: availablePages['/test'] } };
            }
            
            if (lowerText.includes('text reveal') || lowerText.includes('animations') || lowerText.includes('text animations')) {
                return { type: 'navigation', action: { path: '/text-reveal', page: availablePages['/text-reveal'] } };
            }
            
            if (lowerText.includes('profile') || lowerText.includes('user profile')) {
                return { type: 'navigation', action: { path: '/profile', page: availablePages['/profile'] } };
            }
            
            if (lowerText.includes('old home') || lowerText.includes('previous home')) {
                return { type: 'navigation', action: { path: '/old-home', page: availablePages['/old-home'] } };
            }
        }
        
        // Settings commands with expanded variations
        const settingsKeywords = ['settings', 'preferences', 'options', 'config', 'setup'];
        if (settingsKeywords.some(keyword => lowerText.includes(keyword))) {
            return { type: 'settings', action: 'open' };
        }
        
        // Theme settings with expanded variations
        const themeKeywords = ['theme', 'dark', 'light', 'mode', 'appearance'];
        const themeActionKeywords = ['make', 'put', 'bring', 'set', 'change', 'switch', 'turn', 'enable', 'use'];
        
        if (themeKeywords.some(keyword => lowerText.includes(keyword)) || 
            (themeActionKeywords.some(action => lowerText.includes(action)) && (lowerText.includes('dark') || lowerText.includes('light')))) {
            let themeValue = 'auto';
            if (lowerText.includes('dark')) themeValue = 'dark';
            else if (lowerText.includes('light')) themeValue = 'light';
            return { type: 'settings', action: { setting: 'theme', value: themeValue } };
        }
        
        // Font size settings with expanded variations
        const fontKeywords = ['font', 'text size', 'text', 'size', 'bigger', 'smaller'];
        const fontActionKeywords = ['make', 'put', 'bring', 'set', 'change', 'increase', 'decrease'];
        
        if (fontKeywords.some(keyword => lowerText.includes(keyword)) || 
            (fontActionKeywords.some(action => lowerText.includes(action)) && (lowerText.includes('large') || lowerText.includes('small') || lowerText.includes('big') || lowerText.includes('tiny')))) {
            let size = 'medium';
            if (lowerText.includes('large') || lowerText.includes('big')) size = 'large';
            else if (lowerText.includes('small') || lowerText.includes('tiny')) size = 'small';
            return { type: 'settings', action: { setting: 'fontSize', value: size } };
        }
        
        // Animation settings with expanded variations
        const animationKeywords = ['animation', 'motion', 'effects', 'transitions'];
        const animationActionKeywords = ['make', 'put', 'bring', 'set', 'change', 'enable', 'disable', 'turn'];
        
        if (animationKeywords.some(keyword => lowerText.includes(keyword)) || 
            (animationActionKeywords.some(action => lowerText.includes(action)) && (lowerText.includes('animation') || lowerText.includes('motion')))) {
            const enabled = !lowerText.includes('disable') && !lowerText.includes('off') && !lowerText.includes('stop');
            return { type: 'settings', action: { setting: 'animations', value: enabled ? 'enabled' : 'disabled' } };
        }
        
        // Sound settings with expanded variations
        const soundKeywords = ['sound', 'audio', 'volume', 'noise', 'voice'];
        const soundActionKeywords = ['make', 'put', 'bring', 'set', 'change', 'enable', 'disable', 'turn', 'mute'];
        
        if (soundKeywords.some(keyword => lowerText.includes(keyword)) || 
            (soundActionKeywords.some(action => lowerText.includes(action)) && (lowerText.includes('sound') || lowerText.includes('audio') || lowerText.includes('voice')))) {
            const enabled = !lowerText.includes('mute') && !lowerText.includes('off') && !lowerText.includes('disable');
            return { type: 'settings', action: { setting: 'sound', value: enabled ? 'enabled' : 'disabled' } };
        }

        // AI Agent settings
        const aiAgentSettingKeywords = ['ai agent', 'agent', 'ai assistant', 'assistant'];
        if (aiAgentSettingKeywords.some(keyword => lowerText.includes(keyword))) {
            const enabled = !lowerText.includes('disable') && !lowerText.includes('off') && !lowerText.includes('stop');
            return { type: 'settings', action: { setting: 'aiAgent', value: enabled ? 'enabled' : 'disabled' } };
        }

        // Notifications settings
        const notificationKeywords = ['notification', 'notify', 'alert', 'reminder'];
        if (notificationKeywords.some(keyword => lowerText.includes(keyword))) {
            const enabled = !lowerText.includes('disable') && !lowerText.includes('off') && !lowerText.includes('stop');
            return { type: 'settings', action: { setting: 'notifications', value: enabled ? 'enabled' : 'disabled' } };
        }

        // Auto save settings
        const autoSaveKeywords = ['auto save', 'autosave', 'save'];
        if (autoSaveKeywords.some(keyword => lowerText.includes(keyword))) {
            const enabled = !lowerText.includes('disable') && !lowerText.includes('off') && !lowerText.includes('stop');
            return { type: 'settings', action: { setting: 'autoSave', value: enabled ? 'enabled' : 'disabled' } };
        }

        // Enhanced Accessibility settings - ALL ACCESSIBILITY FEATURES
        const accessibilityKeywords = [
            'colorblind', 'color blind', 'protanopia', 'deuteranopia', 'tritanopia', 
            'contrast', 'spacing', 'bold', 'text spacing', 'high contrast', 'accessibility',
            'screen reader', 'keyboard navigation', 'focus indicators', 'reduced motion'
        ];
        const accessibilityActionKeywords = ['make', 'put', 'bring', 'set', 'change', 'enable', 'disable', 'turn', 'use', 'need', 'want', 'have'];
        
        if (accessibilityKeywords.some(keyword => lowerText.includes(keyword)) || 
            (accessibilityActionKeywords.some(action => lowerText.includes(action)) && 
             (lowerText.includes('colorblind') || lowerText.includes('contrast') || lowerText.includes('spacing') || 
              lowerText.includes('bold') || lowerText.includes('accessibility') || lowerText.includes('screen reader') || 
              lowerText.includes('keyboard') || lowerText.includes('focus') || lowerText.includes('motion')))) {
            
            // Handle ALL accessibility requests
            if (lowerText.includes('protanopia') || lowerText.includes('deuteranopia') || lowerText.includes('tritanopia')) {
                return { type: 'settings', action: { setting: 'colorBlindMode', value: lowerText.includes('protanopia') ? 'protanopia' : lowerText.includes('deuteranopia') ? 'deuteranopia' : 'tritanopia' } };
            }
            
            if (lowerText.includes('high contrast') || lowerText.includes('contrast')) {
                const enabled = !lowerText.includes('disable') && !lowerText.includes('off');
                return { type: 'settings', action: { setting: 'highContrast', value: enabled ? 'enabled' : 'disabled' } };
            }
            
            if (lowerText.includes('screen reader')) {
                const enabled = !lowerText.includes('disable') && !lowerText.includes('off');
                return { type: 'settings', action: { setting: 'screenReader', value: enabled ? 'enabled' : 'disabled' } };
            }
            
            if (lowerText.includes('keyboard navigation') || lowerText.includes('keyboard')) {
                const enabled = !lowerText.includes('disable') && !lowerText.includes('off');
                return { type: 'settings', action: { setting: 'keyboardNavigation', value: enabled ? 'enabled' : 'disabled' } };
            }
            
            if (lowerText.includes('focus indicators') || lowerText.includes('focus')) {
                const enabled = !lowerText.includes('disable') && !lowerText.includes('off');
                return { type: 'settings', action: { setting: 'focusIndicators', value: enabled ? 'enabled' : 'disabled' } };
            }
            
            if (lowerText.includes('reduced motion') || lowerText.includes('motion')) {
                const enabled = !lowerText.includes('disable') && !lowerText.includes('off');
                return { type: 'settings', action: { setting: 'reducedMotion', value: enabled ? 'enabled' : 'disabled' } };
            }
            
            if (lowerText.includes('spacing') || lowerText.includes('space') || lowerText.includes('bold')) {
                if (lowerText.includes('extra') || lowerText.includes('more')) {
                    return { type: 'settings', action: { setting: 'textSpacing', value: 'extra' } };
                } else if (lowerText.includes('increased') || lowerText.includes('more')) {
                    return { type: 'settings', action: { setting: 'textSpacing', value: 'increased' } };
                } else {
                    return { type: 'settings', action: { setting: 'textSpacing', value: 'normal' } };
                }
            }
            
            if (lowerText.includes('accessibility')) {
                const enabled = !lowerText.includes('disable') && !lowerText.includes('off');
                return { type: 'settings', action: { setting: 'accessibility', value: enabled ? 'enabled' : 'disabled' } };
            }
            
            // Default to chat for complex accessibility requests
            return { type: 'chat' };
        }
        
        // Info commands
        if (lowerText.includes('what can you do') || lowerText.includes('help') || lowerText.includes('capabilities')) {
            return { type: 'info', action: 'capabilities' };
        }
        
        if (lowerText.includes('where am i') || lowerText.includes('current page')) {
            return { type: 'info', action: 'location' };
        }
        
        // Default to chat
        return { type: 'chat' };
    };

    const executeCommand = async (command: { type: string, action?: any }): Promise<string> => {
        switch (command.type) {
            case 'agent':
                if (command.action?.command === 'show') {
                    try {
                        // Create a context for the agent with current game state
                        const agentContext = {
                            gameId: currentContext?.gameId || 'general',
                            currentProgress: currentContext?.currentProgress || 0,
                            moveHistory: currentContext?.moveHistory || [],
                            timeSpent: currentContext?.timeSpent || 0,
                            agentPersonality: currentContext?.agentPersonality || 'synapse-normal'
                        };
                        showAgent(agentContext);
                        return `🤖 AI Agent activated! I've opened the AI assistant for you! 🧠✨`;
                    } catch (error) {
                        console.error('Agent show error:', error);
                        return `❌ Sorry, I couldn't activate the AI agent right now. Please try again! 🤖`;
                    }
                }
                
                if (command.action?.command === 'hide') {
                    try {
                        hideAgent();
                        return `🤖 AI Agent hidden! The AI assistant is now closed! 👋`;
                    } catch (error) {
                        console.error('Agent hide error:', error);
                        return `❌ Sorry, I couldn't hide the AI agent right now. Please try again! 🤖`;
                    }
                }
                
                if (command.action?.command === 'trigger') {
                    try {
                        const triggerType = command.action.triggerType || 'manual';
                        // Create a context for the agent with current game state
                        const agentContext = {
                            gameId: currentContext?.gameId || 'general',
                            currentProgress: currentContext?.currentProgress || 0,
                            moveHistory: currentContext?.moveHistory || [],
                            timeSpent: currentContext?.timeSpent || 0,
                            agentPersonality: currentContext?.agentPersonality || 'synapse-normal'
                        };
                        triggerAgent(triggerType as any, agentContext);
                        return `🚀 AI Agent triggered with ${triggerType} mode! The AI assistant is now active! ⚡`;
                    } catch (error) {
                        console.error('Agent trigger error:', error);
                        return `❌ Sorry, I couldn't trigger the AI agent right now. Please try again! 🤖`;
                    }
                }
                
                if (command.action?.command === 'personality') {
                    try {
                        const personality = command.action.personality;
                        updateContext({ agentPersonality: personality });
                        
                        // Apply personality to current conversation
                        const personalityMessages = {
                            coach: "🎯 I'm now in Coach mode! I'll be direct, encouraging, and help you achieve your goals! Let's get you to the next level! 💪",
                            mentor: "🧠 I'm now in Mentor mode! I'll guide you with wisdom and help you understand concepts deeply! Let's explore together! 🌟",
                            friend: "😊 I'm now in Friend mode! I'll be supportive, fun, and here to chat with you! What's on your mind? 💬",
                            analyst: "🔍 I'm now in Analyst mode! I'll help you understand data, patterns, and make informed decisions! Let's analyze! 🔍"
                        };
                        
                        return `🎭 AI Agent personality changed to ${personality}! ${personalityMessages[personality as keyof typeof personalityMessages] || 'The AI assistant will now behave differently!'} 🎨`;
                    } catch (error) {
                        console.error('Agent personality error:', error);
                        return `❌ Sorry, I couldn't change the AI personality right now. Please try again! 🤖`;
                    }
                }
                break;
                
            case 'navigation':
                if (command.action?.path) {
                    console.log('Navigating to:', command.action.path, command.action.page);
                    navigate(command.action.path);
                    return `🚀 Taking you to ${command.action.page.name}! ${command.action.page.description} ✨`;
                }
                break;
                
            case 'settings':
                if (command.action === 'open') {
                    return `⚙️ Settings panel is now available! You can customize your experience through the settings dropdown in the header! 🎛️`;
                }
                
                if (command.action?.setting) {
                    const { setting, value } = command.action;
                    try {
                        switch (setting) {
                            case 'theme':
                                theme.setTheme(value);
                                return `🎨 Theme changed to ${value}! The page should update automatically! ✨`;
                            case 'fontSize':
                                theme.setFontSize(value);
                                return `📝 Font size changed to ${value}! Text should be easier to read now! 📖`;
                            case 'animations':
                                theme.setAnimationsEnabled(value === 'enabled');
                                return `🎬 Animations ${value === 'enabled' ? 'enabled' : 'disabled'}! ${value === 'enabled' ? 'Things will be more lively!' : 'Things will be calmer!'} 🎭`;
                            case 'sound':
                                // This would need to be implemented in the theme context
                                return `🔊 Sound settings would be updated here! 🔊`;
                            case 'colorBlindMode':
                                theme.setColorBlindMode(value);
                                return `🌈 Color blind mode set to ${value}! I've adjusted the colors to make them easier to see! 🎨`;
                            case 'highContrast':
                                theme.setHighContrast(value === 'enabled');
                                return `📖 High contrast ${value === 'enabled' ? 'enabled' : 'disabled'}! Text should be much easier to read now! 👁️`;
                            case 'textSpacing':
                                theme.setTextSpacing(value);
                                return `📝 Text spacing changed to ${value}! Letters should be easier to read now! 🔤`;
                            case 'aiAgent':
                                // This would control AI agent visibility/behavior
                                return `🤖 AI Agent ${value === 'enabled' ? 'enabled' : 'disabled'}! The AI assistant is now ${value === 'enabled' ? 'active' : 'inactive'}! 🧠`;
                            case 'notifications':
                                // This would control notification settings
                                return `🔔 Notifications ${value === 'enabled' ? 'enabled' : 'disabled'}! You'll ${value === 'enabled' ? 'receive' : 'not receive'} alerts! 📢`;
                            case 'autoSave':
                                // This would control auto-save settings
                                return `💾 Auto save ${value === 'enabled' ? 'enabled' : 'disabled'}! Your progress will ${value === 'enabled' ? 'be saved automatically' : 'need manual saving'}! 💿`;
                            case 'accessibility':
                                // This would control general accessibility settings
                                return `♿ Accessibility features ${value === 'enabled' ? 'enabled' : 'disabled'}! The platform is now ${value === 'enabled' ? 'more accessible' : 'less accessible'}! 🎯`;
                            case 'reducedMotion':
                                theme.setReducedMotion(value === 'enabled');
                                return `🎬 Reduced motion ${value === 'enabled' ? 'enabled' : 'disabled'}! Animations will be ${value === 'enabled' ? 'minimized' : 'full'}! 🎭`;
                            case 'screenReader':
                                theme.setScreenReader(value === 'enabled');
                                return `📖 Screen reader ${value === 'enabled' ? 'enabled' : 'disabled'}! ${value === 'enabled' ? 'Screen readers will work better' : 'Screen reader support disabled'}! 🔊`;
                            case 'keyboardNavigation':
                                theme.setKeyboardNavigation(value === 'enabled');
                                return `⌨️ Keyboard navigation ${value === 'enabled' ? 'enabled' : 'disabled'}! You can ${value === 'enabled' ? 'navigate with keyboard' : 'use mouse/touch'}! 🎯`;
                            case 'focusIndicators':
                                theme.setFocusIndicators(value === 'enabled');
                                return `🎯 Focus indicators ${value === 'enabled' ? 'enabled' : 'disabled'}! ${value === 'enabled' ? 'Focus will be clearly visible' : 'Focus indicators hidden'}! 👁️`;
                        }
                    } catch (error) {
                        return `Oops! I couldn't change that setting right now. Try opening settings manually! ⚙️`;
                    }
                }
                break;
                
            case 'info':
                if (command.action === 'capabilities') {
                    const allPages = Object.entries(availablePages).map(([path, page]) => 
                        `• "${page.name}" or "Go to ${page.name}" or "Show ${page.name}"`
                    ).join('\n');
                    
                    const allSettings = Object.entries(availableSettings).map(([key, setting]) => {
                        if (setting.options) {
                            return `• "${setting.name}" - ${setting.description} (${setting.options.join(', ')})`;
                        }
                        return `• "${setting.name}" - ${setting.description}`;
                    }).join('\n');
                    
                    return `🌟 Here's what I can do for you! 🚀

🎮 **Navigation**: I can take you to ANY page! Try:
${allPages}

⚙️ **Settings**: I can change ALL your preferences! Try:
${allSettings}

🤖 **AI Agent Control**: I can control the AI assistant! Try:
• "Show AI agent" or "Open AI assistant" or "Activate AI" or "Wake up AI"
• "Hide AI agent" or "Close AI assistant" or "Stop AI" or "Go away AI"
• "Trigger AI agent" or "Start AI assistant" or "Launch AI" or "Call AI"
• "Change AI to coach" or "Set AI as mentor" or "Make AI friend" or "AI be analyst"
• "I want the AI agent" or "I need the assistant" or "Can you show the AI"
• "Bring the AI" or "Summon the agent" or "Wake the assistant"

🎭 **AI Personalities**:
• "Be my coach" or "Act as a mentor" or "Be my friend" or "Analyze like an analyst"
• "Change to coach mode" or "Switch to mentor" or "Make it friendly" or "Be analytical"
• "I want a coach" or "I need a mentor" or "Be my buddy" or "Help me analyze"

🚀 **AI Triggers**:
• "Trigger achievement mode" or "Activate on success" or "Trigger on win"
• "Trigger struggle mode" or "Activate on difficulty" or "Help when stuck"
• "Trigger milestone mode" or "Activate on progress" or "Celebrate steps"
• "Trigger auto mode" or "Activate automatically" or "Smart triggers"
• "Trigger stuck mode" or "Activate on repetition" or "Help with patterns"
• "Trigger rapid mode" or "Activate on fast moves" or "Help with speed"

🌈 **Accessibility**: I can help with special needs! Try:
• "I am colorblind" or "I have protanopia"
• "Make high contrast" or "Put bold text"
• "Space letters out" or "Make text bigger"
• "I need help seeing" or "Make it easier to read"
• "Enable accessibility" or "Disable accessibility"
• "Enable screen reader" or "Disable screen reader"
• "Enable keyboard navigation" or "Disable keyboard navigation"
• "Enable focus indicators" or "Disable focus indicators"
• "Enable reduced motion" or "Disable reduced motion"

💬 **Chat**: I can answer questions, draw pictures, and help with learning!

📍 **Current Location**: You're currently on ${availablePages[location.pathname as keyof typeof availablePages]?.name || 'an unknown page'}!

Need help with anything specific? Just ask! 🌟`;
                }
                
                if (command.action === 'location') {
                    const currentPage = availablePages[location.pathname as keyof typeof availablePages];
                    return `📍 You're currently on the ${currentPage?.name || 'unknown'} page! ${currentPage?.description || ''} 🎯`;
                }
                break;
        }
        
        return `❌ I didn't understand that command. Try asking for help!`;
    };

    // NEW: Unified message handling function
    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;
        console.log(`Sending message in mode: ${mode}`);

        // Add user message to UI
        const userMessage: Message = { text, isUser: true, timestamp: new Date() };
        addMessageToConversation(activeConversation, userMessage);
        setInputMessage('');
        setIsLoading(true);

        // Apply prompt count restrictions for non-demo users
        if (!isDemoUser) {
            setPromptCount(count => count + 1);
        }

        try {
            // In full conversation mode, always treat input as a chat message
            if (mode === 'conversing') {
                await handleConversationMode(text);
                // Auto-play the response
                setTimeout(async () => {
                    const messages = conversations[activeConversation]?.messages || [];
                    const userMessageTime = userMessage.timestamp;
                    const recentAIMessages = messages
                        .filter(msg => !msg.isUser && msg.timestamp > userMessageTime)
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                    
                    if (recentAIMessages.length > 0) {
                        const latestAIMessage = recentAIMessages[0];
                        console.log('Auto-playing response to text input:', latestAIMessage.text.substring(0, 50) + '...');
                        await playVoice(latestAIMessage.text);
                    }
                }, 1500);
            } else {
                // For text or single recordings, check for commands first
                const command = analyzeCommand(text);
                if (command.type !== 'chat') {
                    const responseText = await executeCommand(command);
                    addMessageToConversation(activeConversation, { 
                        text: responseText, 
                        isUser: false, 
                        timestamp: new Date(),
                        action: command.type as any
                    });
                } else if (isImageRequest(text)) {
                    await handleImageRequest(text);
                } else {
                    await handleChatMode(text);
                }
            }
        } catch (error: any) {
            console.error('Error in handleSendMessage:', error);
            addMessageToConversation(activeConversation, { 
                text: `Oops! Something went wrong: ${error.message}. Let's try again in a moment! 🌟`, 
                isUser: false, 
                timestamp: new Date() 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Cleaner mode toggle functions
    const handleToggleConversationMode = async () => {
        if (mode === 'conversing') {
            // Stop the conversation
            console.log('🔄 Ending conversation mode...');
            
            if (isNetlify()) {
                console.log('🔄 ConversationService has active conversation:', conversationService.current.hasActiveConversation);
                if (conversationService.current.hasActiveConversation) {
                    await conversationService.current.endConversation();
                    console.log('✅ Conversation ended successfully');
                }
            } else if (isRender()) {
                // On Render, stop the MediaRecorder and clean up
                console.log('🔄 Stopping voice recording on Render...');
            }
            
            // Stop media recorder if it's running
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current = null;
            }
            
            // Stop audio stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            
            setMode('idle');
            addMessageToConversation(activeConversation, { 
                text: "Conversation mode ended. You can still chat with me via text! 🎤", 
                isUser: false, 
                timestamp: new Date() 
            });
        } else {
            // Start the conversation
            console.log('🔄 Setting mode to conversing...');
            setMode('conversing');
            modeRef.current = 'conversing'; // Set ref immediately
            
            addMessageToConversation(activeConversation, { 
                text: "Starting conversation mode... 🎤", 
                isUser: false, 
                timestamp: new Date() 
            });
            
            try {
                if (isNetlify()) {
                    // Initialize Ably connection only on Netlify
                    console.log('🔗 Initializing Ably connection...');
                    await conversationService.current.initialize();
                    console.log('✅ Ably initialized successfully');
                    
                    // Start conversation with ElevenLabs
                    console.log('🎯 Starting conversation with ElevenLabs...');
                    console.log('🎯 Agent ID:', getAgentId());
                    console.log('🎯 Voice ID:', getVoiceId());
                    
                    await conversationService.current.startConversation({
                        agentId: getAgentId(),
                        voiceId: getVoiceId()
                    });
                    console.log('✅ ElevenLabs conversation started successfully');
                    
                    // Ensure mode is set to conversing before proceeding
                    setMode('conversing');
                    modeRef.current = 'conversing';
                    
                    // Small delay to ensure mode transition is complete
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    console.log('✅ Mode confirmed as conversing:', modeRef.current);
                    
                    // Start local audio recording for streaming
                    console.log('🎤 Requesting microphone access...');
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('✅ Microphone access granted');
                    console.log('✅ Audio stream created:', stream);
                    streamRef.current = stream;
                    
                    console.log('🎙️ Creating MediaRecorder with stream...');
                    console.log('🎙️ Stream active:', stream.active);
                    console.log('🎙️ Stream tracks:', stream.getTracks().length);
                    
                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'audio/webm;codecs=opus'
                    });
                    console.log('🎙️ MediaRecorder created successfully');
                    console.log('🎙️ MediaRecorder state:', mediaRecorder.state);
                    
                    // Store reference for cleanup
                    mediaRecorderRef.current = mediaRecorder;
                    console.log('🎙️ MediaRecorder reference stored');
                    
                    mediaRecorder.ondataavailable = async (event) => {
                        console.log(`🔊 Audio data available: ${event.data.size} bytes`);
                        
                        // Check if we're still in conversation mode and have an active conversation
                        const hasData = event.data.size > 0;
                        const isConnected = conversationService.current.connected;
                        const hasActiveConversation = conversationService.current.hasActiveConversation;
                        const currentMode = modeRef.current; // Use ref instead of state
                        
                        console.log(`🔍 Condition check:`, {
                            hasData,
                            isConnected,
                            currentMode,
                            hasActiveConversation,
                            mediaRecorderState: mediaRecorder.state,
                            conversationServiceStatus: conversationService.current ? 'exists' : 'null'
                        });
                        
                        // Only process audio if we're in conversing mode and have an active conversation
                        if (hasData && isConnected && currentMode === 'conversing' && hasActiveConversation) {
                            console.log('🎯 Processing audio data for ElevenLabs...');
                            const arrayBuffer = await event.data.arrayBuffer();
                            await conversationService.current.sendAudio(arrayBuffer);
                        }
                    };
                    
                    mediaRecorder.onstop = () => {
                        console.log('🎙️ MediaRecorder stopped');
                    };
                    
                    mediaRecorder.onerror = (event) => {
                        console.error('🎙️ MediaRecorder error:', event);
                    };
                    
                    // Start recording
                    mediaRecorder.start(100); // Collect data every 100ms
                    console.log('🎙️ MediaRecorder started');
                    
                    addMessageToConversation(activeConversation, { 
                        text: "Conversation mode active! Speak anytime to chat with me. 🎤", 
                        isUser: false, 
                        timestamp: new Date() 
                    });
                    
                } else if (isRender()) {
                    // On Render, start voice recording with WebSocket support
                    console.log('🎤 Enabling voice recording on Render...');
                    console.log('🔌 WebSocket available on Render platform');
                    
                    // Start local audio recording for Render
                    console.log('🎤 Requesting microphone access...');
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('✅ Microphone access granted');
                    streamRef.current = stream;
                    
                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'audio/webm;codecs=opus'
                    });
                    mediaRecorderRef.current = mediaRecorder;
                    
                    // Set up continuous recording for Render
                    mediaRecorder.ondataavailable = async (event) => {
                        if (event.data.size > 0 && modeRef.current === 'conversing') {
                            console.log(`🔊 Audio data available: ${event.data.size} bytes`);
                            // Process the audio immediately on Render
                            await processVoiceInput(event.data);
                        }
                    };
                    
                    mediaRecorder.start(1000); // Record in 1-second chunks
                    console.log('🎙️ MediaRecorder started for Render');
                    
                    addMessageToConversation(activeConversation, { 
                        text: "Voice conversation active! Start speaking and I'll respond. 🎤✨", 
                        isUser: false, 
                        timestamp: new Date() 
                    });
                }
                
            } catch (error) {
                console.error('❌ CONVERSATION SETUP FAILED:', error);
                console.error('❌ Error type:', typeof error);
                console.error('❌ Error message:', (error as Error)?.message);
                console.error('❌ Full error object:', error);
                console.log('🔄 Resetting mode to idle due to error...');
                
                // Clean up any started resources
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                    mediaRecorderRef.current = null;
                }
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                
                setMode('idle');
                console.log('✅ Mode reset to idle');
                
                // Show more helpful error message
                const errorMessage = (error as Error).message?.includes('Bridge service not available') 
                    ? "🔧 Conversation mode is temporarily unavailable (bridge service needs deployment). But don't worry - you can still:\n\n✅ Use voice recording (microphone button)\n✅ Chat with text\n✅ Generate images\n✅ Use all other features!\n\nEverything else works perfectly! 🌟"
                    : "Sorry, I couldn't start conversation mode. Please try the voice recording button or text chat instead! 🌟";
                
                addMessageToConversation(activeConversation, { 
                    text: errorMessage, 
                    isUser: false, 
                    timestamp: new Date() 
                });
            }
        }
    };


    const handleRecordButtonClick = async () => {
        if (mode === 'single_recording') {
            // Stop recording and send
            stopVoiceRecording();
            setMode('idle');
        } else {
            // Start recording
            setMode('single_recording');
            await startVoiceRecording();
        }
    };

    const handleSendText = () => {
        if (!inputMessage.trim() || isLoading || (!isDemoUser && promptCount >= 10)) return;
        setMode('text_input');
        handleSendMessage(inputMessage);
        setMode('idle');
    };

    // Updated processVoiceInput to use unified handler with environment detection
    const processVoiceInput = async (audioBlob: Blob) => {
        try {
            console.log('Processing voice input with language:', selectedLanguage);
            
            // Convert audio to base64 for AssemblyAI
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            // Environment-specific API endpoint
            const apiEndpoint = isNetlify() 
                ? '/.netlify/functions/assemblyai-transcribe'
                : '/api/assemblyai-transcribe'; // For Render, we'll need to create this endpoint
            
            // Send to AssemblyAI for transcription with language support
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    audio: base64Audio,
                    language_code: selectedLanguage, // Will use auto-detect if set to 'auto'
                    speech_model: 'universal' // Best model for multilingual support
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Transcription failed:', errorText);
                throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            const transcribedText = result.text;
            const detectedLanguage = result.language_code || selectedLanguage;
            
            if (transcribedText && transcribedText.trim()) {
                console.log('Transcribed text:', transcribedText);
                console.log('Detected/Used language:', detectedLanguage);
                
                // Show language detection info if auto-detect was used
                if (selectedLanguage === 'auto' && detectedLanguage) {
                    const languageName = SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage;
                    console.log(`🌍 Detected language: ${languageName}`);
                }
                
                // Use unified message handler
                await handleSendMessage(transcribedText);
            } else {
                console.log('No text transcribed');
                const currentLang = SUPPORTED_LANGUAGES[selectedLanguage] || selectedLanguage;
                addMessageToConversation(activeConversation, { 
                    text: `I couldn't hear what you said in ${currentLang}. Could you try again? 🎤`, 
                    isUser: false, 
                    timestamp: new Date() 
                });
            }
        } catch (error: any) {
            console.error('Voice processing error:', error);
            const currentLang = SUPPORTED_LANGUAGES[selectedLanguage] || selectedLanguage;
            addMessageToConversation(activeConversation, { 
                text: `Sorry, I couldn't process that voice input in ${currentLang}. Please try again! 🌟`, 
                isUser: false, 
                timestamp: new Date() 
            });
        }
    };

    // Updated startVoiceRecording to set correct mode
    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await processVoiceInput(audioBlob);
            };
            
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setMode('idle');
                alert('Recording failed. Please try again.');
            };
            
            mediaRecorder.start(100);
            mediaRecorderRef.current = mediaRecorder;
            console.log('Voice recording started');
        } catch (error) {
            console.error('Failed to start voice recording:', error);
            setMode('idle');
            alert('Failed to access microphone.');
        }
    };

    // Updated stopVoiceRecording to handle mode correctly
    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && mode === 'single_recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            console.log('Voice recording stopped');
        }
    };

    // Updated toggleVoiceRecording to use new mode system
    const toggleVoiceRecording = () => {
        if (mode === 'single_recording') {
            stopVoiceRecording();
        } else {
            // Try recording first, if it fails, fall back to streaming
            startVoiceRecording().catch((error) => {
                console.log('Recording failed:', error);
            });
        }
    };



    // Updated processVoiceChunk to use unified handler
    const processVoiceChunk = async (transcribedText: string) => {
        try {
            console.log('Processing voice chunk:', transcribedText);
            
            // Add to chunks
            setVoiceChunks(prev => [...prev, transcribedText]);
            
            // Clear existing timeout
            if (voiceChunkTimeoutRef.current) {
                clearTimeout(voiceChunkTimeoutRef.current);
            }
            
            // Set timeout to process chunks after silence
            voiceChunkTimeoutRef.current = setTimeout(async () => {
                await processCompleteVoiceInput();
            }, 2000); // Wait 2 seconds of silence
        } catch (error: any) {
            console.error('Voice chunk processing error:', error);
        }
    };

    // Updated processCompleteVoiceInput to use unified handler
    const processCompleteVoiceInput = async () => {
        try {
            const completeText = voiceChunks.join(' ').trim();
            if (completeText) {
                console.log('Processing complete voice input:', completeText);
                // Use unified message handler
                await handleSendMessage(completeText);
            }
            
            // Clear chunks
            setVoiceChunks([]);
            setIsProcessingVoice(false);
        } catch (error: any) {
            console.error('Complete voice input processing error:', error);
            setVoiceChunks([]);
            setIsProcessingVoice(false);
        }
    };

    // Updated handleKeyPress to use new mode system
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    // Updated activateConversationMode to use new mode system
    const activateConversationMode = () => {
        setMode('conversing');
        
        // Don't add a greeting message automatically - let the user start the conversation
        console.log('Conversation mode activated');
    };

    // Updated processVoiceMessage to use unified handler
    const processVoiceMessage = async (transcribedText: string) => {
        try {
            console.log('Processing voice message:', transcribedText);
            
            if (transcribedText && transcribedText.trim()) {
                // Use unified message handler
                await handleSendMessage(transcribedText);
            }
        } catch (error: any) {
            console.error('Voice message processing error:', error);
            addMessageToConversation(activeConversation, { 
                text: `Sorry, I couldn't process that voice input. Please try again! 🌟`, 
                isUser: false, 
                timestamp: new Date() 
            });
        }
    };

    // Updated handleConversationModeToggle to use new mode system
    const handleConversationModeToggle = async () => {
        if (mode !== 'conversing') {
            // Enter conversation mode
            activateConversationMode();
            
            // Add a greeting message
            const greetings = [
                "Hello there! I'm Synapse, your AI learning assistant. I'm now in conversation mode with voice capabilities. How are you doing today?",
                "Hi! I'm Synapse, your friendly AI teacher. I'm ready for a conversation with voice! What would you like to talk about?",
                "Hey there! I'm Synapse, your learning companion. I'm now in conversation mode with voice. How can I help you today?",
                "Hello! I'm Synapse, your AI assistant. I'm excited to chat with you in conversation mode with voice! What's on your mind?",
                "Hi there! I'm Synapse, your AI teacher. I'm now ready for voice conversations! How are you feeling today?"
            ];
            
            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
            
            const greetingMessage: Message = {
                text: randomGreeting,
                isUser: false,
                timestamp: new Date()
            };
            
            addMessageToConversation(activeConversation, greetingMessage);
            
            // Play the greeting voice
            setTimeout(() => {
                playVoice(randomGreeting);
            }, 500);
        } else {
            // Exit conversation mode
            elevenLabsService.disconnect();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    };

    // Updated processTextMessage to use unified handler
    const processTextMessage = async (inputText: string) => {
        if (!inputText.trim() || isLoading || (!isDemoUser && promptCount >= 10)) return;

        // Use unified message handler
        await handleSendMessage(inputText);
    };

    // Updated sendVoiceMessage to use unified handler
    const sendVoiceMessage = async (inputMessage: string) => {
        if (!inputMessage.trim() || isLoading) return;

        // Use unified message handler
        await handleSendMessage(inputMessage);
    };

    // Updated sendTextMessage to use unified handler
    const sendTextMessage = async () => {
        if (!inputMessage.trim() || isLoading || (!isDemoUser && promptCount >= 10)) return;

        // Use unified message handler
        await handleSendMessage(inputMessage);
    };

    // NEW: Handle conversation mode (pure chat, no commands)
    const handleConversationMode = async (inputMessage: string) => {
        try {
            console.log('Handling conversation mode message:', inputMessage);
            
            // Check for image requests first
            if (isImageRequest(inputMessage)) {
                console.log('Image request detected in conversation mode, calling handleImageRequest');
                await handleImageRequest(inputMessage);
                return;
            }
            
            // Send to Synapse API for conversation
            const response = await sendMessageToSynapse(inputMessage);
            
            const assistantMessage: Message = {
                text: response,
                isUser: false,
                timestamp: new Date()
            };
            
            addMessageToConversation(activeConversation, assistantMessage);
        } catch (error: any) {
            console.error('Error in conversation mode:', error);
            const errorMessage: Message = {
                text: `I'm having trouble with that right now. Could you try again? 🌟`,
                isUser: false,
                timestamp: new Date()
            };
            addMessageToConversation(activeConversation, errorMessage);
        }
    };

    // NEW: Handle chat mode (with commands)
    const handleChatMode = async (inputMessage: string) => {
        try {
            console.log('Handling chat mode message:', inputMessage);
            console.log('Current mode when handling chat:', mode);
            
            // Send to Synapse API for chat
            const response = await sendMessageToSynapse(inputMessage);
            
            const assistantMessage: Message = {
                text: response,
                isUser: false,
                timestamp: new Date()
            };
            
            addMessageToConversation(activeConversation, assistantMessage);
            
            // If this was triggered by voice recording, play the response back
            if (mode === 'single_recording') {
                console.log('Voice recording detected, playing TTS response');
                setTimeout(async () => {
                    await playVoice(response);
                }, 500);
            }
        } catch (error: any) {
            console.error('Error in chat mode:', error);
            const errorMessage: Message = {
                text: `I'm having trouble with that right now. Could you try again? 🌟`,
                isUser: false,
                timestamp: new Date()
            };
            addMessageToConversation(activeConversation, errorMessage);
        }
    };

    // NEW: Send message to Synapse API
    const sendMessageToSynapse = async (message: string): Promise<string> => {
        try {
            // Platform-aware API endpoint
            const apiEndpoint = isNetlify() 
                ? '/.netlify/functions/api'
                : '/api/api'; // For Render
            
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    model: 'gpt-3.5-turbo'
                })
            });
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
            
            const result = await response.json();
            return result.response || result.message || 'No response received';
        } catch (error) {
            console.error('Synapse API error:', error);
            return "I'm having trouble processing that right now. Could you try again?";
        }
    };

    // NEW: Get system prompt with personality
    const getSystemPrompt = () => {
        const basePrompt = `You are NeuraPlay's AI assistant, helping children learn through interactive games and activities.

You are a highly structured, multilingual AI assistant. You must follow a strict two-step process for every response.

**Step 1: Analyze User Intent**
First, silently and internally classify the user's request into one of the following categories:
- **[Question]**: The user is asking for information, an explanation, or an answer.
- **[Fact Request]**: The user is explicitly asking for a single, concise fact.
- **[Story Request]**: The user is asking for a narrative, an anecdote, or a story.
- **[General Conversation]**: The request is a greeting, command, or conversational statement that doesn't fit the other categories.

**Step 2: Generate Response Based on Strict Rules**
After classifying the intent, generate your response adhering to the following length and language rules:

- **Language Rule**: Your response MUST be in the same language as the user's query (English, Arabic, or Russian), unless they explicitly ask for a different language.

- **Content Rules**:
    - If the intent is **[Question]**: Your response must be **1-2 sentences**. Provide a direct and concise answer.
    - If the intent is **[Fact Request]**: Your response must be **1 sentence only**. State the fact clearly and without elaboration.
    - If the intent is **[Story Request]**: Your response must be a **3-5 sentence** narrative.
    - If the intent is **[General Conversation]**: Your response must be **1-2 sentences**.

This two-step process is mandatory. Do not deviate.`;
        
        const personalityPrompts = {
            'synapse-normal': "You are friendly, helpful, and encouraging. Explain concepts clearly and celebrate small wins.",
            'coach': "You are motivational and goal-oriented. Focus on progress, set achievable targets, and provide energizing encouragement.",
            'mentor': "You are wise and guiding. Share insights, ask thoughtful questions, and help users discover solutions themselves.",
            'friend': "You are supportive and casual. Use a relaxed, conversational tone and show genuine interest in the user's experience.",
            'analyst': "You are detailed and analytical. Provide thorough explanations, break down complex concepts, and focus on understanding."
        };

        // Default to synapse-normal personality
        const currentPersonality = 'synapse-normal';
        
        return `${basePrompt} ${personalityPrompts[currentPersonality as keyof typeof personalityPrompts]}`;
    };

    // NEW: Parse API response
    const parseAPIResponse = (result: any): string => {
        try {
            console.log('Parsing API response:', result);
            
            // Handle array responses (common with some APIs)
            if (Array.isArray(result)) {
                if (result.length > 0) {
                    const firstItem = result[0];
                    if (typeof firstItem === 'string') {
                        return firstItem;
                    }
                    if (firstItem && typeof firstItem === 'object') {
                        if (firstItem.generated_text) {
                            return firstItem.generated_text;
                        }
                        if (firstItem.text) {
                            return firstItem.text;
                        }
                        if (firstItem.response) {
                            return firstItem.response;
                        }
                        if (firstItem.message) {
                            return firstItem.message;
                        }
                    }
                }
                console.warn('Array response but no valid content found:', result);
                return "I received an unexpected response format. Could you try again?";
            }
            
            // Handle object responses
            if (result && typeof result === 'object') {
                if (result.error) {
                    console.error('API error:', result.error);
                    return "I'm having trouble processing that right now. Could you try again?";
                }
                
                if (result.response) {
                    return result.response;
                }
                
                if (result.text) {
                    return result.text;
                }
                
                if (result.message) {
                    return result.message;
                }
                
                if (result.generated_text) {
                    return result.generated_text;
                }
                
                if (result.summary_text) {
                    return result.summary_text;
                }
            }
            
            // Handle string responses
            if (typeof result === 'string') {
                return result;
            }
            
            console.warn('Unexpected API response format:', result);
            return "I received an unexpected response format. Could you try again?";
        } catch (error) {
            console.error('Error parsing API response:', error);
            return "I'm having trouble processing the response. Could you try again?";
        }
    };

    // NEW: Check if text is an image request
    const isImageRequest = (text: string): boolean => {
        const imageKeywords = [
            'generate', 'create', 'make', 'draw', 'show', 'image', 'picture', 'photo', 'art',
            'generate an image', 'create an image', 'make an image', 'draw an image',
            'show me an image', 'picture of', 'photo of', 'art of'
        ];
        
        const lowerText = text.toLowerCase();
        return imageKeywords.some(keyword => lowerText.includes(keyword));
    };

    // NEW: Handle image generation requests
    const handleImageRequest = async (prompt: string) => {
        try {
            console.log('Handling image request:', prompt);
            
            // Extract the image prompt from the user's message
            const imagePrompt = prompt.replace(/^(generate|create|make|draw|show)\s+(an\s+)?(image|picture|photo|art)\s+of?\s*/i, '');
            
            if (!imagePrompt.trim()) {
                addMessageToConversation(activeConversation, {
                    text: "Please tell me what kind of image you'd like me to create! 🎨",
                    isUser: false,
                    timestamp: new Date()
                });
                return;
            }
            
            // Generate the image
            const imageUrl = await generateImage(imagePrompt);
            
            if (imageUrl) {
                addMessageToConversation(activeConversation, {
                    text: `Here's your image: "${imagePrompt}" 🎨`,
                    isUser: false,
                    timestamp: new Date(),
                    image: imageUrl
                });
            } else {
                addMessageToConversation(activeConversation, {
                    text: "Sorry, I couldn't generate that image. Please try again! 🎨",
                    isUser: false,
                    timestamp: new Date()
                });
            }
        } catch (error: any) {
            console.error('Error handling image request:', error);
            addMessageToConversation(activeConversation, {
                text: `Sorry, I couldn't generate that image: ${error.message} 🎨`,
                isUser: false,
                timestamp: new Date()
            });
        }
    };

    // NEW: Generate image using API
    const generateImage = async (prompt: string, retryCount = 0): Promise<string | null> => {
        try {
            console.log('Generating image for prompt:', prompt);
            
            // Platform-aware API endpoint and payload
            const apiEndpoint = isNetlify() 
                ? '/.netlify/functions/api'
                : '/api/api'; // For Render
            
            // Different payload formats for different platforms
            const requestBody = isNetlify() 
                ? JSON.stringify({
                    task_type: 'image',
                    input_data: {
                        prompt: prompt,
                        size: '512x512'
                    }
                })
                : JSON.stringify({
                    message: `Generate an image: ${prompt}`,
                    model: 'image-generation'
                });
            
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });
            
            if (!response.ok) {
                throw new Error(`Image generation failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Handle different response formats
            if (result.image_url) {
                return result.image_url;
            }
            
            if (result.url) {
                return result.url;
            }
            
            // Handle base64 data URL format
            if (result.data && result.contentType) {
                // Convert base64 to data URL
                const dataUrl = `data:${result.contentType};base64,${result.data}`;
                return dataUrl;
            }
            
            // Handle direct base64 data
            if (result.data && typeof result.data === 'string' && result.data.startsWith('/9j/')) {
                // This is a base64 JPEG image
                const dataUrl = `data:image/jpeg;base64,${result.data}`;
                return dataUrl;
            }
            
            console.warn('Unexpected image generation response format:', result);
            return null;
        } catch (error: any) {
            console.error('Image generation error:', error);
            
            if (retryCount < 2) {
                console.log(`Retrying image generation (attempt ${retryCount + 1})`);
                return generateImage(prompt, retryCount + 1);
            }
            
            return null;
        }
    };

    // NEW: Debug MediaRecorder
    const debugMediaRecorder = () => {
        console.log('MediaRecorder supported:', !!window.MediaRecorder);
        console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);
    };

    const playVoice = async (text: string) => {
        if (isPlayingVoice) {
            setIsPlayingVoice(false);
            return;
        }

        try {
            console.log('Requesting ElevenLabs TTS for text:', text.substring(0, 50) + '...');
            setIsPlayingVoice(true);
            
            // Platform-aware ElevenLabs TTS endpoint
            const ttsEndpoint = isNetlify() 
                ? '/.netlify/functions/elevenlabs-tts'
                : '/api/elevenlabs-tts';
            
            const response = await fetch(ttsEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voiceId: '8LVfoRdkh4zgjr8v5ObE', // English voice
                    modelId: 'eleven_turbo_v2_5'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('ElevenLabs TTS API error:', response.status, errorText);
                throw new Error(`Failed to generate audio: ${response.status}`);
            }

            const result = await response.json();
            console.log('ElevenLabs TTS response received:', result);
            
            if (result.audio_base64) {
                // Use ElevenLabs TTS
                console.log('Creating audio blob from ElevenLabs data');
                const audioBlob = new Blob([base64ToBinary(result.audio_base64)], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                audio.onended = () => {
                    console.log('ElevenLabs audio playback ended');
                    setIsPlayingVoice(false);
                };
                
                audio.onerror = (e) => {
                    console.error('ElevenLabs audio playback error:', e);
                    setIsPlayingVoice(false);
                };
                
                audio.onloadstart = () => console.log('ElevenLabs audio loading started');
                audio.oncanplay = () => console.log('ElevenLabs audio can play');
                
                await audio.play();
                console.log('ElevenLabs audio playback started');
                
                // Clean up the URL after a delay
                setTimeout(() => URL.revokeObjectURL(audioUrl), 10000);
            } else {
                console.error('No ElevenLabs audio data received');
                setIsPlayingVoice(false);
            }
        } catch (error) {
            console.error('Error playing ElevenLabs voice:', error);
            setIsPlayingVoice(false);
        }
    };

    const readLastMessage = async () => {
        const lastAIMessage = currentMessages
            .filter(msg => !msg.isUser)
            .pop();
        
        if (lastAIMessage && !isReadingLastMessage) {
            setIsReadingLastMessage(true);
            await playVoice(lastAIMessage.text);
            setIsReadingLastMessage(false);
        }
    };

    // Test function to verify all services are working
    const testServices = async () => {
        try {
            console.log('🧪 Testing all services...');
            
            // Test Ably
            console.log('🔗 Testing Ably connection...');
            await conversationService.current.initialize();
            console.log('✅ Ably connection successful');
            
            // Test ElevenLabs
            console.log('🎤 Testing ElevenLabs API...');
            const ttsResponse = await fetch('/.netlify/functions/test-elevenlabs');
            const ttsResult = await ttsResponse.json();
            console.log('✅ ElevenLabs test result:', ttsResult);
            
            // Test AssemblyAI
            console.log('🎙️ Testing AssemblyAI...');
            const sttResponse = await fetch('/.netlify/functions/assemblyai-transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio_base64: 'dGVzdA==' }) // "test" in base64
            });
            console.log('✅ AssemblyAI test completed, status:', sttResponse.status);
            
            console.log('🎉 All services are working!');
            return true;
        } catch (error) {
            console.error('❌ Service test failed:', error);
            return false;
        }
    };

    // Generate and play TTS for text
    const generateAndPlayTTS = async (text: string, voiceId: string = '8LVfoRdkh4zgjr8v5ObE') => {
        try {
            console.log('🎤 Generating TTS for:', text.substring(0, 50) + '...');
            
            const response = await fetch('/.netlify/functions/elevenlabs-streaming-tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voiceId: voiceId,
                    modelId: 'eleven_turbo_v2_5'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('TTS API error:', response.status, errorText);
                throw new Error(`Failed to generate audio: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.audio_base64) {
                try {
                    const audioBlob = new Blob(
                        [Uint8Array.from(atob(result.audio_base64), c => c.charCodeAt(0))], 
                        { type: 'audio/mpeg' }
                    );
                    console.log('🔊 TTS audio blob created, size:', audioBlob.size);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    
                    audio.onloadstart = () => console.log('🔊 TTS audio loading started');
                    audio.oncanplay = () => console.log('🔊 TTS audio can play');
                    audio.onplay = () => console.log('🔊 TTS audio playback started');
                    audio.onended = () => {
                        console.log('🔊 TTS audio playback ended');
                        URL.revokeObjectURL(audioUrl);
                    };
                    audio.onerror = (e) => console.error('🔊 TTS audio error:', e);
                    
                    await audio.play();
                    console.log('🔊 TTS audio play() succeeded');
                } catch (error) {
                    console.error('❌ Error playing TTS audio:', error);
                }
            }

        } catch (error) {
            console.error('❌ Error generating TTS:', error);
        }
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <div
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 cursor-pointer z-50 hover:scale-110 transition-all duration-300 bg-purple-500 text-white rounded-full p-4 shadow-lg hover:shadow-purple-500/50"
                >
                    <Bot size={32} />
                </div>
            )}

            {/* Neon Glass Chat Interface */}
            <aside 
                id="ai-teacher-menu" 
                ref={menuRef} 
                className={`${isOpen ? 'open' : ''} ${isFullscreen ? 'fullscreen' : ''} ${theme.isDarkMode ? 'dark' : ''}`}
                data-theme={theme.isDarkMode ? 'dark' : 'light'}
            >
                <span className="shine shine-top"></span>
                <span className="shine shine-bottom"></span>
                <span className="glow glow-top"></span>
                <span className="glow glow-bottom"></span>

                <div className="inner">
                    {/* Fullscreen Header */}
                    {isFullscreen && (
                        <div className="ai-fullscreen-header">
                            <div className="ai-fullscreen-title flex items-center gap-2">
                                <span>Synapse - Fullscreen Mode</span>
                            </div>
                            <div className="ai-fullscreen-controls">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        createNewConversation();
                                    }}
                                    className="ai-fullscreen-button"
                                    title="New Conversation"
                                >
                                    <MessageSquare size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFullscreen();
                                    }}
                                    className="ai-fullscreen-button"
                                    title="Exit Fullscreen"
                                >
                                    <Minimize2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                    }}
                                    className="ai-fullscreen-button"
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Context Tabs - Only show in fullscreen mode */}
                    {isFullscreen && (
                        <div className="ai-context-tabs">
                            {Object.values(conversations).map((conversation) => (
                                <button
                                    key={conversation.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveConversation(conversation.id);
                                    }}
                                    className={`ai-context-tab ${activeConversation === conversation.id ? 'active' : ''}`}
                                    title={conversation.title}
                                >
                                    <div className="flex items-center gap-2">
                                        <History size={14} />
                                        <span className="truncate max-w-[120px]">{conversation.title}</span>
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    createNewConversation();
                                }}
                                className="ai-context-tab"
                                title="New Conversation"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={14} />
                                    <span>New</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Regular Header - Only show when not in fullscreen */}
                    {!isFullscreen && (
                        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Synapse
                            </h3>
                            <div className="flex items-center gap-2">
                                {/* Fullscreen Toggle */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFullscreen();
                                    }}
                                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                                    title="Enter Fullscreen Mode"
                                >
                                    <Maximize2 size={16} />
                                </button>
                                
                                {/* Language Selector */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLanguageDropdown();
                                        }}
                                        className="ai-language-selector"
                                        title="Select Language"
                                    >
                                        <Globe size={16} />
                                    </button>
                                    {showLanguageDropdown && (
                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[1000] w-56 max-h-64 overflow-y-auto">
                                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                                                <button
                                                    key={code}
                                                    onClick={() => handleLanguageSelect(code as LanguageCode)}
                                                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                                                        selectedLanguage === code ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Read Last Message */}
                                {currentMessages.filter(msg => !msg.isUser).length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            readLastMessage();
                                        }}
                                        className={`p-2 rounded-full transition-all duration-300 ${
                                            isReadingLastMessage 
                                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse' 
                                                : 'bg-white/20 text-white hover:bg-white/30 hover:shadow-lg hover:shadow-white/20'
                                        }`}
                                        title="Read Last Message Aloud"
                                    >
                                        {isReadingLastMessage ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                    </button>
                                )}
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                    }}
                                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                                    title="Close Chat"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {currentMessages.map((msg, index) => (
                             <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] ${msg.isUser ? 'ai-message-user' : 'ai-message-assistant'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            {msg.image && (
                                                <div className="mt-2">
                                                    <img 
                                                        src={msg.image} 
                                                        alt="AI Generated Image"
                                                        className="w-full max-w-xs rounded-lg shadow-md"
                                                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                            <p className={`text-xs mt-1 ${msg.isUser ? 'text-white/70' : 'text-gray-500'}`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!msg.isUser && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    playVoice(msg.text);
                                                }}
                                                className={`p-1 rounded-full transition-all duration-300 ${
                                                    isPlayingVoice 
                                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50 animate-pulse' 
                                                        : 'bg-white/20 text-gray-600 hover:bg-white/30 hover:shadow-lg hover:shadow-white/20'
                                                }`}
                                                title="Listen to message"
                                            >
                                                {isPlayingVoice ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Child-friendly prompt suggestions */}
                        {currentMessages.length === 1 && !isLoading && (
                            <div className="space-y-2">
                                <p className="text-amber-300 font-bold text-center text-lg">💡 Try asking me:</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {childPrompts.slice(0, 5).map((prompt, index) => (
                                        <button
                                            key={index}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setInputMessage(prompt);
                                                setTimeout(() => handleSendText(), 100);
                                            }}
                                            className="text-left p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 rounded-xl hover:from-amber-500/30 hover:to-yellow-500/30 transition-all duration-200 text-amber-200 font-semibold text-sm"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="ai-message-assistant">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-600">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-2">
                        {/* Voice Processing Indicator */}
                        {(voiceChunks.length > 0 || isProcessingVoice) && (
                            <div className="mb-2 p-2 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-300 text-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="font-semibold">
                                        {isProcessingVoice ? 'Processing voice...' : `Voice chunks: ${voiceChunks.length}`}
                                    </span>
                                    {voiceChunks.length > 0 && (
                                        <span className="text-xs opacity-70">
                                            "{voiceChunks.join(' ').substring(0, 50)}..."
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Conversation Mode Indicator */}
                        {mode === 'conversing' && (
                            <div className="mb-2 p-2 bg-green-500/20 border border-green-400/30 rounded-lg">
                                <div className="flex items-center gap-2 text-green-300 text-sm">
                                    <PlasmaBall size={20} />
                                    <span className="font-semibold">Conversation Mode Active</span>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <label className="flex items-center gap-2">
                            <input 
                                type="text"
                                placeholder={
                                    mode === 'conversing' 
                                        ? "Talk to Synapse in conversation mode! 🗣️" 
                                        : (!isDemoUser && promptCount >= 10)
                                            ? "Daily limit reached! 🎯" 
                                            : "Ask me anything, little explorer! 🚀"
                                }
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="ai-input-field"
                                disabled={isLoading || (!isDemoUser && promptCount >= 10)}
                            />
                        </label>
                        
                        {/* Control Buttons */}
                        <div className="ai-input-controls mt-3 flex gap-2">
                            {/* Text Send Button */}
                            <button
                                onClick={handleSendText}
                                disabled={!inputMessage.trim() || isLoading || (!isDemoUser && promptCount >= 10)}
                                className={`ai-mode-button flex-1 ${!inputMessage.trim() || isLoading ? 'opacity-50' : ''}`}
                                title="Send Message"
                            >
                                <Send size={16} />
                                <span>Send</span>
                            </button>
                            
                            {/* Plasma Ball Conversation Mode */}
                            <div 
                                className={`plasma-ball-conversation-container ${mode === 'conversing' ? 'active' : ''}`}
                                onClick={handleToggleConversationMode}
                                title={mode === 'conversing' ? 'Stop Conversation Mode' : 'Start Conversation Mode'}
                            >
                                <PlasmaBall 
                                    size={36}
                                    className={`conversation-plasma-ball ${mode === 'conversing' ? 'active' : ''}`}
                                    intensity={mode === 'conversing' ? 1.0 : 0.3}
                                />
                                <span className="plasma-label">Chat</span>
                            </div>
                            
                            {/* Voice Recording Button */}
                            <button
                                onClick={handleRecordButtonClick}
                                className={`ai-mode-button flex-1 ${mode === 'single_recording' ? 'recording' : ''}`}
                                title={mode === 'single_recording' ? 'Stop Recording' : 'Start Voice Recording'}
                                disabled={isLoading || mode === 'conversing'}
                            >
                                {mode === 'single_recording' ? <MicOff size={16} /> : <Mic size={16} />}
                                <span>{mode === 'single_recording' ? 'Stop' : 'Record'}</span>
                            </button>
                        </div>
                        {!isDemoUser && promptCount >= 10 && (
                            <div className="text-center text-amber-400 text-xs mt-2 font-bold">🎯 You've used all your daily questions! Come back tomorrow for more fun! 🌟</div>
                        )}
                        {isDemoUser && (
                            <div className="text-center text-green-400 text-xs mt-2 font-bold">🌟 Demo User: Unlimited access! 🚀</div>
                        )}
                        {mode === 'conversing' && (
                            <div className="text-center text-blue-400 text-xs mt-2 font-bold animate-pulse">🎤 Streaming Conversation Active - Speak to Synapse! 🔊</div>
                        )}
                        
                        {/* Test Image Generation Button (for debugging) */}
                        {isDemoUser && (
                            <div className="mt-2 text-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setInputMessage("Generate an image of a cute robot");
                                        setTimeout(() => handleSendText(), 100);
                                    }}
                                    className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-lg text-purple-300 text-xs hover:bg-purple-500/30 transition-all"
                                >
                                    🧪 Test Image Gen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>


        </>
    );
};

export default AIAssistant;