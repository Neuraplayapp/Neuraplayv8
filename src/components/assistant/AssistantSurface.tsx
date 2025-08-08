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
    // Compact: top text (~33%), bottom visual if needed
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

  // Fullscreen: side-by-side or stacked depending on available width
  return (
    <div className="w-full h-[calc(100vh-4rem)] grid grid-cols-3">
      <div className="col-span-1 border-r border-white/10">
        {/* @ts-ignore */}
        <TextWorkbench compact={false} />
      </div>
      <div className="col-span-2">
        {showVisual && (
          // @ts-ignore
          <Scribbleboard mode="fullscreen" />
        )}
      </div>
    </div>
  );
};

export default AssistantSurface;

