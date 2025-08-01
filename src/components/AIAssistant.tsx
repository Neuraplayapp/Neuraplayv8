import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Volume2, VolumeX, Sparkles, Crown, Star, Settings, Home, Gamepad2, Users, FileText, User, BarChart3, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

import PlasmaBall from './PlasmaBall';
import './AIAssistant.css';

interface Message {
    text: string;
    isUser: boolean;
    timestamp: Date;
    image?: string;
    action?: 'navigation' | 'settings' | 'info';
}

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([
        { 
            text: "🌟 Hi there! I'm Synapse, your friendly AI teacher! 🚀 I can help you with learning, games, navigation, settings, and accessibility needs. What would you like to explore today? 🎮✨", 
            isUser: false, 
            timestamp: new Date() 
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const [promptCount, setPromptCount] = useState(0);
    const [isConversationMode, setIsConversationMode] = useState(false);
    const [isReadingLastMessage, setIsReadingLastMessage] = useState(false);

    
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

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
        '/text-reveal': { name: 'Text Reveal', icon: <Sparkles className="w-4 h-4" />, description: 'Text animations' }
    };

    // Available settings and their descriptions
    const availableSettings = {
        'theme': { name: 'Theme', description: 'Change light/dark mode', options: ['light', 'dark', 'auto'] },
        'fontSize': { name: 'Font Size', description: 'Adjust text size', options: ['small', 'medium', 'large', 'extra-large'] },
        'animations': { name: 'Animations', description: 'Enable/disable animations', options: ['enabled', 'disabled'] },
        'sound': { name: 'Sound', description: 'Enable/disable sound effects', options: ['enabled', 'disabled'] },
        'highContrast': { name: 'High Contrast', description: 'Enhanced visibility', options: ['enabled', 'disabled'] },
        'reducedMotion': { name: 'Reduced Motion', description: 'Minimize animations', options: ['enabled', 'disabled'] },
        'aiPersonality': { name: 'AI Personality', description: 'Change AI assistant style', options: ['coach', 'mentor', 'friend', 'analyst'] }
    };

    // Child-friendly prompt suggestions
    const childPrompts = [
        "🎨 Draw me a happy dinosaur!",
        "🧮 Help me count to 10!",
        "🌈 What colors make a rainbow?",
        "🚗 Tell me about cars!",
        "🐾 What animals live in the forest?",
        "⭐ How do stars twinkle?",
        "🌱 How do plants grow?",
        "🎵 Sing me a fun song!",
        "🏰 Tell me a castle story!",
        "🚀 How do rockets fly?",
        "🎮 Playground",
        "📊 Learning Central",
        "📈 Show me stats!",
        "⚙️ Settings",
        "🏠 Home"
    ];

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

    // AI Agency Functions
    const analyzeCommand = (text: string): { type: 'navigation' | 'settings' | 'chat' | 'info', action?: any } => {
        const lowerText = text.toLowerCase();
        
        // Navigation commands with expanded variations
        const navigationKeywords = ['go to', 'take me to', 'navigate to', 'open', 'get', 'list', 'show', 'search', 'bring', 'go', 'take me', 'remove', 'edit'];
        
        if (navigationKeywords.some(keyword => lowerText.includes(keyword)) || 
            // Direct page names without action words
            lowerText.includes('playground') || 
            lowerText.includes('home') || 
            lowerText.includes('learning central') || 
            lowerText.includes('stats') || 
            lowerText.includes('settings')) {
            
            // Check for specific page matches
            for (const [path, page] of Object.entries(availablePages)) {
                if (lowerText.includes(page.name.toLowerCase()) || lowerText.includes(path.replace('/', ''))) {
                    return { type: 'navigation', action: { path, page } };
                }
            }
            
            // Special navigation cases with expanded variations
            if (lowerText.includes('home') || lowerText.includes('main')) {
                return { type: 'navigation', action: { path: '/', page: availablePages['/'] } };
            }
            
            if (lowerText.includes('playground') || lowerText.includes('games')) {
                return { type: 'navigation', action: { path: '/playground', page: availablePages['/playground'] } };
            }
            
            if (lowerText.includes('learning central') || lowerText.includes('progress') || lowerText.includes('dashboard')) {
                return { type: 'navigation', action: { path: '/dashboard', page: availablePages['/dashboard'] } };
            }
            
            if (lowerText.includes('stats') || lowerText.includes('statistics')) {
                return { type: 'navigation', action: { path: '/dashboard', page: availablePages['/dashboard'] } };
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
        const soundKeywords = ['sound', 'audio', 'volume', 'noise'];
        const soundActionKeywords = ['make', 'put', 'bring', 'set', 'change', 'enable', 'disable', 'turn', 'mute'];
        
        if (soundKeywords.some(keyword => lowerText.includes(keyword)) || 
            (soundActionKeywords.some(action => lowerText.includes(action)) && (lowerText.includes('sound') || lowerText.includes('audio')))) {
            const enabled = !lowerText.includes('mute') && !lowerText.includes('off') && !lowerText.includes('disable');
            return { type: 'settings', action: { setting: 'sound', value: enabled ? 'enabled' : 'disabled' } };
        }

        // Accessibility settings with expanded variations
        const accessibilityKeywords = ['colorblind', 'color blind', 'protanopia', 'deuteranopia', 'tritanopia', 'contrast', 'spacing', 'bold', 'text spacing', 'high contrast'];
        const accessibilityActionKeywords = ['make', 'put', 'bring', 'set', 'change', 'enable', 'disable', 'turn', 'use', 'need', 'want', 'have'];
        
        if (accessibilityKeywords.some(keyword => lowerText.includes(keyword)) || 
            (accessibilityActionKeywords.some(action => lowerText.includes(action)) && 
             (lowerText.includes('colorblind') || lowerText.includes('contrast') || lowerText.includes('spacing') || lowerText.includes('bold')))) {
            
            // Handle specific accessibility requests
            if (lowerText.includes('protanopia') || lowerText.includes('deuteranopia') || lowerText.includes('tritanopia')) {
                return { type: 'settings', action: { setting: 'colorBlindMode', value: lowerText.includes('protanopia') ? 'protanopia' : lowerText.includes('deuteranopia') ? 'deuteranopia' : 'tritanopia' } };
            }
            
            if (lowerText.includes('high contrast') || lowerText.includes('contrast')) {
                return { type: 'settings', action: { setting: 'highContrast', value: 'enabled' } };
            }
            
            if (lowerText.includes('spacing') || lowerText.includes('space') || lowerText.includes('bold')) {
                if (lowerText.includes('extra') || lowerText.includes('more')) {
                    return { type: 'settings', action: { setting: 'textSpacing', value: 'extra' } };
                } else if (lowerText.includes('increased') || lowerText.includes('more')) {
                    return { type: 'settings', action: { setting: 'textSpacing', value: 'increased' } };
                }
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
            case 'navigation':
                if (command.action?.path) {
                    navigate(command.action.path);
                    return `🚀 Taking you to ${command.action.page.name}! ${command.action.page.description} ✨`;
                }
                break;
                
            case 'settings':
                if (command.action === 'open') {
                    return `⚙️ Settings are currently being updated! You can customize your experience through the theme context directly! 🎛️`;
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
                        }
                    } catch (error) {
                        return `Oops! I couldn't change that setting right now. Try opening settings manually! ⚙️`;
                    }
                }
                break;
                
            case 'info':
                if (command.action === 'capabilities') {
                    return `🌟 Here's what I can do for you! 🚀

🎮 **Navigation**: I can take you to any page! Try:
• "Playground" or "Get playground" or "Show playground"
• "Learning Central" or "Show me stats" or "Get stats"
• "Home" or "Go home" or "Bring me home"
• "Settings" or "Open settings" or "Show settings"

⚙️ **Settings**: I can change your preferences! Try:
• "Make dark theme" or "Put light theme" or "Bring dark mode"
• "Make font bigger" or "Put text smaller" or "Bring large text"
• "Make animations on" or "Put motion off" or "Bring effects"
• "Make sound on" or "Put audio off" or "Bring volume"

🌈 **Accessibility**: I can help with special needs! Try:
• "I am colorblind" or "I have protanopia"
• "Make high contrast" or "Put bold text"
• "Space letters out" or "Make text bigger"
• "I need help seeing" or "Make it easier to read"

💬 **Chat**: I can answer questions, draw pictures, and help with learning!

🎯 **Current Location**: You're currently on ${availablePages[location.pathname as keyof typeof availablePages]?.name || 'an unknown page'}!

Just say "playground" or "I am colorblind" and I'll help! ✨`;
                }
                
                if (command.action === 'location') {
                    const currentPage = availablePages[location.pathname as keyof typeof availablePages];
                    return `📍 You're currently on the ${currentPage?.name || 'unknown'} page! ${currentPage?.description || ''} 🎯`;
                }
                break;
        }
        
        return '';
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading || promptCount >= 10) return;

        const userMessage: Message = {
            text: inputMessage,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setPromptCount(count => count + 1);

        try {
            // First, analyze if this is a command
            const command = analyzeCommand(inputMessage);
            
            if (command.type !== 'chat') {
                // Execute the command
                const response = await executeCommand(command);
                
                const assistantMessage: Message = {
                    text: response,
                    isUser: false,
                    timestamp: new Date(),
                    action: command.type as any
                };

                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
                return;
            }

            // Check if this is an image request
            if (isImageRequest(inputMessage)) {
                // Generate image
                const imageData = await generateImage(inputMessage);
                
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

                setMessages(prev => [...prev, assistantMessage]);
                return;
            }

            // Build conversation history for chat with enhanced context
            const conversationHistory = messages
                .filter(msg => !msg.image) // Exclude image messages from history
                .slice(-12); // Keep last 12 messages (6 exchanges) for better context
            
            const messagesForAPI = [];
            
            // Only add system context if this is the first message or if we have no conversation history
            if (messages.length <= 2) { // First exchange or just the initial greeting
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
            
            let aiResponse = '';
            console.log('AI Response result:', result);
            
            if (result[0] && result[0].generated_text) {
                aiResponse = result[0].generated_text;
            } else if (result[0] && result[0].summary_text) {
                aiResponse = result[0].summary_text;
            } else if (typeof result === 'string') {
                aiResponse = result;
            } else if (result && result.generated_text) {
                aiResponse = result.generated_text;
            } else if (result && result.summary_text) {
                aiResponse = result.summary_text;
            } else if (result && result.error) {
                aiResponse = `Oops! Something went wrong: ${result.error}. Let's try again! 🌟`;
            } else {
                console.log('Fallback response - result:', result);
                aiResponse = "I'm here to help! Could you ask me something else? 🎮✨";
            }

            const assistantMessage: Message = {
                text: aiResponse,
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                text: `Oops! Something went wrong: ${error.message}. Let's try again in a moment! 🌟`,
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
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
        const lastAIMessage = messages
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
            'illustration', 'visual', 'art', 'painting', 'sketch', 'drawing', 'graphic'
        ];
        const lowerText = text.toLowerCase();
        return imageKeywords.some(keyword => lowerText.includes(keyword));
    };

    const generateImage = async (prompt: string): Promise<string | null> => {
        try {
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

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const result = await response.json();
            
            if (result.data) {
                return `data:${result.contentType};base64,${result.data}`;
            }
            return null;
        } catch (error) {
            console.error('Error generating image:', error);
            return null;
        }
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
            <aside id="ai-teacher-menu" ref={menuRef} className={isOpen ? 'open' : ''}>
                <span className="shine shine-top"></span>
                <span className="shine shine-bottom"></span>
                <span className="glow glow-top"></span>
                <span className="glow glow-bottom"></span>

                <div className="inner">
                    <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                         <h3 className="font-bold text-white flex items-center gap-2"><PlasmaBall size={28}/> AI Teacher</h3>
                         <div className="flex items-center gap-2">
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
                             
                             {/* Read Last Message */}
                             {messages.filter(msg => !msg.isUser).length > 0 && (
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

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                             <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isUser ? 'bg-violet-500/50' : 'bg-white/10'}`}>
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
                                            <p className={`text-xs mt-1 ${msg.isUser ? 'text-violet-200' : 'text-slate-400'}`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!msg.isUser && (
                                            <button
                                                onClick={() => playVoice(msg.text)}
                                                className={`p-1 rounded-full transition-colors ${
                                                    isPlayingVoice 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-white/20 text-white hover:bg-white/30'
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
                        {messages.length === 1 && !isLoading && (
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
                                <div className="bg-white/10 text-white p-3 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-xs text-white/70">Thinking...</span>
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
                                        : promptCount >= 10 
                                            ? "Daily limit reached! 🎯" 
                                            : "Ask me anything, little explorer! 🚀"
                                }
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading || promptCount >= 10}
                                className="flex-1"
                            />
                            <button 
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading || promptCount >= 10}
                                className="p-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                                title="Send your message to Synapse! 🚀"
                            >
                                <div className="flex items-center gap-1">
                                    <Send size={18} className="text-white" />
                                    <span className="text-white font-bold text-sm">Send!</span>
                                </div>
                            </button>
                        </label>
                        {promptCount >= 10 && (
                            <div className="text-center text-amber-400 text-xs mt-2 font-bold">🎯 You've used all your daily questions! Come back tomorrow for more fun! 🌟</div>
                        )}
                    </div>
                </div>
            </aside>


        </>
    );
};

export default AIAssistant;