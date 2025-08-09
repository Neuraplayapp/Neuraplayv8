// Canvas Board Store - Zustand-based state management for Gemini/Claude-like canvas
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Canvas Board Types
export interface CanvasElement {
  id: string;
  type: 'text' | 'code' | 'chart' | 'diagram' | 'image' | 'hypothesis' | 'decision' | 'suggestion';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  timestamp: Date;
  layer: number;
  metadata?: {
    sourceMessage?: string;
    toolResult?: any;
    confidence?: number;
  };
}

export interface Hypothesis {
  id: string;
  type: 'binary_choice' | 'multi_option' | 'user_preference';
  title: string;
  options: Array<{
    id: string;
    text: string;
    probability: number;
    userHistoryWeight: number;
  }>;
  detectedFrom: string; // Message that triggered detection
  timestamp: Date;
  resolved?: {
    chosenOption: string;
    confidence: number;
    timestamp: Date;
  };
}

export interface UserDecisionPattern {
  context: string;
  choices: Array<{
    option: string;
    frequency: number;
    lastChosen: Date;
    contexts: string[];
  }>;
  learningWeight: number; // How much this pattern influences future suggestions
}

export interface SuggestionCard {
  id: string;
  title: string;
  description: string;
  action: string; // Tool to execute
  parameters: any;
  confidence: number;
  sourceAnalysis: string;
  category: 'navigation' | 'learning' | 'creation' | 'analysis' | 'preference';
  priority: 'low' | 'medium' | 'high';
  executionTime?: Date;
}

export interface CanvasState {
  // Canvas Layout
  isCanvasMode: boolean;
  splitRatio: number; // 0.6-0.8 for canvas, 0.2-0.4 for chat
  canvasElements: CanvasElement[];
  
  // Chat Integration
  activeChatId: string;
  chatPosition: 'right' | 'left' | 'bottom';
  chatSize: { width: number; height: number };
  
  // Agentic Decision System
  activeHypotheses: Hypothesis[];
  userDecisionPatterns: { [context: string]: UserDecisionPattern };
  suggestionCards: SuggestionCard[];
  
  // Canvas View State
  viewportCenter: { x: number; y: number };
  zoomLevel: number;
  selectedElements: string[];
  canvasTheme: 'light' | 'dark' | 'auto';
  
  // Animation States
  isAnimating: boolean;
  animationQueue: Array<{
    type: string;
    targetId: string;
    properties: any;
    duration: number;
  }>;
  
  // 3D Visualization
  show3DGraphs: boolean;
  graphData: Array<{
    id: string;
    type: '3d_scatter' | '3d_network' | '3d_surface' | '3d_flow';
    data: any;
    position: { x: number; y: number; z: number };
  }>;
}

export interface CanvasActions {
  // Canvas Mode Control
  toggleCanvasMode: () => void;
  setSplitRatio: (ratio: number) => void;
  setCanvasTheme: (theme: 'light' | 'dark' | 'auto') => void;
  
  // Element Management
  addCanvasElement: (element: Omit<CanvasElement, 'id' | 'timestamp'>) => string;
  updateCanvasElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeCanvasElement: (id: string) => void;
  moveElement: (id: string, newPosition: { x: number; y: number }) => void;
  selectElements: (ids: string[]) => void;
  clearCanvas: () => void;
  
  // Hypothesis Detection & Management
  detectHypothesis: (message: string, context: any) => Hypothesis | null;
  resolveHypothesis: (hypothesisId: string, chosenOption: string, confidence: number) => void;
  learnFromDecision: (context: string, choice: string) => void;
  
  // Suggestion System
  generateSuggestions: (context: any) => SuggestionCard[];
  executeSuggestion: (suggestionId: string) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => void;
  
  // Viewport Control
  setViewportCenter: (center: { x: number; y: number }) => void;
  setZoomLevel: (zoom: number) => void;
  resetViewport: () => void;
  
  // Animation Control
  queueAnimation: (animation: any) => void;
  playAnimations: () => Promise<void>;
  
