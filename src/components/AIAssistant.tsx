import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, Volume2, VolumeX } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date; image?: string }>>([
    {
      text: "Hi there! I'm your AI teaching assistant. I'm here to help answer questions about your child's learning journey, explain game concepts, or provide educational guidance. I can also create images when you ask! How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [promptCount, setPromptCount] = useState(0);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || promptCount >= 10) return;

    const userMessage = {
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

        const assistantMessage = {
          text: responseText,
          isUser: false,
          timestamp: new Date(),
          image: imageData || undefined
        };

        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      // Build conversation history for Llama 3.1
      const conversationHistory = messages
        .filter(msg => !msg.image) // Exclude image messages from history
        .slice(-6); // Keep last 6 messages (3 exchanges)
      
      const messagesForLlama = [];
      
      // Add system message
      messagesForLlama.push({
        role: 'system',
        content: `You are "Synapse," a helpful and encouraging AI learning assistant from Neuraplay, designed for children aged 3-12.

**Your Core Directives:**
1.  **Persona:** You are always cheerful, patient, and supportive. Your language is simple, child-friendly, and easy to understand.
2.  **Safety:** You MUST refuse to discuss or generate any content related to violence, weapons, self-harm, adult themes (NSFW), drugs, alcohol, or any illegal or unsafe topics. If asked about these, you must politely decline with a response like, "That's a topic for grown-ups, but I can help you with learning about animals, numbers, or stories!"
3.  **Scope:** Your knowledge is strictly limited to educational topics: math, science, reading, art, social skills, and creativity. You should not express personal opinions, consciousness, or feelings.
4.  **Goal:** Your primary goal is to make learning fun and to build a child's confidence.

---
[User's Question Goes Here]
---

**REMINDER OF YOUR DIRECTIVES:** Remember, you are "Synapse" from Neuraplay. Your response must be 100% safe, positive, encouraging, and within your educational scope for a young child. Do not break character.`
      });
      
      // Add conversation history
      for (let i = 0; i < conversationHistory.length; i += 2) {
        if (conversationHistory[i] && conversationHistory[i + 1]) {
          messagesForLlama.push({
            role: 'user',
            content: conversationHistory[i].text
          });
          messagesForLlama.push({
            role: 'assistant',
            content: conversationHistory[i + 1].text
          });
        }
      }
      
      // Add current user message
      messagesForLlama.push({
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
            messages: messagesForLlama
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

      const assistantMessage = {
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = {
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
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6" />
            <span className="font-bold whitespace-nowrap">Want to talk to the teacher?</span>
          </div>
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">AI Teaching Assistant</h3>
                <p className="text-sm text-violet-100">Always here to help!</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.text}</p>
                      {message.image && (
                        <div className="mt-2">
                          <img 
                            src={message.image} 
                            alt="AI Generated Image"
                            className="w-full max-w-xs rounded-lg shadow-md"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                  <p className={`text-xs mt-1 ${
                    message.isUser ? 'text-violet-200' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                    </div>
                    {!message.isUser && (
                      <button
                        onClick={() => playVoice(message.text)}
                        className={`p-1 rounded-full transition-colors ${
                          isPlayingVoice 
                            ? 'bg-green-500 text-white' 
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
                <div className="bg-slate-100 text-slate-800 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={promptCount >= 10 ? "Daily prompt limit reached" : "Ask me anything about learning..."}
                className="flex-1 p-3 border border-slate-300 rounded-full focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm"
                disabled={isLoading || promptCount >= 10}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || promptCount >= 10}
                className="bg-violet-600 text-white p-3 rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          {promptCount >= 10 && (
            <div className="text-center text-red-500 text-xs mt-2">You have reached your daily limit of 10 prompts. Please come back tomorrow!</div>
          )}
        </div>
      )}
    </>
  );
};

export default AIAssistant;