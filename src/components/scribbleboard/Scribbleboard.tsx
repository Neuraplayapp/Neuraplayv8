import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// @ts-ignore
import ChartCard, { CHART_SCENARIOS } from './ChartCard';
import { selectionManager } from '../../services/SelectionManager';
import { suggestLabel } from '../../services/labels/LabelingService';

type Mode = 'fullscreen' | 'compact';

export interface HypothesisResult {
  title: string;
  estimate: string; // e.g., "47% time saved"
  confidence: string; // e.g., "0.87"
}

interface HypothesisCardProps {
  prompt: string;
  mode: Mode;
  result?: HypothesisResult;
}

const HypothesisCard: React.FC<HypothesisCardProps> = ({ prompt, mode, result }) => {
  const isCompact = mode === 'compact';
  return (
    <div className={`${isCompact ? 'p-2 rounded-md' : 'p-4 rounded-lg'} border ${isCompact ? 'text-sm' : 'text-base'} bg-white/80 dark:bg-black/40 border-black/10 dark:border-white/10 shadow-sm`}> 
      <div className={`font-semibold ${isCompact ? 'mb-1' : 'mb-2'}`}>🧪 Hypothesis Tester</div>
      <div className={`text-gray-700 dark:text-gray-300 ${isCompact ? 'mb-1' : 'mb-2'}`}>{prompt}</div>
      {result ? (
        <div className={`flex items-center gap-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{result.estimate}</span>
          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">conf {result.confidence}</span>
        </div>
      ) : (
        <div className={`text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>Waiting for simulation…</div>
      )}
    </div>
  );
};

interface SuggestionCardProps {
  text: string;
  mode: Mode;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ text, mode }) => (
  <div className={`${mode === 'compact' ? 'p-2 text-xs rounded-md' : 'p-3 text-sm rounded-lg'} border bg-white/80 dark:bg-black/40 border-black/10 dark:border-white/10`}>{text}</div>
);

interface ScribbleboardProps {
  mode: Mode;
}

type Board = {
  id: string;
  name: string;
  hypotheses: Array<{ id: string; prompt: string; result?: HypothesisResult; branches?: {A?: string; B?: string} }>;
  suggestions: string[];
  parallel: { left: string[]; right: string[] } | null;
  mutating: Array<{ id: string; title: string; versions: string[]; type: string }>; // simple placeholder
  graph: { nodes: Array<{ id: string; label: string }>; edges: Array<{ from: string; to: string }> };
  charts?: Array<{ id: string; title?: string; type: 'line'|'bar'|'area'|'scatter'|'pie'|'graph'; series: Array<{ name: string; data: Array<{ x: number|string; y: number }>; color?: string }> }>
};

