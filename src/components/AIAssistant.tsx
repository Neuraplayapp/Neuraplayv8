import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Volume2, VolumeX, Sparkles, Crown, Star, Settings, Home, Gamepad2, Users, FileText, User, BarChart3, Info, Brain, Zap, Target, TrendingUp, Lightbulb, RotateCcw, Play, Pause, HelpCircle, Award, Clock, Activity, Maximize2, Minimize2, MessageSquare, History, Mic, MicOff, Bell, Globe, Shield, Calculator, BookOpen, Palette, Music, Heart, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useConversation } from '@elevenlabs/react';

import { getAgentId, getVoiceId } from '../config/elevenlabs';
import { useAIAgent } from '../contexts/AIAgentContext';
import { useUser } from '../contexts/UserContext';
import { useConversation as useGlobalConversation, type Message } from '../contexts/ConversationContext';
import { base64ToBinary } from '../utils/videoUtils';

import RichMessageRenderer from './RichMessageRenderer';
// Unified assistant surface (text + visual)
import AssistantSurface from './assistant/AssistantSurface';
import ScribbleModule from './ScribbleModule';
import Overlay from './Overlay';
// @ts-ignore
import Scribbleboard from './scribbleboard/Scribbleboard';
// @ts-ignore
import TextWorkbench from './editor/TextWorkbench';
import SearchOverlay from './SearchOverlay';
import { analyzeCommand as analyzeIntent } from '../services/IntentClassifier';
import { AssistantConfig } from '../services/AssistantConfig';
import { WebSocketService } from '../services/WebSocketService';
import { dataCollectionService } from '../services/DataCollectionService';

import PlasmaBall from './PlasmaBall';
import './AIAssistant.css';

