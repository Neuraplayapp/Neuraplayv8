import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send } from 'lucide-react';
import './AIAssistant.css';

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState([{ text: "Hi! How can I help with your learning adventure today?", isUser: false }]);
    const [inputMessage, setInputMessage] = useState('');

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
                                <p className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isUser ? 'bg-violet-500/50' : 'bg-white/10'}`}>
                                    {msg.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-2">
                        <label className="flex items-center gap-2">
                            <input 
                                type="text"
                                placeholder="Ask me anything..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="flex-1"
                            />
                            <button className="p-2 rounded-full bg-violet-500/50 hover:bg-violet-500/80 transition-colors">
                                <Send size={16} />
                            </button>
                        </label>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AIAssistant;