import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Volume2, VolumeX, Sparkles, Crown, Star, Settings, Home, Gamepad2, Users, FileText, User, BarChart3, Info, Brain, Zap, Target, TrendingUp, Lightbulb, RotateCcw, Play, Pause, HelpCircle, Award, Clock, Activity, Maximize2, Minimize2, MessageSquare, History, Mic, MicOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAIAgent } from '../contexts/AIAgentContext';
import { useUser } from '../contexts/UserContext';

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
    const [isConversationMode, setIsConversationMode] = useState(false); // Conversation mode is for audio only
    const [isReadingLastMessage, setIsReadingLastMessage] = useState(false);
    
    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isStreamingMode, setIsStreamingMode] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const streamingTranscriptionRef = useRef<any>(null);

    
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { triggerAgent, showAgent, hideAgent, currentContext, updateContext } = useAIAgent();
    const { user } = useUser();
    
    // Remove limits for DemoUser
    const isDemoUser = user?.username === 'DemoUser';

    // Get current messages based on active conversation
    const currentMessages = conversations[activeConversation]?.messages || [];

    // Available pages and their descriptions
    const availablePages = {
        '/': { name: 'Home', icon: <Home className="w-4 h-4" />, description: 'Main landing page' },
        '/playground': { name: 'Playground', icon: <Gamepad2 className="w-4 h-4" />, description: 'Games and activities' },
        '/dashboard': { name: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, description: 'Your learning progress' },
        '/forum': { name: 'Forum', icon: <Users className="w-4 h-4" />, description: 'Community discussions' },
        '/forum-registration': { name: 'Forum Registration', icon: <FileText className="w-4 h-4" />, description: 'Join the forum' },
        '/registration': { name: 'Registration', icon: <User className="w-4 h-4" />, description: 'Create an account' },
        '/signin': { name: 'Sign In', icon: <User className="w-4 h-4" />, description: 'Login to your account' },
        '/ai-report': { name: 'AI Report', icon: <BarChart3 className="w-4 h-4" />, description: 'AI learning analytics' },
        '/about': { name: 'About Us', icon: <Info className="w-4 h-4" />, description: 'Learn about NeuraPlay' },
        '/counting-test': { name: 'Counting Test', icon: <Gamepad2 className="w-4 h-4" />, description: 'Math practice' },
        '/test': { name: 'Test Page', icon: <Gamepad2 className="w-4 h-4" />, description: 'Testing features' },
        '/text-reveal': { name: 'Text Reveal', icon: <Sparkles className="w-4 h-4" />, description: 'Text animations' },
        '/old-home': { name: 'Old Home', icon: <Home className="w-4 h-4" />, description: 'Previous home page' },
        '/profile': { name: 'Profile', icon: <User className="w-4 h-4" />, description: 'Your user profile' },
        '/user-profile': { name: 'User Profile', icon: <User className="w-4 h-4" />, description: 'Detailed user profile' }
    };

    // Available settings and their descriptions - COMPLETE LIST
    const availableSettings = {
        'theme': { name: 'Theme', description: 'Change light/dark mode', options: ['light', 'dark', 'auto', 'bright', 'dark-gradient', 'white-purple-gradient'] },
        'fontSize': { name: 'Font Size', description: 'Adjust text size', options: ['small', 'medium', 'large', 'extra-large'] },
        'animations': { name: 'Animations', description: 'Enable/disable animations', options: ['enabled', 'disabled'] },
        'sound': { name: 'Sound', description: 'Enable/disable sound effects', options: ['enabled', 'disabled'] },
        'highContrast': { name: 'High Contrast', description: 'Enhanced visibility', options: ['enabled', 'disabled'] },
        'reducedMotion': { name: 'Reduced Motion', description: 'Minimize animations', options: ['enabled', 'disabled'] },
        'screenReader': { name: 'Screen Reader', description: 'Enable screen reader support', options: ['enabled', 'disabled'] },
        'keyboardNavigation': { name: 'Keyboard Navigation', description: 'Enable keyboard navigation', options: ['enabled', 'disabled'] },
        'focusIndicators': { name: 'Focus Indicators', description: 'Show focus indicators', options: ['enabled', 'disabled'] },
        'colorBlindMode': { name: 'Color Blind Mode', description: 'Color accessibility', options: ['none', 'protanopia', 'deuteranopia', 'tritanopia'] },
        'textSpacing': { name: 'Text Spacing', description: 'Adjust letter spacing', options: ['normal', 'increased', 'extra'] },
        'aiPersonality': { name: 'AI Personality', description: 'Change AI assistant style', options: ['coach', 'mentor', 'friend', 'analyst'] },
        'aiAgent': { name: 'AI Agent', description: 'Control AI agent behavior', options: ['enabled', 'disabled', 'auto', 'manual'] },
        'voiceEnabled': { name: 'Voice', description: 'Enable voice features', options: ['enabled', 'disabled'] },
        'notifications': { name: 'Notifications', description: 'Control notifications', options: ['enabled', 'disabled'] },
        'autoSave': { name: 'Auto Save', description: 'Automatic saving', options: ['enabled', 'disabled'] },
        'accessibility': { name: 'Accessibility', description: 'Accessibility features', options: ['enabled', 'disabled'] }
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
        "🎨 Draw me a happy dinosaur!",
        "🧮 Help me count to 10!",
        "🌈 What colors make a rainbow?",
        "🚀 Tell me about space!",
        "🐾 What animals live in the jungle?",
        "🌱 How do plants grow?",
        "⚡ What is electricity?",
        "🌊 Why is the ocean blue?",
        "🦋 How do butterflies fly?",
        "🏠 How do houses stay warm?"
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

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading || (!isDemoUser && promptCount >= 10)) return;

        const userMessage: Message = {
            text: inputMessage,
            isUser: true,
            timestamp: new Date()
        };

        addMessageToConversation(activeConversation, userMessage);
        setInputMessage('');
        setIsLoading(true);
        setPromptCount(count => count + 1);

        try {
            // FIXED: Check conversation mode first
            if (isConversationMode) {
                // Conversation mode: Check for image requests first, then use chat API
                if (isImageRequest(inputMessage)) {
                    console.log('Image request detected in conversation mode, calling handleImageRequest');
                    await handleImageRequest(inputMessage);
                    return;
                }
                // Conversation mode: Always use chat API, ignore commands
                await handleConversationMode(inputMessage);
            } else {
                // Normal mode: Check for commands first
                const command = analyzeCommand(inputMessage);
                console.log('Command detected:', command);
                
                if (command.type !== 'chat') {
                    // Execute the command
                    const response = await executeCommand(command);
                    
                    const assistantMessage: Message = {
                        text: response,
                        isUser: false,
                        timestamp: new Date(),
                        action: command.type as any
                    };

                    addMessageToConversation(activeConversation, assistantMessage);
                    setIsLoading(false);
                    return;
                }

                // Check if this is an image request
                if (isImageRequest(inputMessage)) {
                    console.log('Image request detected, calling handleImageRequest');
                    await handleImageRequest(inputMessage);
                    return;
                }

                // Normal chat mode
                await handleChatMode(inputMessage);
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                text: `Oops! Something went wrong: ${error.message}. Let's try again in a moment! 🌟`,
                isUser: false,
                timestamp: new Date()
            };
            addMessageToConversation(activeConversation, errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Handle conversation mode (pure chat, no commands)
    const handleConversationMode = async (inputMessage: string) => {
        const conversationHistory = currentMessages
            .filter(msg => !msg.image && !msg.action) // Exclude image and action messages
            .slice(-10); // Keep last 10 messages (5 exchanges)
        
        const messagesForAPI = [];
        
        // Always add system context for conversation mode
        messagesForAPI.push({
            role: 'system',
            content: `You are Synapse, a friendly AI teacher for children in conversation mode. You are having a natural conversation with a child. Be engaging, educational, and conversational. Don't execute commands or navigate - just have a friendly chat!`
        });
        
        // Add conversation history
        for (let i = 0; i < conversationHistory.length; i += 2) {
            if (conversationHistory[i] && conversationHistory[i + 1]) {
                messagesForAPI.push({
                    role: 'user',
                    content: conversationHistory[i].text
                });
                messagesForAPI.push({
                    role: 'assistant',
                    content: conversationHistory[i + 1].text
                });
            }
        }
        
        // Add current user message
        messagesForAPI.push({
            role: 'user',
            content: inputMessage
        });

        const response = await fetch('/.netlify/functions/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_type: 'chat',
                input_data: {
                    messages: messagesForAPI
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        let aiResponse = parseAPIResponse(result);

        const assistantMessage: Message = {
            text: aiResponse,
            isUser: false,
            timestamp: new Date()
        };

        addMessageToConversation(activeConversation, assistantMessage);
    };

    // NEW: Handle normal chat mode (with commands and images)
    const handleChatMode = async (inputMessage: string) => {
        const conversationHistory = currentMessages
            .filter(msg => !msg.image) // Exclude image messages from history
            .slice(-12); // Keep last 12 messages (6 exchanges) for better context
        
        const messagesForAPI = [];
        
        // Only add system context if this is the first message or if we have no conversation history
        if (currentMessages.length <= 2) { // First exchange or just the initial greeting
            messagesForAPI.push({
                role: 'system',
                content: `You are Synapse, a friendly AI teacher for children. You are very knowledgeable about accessibility and can help with:
- Color blindness (protanopia, deuteranopia, tritanopia)
- Visual impairments and contrast needs
- Text spacing and font size preferences
- Motion sensitivity and animation preferences
- Screen reader support
- Keyboard navigation

When users mention accessibility needs, you should:
1. Acknowledge their needs with empathy
2. Offer specific solutions and settings changes
3. Maintain context across multiple messages
4. Use child-friendly language while being informative
5. Suggest relevant settings changes they can make

Always be supportive and helpful with accessibility requests!`
            });
        }
        
        // Add conversation history
        for (let i = 0; i < conversationHistory.length; i += 2) {
            if (conversationHistory[i] && conversationHistory[i + 1]) {
                messagesForAPI.push({
                    role: 'user',
                    content: conversationHistory[i].text
                });
                messagesForAPI.push({
                    role: 'assistant',
                    content: conversationHistory[i + 1].text
                });
            }
        }
        
        // Add current user message
        messagesForAPI.push({
            role: 'user',
            content: inputMessage
        });

        const response = await fetch('/.netlify/functions/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_type: 'chat',
                input_data: {
                    messages: messagesForAPI
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        let aiResponse = parseAPIResponse(result);

        const assistantMessage: Message = {
            text: aiResponse,
            isUser: false,
            timestamp: new Date()
        };

        addMessageToConversation(activeConversation, assistantMessage);
    };

    // NEW: Handle image requests
    const handleImageRequest = async (inputMessage: string) => {
        console.log('handleImageRequest called with:', inputMessage);
        const imageData = await generateImage(inputMessage);
        console.log('Image generation result:', !!imageData);
        
        let responseText = "Here's the image you requested!";
        if (!imageData) {
            responseText = "I'm sorry, I couldn't generate an image for that request. Please try again with a different description.";
        }

        const assistantMessage: Message = {
            text: responseText,
            isUser: false,
            timestamp: new Date(),
            image: imageData || undefined
        };

        addMessageToConversation(activeConversation, assistantMessage);
    };

    // NEW: Improved API response parsing
    const parseAPIResponse = (result: any): string => {
        if (Array.isArray(result) && result.length > 0) {
            if (result[0].generated_text) {
                return result[0].generated_text;
            } else if (result[0].summary_text) {
                return result[0].summary_text;
            } else if (typeof result[0] === 'string') {
                return result[0];
            }
        }
        if (typeof result === 'string') {
            return result;
        }
        if (result?.generated_text) {
            return result.generated_text;
        }
        if (result?.summary_text) {
            return result.summary_text;
        }
        if (result?.error) {
            return `Oops! Something went wrong: ${result.error}. Let's try again! 🌟`;
        }
        return "I'm here to help! Could you ask me something else? 🎮✨";
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const playVoice = async (text: string) => {
        if (isPlayingVoice) {
            setIsPlayingVoice(false);
            return;
        }

        try {
            console.log('Requesting voice for text:', text.substring(0, 50) + '...');
            setIsPlayingVoice(true);
            
            const response = await fetch('/.netlify/functions/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task_type: 'voice',
                    input_data: text
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Voice API error:', response.status, errorText);
                throw new Error(`Failed to generate audio: ${response.status}`);
            }

            const result = await response.json();
            console.log('Voice API response received:', result);
            
            if (result.data) {
                // Use Hugging Face TTS
                const audioBlob = `data:${result.contentType};base64,${result.data}`;
                const audio = new Audio(audioBlob);
                
                audio.onended = () => {
                    console.log('Audio playback ended');
                    setIsPlayingVoice(false);
                };
                
                audio.onerror = (e) => {
                    console.error('Audio playback error:', e);
                    setIsPlayingVoice(false);
                };
                
                audio.onloadstart = () => console.log('Audio loading started');
                audio.oncanplay = () => console.log('Audio can play');
                
                await audio.play();
                console.log('Audio playback started');
            } else if (result.useBrowserTTS) {
                // Fallback to browser TTS
                console.log('Using browser TTS fallback');
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(result.text || text);
                    utterance.rate = 0.8;
                    utterance.pitch = 1.1;
                    utterance.volume = 0.9;
                    
                    utterance.onend = () => {
                        console.log('Browser TTS ended');
                        setIsPlayingVoice(false);
                    };
                    
                    utterance.onerror = (e) => {
                        console.error('Browser TTS error:', e);
                        setIsPlayingVoice(false);
                    };
                    
                    window.speechSynthesis.speak(utterance);
                    console.log('Browser TTS started');
                } else {
                    console.error('Browser TTS not supported');
                    setIsPlayingVoice(false);
                }
            } else {
                console.error('No audio data received and no fallback available');
                setIsPlayingVoice(false);
            }
        } catch (error) {
            console.error('Error playing voice:', error);
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

    const isImageRequest = (text: string): boolean => {
        const imageKeywords = [
            'image', 'picture', 'photo', 'draw', 'create', 'generate', 'show me', 'make', 'design',
            'illustration', 'visual', 'art', 'painting', 'sketch', 'drawing', 'graphic', 'schnell',
            'generate image', 'create image', 'draw image', 'make image', 'show image'
        ];
        const lowerText = text.toLowerCase();
        const isImage = imageKeywords.some(keyword => lowerText.includes(keyword));
        console.log('Image request check:', { text, isImage, matchedKeywords: imageKeywords.filter(keyword => lowerText.includes(keyword)) });
        return isImage;
    };

    const generateImage = async (prompt: string): Promise<string | null> => {
        try {
            console.log('Generating image for prompt:', prompt);
            
            const response = await fetch('/.netlify/functions/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task_type: 'image',
                    input_data: prompt
                })
            });

            console.log('Image generation response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Image generation error response:', errorText);
                throw new Error(`Failed to generate image: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Image generation result:', result);
            
            if (result.data) {
                console.log('Image data received, length:', result.data.length);
                return `data:${result.contentType};base64,${result.data}`;
            } else {
                console.error('No image data in response:', result);
                return null;
            }
        } catch (error: any) {
            console.error('Error generating image:', error);
            return null;
        }
    };

    // FIXED: Get personality from context (already declared above)
    const currentPersonality = currentContext?.agentPersonality || 'synapse-normal';
    
    // Voice recording functions
    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            const audioChunks: Blob[] = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await processVoiceInput(audioBlob);
            };
            
            mediaRecorder.start(100); // Collect data every 100ms
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            console.log('Voice recording started');
        } catch (error) {
            console.error('Failed to start voice recording:', error);
            alert('Failed to access microphone. Please check permissions.');
        }
    };
    
    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            console.log('Voice recording stopped');
        }
    };
    
    const processVoiceInput = async (audioBlob: Blob) => {
        try {
            console.log('Processing voice input, blob size:', audioBlob.size);
            
            // Convert blob to file for AssemblyAI
            const audioFile = new File([audioBlob], 'voice-input.webm', { type: 'audio/webm' });
            console.log('Created audio file:', audioFile.name, 'size:', audioFile.size);
            
            // Send to AssemblyAI for transcription
            const formData = new FormData();
            formData.append('audio', audioFile);
            
            console.log('Sending to AssemblyAI...');
            const response = await fetch('/.netlify/functions/assemblyai-transcribe', {
                method: 'POST',
                body: formData
            });
            
            console.log('AssemblyAI response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('AssemblyAI error response:', errorText);
                throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('AssemblyAI result:', result);
            const transcribedText = result.text;
            
            if (transcribedText && transcribedText.trim()) {
                console.log('Transcribed text:', transcribedText);
                // Process the transcribed text through Synapse
                setInputMessage(transcribedText);
                await sendMessage();
            } else {
                console.log('No transcribed text received');
                alert('No speech detected. Please try speaking more clearly.');
            }
        } catch (error: any) {
            console.error('Voice processing error:', error);
            alert(`Failed to process voice input: ${error.message}. Please try again.`);
        }
    };
    
    const toggleVoiceRecording = () => {
        if (isRecording) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    };
    
    // Streaming conversation mode functions
    const startStreamingConversation = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // Import AssemblyAI streaming transcription
            const { createStreamingTranscription } = await import('../utils/assemblyAI');
            
            streamingTranscriptionRef.current = createStreamingTranscription(
                async (result) => {
                    if (result.isFinal && result.text.trim()) {
                        console.log('Streaming transcription:', result.text);
                        // Process through Synapse
                        await processStreamingInput(result.text);
                    }
                },
                (error) => {
                    console.error('Streaming transcription error:', error);
                }
            );
            
            setIsStreamingMode(true);
            console.log('Streaming conversation started');
        } catch (error) {
            console.error('Failed to start streaming conversation:', error);
            alert('Failed to access microphone for streaming mode.');
        }
    };
    
    const stopStreamingConversation = () => {
        if (streamingTranscriptionRef.current) {
            streamingTranscriptionRef.current.close();
            streamingTranscriptionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsStreamingMode(false);
        console.log('Streaming conversation stopped');
    };
    
    const processStreamingInput = async (transcribedText: string) => {
        try {
            // Add user message to conversation
            const userMessage: Message = {
                text: transcribedText,
                isUser: true,
                timestamp: new Date()
            };
            
            addMessageToConversation(activeConversation, userMessage);
            
            // Process through Synapse
            const response = await sendMessageToSynapse(transcribedText);
            
            // Add AI response to conversation
            const aiMessage: Message = {
                text: response,
                isUser: false,
                timestamp: new Date()
            };
            
            addMessageToConversation(activeConversation, aiMessage);
            
            // Play voice response
            await playVoice(response);
            
        } catch (error) {
            console.error('Error processing streaming input:', error);
        }
    };
    
    const sendMessageToSynapse = async (message: string): Promise<string> => {
        try {
            const response = await fetch('/.netlify/functions/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: 'chat',
                    input_data: {
                        messages: [
                            { role: 'system', content: getSystemPrompt() },
                            { role: 'user', content: message }
                        ]
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
            
            const result = await response.json();
            return parseAPIResponse(result);
        } catch (error) {
            console.error('Synapse API error:', error);
            return "I'm having trouble processing that right now. Could you try again?";
        }
    };

    // FIXED: Apply personality to system prompt
    const getSystemPrompt = () => {
        const basePrompt = "You are NeuraPlay's AI assistant, helping children learn through interactive games and activities.";
        
        const personalityPrompts = {
            'synapse-normal': "You are friendly, helpful, and encouraging. Explain concepts clearly and celebrate small wins.",
            'coach': "You are motivational and goal-oriented. Focus on progress, set achievable targets, and provide energizing encouragement.",
            'mentor': "You are wise and guiding. Share insights, ask thoughtful questions, and help users discover solutions themselves.",
            'friend': "You are supportive and casual. Use a relaxed, conversational tone and show genuine interest in the user's experience.",
            'analyst': "You are detailed and analytical. Provide thorough explanations, break down complex concepts, and focus on understanding."
        };

        return `${basePrompt} ${personalityPrompts[currentPersonality as keyof typeof personalityPrompts]}`;
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <div
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 cursor-pointer z-50 hover:scale-110 transition-all duration-300"
                >
                    <PlasmaBall size={48} />
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
                                {isConversationMode && (
                                    <button
                                        onClick={toggleVoiceRecording}
                                        className={`p-2 rounded-full transition-all duration-200 ${
                                            isRecording 
                                                ? 'bg-red-500 text-white animate-pulse' 
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                        title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                                    >
                                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                )}
                                {isConversationMode && (
                                    <button
                                        onClick={isStreamingMode ? stopStreamingConversation : startStreamingConversation}
                                        className={`p-2 rounded-full transition-all duration-200 ${
                                            isStreamingMode 
                                                ? 'bg-green-500 text-white animate-pulse' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                        title={isStreamingMode ? 'Stop Streaming Conversation' : 'Start Streaming Conversation'}
                                    >
                                        {isStreamingMode ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                )}
                            </div>
                            <div className="ai-fullscreen-controls">
                                <button
                                    onClick={createNewConversation}
                                    className="ai-fullscreen-button"
                                    title="New Conversation"
                                >
                                    <MessageSquare size={16} />
                                </button>
                                <button
                                    onClick={toggleFullscreen}
                                    className="ai-fullscreen-button"
                                    title="Exit Fullscreen"
                                >
                                    <Minimize2 size={16} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
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
                                    onClick={() => setActiveConversation(conversation.id)}
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
                                onClick={createNewConversation}
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
                                    onClick={toggleFullscreen}
                                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                                    title="Enter Fullscreen Mode"
                                >
                                    <Maximize2 size={16} />
                                </button>
                                
                                {/* Conversation Mode Toggle */}
                                <button
                                    onClick={() => setIsConversationMode(!isConversationMode)}
                                    className={`p-2 rounded-full transition-all ${
                                        isConversationMode 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                    title={isConversationMode ? "Exit Conversation Mode" : "Enter Conversation Mode"}
                                >
                                    <PlasmaBall size={24} />
                                </button>
                                
                                {/* Voice Recording Button - Only show in conversation mode */}
                                {isConversationMode && (
                                    <button
                                        onClick={toggleVoiceRecording}
                                        className={`p-2 rounded-full transition-all duration-200 ${
                                            isRecording 
                                                ? 'bg-red-500 text-white animate-pulse' 
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                        title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                                    >
                                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                )}
                                
                                {/* Streaming Conversation Button - Only show in conversation mode */}
                                {isConversationMode && (
                                    <button
                                        onClick={isStreamingMode ? stopStreamingConversation : startStreamingConversation}
                                        className={`p-2 rounded-full transition-all duration-200 ${
                                            isStreamingMode 
                                                ? 'bg-green-500 text-white animate-pulse' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                        title={isStreamingMode ? 'Stop Streaming Conversation' : 'Start Streaming Conversation'}
                                    >
                                        {isStreamingMode ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                )}
                                
                                {/* Read Last Message */}
                                {currentMessages.filter(msg => !msg.isUser).length > 0 && (
                                    <button
                                        onClick={readLastMessage}
                                        className={`p-2 rounded-full transition-all ${
                                            isReadingLastMessage 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                        title="Read Last Message Aloud"
                                    >
                                        {isReadingLastMessage ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                    </button>
                                )}
                                
                                <button onClick={() => setIsOpen(false)}><X size={20}/></button>
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
                                                onClick={() => playVoice(msg.text)}
                                                className={`p-1 rounded-full transition-colors ${
                                                    isPlayingVoice 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-white/20 text-gray-600 hover:bg-white/30'
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
                                            onClick={() => {
                                                setInputMessage(prompt);
                                                setTimeout(() => sendMessage(), 100);
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
                        {/* Conversation Mode Indicator */}
                        {isConversationMode && (
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
                                    isConversationMode 
                                        ? "Talk to Synapse in conversation mode! 🗣️" 
                                        : (!isDemoUser && promptCount >= 10)
                                            ? "Daily limit reached! 🎯" 
                                            : "Ask me anything, little explorer! 🚀"
                                }
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading || (!isDemoUser && promptCount >= 10)}
                                className="flex-1 ai-input-field"
                            />
                            <button 
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading || (!isDemoUser && promptCount >= 10)}
                                className="ai-send-button p-3 rounded-full transition-all duration-300 disabled:opacity-50 transform hover:scale-110 active:scale-95"
                                title="Send your message to Synapse! 🚀"
                            >
                                <div className="flex items-center gap-1">
                                    <Send size={18} className="text-white" />
                                    <span className="text-white font-bold text-sm">Send!</span>
                                </div>
                            </button>
                        </label>
                        {!isDemoUser && promptCount >= 10 && (
                            <div className="text-center text-amber-400 text-xs mt-2 font-bold">🎯 You've used all your daily questions! Come back tomorrow for more fun! 🌟</div>
                        )}
                        {isDemoUser && (
                            <div className="text-center text-green-400 text-xs mt-2 font-bold">🌟 Demo User: Unlimited access! 🚀</div>
                        )}
                        {isStreamingMode && (
                            <div className="text-center text-blue-400 text-xs mt-2 font-bold animate-pulse">🎤 Streaming Conversation Active - Speak to Synapse! 🔊</div>
                        )}
                        
                        {/* Test Image Generation Button (for debugging) */}
                        {isDemoUser && (
                            <div className="mt-2 text-center">
                                <button
                                    onClick={() => {
                                        setInputMessage("Generate an image of a cute robot");
                                        setTimeout(() => sendMessage(), 100);
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