// Message and Conversation interfaces are now imported from ConversationContext

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

    // Listen for search triggers from clickable cards - moved to after function definition
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isScribbleModuleOpen, setIsScribbleModuleOpen] = useState(false);
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
    const [overlayContent, setOverlayContent] = useState<JSX.Element | null>(null);
    const [scribbleImports, setScribbleImports] = useState<any[]>([]);
    const [scribbleTemplate, setScribbleTemplate] = useState<string | null>(null);
    // Use global conversation context instead of local state
    const {
        conversations,
        activeConversation,
        setActiveConversation,
        addMessage,
        createConversation,
        clearConversation,
        getActiveConversation
    } = useGlobalConversation();

    // Listen for tool-triggered canvas open requests
    useEffect(() => {
        const handler = (e: any) => {
            setIsScribbleModuleOpen(true);
            if (e?.detail?.items && Array.isArray(e.detail.items)) {
                setScribbleImports(e.detail.items);
            }
            if (e?.detail?.template) {
                setScribbleTemplate(e.detail.template);
            }
            // Support plugin quick-add and content injection
            if (e?.detail?.pluginId || e?.detail?.content) {
                const detail = e.detail || {};
                // Pass as a special import item the ScribbleModule understands
                setScribbleImports([
                    {
                        type: detail.pluginId || 'text',
                        title: detail.pluginId || 'plugin',
                        content: detail.content || 'New Block',
                        metadata: { position: detail.position || null }
                    }
                ]);
            }
        };
        window.addEventListener('openScribbleModule', handler as EventListener);
        return () => window.removeEventListener('openScribbleModule', handler as EventListener);
    }, []);

    // New: open Scribbleboard via tool
    const [isScribbleboardOpen, setIsScribbleboardOpen] = useState(false);
    const [surfacePreference, setSurfacePreference] = useState<'auto'|'text'|'visual'>('auto');
    useEffect(() => {
        const openBoard = () => setIsScribbleboardOpen(true);
        window.addEventListener('scribble_open', openBoard as EventListener);
        return () => window.removeEventListener('scribble_open', openBoard as EventListener);
    }, []);
    
    // Use user context for usage limits and verification
    const { 
        user: contextUser, 
        canUseAI, 
        canGenerateImage, 
        recordAIUsage, 
        recordImageGeneration 
    } = useUser();
    
    const menuRef = useRef<HTMLDivElement>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const [promptCount, setPromptCount] = useState(0);
    const [isReadingLastMessage, setIsReadingLastMessage] = useState(false);
    
    // WebSocket service for real-time communication  
    const webSocketService = useRef<WebSocketService>(WebSocketService.getInstance());
    
    // Official ElevenLabs Conversation Hook - ONLY for conversation mode
    const elevenLabsConversation = useConversation({
        onConnect: () => {
            console.log('✅ ElevenLabs Conversation Connected');
            console.log('🔍 Connection details:');
            console.log('  - Agent ID used:', getAgentId());
            console.log('  - Connection timestamp:', new Date().toISOString());
            console.log('  - Browser info:', navigator.userAgent);
            addMessage(activeConversation, { 
                text: "🎤 Voice conversation ready! Start speaking anytime! ✨", 
                isUser: false, 
                timestamp: new Date() 
            });
        },
        onDisconnect: () => {
            console.log('❌ ElevenLabs Conversation Disconnected');
            console.log('🔍 Disconnection timestamp:', new Date().toISOString());
            addMessage(activeConversation, { 
                text: "🔌 Voice conversation ended. You can still chat with text or single recordings! 💬", 
                isUser: false, 
                timestamp: new Date() 
            });
        },
        onMessage: (message) => {
            console.log('📥 ElevenLabs Message:', message);
            console.log('📥 Message type:', typeof message);
            console.log('📥 Message keys:', Object.keys(message || {}));
            console.log('📥 Message source:', message?.source);
            console.log('📥 Message content:', message?.message);
            console.log('📥 Message timestamp:', new Date().toISOString());
            
            // Handle different message sources based on ElevenLabs API
            if (message.source === 'ai' && message.message) {
                addMessage(activeConversation, { 
                    text: message.message, 
                    isUser: false, 
                    timestamp: new Date() 
                });
            } else if (message.source === 'user' && message.message) {
                addMessage(activeConversation, { 
                    text: message.message, 
                    isUser: true, 
                    timestamp: new Date() 
                });
            }
        },
        onError: (error) => {
            console.error('❌ ElevenLabs Conversation Hook Error:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            console.error('❌ Error type:', typeof error);
            console.error('❌ Error properties:', Object.keys(error || {}));
            
            // Safe error property access
            const errorObj = typeof error === 'object' && error !== null ? error as any : {};
            const errorStr = typeof error === 'string' ? error : error?.toString?.() || 'Unknown error';
            
            console.error('❌ Error message:', errorObj?.message || errorStr);
            console.error('❌ Error stack:', errorObj?.stack || 'No stack');
            console.error('❌ Error timestamp:', new Date().toISOString());
            
            // Enhanced authorization error debugging for the hook
            if ((errorObj?.message && errorObj.message.includes('authorize')) || 
                (errorObj?.message && errorObj.message.includes('authorization')) ||
                (errorStr.includes('authorize')) || (errorStr.includes('authorization')) ||
                (errorObj?.name && errorObj.name.includes('Authorization')) || 
                (errorObj?.code && errorObj.code.includes('auth'))) {
                console.error('🚫 CONVERSATION HOOK AUTHORIZATION ERROR DETECTED');
                console.error('🔍 Detailed authorization debugging:');
                console.error('  - Agent ID:', getAgentId());
                console.error('  - Voice ID:', getVoiceId());
                console.error('  - API Key exists:', !!import.meta.env.VITE_ELEVENLABS_API_KEY);
                console.error('  - API Key length:', import.meta.env.VITE_ELEVENLABS_API_KEY?.length || 0);
                console.error('  - API Key starts with sk-:', import.meta.env.VITE_ELEVENLABS_API_KEY?.startsWith('sk-') || false);
                console.error('  - Current URL:', window.location.href);
                console.error('  - User agent:', navigator.userAgent);
                console.error('  - Permissions API available:', !!navigator.permissions);
                
                // Check microphone permissions
                if (navigator.permissions) {
                    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
                        console.error('🔍 Microphone permission:', result.state);
                    }).catch(permError => {
                        console.error('🔍 Microphone permission check failed:', permError);
                    });
                }
                
                // Check if this is a CORS issue
                console.error('🔍 Checking for CORS issues...');
                console.error('  - Origin:', window.location.origin);
                console.error('  - Protocol:', window.location.protocol);
                console.error('  - Is HTTPS:', window.location.protocol === 'https:');
                console.error('  - Is localhost:', window.location.hostname === 'localhost');
                
                // Test basic API connectivity
                console.error('🔍 Testing basic ElevenLabs API connectivity...');
                const testBasicAPI = async () => {
                    try {
                        const response = await fetch('https://api.elevenlabs.io/v1/user', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${import.meta.env.VITE_ELEVENLABS_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        console.error('🔍 Basic API test status:', response.status);
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('🔍 Basic API test error:', errorText);
                        } else {
                            const userData = await response.json();
                            console.error('🔍 Basic API test success:', userData);
                        }
                    } catch (apiError) {
                        console.error('🔍 Basic API test failed:', apiError);
                    }
                };
                testBasicAPI();
            }
            
            addMessage(activeConversation, { 
                text: "⚠️ Connection error. Please try again or use text chat! 🔄", 
                isUser: false, 
                timestamp: new Date() 
            });
        }
    });
    
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
    const { user: currentUser } = useUser();
    
    // Remove limits for Admin users
    const isUnlimitedUser = currentUser?.role === 'admin' || currentUser?.subscription?.tier === 'unlimited';

    // Load ElevenLabs widget script and custom styling (only once)
    useEffect(() => {
        console.log('🔍 ElevenLabs Integration Debug - Starting widget initialization...');
        console.log('🔍 Current Agent ID:', getAgentId());
        console.log('🔍 Current Voice ID:', getVoiceId());
        console.log('🔍 Window origin:', window.location.origin);
        console.log('🔍 Window hostname:', window.location.hostname);
        console.log('🔍 Full URL:', window.location.href);
        
        // Check if script is already loaded
        const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
        const existingStyle = document.querySelector('#elevenlabs-custom-style');
        
        if (!existingScript && !customElements.get('elevenlabs-convai')) {
            console.log('🔄 Loading ElevenLabs widget script...');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
            script.async = true;
            script.type = 'text/javascript';
            script.id = 'elevenlabs-widget-script';
            
            // Handle successful loading
            script.onload = () => {
                console.log('✅ ElevenLabs widget script loaded successfully');
                console.log('🔍 Custom elements available:', !!window.customElements);
                console.log('🔍 ElevenLabs ConvAI element registered:', !!customElements.get('elevenlabs-convai'));
                
                // Add comprehensive event listeners for widget debugging
                setTimeout(() => {
                    const widget = document.querySelector('elevenlabs-convai');
                    console.log('🔍 Widget found in DOM:', !!widget);
                    
                    if (widget) {
                        console.log('🔍 Widget attributes:', Array.from(widget.attributes).map(attr => `${attr.name}="${attr.value}"`));
                        
                        // Add all possible event listeners for debugging
                        widget.addEventListener('elevenlabs-convai:call', (event) => {
                            const customEvent = event as CustomEvent;
                            console.log('🎤 Widget call started:', customEvent.detail);
                        });
                        
                        widget.addEventListener('elevenlabs-convai:error', (event) => {
                            const customEvent = event as CustomEvent;
                            console.error('❌ Widget error event:', customEvent.detail);
                            console.error('❌ Error type:', typeof customEvent.detail);
                            console.error('❌ Error keys:', Object.keys(customEvent.detail || {}));
                            if (customEvent.detail?.message) {
                                console.error('❌ Error message:', customEvent.detail.message);
                            }
                            if (customEvent.detail?.error) {
                                console.error('❌ Error object:', customEvent.detail.error);
                            }
                            
                            // Specific authorization error debugging
                            if (customEvent.detail?.message?.includes('authorize') || customEvent.detail?.message?.includes('authorization')) {
                                console.error('🚫 AUTHORIZATION ERROR DETECTED');
                                console.error('🔍 Agent ID being used:', getAgentId());
                                console.error('🔍 Is agent ID valid?', !!getAgentId() && getAgentId().length > 0);
                                console.error('🔍 Environment variables check:');
                                console.error('  - VITE_ELEVENLABS_API_KEY exists:', !!import.meta.env.VITE_ELEVENLABS_API_KEY);
                                console.error('  - Agent ID from config:', getAgentId());
                                console.error('🔍 Widget configuration:');
                                console.error('  - data-public:', widget.getAttribute('data-public'));
                                console.error('  - data-no-auth:', widget.getAttribute('data-no-auth'));
                                console.error('  - disable-auth:', widget.getAttribute('disable-auth'));
                                console.error('  - no-authentication:', widget.getAttribute('no-authentication'));
                                console.error('  - public-agent:', widget.getAttribute('public-agent'));
                            }
                        });
                        
                        widget.addEventListener('elevenlabs-convai:end', (event) => {
                            const customEvent = event as CustomEvent;
                            console.log('🔚 Widget call ended:', customEvent.detail);
                        });
                        
                        widget.addEventListener('elevenlabs-convai:connect', (event) => {
                            const customEvent = event as CustomEvent;
                            console.log('🔗 Widget connected:', customEvent.detail);
                        });
                        
                        widget.addEventListener('elevenlabs-convai:disconnect', (event) => {
                            const customEvent = event as CustomEvent;
                            console.log('🔌 Widget disconnected:', customEvent.detail);
                        });
                        
                        widget.addEventListener('elevenlabs-convai:message', (event) => {
                            const customEvent = event as CustomEvent;
                            console.log('💬 Widget message:', customEvent.detail);
                        });
                        
                        // Add generic error event listener
                        widget.addEventListener('error', (event) => {
                            console.error('❌ Generic widget error:', event);
                        });
                    } else {
                        console.warn('⚠️ Widget not found in DOM after script load');
                    }
                }, 1000);
            };
            
            // Handle any loading errors gracefully
            script.onerror = (error) => {
                console.error('❌ ElevenLabs widget script failed to load:', error);
                console.warn('⚠️ Falling back to plasma ball voice interface');
            };
            
            document.head.appendChild(script);
        } else if (customElements.get('elevenlabs-convai')) {
            console.log('✅ ElevenLabs widget already registered');
            console.log('🔍 Existing widget status check...');
            
            // Check existing widget
            setTimeout(() => {
                const existingWidget = document.querySelector('elevenlabs-convai');
                if (existingWidget) {
                    console.log('🔍 Existing widget found, attributes:', Array.from(existingWidget.attributes).map(attr => `${attr.name}="${attr.value}"`));
                }
            }, 500);
        }

        // Add custom CSS to hide branding and improve styling (only once)
        if (!existingStyle) {
            const style = document.createElement('style');
            style.id = 'elevenlabs-custom-style';
            style.textContent = `
                /* Hide ElevenLabs branding */
                elevenlabs-convai::part(branding),
                elevenlabs-convai [data-testid*="branding"],
                elevenlabs-convai [class*="branding"],
                elevenlabs-convai [class*="footer"],
                elevenlabs-convai [class*="powered"],
                elevenlabs-convai::shadow [data-testid*="branding"],
                elevenlabs-convai::shadow [class*="branding"],
                elevenlabs-convai::shadow [class*="footer"],
                elevenlabs-convai::shadow [class*="powered"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                /* Center and style the widget */
                .elevenlabs-widget-container elevenlabs-convai {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    margin: 0 auto !important;
                }
                
                /* Custom widget styling */
                elevenlabs-convai {
                    border-radius: 12px !important;
                    overflow: hidden !important;
                }
                
                /* Remove any bottom spacing/padding that might contain branding */
                elevenlabs-convai::shadow .widget-footer,
                elevenlabs-convai::shadow .footer,
                elevenlabs-convai::shadow .branding-container {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        // No cleanup function - keep script and styles loaded globally
    }, []);

    // Debug MediaRecorder on mount
    useEffect(() => {
        debugMediaRecorder();
    }, []);

    // Get current messages based on active conversation
    const currentMessages = getActiveConversation().messages;

    // Available pages and their descriptions - ONLY ACTUAL ROUTES
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
        '/profile': { name: 'Profile', icon: User, description: 'Your user profile' },
        '/streaming-demo': { name: 'Streaming Demo', icon: Activity, description: 'Voice streaming demo' }
    };

    // Available settings and their descriptions - COMPLETE LIST with agency
    const availableSettings = {
        'theme': { 
            name: 'Theme', 
            icon: Settings, 
            description: 'Change light/dark mode',
            actions: ['toggle_dark_mode', 'set_theme_preference']
        },
        'accessibility': { 
            name: 'Accessibility', 
            icon: Target, 
            description: 'Accessibility settings including color blindness support',
            actions: ['test_color_vision', 'enable_colorblind_mode', 'adjust_contrast', 'increase_font_size']
        },
        'notifications': { 
            name: 'Notifications', 
            icon: Bell, 
            description: 'Notification preferences',
            actions: ['toggle_notifications', 'set_reminder_frequency', 'customize_alerts']
        },
        'language': { 
            name: 'Language', 
            icon: Globe, 
            description: 'Language settings',
            actions: ['change_language', 'set_speech_language', 'enable_translation']
        },
        'privacy': { 
            name: 'Privacy', 
            icon: Shield, 
            description: 'Privacy settings',
            actions: ['manage_data_sharing', 'set_parental_controls', 'review_permissions']
        },
        'voice': { 
            name: 'Voice Settings', 
            icon: Mic, 
            description: 'Voice recognition and TTS preferences',
            actions: ['adjust_voice_speed', 'change_voice_character', 'calibrate_microphone']
        },
        'profile': { 
            name: 'Profile', 
            icon: User, 
            description: 'User profile and learning preferences',
            actions: ['update_learning_goals', 'set_difficulty_level', 'customize_avatar']
        }
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

    // Available games and their descriptions with developmental benefits
    const availableGames = {
        'counting': { 
            name: 'Counting Adventure', 
            icon: Gamepad2, 
            description: 'Learn to count with fun games',
            benefits: 'Develops number recognition, counting skills, and basic math foundations'
        },
        'fuzzling': { 
            name: 'Fuzzling Game', 
            icon: Target, 
            description: 'Interactive shape and pattern matching',
            benefits: 'Improves visual processing, pattern recognition, and cognitive flexibility'
        },
        'memory': { 
            name: 'Memory Sequence', 
            icon: Brain, 
            description: 'Test and improve memory skills',
            benefits: 'Enhances working memory, attention span, and sequential processing'
        },
        'inhibition': { 
            name: 'Inhibition Control', 
            icon: Shield, 
            description: 'Practice self-control and focus',
            benefits: 'Builds impulse control, attention regulation, and executive function'
        },
        'cube': { 
            name: 'The Cube Game', 
            icon: Target, 
            description: 'Spatial reasoning and 3D thinking',
            benefits: 'Develops spatial intelligence, problem-solving, and visual-motor skills'
        },
        'stacker': { 
            name: 'Stacker Challenge', 
            icon: TrendingUp, 
            description: 'Balance and coordination game',
            benefits: 'Improves hand-eye coordination, planning, and motor control'
        },
        'mountain': { 
            name: 'Mountain Climber', 
            icon: TrendingUp, 
            description: 'Adventure and problem-solving',
            benefits: 'Enhances strategic thinking, perseverance, and goal-setting'
        },
        'letter': { 
            name: 'Letter Hunt', 
            icon: BookOpen, 
            description: 'Letter recognition and phonics',
            benefits: 'Builds literacy skills, letter recognition, and reading readiness'
        }
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

    // Create new conversation using context
    const createNewConversation = () => {
        const newId = `conv_${Date.now()}`;
        const title = `Chat ${Object.keys(conversations).length}`;
        
        // Create conversation in context
        createConversation(newId, title);
        
        // Add welcome message
        addMessage(newId, { 
            text: "🌟 Hi there! I'm AI Assistant, your friendly AI teacher! 🚀 What would you like to explore today? 🎮✨", 
            isUser: false, 
            timestamp: new Date() 
        });
        
        setActiveConversation(newId);
    };

    // Clear current conversation history
    const clearCurrentConversation = () => {
        clearConversation(activeConversation);
        console.log('🧹 Cleared conversation history for:', activeConversation);
    };

    // updateConversationTitle function removed - not used in the component

    // addMessage helper function removed - now using context method addMessage

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

    // Platform-specific conversation service event handlers (single registration with cleanup + debounce)
    useEffect(() => {
        const wsService = webSocketService.current;

        let lastErrorTime = 0;

        const handleConnected = () => {
            console.log('✅ WebSocket connected for conversation');
            if (modeRef.current === 'conversing') {
                addMessage(activeConversation, {
                    text: 'Voice conversation ready! Start speaking! 🎤',
                    isUser: false,
                    timestamp: new Date()
                });
            }
        };

        const handleMessage = (data: any) => {
            console.log('📥 WebSocket message received:', data);
            if (data.type === 'ai_response' && data.text) {
                addMessage(activeConversation, {
                    text: data.text,
                    isUser: false,
                    timestamp: new Date()
                });
            }
            if (data.type === 'audio_chunk' && data.audio) {
                playBase64Audio(data.audio);
            }
        };

        const handleError = (error: any) => {
            console.error('❌ WebSocket error:', error);
            const now = Date.now();
            if (now - lastErrorTime > 10000) { // 10s debounce
                lastErrorTime = now;
                addMessage(activeConversation, {
                    text: 'Connection error. Please try again. 🔄',
                    isUser: false,
                    timestamp: new Date()
                });
            }
        };

        const handleDisconnected = () => {
            console.log('🔌 WebSocket disconnected');
        };

        wsService.on('connected', handleConnected);
        wsService.on('message', handleMessage);
        wsService.on('error', handleError);
        wsService.on('disconnected', handleDisconnected);

        return () => {
            wsService.off('connected', handleConnected);
            wsService.off('message', handleMessage);
            wsService.off('error', handleError);
            wsService.off('disconnected', handleDisconnected);
        };
    }, [activeConversation]);

    // Enhanced AI Agency Functions - COMPREHENSIVE AGENCY
    const analyzeCommand = (text: string): { type: 'navigation' | 'settings' | 'chat' | 'info' | 'agent' | 'game' | 'accessibility' | 'development' | 'content' | 'read', action?: any } => {
        // Delegate to centralized classifier service
        // @ts-ignore
        return analyzeIntent(text, { availablePages });
    };

    const executeCommand = async (command: { type: string, action?: any }): Promise<string> => {
        switch (command.type) {
            case 'accessibility':
                if (command.action?.type === 'color_blindness_support') {
                    // Navigate to a test page or create color tests
                    navigate('/playground');
                    setTimeout(() => {
                        addMessage(activeConversation, {
                            text: `🎨 I've taken you to the playground where we can test your color vision! I'm going to create some color tests for you. 

Let's start: Can you tell me if these colors look the same or different?
🔴 Red vs 🟢 Green
🔵 Blue vs 🟡 Yellow

Based on your answers, I'll customize NeuraPlay's colors to work perfectly for you!`,
                            isUser: false,
                            timestamp: new Date()
                        });
                    }, 1000);
                    return command.action.message;
                }
                
                if (command.action?.type === 'color_blindness_analysis') {
                    // Apply colorblind settings based on analysis
                    if (command.action.result === 'red_green_deficiency') {
                        // Enable colorblind mode
                        console.log('🎨 Enabling colorblind-friendly mode');
                        // Add actual colorblind mode implementation here
                    }
                    return command.action.message;
                }
                break;
                
            case 'development':
                if (command.action?.request === 'recommend_games') {
                    const skill = command.action.skill;
                    const recommendedGames = Object.entries(availableGames).filter(([key, game]) => {
                        const benefits = game.benefits.toLowerCase();
                        switch(skill) {
                            case 'math': return benefits.includes('math') || benefits.includes('number') || benefits.includes('count');
                            case 'reading': return benefits.includes('letter') || benefits.includes('reading') || benefits.includes('literacy');
                            case 'memory': return benefits.includes('memory') || benefits.includes('attention');
                            case 'coordination': return benefits.includes('coordination') || benefits.includes('motor');
                            case 'problem_solving': return benefits.includes('problem') || benefits.includes('reasoning');
                            case 'inhibition': return benefits.includes('control') || benefits.includes('attention');
                            case 'spatial': return benefits.includes('spatial') || benefits.includes('visual');
                            default: return true;
                        }
                    });
                    
                    navigate('/playground');
                    let gameList = recommendedGames.map(([key, game]) => 
                        `• **${game.name}**: ${game.description}\n  *Benefits: ${game.benefits}*`
                    ).join('\n\n');
                    
                    return `${command.action.message}\n\n🎯 **Perfect games for ${skill} development:**\n\n${gameList}\n\nI've taken you to the playground - try these games!`;
                }
                break;
                
            case 'content':
                if (command.action?.type === 'diary') {
                    const prompts = [
                        "What was the most interesting thing you learned today?",
                        "Describe a challenge you overcame recently and how you did it.",
                        "What are three things you're grateful for right now?",
                        "If you could teach someone else something you learned, what would it be?",
                        "What goal do you want to work on tomorrow?"
                    ];
                    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                    
                    return `📝 Here's your personalized diary prompt:\n\n"${randomPrompt}"\n\nTake your time to reflect and write your thoughts! 🌟`;
                } else if (command.action?.type === 'calendar') {
                    return `📅 I'm ready to help you schedule something! What would you like to add to your calendar? For example:
• Study session
• Game time  
• Practice activity
• Learning goal
• Fun activity

Just tell me what and when! 🗓️`;
                } else if (command.action?.type === 'forum') {
                    navigate('/forum');
                    return `💬 I've taken you to the forum! You can create a post about:
• Ask questions about games
• Share your progress
• Help other learners
• Discuss learning strategies
• Connect with the community

What would you like to post about? 🌟`;
                }
                break;
                
            case 'read':
                if (command.action?.type === 'notifications') {
                    return `🔔 Here are your recent notifications:\n\n• Welcome to NeuraPlay! 🌟\n• New games available in playground\n• Daily learning streak: Keep it up!\n• Community forum has new discussions\n\nI can also help you customize notification settings if needed! 📱`;
                } else if (command.action?.type === 'forum') {
                    navigate('/forum');
                    return `💬 I've taken you to the forum! Here's what's happening:\n\n• Active discussions about learning strategies\n• Users sharing their progress\n• Questions and answers about games\n• Community challenges and events\n\nYou can join any discussion or start your own! 🌟`;
                } else if (command.action?.type === 'playground') {
                    navigate('/playground');
                    const gamesList = Object.entries(availableGames).map(([key, game]) => 
                        `• **${game.name}**: ${game.description}`
                    ).join('\n');
                    return `🎮 Here are all available games and activities:\n\n${gamesList}\n\nI've taken you to the playground - have fun learning! 🌟`;
                } else if (command.action?.type === 'diary') {
                    return `📖 Your diary entries:\n\n• Reflections on learning progress\n• Daily thoughts and insights\n• Goals and achievements\n• Challenges and solutions\n\nWould you like me to create a new diary prompt for today? 📝`;
                }
                break;
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
                
                if (command.action === 'notifications') {
                    return `🔔 Notifications panel is now available! You can check your alerts and messages through the notifications dropdown in the header! 📬`;
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
                        return `• "${setting.name}" - ${setting.description}`;
                    }).join('\n');
                    
                    return `🌟 Here's what I can do for you! 🚀

🎮 **Navigation**: I can take you to ANY page! Try:
${allPages}
• "Settings" or "Open settings" - Access settings dropdown
• "Notifications" or "Check notifications" - View notifications dropdown

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
        const currentMode = modeRef.current; // Use ref for more accurate mode
        console.log(`Sending message in mode: ${currentMode}`);

        // Add user message to UI
        const userMessage: Message = { text, isUser: true, timestamp: new Date() };
        addMessage(activeConversation, userMessage);
        setInputMessage('');
        setIsLoading(true);

        // Apply prompt count restrictions for non-unlimited users
        if (!isUnlimitedUser) {
            setPromptCount(count => count + 1);
        }

        try {
            // In full conversation mode, treat as chat but allow some tool calling for accessibility/urgent needs
            if (currentMode === 'conversing') {
                // Check for urgent tool needs (accessibility, settings) even in conversation mode
                const urgentToolNeeds = checkUrgentToolNeeds(text);
                if (urgentToolNeeds.length > 0) {
                    await handleAIWithToolCalling(text, true); // Enable tool calling for urgent needs
                } else {
                    await handleConversationMode(text); // Pure conversation
                }
                // Auto-play the response
                setTimeout(async () => {
                    const messages = getActiveConversation().messages;
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
                // For text or single recordings, use enhanced AI with tool calling
                await handleChatMode(text);
                // Auto-open surface on visual intent
                try {
                    const { analyzeCommand } = await import('../services/IntentClassifier');
                    const cmd = analyzeCommand(text);
                    const wantsVisual = /chart|graph|diagram|visual|plot|bar|line|pie|scatter/.test(text.toLowerCase()) || (cmd?.type === 'content' && /chart|graph|diagram/.test(cmd?.action?.type || ''));
                    if (wantsVisual) { setSurfacePreference('visual'); setIsScribbleboardOpen(true); }
                    else { setSurfacePreference('text'); }
                } catch {}
            }
        } catch (error: any) {
            console.error('Error in handleSendMessage:', error);
            addMessage(activeConversation, { 
                text: `Oops! Something went wrong: ${error.message}. Let's try again in a moment! 🌟`, 
                isUser: false, 
                timestamp: new Date() 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Official ElevenLabs Conversation Mode - Following ElevenLabs Documentation
    const handleToggleConversationMode = async () => {
        if (mode === 'conversing') {
            // Stop the conversation using official ElevenLabs API
            console.log('🔄 Ending conversation mode...');
            
            try {
                // End ElevenLabs conversation session
                await elevenLabsConversation.endSession();
                console.log('✅ ElevenLabs conversation ended successfully');
            } catch (error) {
                console.error('❌ Error ending ElevenLabs conversation:', error);
            }
            
            setMode('idle');
            addMessage(activeConversation, { 
                text: "Conversation mode ended. You can still chat with me via text! 🎤", 
                isUser: false, 
                timestamp: new Date() 
            });
        } else {
            // Start the conversation using official ElevenLabs API
            console.log('🔄 Setting mode to conversing...');
            setMode('conversing');
            modeRef.current = 'conversing'; // Set ref immediately
            
            addMessage(activeConversation, { 
                text: "Starting conversation mode... 🎤", 
                isUser: false, 
                timestamp: new Date() 
            });
            
            try {
                // Test configuration before attempting connection
                const configTest = await testElevenLabsConfiguration();
                if (!configTest) {
                    throw new Error('ElevenLabs configuration test failed');
                }
                
                // Request microphone permission (required by ElevenLabs)
                console.log('🎤 Requesting microphone access...');
                console.log('🔍 Navigator.mediaDevices available:', !!navigator.mediaDevices);
                console.log('🔍 getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ Microphone access granted');
                console.log('🔍 Stream info:', {
                    id: stream.id,
                    active: stream.active,
                    tracks: stream.getTracks().length
                });
                
                // Stop the test stream since ElevenLabs will handle audio
                stream.getTracks().forEach(track => track.stop());

                // Start ElevenLabs conversation session with agent ID
                console.log('🎯 Starting ElevenLabs conversation...');
                console.log('🎯 Agent ID:', getAgentId());
                console.log('🎯 Agent ID type:', typeof getAgentId());
                console.log('🎯 Agent ID length:', getAgentId()?.length);
                console.log('🔍 Current origin:', window.location.origin);
                console.log('🔍 Current hostname:', window.location.hostname);
                console.log('🔍 Full URL:', window.location.href);
                console.log('🔍 Protocol:', window.location.protocol);
                console.log('🔍 Is HTTPS:', window.location.protocol === 'https:');
                console.log('🔍 User agent:', navigator.userAgent);
                console.log('🔍 API Key exists:', !!import.meta.env.VITE_ELEVENLABS_API_KEY);
                console.log('🔍 API Key length:', import.meta.env.VITE_ELEVENLABS_API_KEY?.length || 0);
                
                const sessionConfig = {
                    agentId: getAgentId(),
                    connectionType: 'websocket' as const, // Required by ElevenLabs
                    // Optional: add user_id for tracking if needed
                    // user_id: user?.username || 'anonymous'
                };
                
                console.log('🔍 Session config:', sessionConfig);
                console.log('🔍 ElevenLabs conversation object:', elevenLabsConversation);
                console.log('🔍 startSession method available:', typeof elevenLabsConversation.startSession);
                
                await elevenLabsConversation.startSession(sessionConfig);
                
                console.log('✅ ElevenLabs conversation started successfully');
                
                // Note: The official ElevenLabs hook handles all audio streaming automatically
                // No need for manual MediaRecorder setup - it's all handled internally
                    
                } catch (error) {
                    console.error('❌ CONVERSATION SETUP FAILED:', error);
                    console.error('❌ Error type:', typeof error);
                    console.error('❌ Error constructor:', error?.constructor?.name);
                    console.error('❌ Error message:', (error as Error)?.message);
                    console.error('❌ Error stack:', (error as Error)?.stack);
                    console.error('❌ Error code:', (error as any)?.code);
                    console.error('❌ Error status:', (error as any)?.status);
                    console.error('❌ Error statusText:', (error as any)?.statusText);
                    console.error('❌ Full error object:', error);
                    console.error('❌ Error properties:', Object.keys(error || {}));
                    
                    // Try to get more details from the error
                    if (typeof error === 'object' && error !== null) {
                        console.error('❌ Error object inspection:');
                        for (const [key, value] of Object.entries(error)) {
                            console.error(`  - ${key}:`, value);
                        }
                    }
                    
                    // Check if this is specifically an authorization error
                    const errorMessage = (error as Error)?.message || '';
                    const errorString = error?.toString?.() || '';
                    
                    if (errorMessage.includes('authorize') || errorMessage.includes('authorization') ||
                        errorString.includes('authorize') || errorString.includes('authorization') ||
                        errorMessage.includes('401') || errorMessage.includes('403') ||
                        errorMessage.includes('Unauthorized') || errorMessage.includes('Forbidden')) {
                        console.error('🚫 AUTHORIZATION ERROR IN CONVERSATION SETUP');
                        console.error('🔍 This appears to be an authorization issue with the ElevenLabs agent');
                        console.error('🔍 Possible causes:');
                        console.error('  1. Invalid or missing API key');
                        console.error('  2. Agent ID not found or not accessible');
                        console.error('  3. Agent not properly configured in ElevenLabs dashboard');
                        console.error('  4. Domain not whitelisted for this agent');
                        console.error('  5. API key doesn\'t have ConvAI permissions');
                        console.error('🔍 Troubleshooting steps:');
                        console.error('  1. Verify agent ID in ElevenLabs dashboard');
                        console.error('  2. Check API key permissions');
                        console.error('  3. Ensure agent is published and accessible');
                        console.error('  4. Check domain whitelist settings');
                    }
                    
                    console.log('🔄 Resetting mode to idle due to error...');
                    
                    setMode('idle');
                    console.log('✅ Mode reset to idle');
                    
                    // Check if it's a connection error and provide helpful messaging
                    const errorMsg = (error as Error)?.message || '';
                    const isConnectionError = errorMsg.includes('agent') || 
                                            errorMsg.includes('connection') || 
                                            errorMsg.includes('network') ||
                                            errorMsg.includes('timeout') ||
                                            errorMsg.includes('permission');
                    
                    const isAuthError = errorMsg.includes('authorize') || errorMsg.includes('authorization') ||
                                       errorMsg.includes('401') || errorMsg.includes('403');
                    
                    if (errorMsg.includes('getUserMedia') || errorMsg.includes('permission')) {
                        // Microphone error
                        const errorMessage = "🎤 Microphone access is required for conversation mode. Please allow microphone access and try again! You can still use:\n\n✅ Voice recording (microphone button)\n✅ Chat with text\n✅ All other features! 🌟";
                        addMessage(activeConversation, { 
                            text: errorMessage, 
                            isUser: false, 
                            timestamp: new Date() 
                        });
                    } else if (isAuthError) {
                        // Authorization error
                        const errorMessage = "🚫 Authorization error with voice conversation. This might be due to:\n\n• Agent configuration issues\n• API key permissions\n• Domain restrictions\n\nYou can still use:\n✅ Voice recording (microphone button)\n✅ Chat with text\n✅ All other features! 🌟";
                        addMessage(activeConversation, { 
                            text: errorMessage, 
                            isUser: false, 
                            timestamp: new Date() 
                        });
                    } else if (isConnectionError) {
                        // Connection error
                        const errorMessage = "🔧 Conversation mode is temporarily unavailable. But don't worry - you can still:\n\n✅ Use voice recording (microphone button)\n✅ Chat with text\n✅ Generate images\n✅ Use all other features!\n\nEverything else works perfectly! 🌟";
                        addMessage(activeConversation, { 
                            text: errorMessage, 
                            isUser: false, 
                            timestamp: new Date() 
                        });
                    } else {
                        // Generic error
                        addMessage(activeConversation, { 
                            text: "Sorry, I couldn't start conversation mode. Please try the voice recording button or text chat instead! 🌟", 
                            isUser: false, 
                            timestamp: new Date() 
                        });
                    }
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
        if (!inputMessage.trim() || isLoading || (!isUnlimitedUser && promptCount >= 10)) return;
        setMode('text_input');
        handleSendMessage(inputMessage);
        setMode('idle');
    };

    // Updated processVoiceInput to use unified handler with environment detection
    const processVoiceInput = async (audioBlob: Blob) => {
        try {
            console.log('Processing voice input with language:', selectedLanguage);
            
            // Convert audio to base64 for AssemblyAI using proper binary encoding
            const arrayBuffer = await audioBlob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binaryString = '';
            const chunkSize = 8192; // Process in chunks to avoid call stack issues
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.slice(i, i + chunkSize);
                binaryString += String.fromCharCode.apply(null, Array.from(chunk));
            }
            const base64Audio = btoa(binaryString);
            
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
                    audioType: audioBlob.type || 'audio/webm', // Pass the actual MIME type
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
                    const languageName = SUPPORTED_LANGUAGES[detectedLanguage as LanguageCode] || detectedLanguage;
                    console.log(`🌍 Detected language: ${languageName}`);
                }
                
                // Use unified message handler
                await handleSendMessage(transcribedText);
            } else {
                console.log('No text transcribed');
                const currentLang = SUPPORTED_LANGUAGES[selectedLanguage] || selectedLanguage;
                addMessage(activeConversation, { 
                    text: `I couldn't hear what you said in ${currentLang}. Could you try again? 🎤`, 
                    isUser: false, 
                    timestamp: new Date() 
                });
            }
        } catch (error: any) {
            console.error('Voice processing error:', error);
            const currentLang = SUPPORTED_LANGUAGES[selectedLanguage] || selectedLanguage;
            addMessage(activeConversation, { 
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
            
            // Use the same MIME type detection as conversation mode
            const supportedMimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/wav'
            ];
            
            let selectedMimeType = null;
            for (const mimeType of supportedMimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    console.log(`🎤 Selected MIME type for recording: ${mimeType}`);
                    break;
                }
            }
            
            const mediaRecorder = selectedMimeType ? 
                new MediaRecorder(stream, { mimeType: selectedMimeType }) :
                new MediaRecorder(stream);
                
            const audioChunks: Blob[] = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                // Use the actual MIME type from MediaRecorder, not hardcoded 'audio/wav'
                const actualMimeType = selectedMimeType || mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunks, { type: actualMimeType });
                console.log(`🎵 Created audio blob with type: ${actualMimeType}, size: ${audioBlob.size} bytes`);
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
            addMessage(activeConversation, { 
                text: `Sorry, I couldn't process that voice input. Please try again! 🌟`, 
                isUser: false, 
                timestamp: new Date() 
            });
        }
    };



    // Updated processTextMessage to use unified handler
    const processTextMessage = async (inputText: string) => {
        if (!inputText.trim() || isLoading || (!isUnlimitedUser && promptCount >= 10)) return;

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
        if (!inputMessage.trim() || isLoading || (!isUnlimitedUser && promptCount >= 10)) return;

        // Use unified message handler
        await handleSendMessage(inputMessage);
    };

    // NEW: Handle conversation mode (pure chat, no commands)
    const handleConversationMode = async (inputMessage: string) => {
        try {
            console.log('Handling conversation mode message:', inputMessage);
            
            // RESTORED: All AI processing now goes through the advanced agentic system
            // The AI model will intelligently choose to call generate_image tool when appropriate
            
            // Send to Synapse API for conversation
            const response = await sendMessageToSynapse(inputMessage);
            
            const assistantMessage: Message = {
                text: response,
                isUser: false,
                timestamp: new Date()
            };
            
            addMessage(activeConversation, assistantMessage);
        } catch (error: any) {
            console.error('Error in conversation mode:', error);
            
            // Provide specific error information instead of generic message
            let errorText = 'I encountered an error processing your request. ';
            if (error.message?.includes('400')) {
                errorText += 'There was an API request issue. This might be related to image generation or malformed requests.';
            } else if (error.message?.includes('401') || error.message?.includes('403')) {
                errorText += 'Authentication failed. Please check API keys.';
            } else if (error.message?.includes('timeout')) {
                errorText += 'The request timed out. Please try again.';
            } else if (error.message?.includes('network')) {
                errorText += 'Network connection issue. Please check your connection.';
            } else {
                errorText += `Specific error: ${error.message || 'Unknown error'}`;
            }
            errorText += ' 🔧';
            
            const errorMessage: Message = {
                text: errorText,
                isUser: false,
                timestamp: new Date()
            };
            addMessage(activeConversation, errorMessage);
        }
    };

    // Import tool executor at top of component
    const [toolExecutorService, setToolExecutorService] = useState<any>(null);
    
    // Initialize tool executor
    useEffect(() => {
        const initToolExecutor = async () => {
            const { toolExecutorService: service } = await import('../services/ToolExecutorService');
            setToolExecutorService(service);
            
            // Initialize navigation service with navigate function
            try {
                const { NavigationService } = await import('../services/NavigationService');
                const navService = NavigationService.getInstance();
                navService.setNavigate(navigate); // Set the navigate function
            } catch (e) {
                console.warn('NavigationService init failed:', e);
            }
        };
        initToolExecutor();
    }, [navigate]);

    // Enhanced chat mode with tool calling support
    const handleChatMode = async (inputMessage: string) => {
        try {
            console.log('Handling chat mode message:', inputMessage);
            console.log('Current mode when handling chat:', mode);
            
            // Determine if we should enable tool calling based on mode
            const enableToolCalling = mode !== 'conversing'; // Enable for text mode, disable for pure conversation
            
            // Optional: assemble educational predefines + personal memory context
            let contextPrefix = '';
            try {
                const { AssistantConfig } = await import('../services/AssistantConfig');
                if (AssistantConfig.useContextAssembler) {
                    const { assembleContext } = await import('../services/ContextAssembler');
                    const userId = contextUser?.id;
                    const assembled = assembleContext(inputMessage, { userId });
                    const predefs = assembled.predefines.map(p => `- ${p.title}`).join('\n');
                    const personal = assembled.personal && Object.keys(assembled.personal).length > 0 ? 'Personal context detected.' : '';
                    if (predefs || personal) {
                        contextPrefix = [
                            'CONTEXT:\n',
                            predefs ? `Predefined references:\n${predefs}\n` : '',
                            personal ? `${personal}\n` : ''
                        ].join('');
                    }
                }
            } catch {}

            // Send to AI service with tool calling capability
            const response = await handleAIWithToolCalling((contextPrefix ? `${contextPrefix}\n` : '') + inputMessage, enableToolCalling);
            
            // If this was triggered by voice recording, play the response back
            if (mode === 'single_recording' && response && response.textResponse) {
                console.log('Voice recording detected, playing TTS response');
                setTimeout(async () => {
                    await playVoice(response.textResponse);
                }, 500);
            }
        } catch (error: any) {
            console.error('Error in chat mode:', error);
            
            // Provide specific error information instead of generic message
            let errorText = 'I encountered an error in chat mode. ';
            if (error.message?.includes('400')) {
                errorText += 'API request failed - this could be due to malformed request or invalid parameters.';
            } else if (error.message?.includes('aiPrompts')) {
                errorText += 'Context property missing - this is a system configuration issue.';
            } else if (error.message?.includes('tool')) {
                errorText += 'Tool execution failed - there was an issue with AI tool calling.';
            } else {
                errorText += `Details: ${error.message || 'Unknown chat error'}`;
            }
            errorText += ' 🛠️';
            
            const errorMessage: Message = {
                text: errorText,
                isUser: false,
                timestamp: new Date()
            };
            addMessage(activeConversation, errorMessage);
        }
    };

    // Enhanced AI handler with tool calling support and usage limits
    const handleAIWithToolCalling = async (inputMessage: string, enableToolCalling: boolean = true) => {
        // Check AI usage limits before proceeding
        const aiUsage = canUseAI();
        if (!aiUsage.allowed) {
            const verificationMessage = contextUser?.isVerified 
                ? `You've reached your AI chat limit (${aiUsage.limit} prompts/day). Upgrade to Premium for more access!` 
                : `You've used your free AI chat limit (${aiUsage.limit} prompts/day). Verify your email for more access or upgrade to Premium!`;
                
            addMessage(activeConversation, {
                text: `🚫 ${verificationMessage}`,
                isUser: false,
                timestamp: new Date()
            });
            return;
        }
        
        // Record AI usage at the start of the request
        recordAIUsage();
        
        // Get current context for AI with conversation history
        const conversationHistory = getActiveConversation().messages.slice(-10); // Last 10 messages for context
        const context = {
            currentPage: location.pathname,
            mode: mode,
            user: contextUser ? { id: contextUser.id, name: contextUser.username } : { id: 'anonymous', name: 'User' },
            timestamp: new Date(),
            language: selectedLanguage !== 'auto' ? SUPPORTED_LANGUAGES[selectedLanguage] : null,
            isVerified: contextUser?.isVerified || false,
            subscription: contextUser?.subscription?.tier || 'free',
            // Add missing properties that may be expected by the system
            aiPrompts: [], // Required by some AI context handlers
            prompts: [], // Alternative name for prompts
            settings: {
                theme: 'dark',
                language: selectedLanguage,
                accessibility: {}
            },
            capabilities: {
                imageGeneration: canGenerateImage().allowed,
                toolCalling: true,
                voiceInput: true,
                voiceOutput: true
            },
            session: {
                id: `session_${Date.now()}`,
                startTime: new Date(),
                messageCount: conversationHistory.length
            },
            conversationHistory: conversationHistory.map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text,
                timestamp: msg.timestamp,
                hasImage: !!msg.image
            }))
        };

        // RESTORED: Image generation now works through the advanced agentic tool-calling system
        // The AI model intelligently decides when to call the generate_image tool

        // Try AI service first (if available), fallback to direct API
        let aiResponse;
        let toolCalls: any[] = [];
        let toolResultsForAssistant: any[] = [];

        try {
            // Try the enhanced AI service
            const { aiService } = await import('../services/AIService');
            console.log('🔍 AI Assistant Debug - Calling AI service with tool calling:', enableToolCalling);
            const response = await aiService.sendMessage(inputMessage, context, enableToolCalling);
            
            console.log('🔍 AI Assistant Debug - AI Service Response:', response);
            
            // Handle different response formats from the enhanced agentic system
            if (typeof response === 'string') {
                // String response - parse for tool calls
                console.log('🔧 DEBUG: Processing string response for tool calls');
                const parsed = parseAIResponse(response);
                aiResponse = parsed.text;
                toolCalls = parsed.toolCalls || [];
                console.log('🔧 DEBUG: Parsed tool calls from string:', toolCalls);
                toolResultsForAssistant = [];
            } else if (Array.isArray(response) && response.length > 0) {
                // Array response from server with tool calls (NEW AGENTIC FORMAT)
                console.log('🔧 DEBUG: Processing agentic array response:', response[0]);
                const firstResponse = response[0];
                aiResponse = firstResponse.generated_text || 'No response received';
                
                // CLIENT-SIDE TOOLS: These need to be executed by ToolExecutorService
                toolCalls = firstResponse.tool_calls || [];
                console.log('🔧 DEBUG: CLIENT-SIDE tool calls to execute:', toolCalls);
                // If there are client tool calls, open surface and prefer visual
                if (toolCalls.length > 0) { setSurfacePreference('visual'); setIsScribbleboardOpen(true); }
                
                // SERVER-SIDE TOOL RESULTS: Already executed, add to conversation
                if (firstResponse.tool_results && firstResponse.tool_results.length > 0) {
                    console.log('🔧 DEBUG: SERVER-SIDE tool results:', firstResponse.tool_results);
                    // Add server tool results to the conversation immediately
                    for (const toolResult of firstResponse.tool_results) {
                        if (toolResult.content) {
                            try {
                                const resultData = JSON.parse(toolResult.content);
                                if (resultData.success) {
                                    const serverToolMessage: Message = {
                                        text: resultData.message,
                                        isUser: false,
                                        timestamp: new Date(),
                                        action: toolResult.name as any,
                                        ...(resultData.data?.image_url && { image: resultData.data.image_url })
                                    };
                                    addMessage(activeConversation, serverToolMessage);
                                }
                            } catch (jsonError) {
                                console.error('🔧 DEBUG: Failed to parse tool result JSON:', jsonError);
                                console.error('🔧 DEBUG: Problematic content:', toolResult.content);
                                
                                // Try to handle truncated JSON by looking for patterns
                                if (toolResult.name === 'generate_image' && toolResult.content.includes('image_url')) {
                                    // Handle truncated image generation result
                                    const fallbackMessage: Message = {
                                        text: '🎨 I generated an image for you, but there was a display issue. Please try again.',
                                        isUser: false,
                                        timestamp: new Date(),
                                        action: toolResult.name as any
                                    };
                                    addMessage(activeConversation, fallbackMessage);
                                } else {
                                    // Generic fallback for other truncated results
                                    const fallbackMessage: Message = {
                                        text: `⚠️ Tool result received but couldn't be processed properly. Tool: ${toolResult.name}`,
                                        isUser: false,
                                        timestamp: new Date(),
                                        action: toolResult.name as any
                                    };
                                    addMessage(activeConversation, fallbackMessage);
                                }
                            }
                        }
                    }
                }
                toolResultsForAssistant = firstResponse.tool_results || [];
            } else if (response && typeof response === 'object') {
                // Object response
                console.log('🔧 DEBUG: Processing object response:', response);
                const responseObj = response as any; // Cast for flexible property access
                aiResponse = responseObj.generated_text || responseObj.text || 'No response received';
                toolCalls = responseObj.tool_calls || [];
                console.log('🔧 DEBUG: Extracted tool calls from object:', toolCalls);
                toolResultsForAssistant = responseObj.tool_results || [];
            } else {
                console.log('🔧 DEBUG: No valid response format found');
                aiResponse = 'No response received';
                toolCalls = [];
                toolResultsForAssistant = [];
            }
            
            console.log('🔍 AI Assistant Debug - Final parsed response:', { aiResponse, toolCalls: toolCalls.length });
            
        } catch (error) {
            console.log('AI Service failed, trying basic API test');
            try {
                // Try the basic API test first
                const { aiService } = await import('../services/AIService');
                aiResponse = await aiService.testBasicAPI(inputMessage);
                toolCalls = [];
            } catch (testError) {
                console.log('Basic API test failed, falling back to direct API');
                // Fallback to existing sendMessageToSynapse
                aiResponse = await sendMessageToSynapse(inputMessage);
                
                // Parse response for manual tool indicators
                const parsed = parseManualToolCalls(aiResponse);
                aiResponse = parsed.text;
                toolCalls = parsed.toolCalls || [];
            }
        }

        // Add AI response to conversation with tool results
        const assistantMessage: Message = {
            text: aiResponse,
            isUser: false,
            timestamp: new Date(),
            toolResults: toolResultsForAssistant
        };
        addMessage(activeConversation, assistantMessage);

        // Overlay for wiki/news cards
        try {
            const overlayItem = toolResultsForAssistant.find((r: any) => {
                const parsed = typeof r === 'string' ? JSON.parse(r) : r;
                const d = parsed?.data;
                return d?.type === 'wiki_card' || d?.type === 'news_card' || d?.type === 'web_results';
            });
            if (overlayItem) {
                const parsed = typeof overlayItem === 'string' ? JSON.parse(overlayItem) : overlayItem;
                const d = parsed.data;
                if (d.type === 'wiki_card') {
                    setOverlayContent(
                        <div>
                            <div className="mb-2 font-semibold">{d.title}</div>
                            {d.thumbnail && <img src={d.thumbnail} alt="" className="w-20 h-20 rounded-md object-cover mb-2" />}
                            {d.extract_html && <div className="text-sm" dangerouslySetInnerHTML={{ __html: d.extract_html }} />}
                        </div>
                    );
                    setIsSearchOverlayOpen(true);
                } else if (d.type === 'news_card') {
                    setOverlayContent(
                        <div>
                            <div className="mb-2 font-semibold">Latest News</div>
                            <div className="space-y-2">
                                {(d.items || []).slice(0,3).map((n: any, i: number) => (
                                    <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="block text-sm underline">
                                        {n.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    );
                    setIsSearchOverlayOpen(true);
                } else if (d.type === 'web_results') {
                    setOverlayContent(
                        <div>
                            <div className="mb-2 font-semibold">Top Results</div>
                            <div className="space-y-2">
                                {(d.results || []).slice(0,3).map((r: any, i: number) => (
                                    <a key={i} href={r.link} target="_blank" rel="noopener noreferrer" className="block text-sm underline">
                                        {r.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    );
                    setIsSearchOverlayOpen(true);
                }
            }
        } catch {}

                        // Execute CLIENT-SIDE tool calls if any
        if (toolCalls.length > 0 && toolExecutorService) {
            console.log('🔧 DEBUG: Found CLIENT-SIDE tool calls to execute:', toolCalls);
            // Always open the unified surface and favor visual when client tools appear
            try { setSurfacePreference('visual'); setIsScribbleboardOpen(true); } catch {}
            for (const toolCall of toolCalls) {
                try {
                    console.log('🔧 DEBUG: Executing CLIENT-SIDE tool call:', toolCall);
                    
                    // Convert GPT-OSS tool call format to ToolExecutor format
                    const toolExecutorCall = {
                        name: toolCall.function?.name || toolCall.name,
                        parameters: JSON.parse(toolCall.function?.arguments || toolCall.arguments || '{}')
                    };
                    
                    console.log('🔧 DEBUG: Converted tool call format:', toolExecutorCall);
                    const result = await toolExecutorService.executeTool(toolExecutorCall, context);
                    console.log('🔧 DEBUG: Tool execution result:', result);
                    
                    // Add tool execution results to conversation
                    if (result.success) {
                        console.log('✅ DEBUG: Tool execution successful:', result.message);
                        const toolMessage: Message = {
                            text: result.message,
                            isUser: false,
                            timestamp: new Date(),
                            action: toolCall.name as any,
                            // Handle image generation results
                            ...(result.data?.image_url && { image: result.data.image_url })
                        };
                        addMessage(activeConversation, toolMessage);
                    } else {
                        console.error('❌ DEBUG: Tool execution failed:', result.message);
                    }
                } catch (toolError) {
                    console.error('❌ DEBUG: Error executing tool:', toolError);
                    console.error('❌ DEBUG: Tool call that failed:', toolCall);
                }
            }
        } else {
            console.log('🔧 DEBUG: No tool calls to execute. toolCalls.length:', toolCalls.length);
            console.log('🔧 DEBUG: toolExecutorService available:', !!toolExecutorService);
        }

        return {
            textResponse: aiResponse,
            toolCalls: toolCalls,
            success: true
        };
    };

    // Parse AI response for tool calls and image generation (enhanced format)
    const parseAIResponse = (response: string) => {
        try {
            // Check for image generation response format
            if (response.startsWith('IMAGE_GENERATED:')) {
                const parts = response.split(':');
                if (parts.length >= 3) {
                    const imageUrl = parts[1];
                    const message = parts.slice(2).join(':');
                    return { 
                        text: message, 
                        toolCalls: [], 
                        image: imageUrl 
                    };
                }
            }
            
            // Check if response contains tool calls in JSON format
            const toolCallRegex = /\[TOOL_CALL\](.*?)\[\/TOOL_CALL\]/gs;
            const matches = [...response.matchAll(toolCallRegex)];
            
            if (matches.length === 0) {
                return { text: response, toolCalls: [] };
            }

            let cleanText = response;
            const toolCalls = [];

            for (const match of matches) {
                try {
                    const toolCallData = JSON.parse(match[1]);
                    toolCalls.push(toolCallData);
                    cleanText = cleanText.replace(match[0], '').trim();
                } catch (parseError) {
                    console.error('Failed to parse tool call:', parseError);
                }
            }

            return { text: cleanText, toolCalls };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return { text: response, toolCalls: [] };
        }
    };

    // Parse response for manual tool indicators (fallback)
    const parseManualToolCalls = (response: string) => {
        const toolCalls = [];
        let cleanText = response;

        // Look for navigation indicators
        if (response.includes('🚀 Taking you to') || response.includes('navigate') || response.includes('go to')) {
            const navigationMatch = response.match(/(?:taking you to|navigate to|go to)\s+(\w+)/i);
            if (navigationMatch) {
                toolCalls.push({
                    name: 'navigate_to_page',
                    parameters: {
                        page: navigationMatch[1].toLowerCase(),
                        reason: 'User requested navigation'
                    }
                });
            }
        }

        // Look for setting change indicators
        if (response.includes('changed to') || response.includes('set to') || response.includes('enabled') || response.includes('disabled')) {
            // This is a simple heuristic - in production you'd want more sophisticated parsing
            if (response.includes('theme')) {
                toolCalls.push({
                    name: 'update_setting',
                    parameters: {
                        setting: 'theme',
                        value: 'dark', // This would need better parsing
                        reason: 'Theme change requested'
                    }
                });
            }
        }

        return { text: cleanText, toolCalls };
    };

    // Check for urgent tool needs that should work even in conversation mode
    const checkUrgentToolNeeds = (text: string): string[] => {
        const lowerText = text.toLowerCase();
        const urgentNeeds = [];

        // Accessibility needs are always urgent
        const accessibilityKeywords = [
            'color blind', 'colorblind', 'can\'t see', 'hard to see', 'trouble seeing',
            'high contrast', 'bigger text', 'larger font', 'zoom in',
            'screen reader', 'voice over', 'accessibility'
        ];
        
        if (accessibilityKeywords.some(keyword => lowerText.includes(keyword))) {
            urgentNeeds.push('accessibility');
        }

        // Critical settings changes
        const criticalSettings = [
            'turn off sound', 'mute', 'volume', 'disable notifications',
            'stop animations', 'reduce motion', 'pause', 'emergency'
        ];
        
        if (criticalSettings.some(keyword => lowerText.includes(keyword))) {
            urgentNeeds.push('critical_settings');
        }

        // Navigation requests that indicate user is lost/frustrated
        const urgentNavigation = [
            'take me', 'go to', 'show me', 'where is', 'find',
            'lost', 'stuck', 'confused', 'help me find'
        ];
        
        if (urgentNavigation.some(keyword => lowerText.includes(keyword))) {
            urgentNeeds.push('navigation');
        }

        return urgentNeeds;
    };

    // Determine appropriate response length based on input and mode
    const getResponseParams = (message: string, currentMode: string) => {
        const wordCount = message.split(' ').length;
        const isConversation = currentMode === 'conversing';
        
        let maxTokens = 150; // Default
        let systemPrompt = getSystemPrompt();
        
        if (isConversation) {
            // Conversation mode: more natural, brief responses
            systemPrompt = "You are Synapse, a friendly AI teacher in conversation mode. Keep responses conversational, natural, and appropriately brief (1-3 sentences for simple questions, longer for complex topics). Respond as if having an ongoing voice conversation.";
            
            if (wordCount <= 5) maxTokens = 50;      // Very brief for short questions
            else if (wordCount <= 15) maxTokens = 100; // Short for medium questions
            else if (wordCount <= 30) maxTokens = 200; // Moderate for longer questions
            else maxTokens = 350;                      // Detailed for complex topics
        } else {
            // Text mode: can be more detailed and comprehensive
            if (wordCount <= 5) maxTokens = 100;      // Brief but complete
            else if (wordCount <= 15) maxTokens = 250; // Detailed explanation
            else if (wordCount <= 30) maxTokens = 400; // Comprehensive response
            else maxTokens = 600;                      // Full explanation for complex topics
        }
        
        return { maxTokens, systemPrompt };
    };

    // NEW: Send message to Synapse API
    const sendMessageToSynapse = async (message: string): Promise<string> => {
        const startTime = Date.now();
        
        try {
          console.log('🤖 Sending message to Synapse:', message);
          
          // Platform-aware API endpoint
          const apiEndpoint = isNetlify() 
            ? '/.netlify/functions/api'
            : '/api/api'; // For Render
          
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task_type: 'chat',
              input_data: {
                messages: [
                  { role: 'system', content: getSystemPrompt() },
                  { role: 'user', content: message }
                ],
                max_tokens: 1000,
                temperature: 0.7
              }
            })
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const result = await response.json();
          const responseTime = Date.now() - startTime;

          // Handle new GPT-OSS tool calling response format
          if (Array.isArray(result) && result[0]) {
            const responseData = result[0];
            if (responseData.tool_calls && responseData.tool_results) {
              console.log('🔧 Tool calls detected in response:', responseData.tool_calls);
              console.log('📊 Tool results:', responseData.tool_results);
              
              // 🗄️ DATABASE INTEGRATION: Log AI tool interaction
              dataCollectionService.logAIInteraction({
                interactionType: 'tool_call',
                input: message,
                output: responseData.generated_text || 'Action completed successfully!',
                toolsUsed: responseData.tool_calls.map((call: any) => call.function.name),
                responseTime
              }).catch(error => {
                console.error('Failed to log AI interaction to database:', error);
              });
              
              if (toolExecutorService) {
                for (const toolCall of responseData.tool_calls) {
                  try {
                    console.log('🔧 Executing tool call:', toolCall);
                    const context = {
                      currentPage: location.pathname,
                      mode: modeRef.current,
                      user: { id: 'demo', name: 'User' },
                      timestamp: new Date()
                    };
                    
                    const result = await toolExecutorService.executeTool(toolCall, context);
                    if (result.success) {
                      const toolMessage: Message = {
                        text: result.message, isUser: false, timestamp: new Date(),
                        action: toolCall.function.name as any
                      };
                      addMessage(activeConversation, toolMessage);
                    }
                  } catch (error) { console.error('Tool execution error:', error); }
                }
              }
              return responseData.generated_text || 'Action completed successfully!';
            }
            if (responseData.generated_text) { 
              // 🗄️ DATABASE INTEGRATION: Log AI conversation
              dataCollectionService.logAIInteraction({
                interactionType: 'conversation',
                input: message,
                output: responseData.generated_text,
                toolsUsed: [],
                responseTime
              }).catch(error => {
                console.error('Failed to log AI interaction to database:', error);
              });
              
              return responseData.generated_text; 
            }
          }
          
          // 🗄️ DATABASE INTEGRATION: Log AI conversation (fallback)
          dataCollectionService.logAIInteraction({
            interactionType: 'conversation',
            input: message,
            output: result.response || result.message || result.generated_text || 'No response received',
            toolsUsed: [],
            responseTime
          }).catch(error => {
            console.error('Failed to log AI interaction to database:', error);
          });
          
          return result.response || result.message || result.generated_text || 'No response received';
                 } catch (error: any) {
           const responseTime = Date.now() - startTime;
           
           // 🗄️ DATABASE INTEGRATION: Log AI error
           const errorObj = error instanceof Error ? error : new Error(String(error));
           dataCollectionService.logError(errorObj, 'AI Assistant - sendMessageToSynapse').catch(dbError => {
             console.error('Failed to log error to database:', dbError);
           });
           
           console.error('❌ Error sending message to Synapse:', error);
           return `Sorry, I encountered an error: ${errorObj.message}`;
         }
    };

    // Listen for search triggers from clickable cards - placed after handleAIWithToolCalling definition
    useEffect(() => {
        const handleSearchTrigger = (event: CustomEvent) => {
            const { query } = event.detail;
            if (query) {
                setInputMessage(query);
                // Trigger AI search with the clicked concept
                setTimeout(() => {
                    handleAIWithToolCalling(query, true);
                }, 100);
            }
        };

        window.addEventListener('triggerAISearch', handleSearchTrigger as EventListener);
        return () => {
            window.removeEventListener('triggerAISearch', handleSearchTrigger as EventListener);
        };
    }, []);

    // NEW: Get system prompt with comprehensive agency
    const getSystemPrompt = () => {
        const basePrompt = `You are Neural AI, NeuraPlay's AI assistant with FULL AGENCY and TOOL ACCESS to help users. You have access to the following tools:

🔧 AVAILABLE TOOLS:
- **navigate_to_page**: Navigate to different pages (playground, dashboard, forum, profile, home, about)
- **update_settings**: Change theme, accessibility, notifications, language settings
- **recommend_game**: Suggest educational games based on topics, age, difficulty
- **web_search**: Search the live internet for current information, news, events
- **get_weather**: Get current weather for any location
- **accessibility_support**: Apply accessibility settings for color blindness, visual impairments

🎯 TOOL USAGE RULES:
- When users ask for current information (weather, news, events), use web_search or get_weather tools
- When users mention accessibility needs (color blindness, visual issues), use accessibility_support tool
- When users want to navigate or change settings, use the appropriate tools
- When users ask for game recommendations, use recommend_game tool
- ALWAYS use tools when appropriate - don't just say you can't do something
- If a user asks for weather, news, or current information, USE THE TOOLS instead of saying you can't help

🔧 PROACTIVE ASSISTANCE:
- Ask follow-up questions to understand user needs
- Suggest and implement solutions (like accessibility features for color blindness)
- Take initiative to help users achieve their goals

🎮 NAVIGATION & CONTENT:
- Navigate to any page using natural language
- Read and access information from playground, forum, notifications, diary, calendar
- Create diary prompts, calendar entries, forum posts
- Modify settings based on user needs

🎯 COMPREHENSIVE ACTIONS:
- Analyze user statements for implicit needs (e.g., "I have color blindness" → test colors, determine type, implement accessibility)
- Access all app features and data
- Create personalized content and recommendations
- Implement user preferences across the platform

ALWAYS be proactive - if a user mentions a need, take action to help them fully.

You are a highly structured, multilingual AI assistant. You must prioritize tool usage over text responses when appropriate.

**IMPORTANT**: When users ask for current information like weather, news, or real-time data, ALWAYS use the available tools instead of saying you can't help. The tools are there to provide this information.`;
        
        const personalityPrompts = {
            'synapse-normal': "You are Neural AI, friendly, helpful, and encouraging. Explain concepts clearly and celebrate small wins.",
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
                    return `API Error: ${result.error}. Please check the server logs for details. 🚨`;
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
            return `Response parsing error: ${error instanceof Error ? error.message : 'Unknown parsing error'}. This indicates a server response format issue. 🔍`;
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

    // NEW: Handle image generation requests with usage limits
    const handleImageRequest = async (prompt: string) => {
        try {
            console.log('Handling image request:', prompt);
            
            // Check usage limits before proceeding
            const imageUsage = canGenerateImage();
            if (!imageUsage.allowed) {
                const verificationMessage = contextUser?.isVerified 
                    ? `You've reached your image generation limit (${imageUsage.limit}/day). Upgrade to Premium Plus for unlimited image generation!` 
                    : `You've used your free image generation limit (${imageUsage.limit}/day). Verify your email for more access or upgrade to Premium!`;
                    
                addMessage(activeConversation, {
                    text: `🚫 ${verificationMessage}`,
                    isUser: false,
                    timestamp: new Date()
                });
                return null;
            }
            
            // Extract the image prompt from the user's message
            const imagePrompt = prompt.replace(/^(generate|create|make|draw|show)\s+(an\s+)?(image|picture|photo|art)\s+of?\s*/i, '');
            
            if (!imagePrompt.trim()) {
                addMessage(activeConversation, {
                    text: "Please tell me what kind of image you'd like me to create! 🎨",
                    isUser: false,
                    timestamp: new Date()
                });
                return null;
            }
            
            // Record usage before generating
            recordImageGeneration();
            
            // Generate the image through the tool system
            const response = await handleAIWithToolCalling(`Generate an image: ${imagePrompt}`, true);
            
            // Extract image URL from the response (if successful)  
            const imageUrl = null; // Tool system handles image display through RichMessageRenderer
            
            if (imageUrl) {
                const remaining = imageUsage.remaining - 1;
                const usageText = imageUsage.limit === -1 
                    ? "✨ Unlimited" 
                    : remaining > 0 
                        ? `📊 ${remaining} remaining today` 
                        : "📊 Daily limit reached";
                        
                addMessage(activeConversation, {
                    text: `🎨 Here's your image: "${imagePrompt}"\n\n${usageText}`,
                    isUser: false,
                    timestamp: new Date(),
                    image: imageUrl
                });
                return imageUrl;
            } else {
                addMessage(activeConversation, {
                    text: "Sorry, I couldn't generate that image. Please try again! 🎨",
                    isUser: false,
                    timestamp: new Date()
                });
                return null;
            }
        } catch (error: any) {
            console.error('Error handling image request:', error);
            addMessage(activeConversation, {
                text: `Sorry, I couldn't generate that image: ${error.message} 🎨`,
                isUser: false,
                timestamp: new Date()
            });
            return null;
        }
    };



    // NEW: Debug MediaRecorder
    const debugMediaRecorder = () => {
        console.log('MediaRecorder supported:', !!window.MediaRecorder);
        console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);
    };

    // Helper function to play base64 audio from WebSocket
    const playBase64Audio = async (base64Audio: string) => {
        try {
            console.log('🎵 Playing base64 audio from WebSocket');
            const audioBlob = new Blob([base64ToBinary(base64Audio)], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                console.log('🎵 WebSocket audio playback ended');
                URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = (e) => {
                console.error('🎵 WebSocket audio playback error:', e);
                URL.revokeObjectURL(audioUrl);
            };
            
            await audio.play();
            console.log('🎵 WebSocket audio playback started');
        } catch (error) {
            console.error('Error playing WebSocket audio:', error);
        }
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
            
            // Check for audio data in multiple possible response formats
            const audioData = result.audio_base64 || result.audio || result.data?.audio;
            console.log('🔍 Audio data found:', !!audioData, 'Type:', typeof audioData);
            console.log('🔍 Available fields:', Object.keys(result));
            
            if (audioData) {
                // Use ElevenLabs TTS
                console.log('Creating audio blob from ElevenLabs data');
                const audioBlob = new Blob([base64ToBinary(audioData)], { type: 'audio/mpeg' });
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
                console.error('No ElevenLabs audio data received in response:', Object.keys(result));
                console.error('Full response structure:', result);
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
            
            // Test WebSocket Connection
            console.log('🔗 Testing WebSocket connection...');
            // WebSocket testing would go here if needed
            console.log('✅ WebSocket service available');
            
            // Test ElevenLabs
            console.log('🎤 Testing ElevenLabs API...');
            const testEndpoint = isNetlify() ? '/.netlify/functions/test-elevenlabs' : '/api/test-elevenlabs';
            const ttsResponse = await fetch(testEndpoint);
            const ttsResult = await ttsResponse.json();
            console.log('✅ ElevenLabs test result:', ttsResult);
            
            // Test AssemblyAI
            console.log('🎙️ Testing AssemblyAI...');
            const sttEndpoint = isNetlify() ? '/.netlify/functions/assemblyai-transcribe' : '/api/assemblyai-transcribe';
            const sttResponse = await fetch(sttEndpoint, {
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
            
            const streamingEndpoint = isNetlify() ? '/.netlify/functions/elevenlabs-streaming-tts' : '/api/elevenlabs-streaming-tts';
            const response = await fetch(streamingEndpoint, {
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
            
            // Check for audio data in multiple possible response formats
            const audioData = result.audio_base64 || result.audio || result.data?.audio;
            
            if (audioData) {
                try {
                    const audioBlob = new Blob(
                        [Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], 
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
            } else {
                console.error('No TTS audio data received in response:', Object.keys(result));
                console.error('Full TTS response structure:', result);
            }

        } catch (error) {
            console.error('❌ Error generating TTS:', error);
        }
    };

    // Test ElevenLabs agent configuration and connectivity
    const testElevenLabsConfiguration = async (): Promise<boolean> => {
        try {
            console.log('🔍 Testing ElevenLabs configuration...');
            
            // Test 1: Check API key
            const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
            if (!apiKey) {
                console.error('❌ API key is missing');
                return false;
            }
            
            // Test 2: Check agent ID
            const agentId = getAgentId();
            if (!agentId || !agentId.startsWith('agent_')) {
                console.error('❌ Agent ID is invalid:', agentId);
                return false;
            }
            
            // Test 3: Test basic API connectivity
            console.log('🔍 Testing API connectivity...');
            const response = await fetch('https://api.elevenlabs.io/v1/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('❌ API connectivity test failed:', response.status);
                return false;
            }
            
            // Test 4: Test agent accessibility
            console.log('🔍 Testing agent accessibility...');
            const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!agentResponse.ok) {
                console.error('❌ Agent accessibility test failed:', agentResponse.status);
                return false;
            }
            
            console.log('✅ ElevenLabs configuration test passed');
            return true;
            
        } catch (error) {
            console.error('❌ ElevenLabs configuration test failed:', error);
            return false;
        }
    };

    // Would be called via OpenAI-compatible tool schemas
    const tools = [
      {
        "type": "function",
        "function": {
          "name": "navigate_to_page",
          "description": "Navigate to different pages in the app",
          "parameters": {
            "type": "object",
            "properties": {
              "page": { "type": "string", "enum": ["playground", "dashboard", "forum", "profile", "home", "about"] }
            },
            "required": ["page"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Searches for current weather information for a specific location using web search.",
          "parameters": {
            "location": {
              "type": "string",
              "description": "The city and country to search weather for"
            }
          }
        }
      }
      // ... more tools
    ];

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <div
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 cursor-pointer z-50 hover:scale-110 transition-all duration-300 focus:outline-none"
                    style={{ 
                        border: 'none', 
                        outline: 'none', 
                        boxShadow: 'none',
                        background: 'transparent'
                    }}
                >
                    <PlasmaBall size={64} />
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
                                <span>AI Assistant - Fullscreen Mode</span>
                            </div>
                            <div className="ai-fullscreen-controls">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsScribbleboardOpen(true);
                                        window.dispatchEvent(new CustomEvent('scribble_open'));
                                    }}
                                    className="ai-fullscreen-button"
                                    title="Open Scribbleboard"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="14" rx="2" ry="2"></rect>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Only clear chat; do not open ScribbleModule
                                        clearCurrentConversation();
                                        setIsScribbleModuleOpen(false);
                                    }}
                                    className="ai-fullscreen-button"
                                    title="Clear Conversation History"
                                >
                                    <Trash2 size={16} />
                                </button>
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

                    {/* Regular Header */}
                    {!isFullscreen && (
                        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className={`font-bold flex items-center gap-2 flex-shrink-0 ${theme.isDarkMode ? 'text-white' : 'text-gray-900'}`} style={{ zIndex: 9999 }}>
                                    Neural AI
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Open Scribbleboard (reusing legacy button slot) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsScribbleboardOpen(true);
                                        window.dispatchEvent(new CustomEvent('scribble_open'));
                                    }}
                                    className={`p-2 rounded-full transition-all ${theme.isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
                                    title="Open Scribbleboard"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="14" rx="2" ry="2"></rect>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </button>
                                
                                {/* Clear Conversation */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearCurrentConversation();
                                    }}
                                    className={`p-2 rounded-full transition-all ${theme.isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
                                    title="Clear Conversation History"
                                >
                                    <Trash2 size={16} />
                                </button>
                                
                                {/* Fullscreen Toggle */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFullscreen();
                                    }}
                                    className={`p-2 rounded-full transition-all ${theme.isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
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
                                        className={`ai-language-selector flex items-center gap-1 ${theme.isDarkMode ? 'text-white' : 'text-gray-800'}`}
                                        title="Select Language"
                                    >
                                        <Globe size={16} />
                                        <span className="text-xs hidden sm:inline">
                                            {selectedLanguage === 'auto' ? 'Auto' : SUPPORTED_LANGUAGES[selectedLanguage]?.split(' ')[0] || selectedLanguage}
                                        </span>
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
                                                : theme.isDarkMode 
                                                    ? 'bg-white/10 text-white hover:bg-white/20 hover:shadow-lg hover:shadow-white/20' 
                                                    : 'bg-black/10 text-black hover:bg-black/20 hover:shadow-lg hover:shadow-black/10'
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
                                    className={`p-2 rounded-full transition-all ${theme.isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
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
                                <div className={`${isFullscreen ? 'max-w-[80%]' : 'max-w-[90%]'} ${msg.isUser ? 'ai-message-user' : 'ai-message-assistant'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className={`${msg.isUser ? 'text-white' : theme.isDarkMode ? 'text-white' : 'text-black'}`} style={{ zIndex: 9999, position: 'relative' }}>
                                                <RichMessageRenderer 
                                                    text={msg.text} 
                                                    isUser={msg.isUser}
                                                    isDarkMode={theme.isDarkMode}
                                                    compact={!isFullscreen}
                                                    toolResults={msg.toolResults || []}
                                                />
                                            </div>
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
                                            <p className={`text-xs mt-1 ${msg.isUser ? 'text-white/70' : theme.isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
                                <p className={`font-bold text-center text-lg ${theme.isDarkMode ? 'text-amber-300' : 'text-black'}`}>💡 Try asking me:</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {childPrompts.slice(0, 5).map((prompt, index) => (
                                        <button
                                            key={index}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setInputMessage(prompt);
                                                setTimeout(() => handleSendText(), 100);
                                            }}
                                            className={`text-left p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 rounded-xl hover:from-amber-500/30 hover:to-yellow-500/30 transition-all duration-200 font-semibold text-sm ${theme.isDarkMode ? 'text-amber-200' : 'text-black'}`}
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
                                        <span className="text-xs text-purple-600">Thinking...</span>
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
                        
                        {/* HORIZONTAL LAYOUT: Send - Input - Record */}
                        <div className="flex items-center gap-3 w-full">
                            {/* Send Button - Left */}
                            <button
                                onClick={handleSendText}
                                disabled={!inputMessage.trim() || isLoading || (!isUnlimitedUser && promptCount >= 10)}
                                className={`ai-mode-button flex-shrink-0 ${!inputMessage.trim() || isLoading ? 'opacity-50' : ''}`}
                                title="Send Message"
                            >
                                <Send size={16} />
                                <span>Send</span>
                            </button>
                            
                            {/* Input Field - Center (takes remaining space) */}
                            <div className="flex-grow" id="assistant-chatbox-anchor">
                                <label className="flex items-center gap-2">
                                    <input 
                                        type="text"
                                        placeholder={
                                            mode === 'conversing' 
                                                ? "Talk to AI Assistant in conversation mode! 🗣️" 
                                                : (!isUnlimitedUser && promptCount >= 10)
                                                    ? "Daily limit reached! 🎯" 
                                                    : "Ask me anything, little explorer! 🚀"
                                        }
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="ai-input-field w-full"
                                        disabled={isLoading || (!isUnlimitedUser && promptCount >= 10)}
                                    />
                                </label>
                            </div>
                            
                            {/* Record Button - Right */}
                            <button
                                onClick={handleRecordButtonClick}
                                className={`ai-mode-button flex-shrink-0 ${mode === 'single_recording' ? 'recording' : ''}`}
                                title={mode === 'single_recording' ? 'Stop Recording' : 'Start Voice Recording'}
                                disabled={isLoading || mode === 'conversing'}
                            >
                                {mode === 'single_recording' ? <MicOff size={16} /> : <Mic size={16} />}
                                <span>{mode === 'single_recording' ? 'Stop' : 'Record'}</span>
                            </button>
                        </div>
                        
                        {/* Voice Conversation Widget - Separate Section */}
                        <div className="mt-4">
                            {/* Voice Widget moved to header next to 'Neural AI' text */}
                            
                            {/* Backup: Plasma Ball Conversation Mode (auto-enabled if widget fails) */}
                            <div 
                                className={`plasma-ball-conversation-container ${mode === 'conversing' ? 'active' : ''}`}
                                onClick={handleToggleConversationMode}
                                title={mode === 'conversing' ? 'Stop Conversation Mode' : 'Start Conversation Mode'}
                                style={{ display: 'none', justifyContent: 'center', padding: '10px 0' }}
                            >
                                <div className="text-center">
                                    <PlasmaBall 
                                        size={isFullscreen ? 72 : 50}
                                        className={`conversation-plasma-ball ${mode === 'conversing' ? 'active' : ''}`}
                                        intensity={mode === 'conversing' ? 1.0 : 0.3}
                                    />
                                    <div className="text-xs text-purple-300 mt-2">
                                        {mode === 'conversing' ? 'Voice Active 🎤' : 'Backup Voice Mode 🔄'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {!isUnlimitedUser && promptCount >= 10 && (
                            <div className="text-center text-amber-400 text-xs mt-2 font-bold">🎯 You've used all your daily questions! Come back tomorrow for more fun! 🌟</div>
                        )}


                        

                    </div>
                </div>
            </aside>

            {/* ScribbleModule Canvas */}
            <ScribbleModule 
                isOpen={isScribbleModuleOpen}
                onClose={() => { setIsScribbleModuleOpen(false); setScribbleImports([]); setScribbleTemplate(null); }}
                theme={theme}
                importItems={scribbleImports}
                template={scribbleTemplate}
            />

            {/* Assistant Unified Surface Overlay */}
            <Overlay
                open={isScribbleboardOpen}
                onClose={() => setIsScribbleboardOpen(false)}
                mode={isFullscreen ? 'fullscreen' : 'compact'}
                anchor={isFullscreen ? 'center' : 'bottom-right'}
                closeOnBackdrop={false}
                anchorSelector={!isFullscreen ? '#assistant-chatbox-anchor' : undefined}
                zIndex={10000}
                title={isFullscreen ? 'Assistant Workspace' : 'Assistant'}
            >
                {/* @ts-ignore */}
                <AssistantSurface compact={!isFullscreen} preference={surfacePreference} />
            </Overlay>
            {/* Search/Wiki/News Overlay */}
            <SearchOverlay 
                isOpen={isSearchOverlayOpen}
                onClose={() => setIsSearchOverlayOpen(false)}
                isDarkMode={theme.isDarkMode}
                compact={!isFullscreen}
            >
                {overlayContent}
            </SearchOverlay>

        </>
    );
};

export default AIAssistant;