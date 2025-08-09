import React, { useEffect, useState } from 'react';
// @ts-ignore
import TextWorkbench from '../editor/TextWorkbench';
// @ts-ignore
import Scribbleboard from '../scribbleboard/Scribbleboard';
import { X, Maximize2, Minimize2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PanelPreference = 'auto' | 'text' | 'visual';
type ScribbleMode = 'hidden' | 'overlay' | 'fullscreen';

interface AssistantSurfaceProps {
  compact: boolean;
  preference?: PanelPreference;
  onScribbleClose?: () => void;
  retainChatContext?: boolean;
  chatContent?: React.ReactNode; // New prop for chat content
}

// Unified assistant surface: white canvas + sliding text editor panel with enhanced scribbleboard UX
const AssistantSurface: React.FC<AssistantSurfaceProps> = ({ compact, preference = 'auto', onScribbleClose, retainChatContext = true, chatContent }) => {
  const [showVisual, setShowVisual] = useState(preference === 'visual');
  const [showEditor, setShowEditor] = useState(false);
  const [scribbleMode, setScribbleMode] = useState<ScribbleMode>('hidden');
  const [showInsights, setShowInsights] = useState(false);
  // Persist surface state in session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('assistant_surface_show_visual');
    if (saved !== null && preference === 'auto') setShowVisual(saved === '1');
  }, [preference]);
  useEffect(() => {
    sessionStorage.setItem('assistant_surface_show_visual', showVisual ? '1' : '0');
  }, [showVisual]);

  // Enhanced visual event handling with proper scribbleboard management
  useEffect(() => {
    const handleScribbleOpen = (e: any) => {
      setShowVisual(true);
      setScribbleMode(compact ? 'overlay' : 'fullscreen');
      setShowInsights(true);
    };
    
    const handleScribbleClose = () => {
      setScribbleMode('hidden');
      setShowInsights(false);
      // In compact mode, close everything. In fullscreen, keep chat open
      if (compact) {
        onScribbleClose?.();
      }
      // Fullscreen mode keeps the chat context as requested
    };
    
    const events = [
      'scribble_open',
      'scribble_parallel_thought',
      'scribble_hypothesis_test',
      'scribble_hypothesis_result',
      'scribble_graph_add_node',
      'scribble_graph_add_edge',
      'scribble_graph_layout',
      'scribble_graph_focus',
      'scribble_chart_create',
      'scribble_mutating_create',
      'scribble_mutating_evolve',
      'scribble_mutating_compare',
    ];
    
    events.forEach((name) => window.addEventListener(name, handleScribbleOpen as EventListener));
    window.addEventListener('scribble_close', handleScribbleClose as EventListener);
    
    return () => {
      events.forEach((name) => window.removeEventListener(name, handleScribbleOpen as EventListener));
      window.removeEventListener('scribble_close', handleScribbleClose as EventListener);
    };
  }, [compact, onScribbleClose]);

  // If preference switches to text explicitly
  useEffect(() => {
    if (preference === 'text') setShowVisual(false);
    if (preference === 'visual') setShowVisual(true);
  }, [preference]);

  // Compact mode - renders the chat interface with optional canvas modal
  if (compact) {
    return (
      <div className="relative w-full h-[33vh] min-h-[280px] sm:min-h-[320px] bg-white text-gray-900">
        {/* Main chat interface */}
        <div className="absolute inset-0 overflow-hidden">
          {chatContent ? (
            <div className="w-full h-full">
              {chatContent}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              <div className="text-center p-4">
                <div className="text-lg mb-2">💬</div>
                <div>Start a conversation</div>
                <div className="text-xs mt-1 text-gray-400">Ask AI anything to begin</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Canvas modal that slides down from top when activated */}
        <AnimatePresence>
          {scribbleMode === 'overlay' && (
            <motion.div
              className="absolute inset-x-0 top-0 z-50 h-full"
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="w-full h-full bg-white border-b-2 border-blue-500 shadow-2xl overflow-hidden">
                {/* Canvas header */}
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b touch-manipulation">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="font-medium text-gray-800 text-sm sm:text-base">Visual Canvas</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full hidden sm:inline">
                      Compact
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Clear canvas button */}
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('scribble_clear_all', { detail: { clearEverything: true } }));
                      }}
                      className="p-2 rounded-md hover:bg-white/60 transition-colors touch-manipulation"
                      title="Clear canvas"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    </button>
                    {/* Fullscreen toggle */}
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('scribble_close'));
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('scribble_open', { detail: { mode: 'fullscreen' } }));
                        }, 100);
                      }}
                      className="p-2 rounded-md hover:bg-white/60 transition-colors touch-manipulation"
                      title="Expand to fullscreen"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('scribble_close'))}
                      className="p-2 rounded-md hover:bg-white/60 transition-colors touch-manipulation"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {/* @ts-ignore */}
                <Scribbleboard mode="compact" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Responsive fullscreen: mobile stacks vertically, desktop splits horizontally
  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-white text-gray-900">
      {/* Header with document editor toggle */}
      <div className="h-12 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="font-medium text-gray-800">AI Workspace</span>
          <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
            Canvas + Chat
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              showEditor 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            📝 Document Editor
          </button>
        </div>
      </div>
      
      {/* Document Editor Overlay */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            className="absolute inset-x-0 top-12 z-40 h-[calc(100%-3rem)]"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full h-full bg-white border-b border-gray-200 shadow-lg">
              <div className="h-10 border-b border-gray-200 flex items-center px-4 justify-between bg-gray-50">
                <div className="text-sm font-medium text-gray-700">Document Editor</div>
                <button 
                  onClick={() => setShowEditor(false)} 
                  className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-white transition-colors"
                >
                  Close Editor
                </button>
              </div>
              <div className="h-[calc(100%-2.5rem)]">
                {/* @ts-ignore */}
                <TextWorkbench compact={false} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] w-full h-[calc(100%-3rem)] min-h-0">
        {/* Canvas area - full width on mobile, 66% on desktop */}
        <div className="relative min-h-0 overflow-hidden h-[60vh] lg:h-full">
          {/* Canvas area */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="w-full h-full overflow-auto">
              {/* @ts-ignore */}
              {showVisual && scribbleMode !== 'hidden' && <Scribbleboard mode="fullscreen" />}
              
              {/* Fallback content when scribbleboard is hidden */}
              {(!showVisual || scribbleMode === 'hidden') && (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Hypothesis Canvas</h3>
                    <p className="text-gray-600 text-sm">Ask AI to create charts, test hypotheses, or analyze data to activate the visual workspace.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Canvas controls overlay */}
          {showVisual && scribbleMode !== 'hidden' && (
            <div className="absolute top-4 right-4 z-30">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className={`p-2 rounded-md transition-colors ${
                    showInsights ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Toggle Insights"
                >
                  {showInsights ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('scribble_close'))}
                  className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Close Canvas (Keep Chat)"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Sliding insights panel from the left */}
          <AnimatePresence>
            {showInsights && scribbleMode !== 'hidden' && (
              <motion.div
                className="absolute inset-y-0 left-0 z-20 pointer-events-none"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="relative h-full">
                  <div className="absolute inset-y-0 left-0 pointer-events-auto">
                    <div className="h-full w-[320px] bg-white/95 backdrop-blur-md shadow-xl border-r border-gray-200">
                      <div className="h-12 border-b border-gray-200 flex items-center px-4 justify-between bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="font-medium text-gray-800">AI Insights</span>
                        </div>
                        <button 
                          onClick={() => setShowInsights(false)} 
                          className="p-1 rounded-md hover:bg-white/60 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="h-[calc(100%-3rem)] p-4 overflow-auto">
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="font-medium text-blue-800 mb-1">✨ Smart Suggestion</div>
                            <div className="text-sm text-blue-700">Try comparing your hypothesis with alternative scenarios for deeper insights.</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="font-medium text-green-800 mb-1">📊 Data Insight</div>
                            <div className="text-sm text-green-700">Your current analysis shows promising patterns. Consider expanding the dataset.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Text Editor moved to header overlay */}
        </div>

        {/* Chat area - stacked below on mobile, 33% sidebar on desktop */}
        <div className="min-h-0 overflow-auto h-[40vh] lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200 bg-white">
          {chatContent ? (
            <div className="w-full h-full">
              {chatContent}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              <div className="text-center p-4">
                <div className="text-lg mb-2">💬</div>
                <div>Start a conversation</div>
                <div className="text-xs mt-1 text-gray-400">Ask AI anything to begin</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantSurface;

// Helper function to trigger scribbleboard open from anywhere
export const openScribbleboard = (config?: { mode?: 'overlay' | 'fullscreen'; data?: any }) => {
  window.dispatchEvent(new CustomEvent('scribble_open', { detail: config }));
};

// Helper function to close scribbleboard 
export const closeScribbleboard = () => {
  window.dispatchEvent(new CustomEvent('scribble_close'));
};

