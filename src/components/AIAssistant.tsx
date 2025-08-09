import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, AlertTriangle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useConversation as useGlobalConversation, Message } from '../contexts/ConversationContext';
import { aiService } from '../services/AIService';
import RichMessageRenderer from './RichMessageRenderer';
import AssistantSurface from './assistant/AssistantSurface';
import Overlay from './Overlay';
import Scribbleboard from './scribbleboard/ScribbleboardV2';

// 🔧 SIMPLIFIED AI ASSISTANT - Clean, minimal, no legacy code

type AssistantMode = 'idle' | 'loading';

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScribbleboardOpen, setIsScribbleboardOpen] = useState(false);
    const [surfacePreference, setSurfacePreference] = useState<'auto'|'text'|'visual'>('auto');
    
    // Core state
    const [inputMessage, setInputMessage] = useState('');
    const [mode, setMode] = useState<AssistantMode>('idle');
    const [isLoading, setIsLoading] = useState(false);
    
    // Global conversation context
    const {
        activeConversation,
        addMessage,
        clearConversation,
        getActiveConversation
    } = useGlobalConversation();

    const { user, canUseAI, recordAIUsage } = useUser();
    const { theme } = useTheme();

    // Event listeners for scribbleboard
    useEffect(() => {
        const openBoard = () => setIsScribbleboardOpen(true);
        window.addEventListener('scribble_open', openBoard as EventListener);
        
        return () => {
            window.removeEventListener('scribble_open', openBoard as EventListener);
        };
    }, []);

    // 🔧 CLEAN AI MESSAGE HANDLER
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || mode !== 'idle') return;
        
        const userMessage = inputMessage.trim();
        setInputMessage('');
        setMode('loading');
        setIsLoading(true);

        // Add user message
            addMessage(activeConversation, { 
            text: userMessage,
            isUser: true,
                timestamp: new Date() 
            });
        
        try {
            // Check usage limits
        const aiUsage = canUseAI();
        if (!aiUsage.allowed) {
                throw new Error(`AI usage limit reached (${aiUsage.limit} prompts/day)`);
            }
            
            // Get conversation context
            const conversation = getActiveConversation();
        const context = {
                conversationHistory: conversation.messages.map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                    content: msg.text
            }))
        };

            console.log('🤖 Sending to AI:', { userMessage, contextLength: context.conversationHistory.length });
            
            // Call AI service with tool calling
            const response = await aiService.handleRequest(userMessage, context, true);
            
            console.log('🤖 AI Response:', response);
            
            // Add AI response
            addMessage(activeConversation, {
                text: response.textResponse || 'I received your message but had trouble responding.',
                                        isUser: false,
                                        timestamp: new Date(),
                toolResults: response.toolResults || []
            });
            
            // Record usage
            recordAIUsage();
            
                 } catch (error: any) {
            console.error('❌ AI Error:', error);
            
            // User-friendly error message
            const errorText = error.message?.includes('limit') 
                ? error.message 
                : 'Sorry, I encountered an error. Please try again.';
                    
                addMessage(activeConversation, {
                text: `❌ ${errorText}`,
                    isUser: false,
                    timestamp: new Date()
                });
        } finally {
            setIsLoading(false);
            setMode('idle');
        }
    };
    
    // 🔧 EMERGENCY RESET
    const emergencyReset = () => {
        console.log('🚨 Emergency reset triggered');
        setIsLoading(false);
        setMode('idle');
        setInputMessage('');
        clearConversation(activeConversation);
        window.dispatchEvent(new CustomEvent('scribble_clear_all', { detail: { clearEverything: true } }));
    };
    
    // Clear conversation
    const clearCurrentConversation = () => {
        console.log('🧹 Clearing conversation');
        clearConversation(activeConversation);
        window.dispatchEvent(new CustomEvent('scribble_clear_all', { detail: { clearEverything: true } }));
    };
    
    // Get current messages
    const currentMessages = getActiveConversation().messages;
    
    // 🎨 RENDER
    return (
        <>
            {/* AI Assistant Toggle Button */}
                                <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center"
                aria-label="Toggle AI Assistant"
            >
                <Send className="w-6 h-6" />
                                </button>

            {/* Compact Chat Window */}
            {isOpen && !isScribbleboardOpen && (
                <div className="fixed bottom-20 right-4 w-80 h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-white">Synapse AI</h3>
                                    <div className="flex items-center gap-2">
                            <button
                                onClick={clearCurrentConversation}
                                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                title="Clear conversation"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {isLoading && (
                                <button
                                    onClick={emergencyReset}
                                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                    title="Emergency reset"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                </button>
                            )}
                                    <button
                                onClick={() => setIsScribbleboardOpen(true)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Workspace
                                </button>
                            </div>
                        </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {currentMessages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <div className="text-2xl mb-2">👋</div>
                                <p className="text-sm">Hi! I'm Synapse, your AI learning companion.</p>
                                <p className="text-xs mt-1">Ask me anything or request charts and analysis!</p>
                            </div>
                        ) : (
                            currentMessages.map((msg, index) => (
                                                <RichMessageRenderer 
                                    key={index}
                                                    text={msg.text} 
                                                    isUser={msg.isUser}
                                                    isDarkMode={theme.isDarkMode}
                                    compact={true}
                                    toolResults={msg.toolResults}
                                />
                            ))
                        )}
                                        </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                    <input 
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={isLoading ? "Thinking..." : "Ask Synapse anything..."}
                                disabled={isLoading}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                                    </div>
                                </div>
            )}

            {/* Fullscreen Workspace Overlay */}
            <Overlay
                open={isScribbleboardOpen}
                onClose={() => setIsScribbleboardOpen(false)}
                mode="fullscreen"
                anchor="center"
                closeOnBackdrop={false}
                zIndex={10000}
                title="AI Visual Workspace"
            >
                <AssistantSurface 
                    compact={false}
                    preference={surfacePreference}
                    onScribbleClose={() => {
                        console.log('Scribbleboard closed');
                        setIsScribbleboardOpen(false);
                    }}
                    retainChatContext={true}
                    chatContent={(
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-800 dark:text-white">Chat with Synapse</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={clearCurrentConversation}
                                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                        title="Clear conversation"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {isLoading && (
                                        <button
                                            onClick={emergencyReset}
                                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                            title="Emergency reset"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {currentMessages.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-16">
                                        <div className="text-4xl mb-4">🧠</div>
                                        <h3 className="text-lg font-medium mb-2">Welcome to your AI Workspace</h3>
                                        <p className="text-sm max-w-md mx-auto">
                                            I'm Synapse, your empathic AI learning companion. Ask me to create charts, 
                                            test hypotheses, or explore ideas together!
                                        </p>
                                    </div>
                                ) : (
                                    currentMessages.map((msg, index) => (
                                                        <RichMessageRenderer 
                                            key={index}
                                                            text={msg.text} 
                                                            isUser={msg.isUser}
                                            isDarkMode={theme.isDarkMode}
                                                            compact={false}
                                            toolResults={msg.toolResults}
                                        />
                                    ))
                                )}
                            </div>
                            
                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={isLoading ? "Synapse is thinking..." : "Ask me to create charts, test ideas, or explore concepts..."}
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Thinking...</span>
                                            </>
                                        ) : (
                                            <>
                                        <Send className="w-4 h-4" />
                                                <span>Send</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                />
            </Overlay>
        </>
    );
};

export default AIAssistant;