const Scribbleboard: React.FC<ScribbleboardProps> = ({ mode }) => {
  const [boards, setBoards] = useState<Board[]>([{
    id: 'board_1', name: 'Board 1', hypotheses: [], suggestions: [], parallel: null, mutating: [], graph: { nodes: [], edges: [] }, charts: []
  }]);
  const [activeBoard, setActiveBoard] = useState('board_1');
  const [autoAgentEnabled, setAutoAgentEnabled] = useState(false);

  // Wire SelectionManager minimally: remember last active board per view
  useEffect(() => {
    const last = selectionManager.getLastForView('scribbleboard');
    if (last && boards.some(b => b.id === last)) {
      setActiveBoard(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeBoard) selectionManager.setHard(activeBoard, 'scribbleboard');
  }, [activeBoard]);

  // Event listeners for tools
  useEffect(() => {
    // Open with hypothesis scaffolding: pre-populate two branches and an empty hypothesis card
    const onOpen = (e: any) => {
      const modeReq = e?.detail?.mode as Mode | undefined;
      // Optional mode-based behaviors; we already control layout in AIAssistant
      const left = e?.detail?.left || 'Hypothesis A: ...';
      const right = e?.detail?.right || 'Hypothesis B: ...';
      const prompt = e?.detail?.prompt || 'State your hypothesis here...';
      setBoards(prev => prev.map(b => b.id===activeBoard ? {
        ...b,
        parallel: { left: [left], right: [right] },
        hypotheses: [{ id: `h_${Date.now()}`, prompt }, ...b.hypotheses]
      } : b));
      // Also add a starting suggestion
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, suggestions: [`Consider variables and expected outcome.`] } : b));
    };
    const onOpenTest = (e: any) => {
      const prompt = e?.detail?.prompt || 'Untitled hypothesis';
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, hypotheses: [{ id: `h_${Date.now()}`, prompt }, ...b.hypotheses] } : b));
    };
    const onSetResult = (e: any) => {
      const { id, estimate, confidence, title } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, hypotheses: b.hypotheses.map(h => h.id===id ? { ...h, result: { title: title || 'Result', estimate, confidence } } : h) } : b));
    };
    const onAutoAgentToggle = (e: any) => {
      setAutoAgentEnabled(!!e?.detail?.enabled);
    };
    const onAutoAgentSuggest = (e: any) => {
      if (!autoAgentEnabled) return;
      const s = e?.detail?.suggestions as string[] | undefined;
      if (s && s.length) setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, suggestions: [...s, ...b.suggestions].slice(0, mode==='compact'?3:8) } : b));
    };
    const onParallelThought = (e: any) => {
      const { leftPrompt, rightPrompt } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, parallel: { left: [leftPrompt||'Branch A'], right: [rightPrompt||'Branch B'] } } : b));
    };
    const onBoardNew = (e: any) => {
      const name = e?.detail?.name || `Board ${boards.length+1}`;
      const id = `board_${Date.now()}`;
      setBoards(prev => [...prev, { id, name, hypotheses: [], suggestions: [], parallel: null, mutating: [], graph: { nodes: [], edges: [] } }]);
      setActiveBoard(id);
    };
    const onBoardSwitch = (e: any) => setActiveBoard(e?.detail?.id || activeBoard);
    const onBoardRename = (e: any) => {
      const { id, name } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===id ? { ...b, name: name || b.name } : b));
    };
    const onBoardDelete = (e: any) => {
      const { id } = e?.detail || {};
      setBoards(prev => prev.filter(b => b.id !== id));
      if (activeBoard === id && boards.length>1) setActiveBoard(boards[0].id);
    };
    const onAddNote = (e: any) => {
      const text = e?.detail?.text || '';
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, suggestions: [text, ...b.suggestions] } : b));
    };
    // Hypothesis branch actions
    const onCombine = (e: any) => {
      const { id } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, parallel: null, hypotheses: b.hypotheses.map(h=>h.id===id?{...h, prompt: `${h.prompt} (Combined)`}:h)}: b));
    };
    const onPrune = (e: any) => {
      const { keep } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, parallel: { left: keep==='A'?b.parallel?.left||[]:[], right: keep==='B'?b.parallel?.right||[]:[] } } : b));
    };
    // Mutating
    const onMutCreate = (e: any) => {
      const { title } = e?.detail || {};
      const label = suggestLabel({ name: title || 'Mutable' });
      const finalTitle = label.label || title || 'Mutable';
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, mutating: [{ id:`m_${Date.now()}`, title: finalTitle, versions:['v1'], type:'generic' }, ...b.mutating] } : b));
    };
    const onMutEvolve = (e: any) => {
      const { id, toType } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, mutating: b.mutating.map(m => m.id===id?{...m, type: toType||m.type, versions:[...m.versions, `v${m.versions.length+1}`]}:m) } : b));
    };
    const onMutCompare = (e: any) => {
      // no-op: UI shows versions; state already holds versions list
    };
    // Graph
    const onGraphAddNode = (e: any) => {
      const { id, label } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, graph: { ...b.graph, nodes: [...b.graph.nodes, { id: id||`n_${Date.now()}`, label: label||'Node' }] } } : b));
    };
    const onGraphAddEdge = (e: any) => {
      const { from, to } = e?.detail || {};
      setBoards(prev => prev.map(b => b.id===activeBoard ? { ...b, graph: { ...b.graph, edges: [...b.graph.edges, { from, to }] } } : b));
    };
    const onGraphLayout = () => {};
    const onGraphFocus = () => {};
    const onGraphExport = () => {};
    // Charts: allow direct creation with provided series OR images/visual content
    const onChartCreate = (e: any) => {
      const { title, type = 'line', series, imageUrl, metadata } = e?.detail || {};
      
      console.log('🎯 Scribbleboard onChartCreate received:', { title, type, series, imageUrl, metadata });
      
      // Handle images and visual content (from Einstein portraits, diagrams, etc.)
      if (imageUrl || type === 'image') {
        setBoards(prev => prev.map(b => b.id===activeBoard ? {
          ...b,
          charts: [{ 
            id: `chart_${Date.now()}`, 
            title: title || 'Visual Content',
            type: 'image',
            imageUrl: imageUrl,
            metadata: metadata,
            series: [] // Empty series for images
          }, ...(b.charts || [])]
        } : b));
        return;
      }
      
      // Handle charts with data series
      if (series && Array.isArray(series) && series.length > 0) {
        setBoards(prev => prev.map(b => b.id===activeBoard ? {
          ...b,
          charts: [{ id: `chart_${Date.now()}`, title, type, series }, ...(b.charts || [])]
        } : b));
        return;
      }
      
      // Handle empty charts (for scenarios like "education 3D")
      if (type && title) {
        setBoards(prev => prev.map(b => b.id===activeBoard ? {
          ...b,
          charts: [{ 
            id: `chart_${Date.now()}`, 
            title, 
            type, 
            series: [], // Will be populated by scenario data
            scenario: e?.detail?.scenario
          }, ...(b.charts || [])]
        } : b));
      }
    };

    window.addEventListener('scribble_open', onOpen as EventListener);
    window.addEventListener('scribble_hypothesis_test', onOpenTest as EventListener);
    window.addEventListener('scribble_hypothesis_result', onSetResult as EventListener);
    window.addEventListener('scribble_autoagent_toggle', onAutoAgentToggle as EventListener);
    window.addEventListener('scribble_autoagent_suggest', onAutoAgentSuggest as EventListener);
    window.addEventListener('scribble_parallel_thought', onParallelThought as EventListener);
    window.addEventListener('scribble_board_new', onBoardNew as EventListener);
    window.addEventListener('scribble_board_switch', onBoardSwitch as EventListener);
    window.addEventListener('scribble_board_rename', onBoardRename as EventListener);
    window.addEventListener('scribble_board_delete', onBoardDelete as EventListener);
    window.addEventListener('scribble_add_note', onAddNote as EventListener);
    window.addEventListener('scribble_hypothesis_branch_combine', onCombine as EventListener);
    window.addEventListener('scribble_hypothesis_branch_prune', onPrune as EventListener);
    window.addEventListener('scribble_mutating_create', onMutCreate as EventListener);
    window.addEventListener('scribble_mutating_evolve', onMutEvolve as EventListener);
    window.addEventListener('scribble_mutating_compare', onMutCompare as EventListener);
    window.addEventListener('scribble_graph_add_node', onGraphAddNode as EventListener);
    window.addEventListener('scribble_graph_add_edge', onGraphAddEdge as EventListener);
    window.addEventListener('scribble_graph_layout', onGraphLayout as EventListener);
    window.addEventListener('scribble_graph_focus', onGraphFocus as EventListener);
    window.addEventListener('scribble_graph_export', onGraphExport as EventListener);
    window.addEventListener('scribble_chart_create', onChartCreate as EventListener);
    
    // Clear all event handler
    const onClearAll = (e: any) => {
      console.log('🧹 Clearing ALL scribbleboard content');
      setBoards([{
        id: '1',
        name: 'Main Board',
        mode: 'fullscreen',
        version: 1,
        hypotheses: [],
        suggestions: [],
        parallel: null,
        mutating: [],
        graph: { nodes: [], edges: [] },
        charts: [],
        insights: [],
        evolution: [],
        scenarios: []
      }]);
      setActiveBoardIndex(0);
    };
    window.addEventListener('scribble_clear_all', onClearAll as EventListener);
    
    return () => {
      window.removeEventListener('scribble_open', onOpen as EventListener);
      window.removeEventListener('scribble_hypothesis_test', onOpenTest as EventListener);
      window.removeEventListener('scribble_hypothesis_result', onSetResult as EventListener);
      window.removeEventListener('scribble_autoagent_toggle', onAutoAgentToggle as EventListener);
      window.removeEventListener('scribble_autoagent_suggest', onAutoAgentSuggest as EventListener);
      window.removeEventListener('scribble_parallel_thought', onParallelThought as EventListener);
      window.removeEventListener('scribble_board_new', onBoardNew as EventListener);
      window.removeEventListener('scribble_board_switch', onBoardSwitch as EventListener);
      window.removeEventListener('scribble_board_rename', onBoardRename as EventListener);
      window.removeEventListener('scribble_board_delete', onBoardDelete as EventListener);
      window.removeEventListener('scribble_add_note', onAddNote as EventListener);
      window.removeEventListener('scribble_hypothesis_branch_combine', onCombine as EventListener);
      window.removeEventListener('scribble_hypothesis_branch_prune', onPrune as EventListener);
      window.removeEventListener('scribble_mutating_create', onMutCreate as EventListener);
      window.removeEventListener('scribble_mutating_evolve', onMutEvolve as EventListener);
      window.removeEventListener('scribble_mutating_compare', onMutCompare as EventListener);
      window.removeEventListener('scribble_graph_add_node', onGraphAddNode as EventListener);
      window.removeEventListener('scribble_graph_add_edge', onGraphAddEdge as EventListener);
      window.removeEventListener('scribble_graph_layout', onGraphLayout as EventListener);
      window.removeEventListener('scribble_graph_focus', onGraphFocus as EventListener);
      window.removeEventListener('scribble_graph_export', onGraphExport as EventListener);
      window.removeEventListener('scribble_chart_create', onChartCreate as EventListener);
      window.removeEventListener('scribble_clear_all', onClearAll as EventListener);
    };
  }, [autoAgentEnabled, mode, activeBoard, boards.length]);

  const isCompact = mode === 'compact';
  const board = boards.find(b => b.id === activeBoard)!;
  const containerClass = useMemo(() => (isCompact ? 'p-3 space-y-3' : 'p-6 space-y-4'), [isCompact]);

  const downloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(boards.find(b=>b.id===activeBoard), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(boards.find(b=>b.id===activeBoard)?.name || 'board').replace(/\s+/g,'_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const content = (
    <div className={`${containerClass} max-w-none`}> 
      {/* AutoAgent Toggle */}
      <div className={`flex items-center justify-between ${isCompact ? 'text-xs' : 'text-sm'} text-gray-700`}>
        <div className="font-medium">🤖 AutoAgent</div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span>{autoAgentEnabled ? 'Enabled' : 'Disabled'}</span>
          <input
            type="checkbox"
            checked={autoAgentEnabled}
            onChange={(e) => setAutoAgentEnabled(e.target.checked)}
          />
        </label>
      </div>

      {/* Boards Switcher */}
      <div className={`flex items-center gap-2 ${isCompact?'text-xs':'text-sm'} text-gray-700`}>
        <select className="px-2 py-1 rounded border border-gray-300" value={activeBoard} onChange={(e)=>setActiveBoard(e.target.value)}>
          {boards.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={()=>window.dispatchEvent(new CustomEvent('scribble_board_new',{detail:{}}))}>New</button>
        <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={()=>{
          const name = prompt('Board name?', board.name) || board.name; window.dispatchEvent(new CustomEvent('scribble_board_rename',{detail:{id:activeBoard,name}}));
        }}>Rename</button>
        {!isCompact && <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={()=>window.dispatchEvent(new CustomEvent('scribble_board_delete',{detail:{id:activeBoard}}))}>Delete</button>}
        <button className="ml-auto px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={downloadJSON}>Export JSON</button>
      </div>

      {/* Suggestions */}
      {board.suggestions.length > 0 && (
        <AnimatePresence>
          <motion.div className="grid grid-cols-1 gap-2" initial="hidden" animate="visible" exit="exit"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } }, exit: {} }}>
            {board.suggestions.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <SuggestionCard text={s} mode={mode} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Parallel Thought */}
      {board.parallel ? (
        <motion.div className={`grid ${isCompact ? 'grid-cols-1' : 'grid-cols-2'} gap-3`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="space-y-2">
            {board.parallel.left.map((p, i) => (
              <motion.div key={`pl_${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                <SuggestionCard text={`A: ${p}`} mode={mode} />
              </motion.div>
            ))}
            {!isCompact && <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={()=>window.dispatchEvent(new CustomEvent('scribble_hypothesis_branch_prune',{detail:{keep:'A'}}))}>Keep A</button>}
          </div>
          {!isCompact && (
            <div className="space-y-2">
              {board.parallel.right.map((p, i) => (
                <motion.div key={`pr_${i}`} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                  <SuggestionCard text={`B: ${p}`} mode={mode} />
                </motion.div>
              ))}
               <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={()=>window.dispatchEvent(new CustomEvent('scribble_hypothesis_branch_prune',{detail:{keep:'B'}}))}>Keep B</button>
            </div>
          )}
          {!isCompact && <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={()=>window.dispatchEvent(new CustomEvent('scribble_hypothesis_branch_combine',{detail:{id: (board.hypotheses[0]?.id)}}))}>Combine</button>}
        </motion.div>
      ) : null}

      {/* Hypothesis Cards */}
      <div className="grid grid-cols-1 gap-2">
        <AnimatePresence>
          {board.hypotheses.map(h => (
            <motion.div key={h.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <HypothesisCard prompt={h.prompt} mode={mode} result={h.result} />
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Mutating node versions panel (compact summary) */}
        {board.mutating.length > 0 && !isCompact && (
          <motion.div className="p-3 border rounded bg-white border-gray-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-sm font-semibold mb-2">🧬 Mutating Nodes</div>
            <div className="space-y-1 text-xs">
              {board.mutating.map(m => (
                <motion.div key={m.id} className="flex items-center justify-between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="truncate mr-2">{m.title} <span className="opacity-60">(v{m.versions.length})</span></div>
                  <div className="flex gap-2">
                    <button className="px-2 py-0.5 border rounded border-gray-300 hover:bg-gray-50" onClick={()=>window.dispatchEvent(new CustomEvent('scribble_mutating_compare',{ detail: { id: m.id, versionIndex: 0 } }))}>Compare</button>
                    <button className="px-2 py-0.5 border rounded border-gray-300 hover:bg-gray-50" onClick={()=>window.dispatchEvent(new CustomEvent('scribble_mutating_evolve',{ detail: { id: m.id } }))}>Evolve</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* Render any explicitly created charts */}
        {(board.charts || []).map(c => (
          <motion.div key={c.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <ChartCard 
              title={c.title} 
              type={c.type} 
              series={c.series || []} 
              compact={mode==='compact'}
              imageUrl={c.imageUrl}
              metadata={c.metadata}
              scenario={c.scenario}
            />
          </motion.div>
        ))}
        {/* Example: if graph contains a series node, render it */}
        {board.graph.nodes.filter(n=>n.label?.startsWith('chart:')).map((n,i)=>{
          const label = n.label.replace('chart:','');
          const series = [{ name: label, data: Array.from({length:11}).map((_,k)=>({x:k-5,y: Math.pow((k-5)+1,2)}))}];
          return <ChartCard key={`c_${i}`} title={`Chart: ${label}`} type="line" series={series} compact={mode==='compact'} />
        })}
      </div>
    </div>
  );

  if (isCompact) return content;

  return (
    <div className="w-full h-full overflow-auto">{content}</div>
  );
};

export default Scribbleboard;

