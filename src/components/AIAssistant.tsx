import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Volume2, VolumeX } from 'lucide-react';
import './AIAssistant.css';

interface Message {
    text: string;
    isUser: boolean;
    timestamp: Date;
    image?: string;
}

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([
        { 
            text: "Hi! I'm your AI learning assistant. I'm here to help answer questions about your child's learning journey, explain game concepts, or provide educational guidance. I can also create images when you ask! How can I help you today?", 
            isUser: false, 
            timestamp: new Date() 
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const [promptCount, setPromptCount] = useState(0);

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

            // Build conversation history for chat
            const conversationHistory = messages
                .filter(msg => !msg.image) // Exclude image messages from history
                .slice(-6); // Keep last 6 messages (3 exchanges)
            
            const messagesForAPI = [];
            
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
                aiResponse = `I'm sorry, there was an error: ${result.error}. Please try again.`;
            } else {
                console.log('Fallback response - result:', result);
                aiResponse = "I'm here to help! Could you please rephrase your question?";
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
                text: `I'm sorry, there was an error: ${error.message}. Please try again in a moment!`,
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
                throw new Error('Failed to generate audio');
            }

            const result = await response.json();
            
            if (result.data) {
                const audioBlob = `data:${result.contentType};base64,${result.data}`;
                const audio = new Audio(audioBlob);
                audio.onended = () => setIsPlayingVoice(false);
                audio.onerror = () => setIsPlayingVoice(false);
                audio.play();
            }
        } catch (error) {
            console.error('Error playing voice:', error);
            setIsPlayingVoice(false);
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
                         <h3 className="font-bold text-white flex items-center gap-2"><Bot size={20}/> AI Teacher</h3>
                         <button onClick={() => setIsOpen(false)}><X size={20}/></button>
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
                        <label className="flex items-center gap-2">
                            <input 
                                type="text"
                                placeholder={promptCount >= 10 ? "Daily prompt limit reached" : "Ask me anything..."}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading || promptCount >= 10}
                                className="flex-1"
                            />
                            <button 
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading || promptCount >= 10}
                                className="p-2 rounded-full bg-violet-500/50 hover:bg-violet-500/80 transition-colors disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </label>
                        {promptCount >= 10 && (
                            <div className="text-center text-red-400 text-xs mt-2">You have reached your daily limit of 10 prompts.</div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AIAssistant;