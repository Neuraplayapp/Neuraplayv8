import React, { useEffect, useMemo, useState } from 'react';
// @ts-ignore
import TextWorkbench from '../editor/TextWorkbench';
// @ts-ignore
import Scribbleboard from '../scribbleboard/Scribbleboard';

type PanelPreference = 'auto' | 'text' | 'visual';

interface AssistantSurfaceProps {
  compact: boolean;
  preference?: PanelPreference;
}

// Unified assistant surface: white canvas + sliding text editor panel
const AssistantSurface: React.FC<AssistantSurfaceProps> = ({ compact, preference = 'auto' }) => {
  const [showVisual, setShowVisual] = useState(preference === 'visual');
  const [showEditor, setShowEditor] = useState(true);
  // Persist surface state in session storage
  useEffect(() => {
    const saved = sessionStorage.getItem('assistant_surface_show_visual');
    if (saved !== null && preference === 'auto') setShowVisual(saved === '1');
  }, [preference]);
  useEffect(() => {
    sessionStorage.setItem('assistant_surface_show_visual', showVisual ? '1' : '0');
  }, [showVisual]);

  // Any visual-oriented event should reveal the visual panel
  useEffect(() => {
    const reveal = () => setShowVisual(true);
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
    events.forEach((name) => window.addEventListener(name, reveal as EventListener));
    return () => {
      events.forEach((name) => window.removeEventListener(name, reveal as EventListener));
    };
  }, []);

  // If preference switches to text explicitly
  useEffect(() => {
    if (preference === 'text') setShowVisual(false);
    if (preference === 'visual') setShowVisual(true);
  }, [preference]);

  // Shared layout: white canvas filling the surface, with a sliding editor panel
  return (
    <div className={`relative w-full ${compact ? 'h-[33vh] min-h-[320px]' : 'h-[calc(100vh-4rem)]'} bg-white text-gray-900`}> 
      {/* Slim header with left-aligned toggle */}
      <div className={`absolute top-0 left-0 right-0 ${compact ? 'h-8' : 'h-10'} border-b border-gray-200 bg-white/95 flex items-center px-2 z-10`}>
        <button
          onClick={() => setShowEditor((v) => !v)}
          className={`px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 active:scale-[0.98]`}
          aria-label={showEditor ? 'End editing' : 'Open editor'}
        >
          {showEditor ? 'End' : 'Edit'}
        </button>
      </div>

      {/* White writable canvas underneath */}
      <div className={`absolute inset-0 ${compact ? 'pt-8' : 'pt-10'} overflow-hidden`}>
        <div className="w-full h-full overflow-auto">
          {/* @ts-ignore */}
          {showVisual && <Scribbleboard mode={compact ? 'compact' : 'fullscreen'} />}
        </div>
      </div>

      {/* Sliding editor panel from the left */}
      <div className="absolute inset-y-0 left-0 z-20 pointer-events-none">
        <div className="relative h-full">
          <div className="absolute inset-y-0 left-0 pointer-events-auto">
            <div
              className={`h-full ${compact ? 'w-[320px]' : 'w-[420px]'} border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out ${showEditor ? 'translate-x-0' : '-translate-x-[110%]'} `}
            >
              <div className={`${compact ? 'h-8' : 'h-10'} border-b border-gray-200 flex items-center px-2 justify-between`}> 
                <div className="text-xs text-gray-500">Text Editor</div>
                {/* Duplicate close for accessibility */}
                <button onClick={() => setShowEditor(false)} className="px-2 py-0.5 text-[11px] rounded border border-gray-300 hover:bg-gray-50">End</button>
              </div>
              <div className="h-[calc(100%-2.5rem)]"> 
                {/* @ts-ignore */}
                <TextWorkbench compact={compact} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantSurface;