  // 3D Visualization
  toggle3DGraphs: () => void;
  add3DGraph: (graph: any) => void;
  update3DGraph: (id: string, updates: any) => void;
  
  // Chat Integration
  syncWithConversation: (conversationId: string, messages: any[]) => void;
  setChatPosition: (position: 'right' | 'left' | 'bottom') => void;
  
  // AI Content Generation
  generateFromMessage: (message: string, toolResults: any[]) => Promise<void>;
  summarizeContent: (elementIds: string[]) => Promise<CanvasElement>;
  
  // Pattern Recognition
  analyzeUserBehavior: () => void;
  predictUserPreference: (context: string) => string | null;
}

export type CanvasStore = CanvasState & CanvasActions;

// AI-powered hypothesis detection patterns
const HYPOTHESIS_PATTERNS = [
  {
    pattern: /(?:should I|shall I|do I|would you recommend|better to|prefer to) (.+?) or (.+?)[\?\!]?/i,
    type: 'binary_choice' as const,
    weight: 0.9
  },
  {
    pattern: /(?:go to|visit|navigate to|check out) (.+?)[\?\!]?/i,
    type: 'navigation_preference' as const,
    weight: 0.7
  },
  {
    pattern: /(?:I (?:want|need|like) to|let me|can you help me) (.+?)[\?\!]?/i,
    type: 'user_preference' as const,
    weight: 0.8
  }
];

