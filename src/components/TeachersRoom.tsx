import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X, Mic, MicOff, Volume2, VolumeX, Settings, MessageSquare, Users, BookOpen, Brain, Zap, GraduationCap } from 'lucide-react';
import { getAgentId } from '../config/elevenlabs';

interface TeachersRoomProps {
  onClose: () => void;
}

const TeachersRoom: React.FC<TeachersRoomProps> = ({ onClose }) => {
  const { isDarkMode, isBrightMode, isDarkGradient, isWhitePurpleGradient } = useTheme();
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isReadingLastMessage, setIsReadingLastMessage] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([]);

  // Get theme-appropriate classes
  const getBackgroundClasses = () => {
    if (isDarkMode || isDarkGradient) {
      return "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900";
    } else if (isBrightMode) {
      return "bg-gradient-to-br from-white via-blue-50 to-white";
    } else {
      return "bg-gradient-to-br from-gray-50 via-white to-gray-50";
    }
  };

  const getCardBackgroundClasses = () => {
    if (isDarkMode || isDarkGradient) {
      return "bg-black/20 backdrop-blur-md border border-white/10";
    } else {
      return "bg-white/80 backdrop-blur-md border border-gray-200";
    }
  };

  const getTextClasses = (type: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
    if (isDarkMode || isDarkGradient) {
      switch (type) {
        case 'primary': return 'text-white';
        case 'secondary': return 'text-gray-300';
        case 'tertiary': return 'text-gray-400';
        default: return 'text-white';
      }
    } else {
      switch (type) {
        case 'primary': return 'text-gray-900';
        case 'secondary': return 'text-gray-600';
        case 'tertiary': return 'text-gray-500';
        default: return 'text-gray-900';
      }
    }
  };

  const handleToggleConversation = () => {
    setIsConversationActive(!isConversationActive);
    if (!isConversationActive) {
      setConversationHistory(prev => [...prev, {
        text: "Voice conversation started. You can now speak with the AI teacher! 🎤",
        isUser: false,
        timestamp: new Date()
      }]);
    } else {
      setConversationHistory(prev => [...prev, {
        text: "Voice conversation ended. You can still chat via text! 📝",
        isUser: false,
        timestamp: new Date()
      }]);
    }
  };

  const handleReadLastMessage = () => {
    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (!lastMessage.isUser) {
        setIsReadingLastMessage(true);
        // Simulate reading the message
        setTimeout(() => {
          setIsReadingLastMessage(false);
        }, 3000);
      }
    }
  };

  return (
    <div className={`${getBackgroundClasses()} min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`${getCardBackgroundClasses()} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${getTextClasses('primary')}`}>Teachers Room</h1>
                <p className={`text-sm ${getTextClasses('secondary')}`}>AI-powered voice conversation with your personal teacher</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDarkMode || isDarkGradient ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversation Area */}
          <div className="lg:col-span-2">
            <div className={`${getCardBackgroundClasses()} rounded-2xl p-6 h-96 flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${getTextClasses('primary')}`}>Voice Conversation</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleReadLastMessage}
                    disabled={conversationHistory.length === 0}
                    className={`p-2 rounded-full transition-all ${
                      isReadingLastMessage 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse' 
                        : isDarkMode || isDarkGradient 
                          ? 'bg-white/10 hover:bg-white/20 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Read Last Message"
                  >
                    {isReadingLastMessage ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleToggleConversation}
                    className={`p-3 rounded-full transition-all ${
                      isConversationActive
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                        : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/50'
                    }`}
                    title={isConversationActive ? "End Conversation" : "Start Conversation"}
                  >
                    {isConversationActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* ElevenLabs Widget */}
              <div className="flex-1 flex items-center justify-center">
                <div 
                  className="elevenlabs-widget-teachers-room"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '500px',
                    minHeight: '200px',
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  <elevenlabs-convai 
                    key="elevenlabs-widget-teachers-room-v1"
                    agent-id={getAgentId()}
                    variant="expanded"
                    action-text="🎤 Start Voice Chat"
                    start-call-text="Start Voice"
                    end-call-text="End Voice"
                    avatar-orb-color-1="#8b5cf6"
                    avatar-orb-color-2="#a855f7"
                    data-public="true"
                    data-no-auth="true" 
                    disable-auth="true"
                    no-authentication="true"
                    public-agent="true"
                    onCall={() => {
                      console.log('🎤 Teachers Room widget call started');
                      setIsConversationActive(true);
                      setConversationHistory(prev => [...prev, {
                        text: "Voice conversation started! 🎤",
                        isUser: false,
                        timestamp: new Date()
                      }]);
                    }}
                    onEnd={() => {
                      console.log('🎤 Teachers Room widget call ended');
                      setIsConversationActive(false);
                      setConversationHistory(prev => [...prev, {
                        text: "Voice conversation ended. 📝",
                        isUser: false,
                        timestamp: new Date()
                      }]);
                    }}
                    onConnect={() => {
                      console.log('🎤 Teachers Room widget connected');
                    }}
                    onDisconnect={() => {
                      console.log('🎤 Teachers Room widget disconnected');
                    }}
                    onMessage={(message: any) => {
                      console.log('🎤 Teachers Room widget message:', message);
                      if (message?.text) {
                        setConversationHistory(prev => [...prev, {
                          text: message.text,
                          isUser: false,
                          timestamp: new Date()
                        }]);
                      }
                    }}
                    onError={(error: any) => {
                      console.error('🚫 Teachers Room Widget Error:', error);
                    }}
                    style={{
                      '--primary-color': '#8b5cf6',
                      '--secondary-color': '#a855f7',
                      '--background-color': 'rgba(139, 92, 246, 0.1)',
                      '--text-color': '#333333',
                      '--border-radius': '16px',
                      width: '100%',
                      maxWidth: '500px',
                      minHeight: '200px',
                      fontSize: '18px',
                      overflow: 'visible',
                      zIndex: '10'
                    }}
                  ></elevenlabs-convai>
                </div>
              </div>

              {/* Conversation Status */}
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConversationActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm ${getTextClasses('secondary')}`}>
                    {isConversationActive ? 'Voice conversation active' : 'Voice conversation ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className={`${getCardBackgroundClasses()} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${getTextClasses('primary')}`}>Quick Actions</h3>
                <div className="space-y-3">
                  <button className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                    isDarkMode || isDarkGradient ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}>
                    <BookOpen className="w-5 h-5" />
                    <span className={getTextClasses('primary')}>Study Materials</span>
                  </button>
                  <button className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                    isDarkMode || isDarkGradient ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}>
                    <Brain className="w-5 h-5" />
                    <span className={getTextClasses('primary')}>Brain Training</span>
                  </button>
                  <button className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                    isDarkMode || isDarkGradient ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}>
                    <Zap className="w-5 h-5" />
                    <span className={getTextClasses('primary')}>Quick Quiz</span>
                  </button>
                </div>
              </div>

              {/* Conversation History */}
              <div className={`${getCardBackgroundClasses()} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${getTextClasses('primary')}`}>Recent Activity</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {conversationHistory.slice(-5).map((message, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      message.isUser 
                        ? 'bg-violet-500/10 border border-violet-500/20' 
                        : 'bg-gray-500/10 border border-gray-500/20'
                    }`}>
                      <p className={`text-sm ${getTextClasses('secondary')}`}>
                        {message.text}
                      </p>
                      <p className={`text-xs mt-1 ${getTextClasses('tertiary')}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                  {conversationHistory.length === 0 && (
                    <p className={`text-sm ${getTextClasses('tertiary')} text-center py-4`}>
                      No conversation history yet. Start a voice chat to begin!
                    </p>
                  )}
                </div>
              </div>

              {/* Teacher Info */}
              <div className={`${getCardBackgroundClasses()} rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${getTextClasses('primary')}`}>Your AI Teacher</h3>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className={`font-semibold ${getTextClasses('primary')}`}>Neural AI Teacher</h4>
                  <p className={`text-sm ${getTextClasses('secondary')}`}>Personalized learning assistant</p>
                  <div className="mt-3 flex items-center justify-center space-x-1">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      ))}
                    </div>
                    <span className={`text-xs ${getTextClasses('tertiary')}`}>5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachersRoom; 