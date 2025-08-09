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

// Unified assistant surface: top text panel, bottom visual panel on demand
const AssistantSurface: React.FC<AssistantSurfaceProps> = ({ compact, preference = 'auto' }) => {
  const [showVisual, setShowVisual] = useState(preference === 'visual');
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

  if (compact) {
    // Compact: anchored mini-surface ~33vh
    return (
      <div className="w-full h-[33vh] min-h-[320px] flex flex-col">
        <div className="shrink-0 border-b border-white/10 h-[40%] min-h-[120px]">
          {/* @ts-ignore */}
          <TextWorkbench compact={true} />
        </div>
        {showVisual && (
          <div className="flex-1 min-h-[160px]">
            {/* @ts-ignore */}
            <Scribbleboard mode="compact" />
          </div>
        )}
      </div>
    );
  }

  // Fullscreen: polished proportions — top anchored modal effect via padding
  return (
    <div className="w-full h-[calc(100vh-4rem)] grid grid-rows-[40%_60%] gap-0">
      <div className="border-b border-white/10 overflow-hidden">
        {/* @ts-ignore */}
        <TextWorkbench compact={false} />
      </div>
      <div className="overflow-hidden">
        {showVisual && (
          // @ts-ignore
          <Scribbleboard mode="fullscreen" />
        )}
      </div>
    </div>
  );
};

export default AssistantSurface;

