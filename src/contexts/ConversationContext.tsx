import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  image?: string;
  action?: 'navigate_to_page' | 'update_settings' | 'recommend_game' | 'create_content' | 'accessibility_support' | 'read_user_data' | 'generate_image' | 'web_search' | 'get_weather' | 'game';
  toolResults?: any[]; // Store tool execution results for enhanced rendering
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  context?: string;
}

interface ConversationContextType {
  conversations: { [key: string]: Conversation };
  activeConversation: string;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  createConversation: (id: string, title: string) => void;
  clearConversation: (conversationId: string) => void;
  clearAllConversations: () => void;
  getActiveConversation: () => Conversation;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

const STORAGE_KEY = 'neuraplay_conversations';
const ACTIVE_CONVERSATION_KEY = 'neuraplay_active_conversation';

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<{ [key: string]: Conversation }>({
    current: {
      id: 'current',
      title: 'Current Chat',
      messages: [
        { 
          text: "🌟 Hi there! I'm AI Assistant, your friendly AI teacher! 🚀 I can help you with learning, games, navigation, settings, AI agent control, and accessibility needs. What would you like to explore today? 🎮✨", 
          isUser: false, 
          timestamp: new Date() 
        }
      ],
      timestamp: new Date()
    }
  });

  const [activeConversation, setActiveConversation] = useState<string>('current');

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem(STORAGE_KEY);
      const savedActiveConversation = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
      
      if (savedConversations) {
        const parsed = JSON.parse(savedConversations);
        // Convert timestamp strings back to Date objects
        const conversationsWithDates = Object.keys(parsed).reduce((acc, key) => {
          acc[key] = {
            ...parsed[key],
            timestamp: new Date(parsed[key].timestamp),
            messages: parsed[key].messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          };
          return acc;
        }, {} as { [key: string]: Conversation });
        
        setConversations(conversationsWithDates);
      }
      
      if (savedActiveConversation && savedActiveConversation !== 'current') {
        setActiveConversation(savedActiveConversation);
      }
    } catch (error) {
      console.error('Error loading conversations from localStorage:', error);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations to localStorage:', error);
    }
  }, [conversations]);

  // Save active conversation to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversation);
    } catch (error) {
      console.error('Error saving active conversation to localStorage:', error);
    }
  }, [activeConversation]);

  const addMessage = (conversationId: string, message: Message) => {
    setConversations(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        messages: [...(prev[conversationId]?.messages || []), message],
        timestamp: new Date()
      }
    }));
  };

  const createConversation = (id: string, title: string) => {
    setConversations(prev => ({
      ...prev,
      [id]: {
        id,
        title,
        messages: [],
        timestamp: new Date()
      }
    }));
  };

  const clearConversation = (conversationId: string) => {
    setConversations(prev => {
      if (conversationId === 'current') {
        // Reset current conversation to initial state
        return {
          ...prev,
          current: {
            id: 'current',
            title: 'Current Chat',
            messages: [
              { 
                text: "🌟 Hi there! I'm AI Assistant, your friendly AI teacher! 🚀 I can help you with learning, games, navigation, settings, AI agent control, and accessibility needs. What would you like to explore today? 🎮✨", 
                isUser: false, 
                timestamp: new Date() 
              }
            ],
            timestamp: new Date()
          }
        };
      } else {
        // Remove other conversations
        const { [conversationId]: removed, ...rest } = prev;
        return rest;
      }
    });
  };

  const clearAllConversations = () => {
    setConversations({
      current: {
        id: 'current',
        title: 'Current Chat',
        messages: [
          { 
            text: "🌟 Hi there! I'm AI Assistant, your friendly AI teacher! 🚀 I can help you with learning, games, navigation, settings, AI agent control, and accessibility needs. What would you like to explore today? 🎮✨", 
            isUser: false, 
            timestamp: new Date() 
          }
        ],
        timestamp: new Date()
      }
    });
    setActiveConversation('current');
  };

  const getActiveConversation = (): Conversation => {
    return conversations[activeConversation] || conversations['current'];
  };

  return (
    <ConversationContext.Provider value={{
      conversations,
      activeConversation,
      setActiveConversation,
      addMessage,
      createConversation,
      clearConversation,
      clearAllConversations,
      getActiveConversation
    }}>
      {children}
    </ConversationContext.Provider>
  );
};