// Store implementation with persistence
export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      // Initial State
      isCanvasMode: false,
      splitRatio: 0.7, // 70% canvas, 30% chat
      canvasElements: [],
      activeChatId: 'current',
      chatPosition: 'right',
      chatSize: { width: 400, height: 600 },
      activeHypotheses: [],
      userDecisionPatterns: {},
      suggestionCards: [],
      viewportCenter: { x: 0, y: 0 },
      zoomLevel: 1,
      selectedElements: [],
      canvasTheme: 'auto',
      isAnimating: false,
      animationQueue: [],
      show3DGraphs: false,
      graphData: [],

      // Actions Implementation
      toggleCanvasMode: () => set((state) => ({
        isCanvasMode: !state.isCanvasMode,
        // Reset viewport when entering canvas mode
        ...(state.isCanvasMode ? {} : {
          viewportCenter: { x: 0, y: 0 },
          zoomLevel: 1,
          selectedElements: []
        })
      })),

      setSplitRatio: (ratio: number) => set({
        splitRatio: Math.max(0.5, Math.min(0.9, ratio)) // Constrain between 50-90%
      }),

      setCanvasTheme: (theme) => set({ canvasTheme: theme }),

      addCanvasElement: (element) => {
        const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newElement: CanvasElement = {
          ...element,
          id,
          timestamp: new Date()
        };
        
        set((state) => ({
          canvasElements: [...state.canvasElements, newElement]
        }));
        
        return id;
      },

      updateCanvasElement: (id, updates) => set((state) => ({
        canvasElements: state.canvasElements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        )
      })),

      removeCanvasElement: (id) => set((state) => ({
        canvasElements: state.canvasElements.filter(el => el.id !== id),
        selectedElements: state.selectedElements.filter(selId => selId !== id)
      })),

      moveElement: (id, newPosition) => set((state) => ({
        canvasElements: state.canvasElements.map(el =>
          el.id === id ? { ...el, position: newPosition } : el
        )
      })),

      selectElements: (ids) => set({ selectedElements: ids }),

      clearCanvas: () => set({
        canvasElements: [],
        selectedElements: [],
        activeHypotheses: [],
        suggestionCards: []
      }),

      // AI-powered hypothesis detection
      detectHypothesis: (message: string, context: any) => {
        const patterns = HYPOTHESIS_PATTERNS;
        
        for (const { pattern, type, weight } of patterns) {
          const match = message.match(pattern);
          if (match) {
            const hypothesis: Hypothesis = {
              id: `hyp_${Date.now()}`,
              type: type as any,
              title: `Decision: ${match[1]} vs ${match[2] || 'alternative'}`,
              options: [
                {
                  id: 'opt1',
                  text: match[1],
                  probability: 0.5,
                  userHistoryWeight: get().predictUserPreference(match[1]) ? 0.3 : 0
                },
                {
                  id: 'opt2', 
                  text: match[2] || 'alternative',
                  probability: 0.5,
                  userHistoryWeight: get().predictUserPreference(match[2] || 'alternative') ? 0.3 : 0
                }
              ],
              detectedFrom: message,
              timestamp: new Date()
            };
            
            set((state) => ({
              activeHypotheses: [...state.activeHypotheses, hypothesis]
            }));
            
            return hypothesis;
          }
        }
        
        return null;
      },

      resolveHypothesis: (hypothesisId, chosenOption, confidence) => {
        set((state) => ({
          activeHypotheses: state.activeHypotheses.map(h =>
            h.id === hypothesisId 
              ? { 
                  ...h, 
                  resolved: { 
                    chosenOption, 
                    confidence, 
                    timestamp: new Date() 
                  } 
                } 
              : h
          )
        }));
        
        // Learn from the decision
        const hypothesis = get().activeHypotheses.find(h => h.id === hypothesisId);
        if (hypothesis) {
          get().learnFromDecision(hypothesis.title, chosenOption);
        }
      },

      learnFromDecision: (context, choice) => {
        set((state) => {
          const patterns = { ...state.userDecisionPatterns };
          
          if (!patterns[context]) {
            patterns[context] = {
              context,
              choices: [],
              learningWeight: 1.0
            };
          }
          
          const existingChoice = patterns[context].choices.find(c => c.option === choice);
          if (existingChoice) {
            existingChoice.frequency += 1;
            existingChoice.lastChosen = new Date();
          } else {
            patterns[context].choices.push({
              option: choice,
              frequency: 1,
              lastChosen: new Date(),
              contexts: [context]
            });
          }
          
          return { userDecisionPatterns: patterns };
        });
      },

      generateSuggestions: (context) => {
        const state = get();
        const suggestions: SuggestionCard[] = [];
        
        // Generate suggestions based on user patterns
        Object.values(state.userDecisionPatterns).forEach(pattern => {
          const topChoice = pattern.choices.sort((a, b) => b.frequency - a.frequency)[0];
          if (topChoice && topChoice.frequency > 1) {
            suggestions.push({
              id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              title: `You usually choose "${topChoice.option}"`,
              description: `Based on your history, you've chosen this ${topChoice.frequency} times`,
              action: 'auto_select',
              parameters: { choice: topChoice.option },
              confidence: Math.min(0.9, topChoice.frequency / 10),
              sourceAnalysis: `Pattern: ${pattern.context}`,
              category: 'preference',
              priority: topChoice.frequency > 3 ? 'high' : 'medium'
            });
          }
        });
        
        set({ suggestionCards: suggestions });
        return suggestions;
      },

      executeSuggestion: async (suggestionId) => {
        const suggestion = get().suggestionCards.find(s => s.id === suggestionId);
        if (!suggestion) return;
        
        // Mark as executed
        set((state) => ({
          suggestionCards: state.suggestionCards.map(s =>
            s.id === suggestionId 
              ? { ...s, executionTime: new Date() }
              : s
          )
        }));
        
        // Execute the suggestion (integrate with existing tool system)
        console.log('Executing suggestion:', suggestion);
      },

      dismissSuggestion: (suggestionId) => set((state) => ({
        suggestionCards: state.suggestionCards.filter(s => s.id !== suggestionId)
      })),

      setViewportCenter: (center) => set({ viewportCenter: center }),
      setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.1, Math.min(5, zoom)) }),
      resetViewport: () => set({ viewportCenter: { x: 0, y: 0 }, zoomLevel: 1 }),

      queueAnimation: (animation) => set((state) => ({
        animationQueue: [...state.animationQueue, animation]
      })),

      playAnimations: async () => {
        const { animationQueue } = get();
        set({ isAnimating: true });
        
        // Process animations sequentially
        for (const animation of animationQueue) {
          await new Promise(resolve => setTimeout(resolve, animation.duration));
        }
        
        set({ isAnimating: false, animationQueue: [] });
      },

      toggle3DGraphs: () => set((state) => ({ show3DGraphs: !state.show3DGraphs })),

      add3DGraph: (graph) => set((state) => ({
        graphData: [...state.graphData, { ...graph, id: `graph_${Date.now()}` }]
      })),

      update3DGraph: (id, updates) => set((state) => ({
        graphData: state.graphData.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      syncWithConversation: (conversationId, messages) => {
        // Auto-generate canvas elements from AI tool results
        messages.forEach(message => {
          if (message.toolResults) {
            get().generateFromMessage(message.text, message.toolResults);
          }
        });
        
        set({ activeChatId: conversationId });
      },

      setChatPosition: (position) => set({ chatPosition: position }),

      generateFromMessage: async (message, toolResults) => {
        const addElement = get().addCanvasElement;
        
        toolResults.forEach(result => {
          if (result.data?.image_url) {
            addElement({
              type: 'image',
              content: { src: result.data.image_url, alt: result.message },
              position: { x: Math.random() * 400, y: Math.random() * 300 },
              size: { width: 300, height: 200 },
              layer: 1,
              metadata: { sourceMessage: message, toolResult: result }
            });
          }
          
          if (result.data?.type === 'web_results') {
            addElement({
              type: 'text',
              content: { 
                title: 'Web Search Results',
                data: result.data.results 
              },
              position: { x: Math.random() * 400, y: Math.random() * 300 },
              size: { width: 350, height: 250 },
              layer: 1,
              metadata: { sourceMessage: message, toolResult: result }
            });
          }
          
          if (result.data?.type === 'math_diagram') {
            addElement({
              type: 'diagram',
              content: result.data,
              position: { x: Math.random() * 400, y: Math.random() * 300 },
              size: { width: 400, height: 300 },
              layer: 1,
              metadata: { sourceMessage: message, toolResult: result }
            });
          }
        });
      },

      summarizeContent: async (elementIds) => {
        const elements = get().canvasElements.filter(el => elementIds.includes(el.id));
        // Create a summary element
        const summaryId = get().addCanvasElement({
          type: 'text',
          content: {
            title: 'Summary',
            text: `Summary of ${elements.length} elements`,
            elements: elements.map(el => ({ id: el.id, type: el.type }))
          },
          position: { x: 50, y: 50 },
          size: { width: 300, height: 150 },
          layer: 2
        });
        
        return get().canvasElements.find(el => el.id === summaryId)!;
      },

      analyzeUserBehavior: () => {
        // Analyze patterns and update learning weights
        const patterns = get().userDecisionPatterns;
        Object.values(patterns).forEach(pattern => {
          const totalChoices = pattern.choices.reduce((sum, choice) => sum + choice.frequency, 0);
          pattern.learningWeight = Math.min(2.0, totalChoices / 10); // Cap at 2.0
        });
      },

      predictUserPreference: (context) => {
        const patterns = get().userDecisionPatterns;
        const relevantPattern = patterns[context] || Object.values(patterns).find(p => 
          p.choices.some(c => c.contexts.includes(context))
        );
        
        if (relevantPattern) {
          const topChoice = relevantPattern.choices.sort((a, b) => b.frequency - a.frequency)[0];
          return topChoice?.frequency > 2 ? topChoice.option : null;
        }
        
        return null;
      }
    }),
    {
      name: 'neuraplay-canvas-store',
      partialize: (state) => ({
        // Persist only essential state
        userDecisionPatterns: state.userDecisionPatterns,
        canvasTheme: state.canvasTheme,
        splitRatio: state.splitRatio,
        chatPosition: state.chatPosition,
        show3DGraphs: state.show3DGraphs
      })
    }
  )
);

export default useCanvasStore;
