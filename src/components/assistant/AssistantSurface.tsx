import React, { useEffect, useState } from 'react';
// @ts-ignore
import TextWorkbench from '../editor/TextWorkbench';
// @ts-ignore
import Scribbleboard from '../scribbleboard/Scribbleboard';
import { X, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PanelPreference = 'auto' | 'text' | 'visual';
type ScribbleMode = 'hidden' | 'overlay' | 'fullscreen';

interface AssistantSurfaceProps {
  compact: boolean;
  preference?: PanelPreference;
  onScribbleClose?: () => void;
  retainChatContext?: boolean;
}

// Unified assistant surface: white canvas + sliding text editor panel with enhanced scribbleboard UX
const AssistantSurface: React.FC<AssistantSurfaceProps> = ({ compact, preference = 'auto', onScribbleClose, retainChatContext = true }) => {
  const [showVisual, setShowVisual] = useState(preference === 'visual');
  const [showEditor, setShowEditor] = useState(true);
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

  // Mobile-first compact mode with responsive overlay
  if (compact) {
    return (
      <div className="relative w-full h-[33vh] min-h-[280px] sm:min-h-[320px] bg-white text-gray-900">
        {/* Base canvas */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-full h-full overflow-auto">
            {/* @ts-ignore */}
            {showVisual && scribbleMode === 'hidden' && <Scribbleboard mode="compact" />}
          </div>
        </div>
        
        {/* Mobile-optimized sliding overlay */}
        <AnimatePresence>
          {scribbleMode === 'overlay' && (
            <motion.div
              className="absolute inset-0 z-50"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="w-full h-full bg-white border-t-2 border-blue-500 shadow-2xl overflow-hidden">
                {/* Mobile-optimized header */}
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b touch-manipulation">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="font-medium text-gray-800 text-sm sm:text-base">Hypothesis Lab</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full hidden sm:inline">
                      Mobile Mode
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Mobile fullscreen toggle */}
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
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] w-full h-full min-h-0">
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
          
          {/* Sliding editor panel from the left (only when insights are hidden) */}
          {!showInsights && (
            <div className="absolute inset-y-0 left-0 z-20 pointer-events-none">
              <div className="relative h-full">
                <div className="absolute inset-y-0 left-0 pointer-events-auto">
                  <div className={`h-full w-[420px] border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out ${showEditor ? 'translate-x-0' : '-translate-x-[110%]'} `}>
                    <div className="h-10 border-b border-gray-200 flex items-center px-2 justify-between">
                      <div className="text-xs text-gray-500">Text Editor</div>
                      <button onClick={() => setShowEditor(false)} className="px-2 py-0.5 text-[11px] rounded border border-gray-300 hover:bg-gray-50">End</button>
                    </div>
                    <div className="h-[calc(100%-2.5rem)]">
                      {/* @ts-ignore */}
                      <TextWorkbench compact={false} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat area - stacked below on mobile, 33% sidebar on desktop */}
        <div className="min-h-0 overflow-auto h-[40vh] lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200" />
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

