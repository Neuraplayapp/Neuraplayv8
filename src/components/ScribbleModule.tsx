// ScribbleModule - Interactive Canvas for Project Plans, Mind Maps, Charts & Roadmaps
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Save, Download, Share, Trash2, Move, Type, Image as ImageIcon, BarChart3, GitBranch, Calendar, Target, Lightbulb, ZoomIn, ZoomOut, Grid as GridIcon, Copy, Wand2 } from 'lucide-react';
import aiService from '../services/AIService';
import { pluginRegistry } from '../plugins';
import type { CanvasObject, CanvasPlugin } from '../plugins/PluginInterface';
import { create } from 'zustand';
import Konva from 'konva';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'chart' | 'roadmap' | 'mindmap' | 'sticky' | 'connector';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    fontWeight: string;
    borderColor: string;
    borderWidth: number;
  };
  data?: any; // For charts, roadmaps, etc.
  connections?: string[]; // Connected element IDs
}

// Lightweight Zustand store for canvas-level actions and selection
type CanvasStore = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addObject: (obj: CanvasObject) => void;
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  addObject: () => {},
}));

interface ScribbleModuleProps {
  isOpen: boolean;
  onClose: () => void;
  theme: { isDarkMode: boolean };
  importItems?: Array<{ type: 'image' | 'chart' | 'text'; title?: string; content: string; metadata?: any }>;
  template?: string | null;
}

const ScribbleModule: React.FC<ScribbleModuleProps> = ({ isOpen, onClose, theme, importItems = [], template = null }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'text' | 'sticky' | 'chart' | 'roadmap' | 'mindmap'>('select');
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMode, setGenMode] = useState<'directive' | 'block' | 'notes' | 'roadmap' | 'gantt' | 'wbs' | 'task_strip' | 'risk_wbs' | 'mini_risk' | 'raci'>('directive');
  const [zoom, setZoom] = useState(1);

  // Import items dropped from chat (supports text/chart/image AND pluginId types)
  useEffect(() => {
    if (importItems && importItems.length > 0 && canvasRef.current) {
      const baseX = 60 + Math.random() * 60;
      const baseY = 80 + Math.random() * 60;
      let offset = 0;
      importItems.forEach((item) => {
        const id = `import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const isPlugin = !!pluginRegistry.find(p => p.id === item.type);
        const pos = (item.metadata && item.metadata.position) ? item.metadata.position : null;
        const resolvedType: CanvasElement['type'] = isPlugin
          ? (item.type as CanvasElement['type'])
          : item.type === 'text'
            ? 'text'
            : item.type === 'chart'
              ? 'chart'
              : 'image';

        const element: CanvasElement = {
          id,
          // If a plugin id was provided, store it in type so plugin renderer picks it up
          type: resolvedType,
          x: (pos?.x ?? (baseX + offset)),
          y: (pos?.y ?? (baseY + offset)),
          width: item.type === 'text' || isPlugin ? 260 : 220,
          height: item.type === 'text' || isPlugin ? 100 : 160,
          content: item.content || (isPlugin ? (pluginRegistry.find(p => p.id === item.type)?.createObject().content ?? '') : ''),
          style: {
            backgroundColor: item.type === 'text' || isPlugin ? (theme.isDarkMode ? '#111827' : '#ffffff') : 'transparent',
            textColor: theme.isDarkMode ? '#ffffff' : '#111827',
            fontSize: 14,
            fontWeight: 'normal',
            borderColor: item.type === 'text' || isPlugin ? (theme.isDarkMode ? '#111827' : '#e5e7eb') : 'transparent',
            borderWidth: 1
          },
          data: item.metadata || {},
          connections: []
        };
        setElements(prev => [...prev, element]);
        offset += 28;
      });
    }
  }, [importItems, theme.isDarkMode]);

  // Canvas tool event listeners (simulate, rewrite, connect)
  useEffect(() => {
    if (!isOpen) return;

    const onSimulate = (e: any) => {
      const { pluginId, prompt } = e.detail || {};
      // Find a matching plugin element
      const el = elements.find(el => el.type === pluginId);
      if (!el) return;
      // Try plugin simulateAgent then add a note/log
      const plugin = pluginRegistry.find(p => p.id === pluginId);
      const outputs = plugin?.simulateAgent ? plugin.simulateAgent({ state: { elements }, prompt }) : [];
      const summary = outputs && outputs.length ? outputs.map(o => `• ${o.output}${o.nextAction ? ` → ${o.nextAction}` : ''}`).join('\n') : 'Simulation run.';
      const id = `sim_${Date.now()}`;
      const note: CanvasElement = {
        id,
        type: 'sticky',
        x: el.x + (el.width + 20),
        y: el.y,
        width: 200,
        height: 120,
        content: summary,
        style: { backgroundColor: theme.isDarkMode ? '#1f2937' : '#fef3c7', textColor: theme.isDarkMode ? '#fff' : '#111827', fontSize: 12, fontWeight: 'normal', borderColor: 'transparent', borderWidth: 1 },
        connections: []
      } as CanvasElement;
      setElements(prev => [...prev, note, { ...el, connections: [...(el.connections || []), id] }]);
    };

    const onRewrite = (e: any) => {
      // Simple layout pass: grid items neatly
      const padding = 40;
      const colWidth = 300;
      setElements(prev => prev.map((el, i) => ({
        ...el,
        x: padding + (i % 3) * (colWidth + padding),
        y: padding + Math.floor(i / 3) * (el.height + padding)
      })) as CanvasElement[]);
    };

    const onConnect = (e: any) => {
      const { fromId, toId } = e.detail || {};
      if (!fromId || !toId) return;
      setElements(prev => prev.map(el => el.id === fromId ? { ...el, connections: [...(el.connections || []), toId] } : el));
    };

    const onEditText = (e: any) => {
      const { insert, erase, replace } = e.detail || {};
      if (!selectedElement) return;
      setElements(prev => prev.map(el => {
        if (el.id !== selectedElement) return el;
        let content = el.content || '';
        if (erase) content = content.split(erase).join('');
        if (replace?.target) content = content.split(replace.target).join(replace.with || '');
        if (insert) content = content + (content ? '\n' : '') + insert;
        return { ...el, content };
      }));
    };

    window.addEventListener('canvasSimulateAgent', onSimulate as EventListener);
    window.addEventListener('canvasRewriteLayout', onRewrite as EventListener);
    window.addEventListener('canvasConnectNodes', onConnect as EventListener);
    window.addEventListener('canvasEditText', onEditText as EventListener);
    return () => {
      window.removeEventListener('canvasSimulateAgent', onSimulate as EventListener);
      window.removeEventListener('canvasRewriteLayout', onRewrite as EventListener);
      window.removeEventListener('canvasConnectNodes', onConnect as EventListener);
      window.removeEventListener('canvasEditText', onEditText as EventListener);
    };
  }, [isOpen, elements, theme.isDarkMode, selectedElement]);

  // Predefined Templates
  const templates = {
    projectPlan: {
      name: '📋 Project Plan',
      elements: [
        { type: 'text', content: '🎯 PROJECT OVERVIEW', x: 50, y: 50, style: { fontSize: 24, fontWeight: 'bold' }},
        { type: 'sticky', content: 'Goals & Objectives', x: 50, y: 120, style: { backgroundColor: '#fef3c7' }},
        { type: 'sticky', content: 'Timeline & Milestones', x: 250, y: 120, style: { backgroundColor: '#dbeafe' }},
        { type: 'sticky', content: 'Resources & Team', x: 450, y: 120, style: { backgroundColor: '#dcfce7' }},
        { type: 'roadmap', content: 'Project Timeline', x: 50, y: 250, data: { phases: ['Planning', 'Development', 'Testing', 'Launch'] }}
      ]
    },
    mindMap: {
      name: '🧠 Mind Map',
      elements: [
        { type: 'mindmap', content: 'Central Idea', x: 300, y: 200, style: { backgroundColor: '#fbbf24', fontSize: 18 }},
        { type: 'sticky', content: 'Branch 1', x: 150, y: 100, style: { backgroundColor: '#60a5fa' }},
        { type: 'sticky', content: 'Branch 2', x: 450, y: 100, style: { backgroundColor: '#34d399' }},
        { type: 'sticky', content: 'Branch 3', x: 150, y: 300, style: { backgroundColor: '#f87171' }},
        { type: 'sticky', content: 'Branch 4', x: 450, y: 300, style: { backgroundColor: '#a78bfa' }}
      ]
    },
    chartDashboard: {
      name: '📊 Chart Dashboard',
      elements: [
        { type: 'text', content: '📈 DATA VISUALIZATION', x: 50, y: 50, style: { fontSize: 24, fontWeight: 'bold' }},
        { type: 'chart', content: 'Sales Trends', x: 50, y: 120, data: { type: 'line', data: [10, 20, 15, 25, 30] }},
        { type: 'chart', content: 'Market Share', x: 350, y: 120, data: { type: 'pie', data: [40, 30, 20, 10] }},
        { type: 'sticky', content: '💡 Key Insights', x: 50, y: 350, style: { backgroundColor: '#fef3c7' }}
      ]
    }
  };

  // Quick-add from plugin registry
  const addFromPlugin = (pluginId: string) => {
    const plugin = pluginRegistry.find(p => p.id === pluginId);
    if (!plugin) return;
    const obj = plugin.createObject();
    const id = `${plugin.id}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const newElement: CanvasElement = {
      id,
      type: obj.type as any,
      x: obj.position.x,
      y: obj.position.y,
      width: obj.size.width,
      height: obj.size.height,
      content: obj.content,
      style: {
        backgroundColor: theme.isDarkMode ? '#0b1220' : '#ffffff',
        textColor: theme.isDarkMode ? '#ffffff' : '#111827',
        fontSize: 14,
        fontWeight: 'normal',
        borderColor: theme.isDarkMode ? '#0b1220' : '#e5e7eb',
        borderWidth: 1,
      },
      connections: [],
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(id);
  };

  // AI generation helpers
  const parseAIResponseToText = (result: any): string => {
    try {
      if (Array.isArray(result)) {
        const first = result[0];
        if (!first) return '';
        return first.generated_text || first.text || first.response || first.message || '';
      }
      if (typeof result === 'string') return result;
      if (result && typeof result === 'object') {
        return result.generated_text || result.text || result.response || result.message || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  const addGeneratedContentToCanvas = (text: string) => {
    if (!text.trim()) return;
    const centerX = 120 + Math.random() * 60;
    const centerY = 100 + Math.random() * 60;

    if (genMode === 'directive' || genMode === 'block') {
      const id = `gen_${Date.now()}`;
      const element: CanvasElement = {
        id,
        type: 'text',
        x: centerX,
        y: centerY,
        width: 560,
        height: 320,
        content: text,
        style: {
          backgroundColor: theme.isDarkMode ? '#0b1220' : '#ffffff',
          textColor: theme.isDarkMode ? '#ffffff' : '#111827',
          fontSize: 14,
          fontWeight: 'normal',
          borderColor: theme.isDarkMode ? '#0b1220' : '#ffffff',
          borderWidth: 1
        },
        connections: []
      };
      setElements(prev => [...prev, element]);
      setSelectedElement(id);
      return;
    }

    if (genMode === 'notes') {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let offset = 0;
      lines.forEach((line, idx) => {
        // Skip headings if prefixed with #
        const content = line.replace(/^#+\s*/, '').replace(/^[-•]\s*/, '');
        const element: CanvasElement = {
          id: `note_${Date.now()}_${idx}`,
          type: 'sticky',
          x: centerX + (offset % 3) * 180,
          y: centerY + Math.floor(offset / 3) * 120,
          width: 160,
          height: 90,
          content,
          style: {
            backgroundColor: theme.isDarkMode ? '#1f2937' : '#fef3c7',
            textColor: theme.isDarkMode ? '#ffffff' : '#111827',
            fontSize: 13,
            fontWeight: 'normal',
            borderColor: theme.isDarkMode ? '#1f2937' : '#fef3c7',
            borderWidth: 1
          },
          connections: []
        };
        setElements(prev => [...prev, element]);
        offset++;
      });
      return;
    }

    if (genMode === 'roadmap') {
      const phases = text.split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => l.replace(/^\d+\.|^-\s*|•\s*/, ''))
        .slice(0, 8);
      const element: CanvasElement = {
        id: `road_${Date.now()}`,
        type: 'roadmap',
        x: centerX,
        y: centerY,
        width: 520,
        height: 80,
        content: 'Generated Roadmap',
        style: {
          backgroundColor: theme.isDarkMode ? '#374151' : '#f9fafb',
          textColor: theme.isDarkMode ? '#ffffff' : '#111827',
          fontSize: 14,
          fontWeight: 'normal',
          borderColor: theme.isDarkMode ? '#374151' : '#f9fafb',
          borderWidth: 2
        },
        data: { phases: phases.length ? phases : ['Phase 1', 'Phase 2', 'Phase 3'] },
        connections: []
      };
      setElements(prev => [...prev, element]);
      setSelectedElement(element.id);
      return;
    }

    if (genMode === 'gantt') {
      // Expect lines like: Task | start_week | end_week
      const tasks = text.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        const parts = l.split('|').map(p => p.trim());
        return { name: parts[0], start: Number(parts[1]) || 1, end: Number(parts[2]) || (Number(parts[1]) || 1) };
      }).slice(0, 10);
      const rowHeight = 32;
      const unitWidth = 28;
      const baseY = centerY;
      tasks.forEach((t, i) => {
        const duration = Math.max(1, t.end - t.start + 1);
        const el: CanvasElement = {
          id: `gantt_${Date.now()}_${i}`,
          type: 'text',
          x: centerX + (t.start - 1) * unitWidth,
          y: baseY + i * (rowHeight + 12),
          width: duration * unitWidth,
          height: rowHeight,
          content: t.name,
          style: {
            backgroundColor: theme.isDarkMode ? '#1e40af' : '#bfdbfe',
            textColor: theme.isDarkMode ? '#e0e7ff' : '#1e3a8a',
            fontSize: 12,
            fontWeight: 'normal',
            borderColor: theme.isDarkMode ? '#1e40af' : '#bfdbfe',
            borderWidth: 1
          },
          connections: []
        };
        setElements(prev => [...prev, el]);
      });
      return;
    }

    if (genMode === 'wbs') {
      // Expect hierarchical lines with '-' indent levels
      const lines = text.split('\n').map(l => l.replace(/\t/g, '  '));
      const nodes: Array<{ level: number; text: string }> = lines
        .map(l => ({ level: (l.match(/^\s*/)?.[0].length || 0) / 2, text: l.replace(/^\s*[-•]?\s*/, '') }))
        .filter(n => n.text.trim().length > 0);
      let x = centerX, y = centerY;
      const levelX = (lvl: number) => x + lvl * 200;
      nodes.forEach((n, idx) => {
        const nodeId = `wbs_${Date.now()}_${idx}`;
        const el: CanvasElement = {
          id: nodeId,
          type: 'mindmap',
          x: levelX(n.level),
          y: y + idx * 120,
          width: 120,
          height: 120,
          content: n.text,
          style: { backgroundColor: '#fbbf24', textColor: '#111827', fontSize: 14, fontWeight: 'bold', borderColor: '#fbbf24', borderWidth: 1 },
          connections: []
        };
        setElements(prev => [...prev, el]);
        // Connect to previous of level-1 if possible
        if (n.level > 0) {
          for (let j = idx - 1; j >= 0; j--) {
            const prevNode = nodes[j];
            if (prevNode.level === n.level - 1) {
              const parentId = `wbs_${Date.now()}_${j}`; // approximate id reference scope
              // Since ids differ due to Date.now, skip hard connection; rely on manual linking later
              break;
            }
          }
        }
      });
      return;
    }

    if (genMode === 'task_strip') {
      const tasks = text.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.replace(/^[-•]\s*/, ''));
      const stripY = centerY;
      let currentX = centerX;
      tasks.forEach((name, i) => {
        const width = Math.max(80, Math.min(220, name.length * 8));
        const el: CanvasElement = {
          id: `strip_${Date.now()}_${i}`,
          type: 'text',
          x: currentX,
          y: stripY,
          width,
          height: 36,
          content: name,
          style: {
            backgroundColor: theme.isDarkMode ? '#065f46' : '#d1fae5',
            textColor: theme.isDarkMode ? '#d1fae5' : '#065f46',
            fontSize: 12,
            fontWeight: 'normal',
            borderColor: theme.isDarkMode ? '#065f46' : '#d1fae5',
            borderWidth: 1
          },
          connections: []
        };
        setElements(prev => [...prev, el]);
        currentX += width + 16;
      });
      return;
    }

    if (genMode === 'risk_wbs' || genMode === 'mini_risk') {
      // Expect lines like: Risk name | P:0.2 | I:3
      const risks = text.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        const m = l.match(/^(.*?)\s*\|\s*P\s*:?\s*(\d*\.?\d+)\s*\|\s*I\s*:?\s*(\d*\.?\d+)/i);
        if (m) return { name: m[1].trim(), p: parseFloat(m[2]), i: parseFloat(m[3]) };
        return { name: l, p: Math.random(), i: 1 + Math.floor(Math.random() * 5) };
      });
      const scores = risks.map(r => r.p * r.i);
      const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      const header: CanvasElement = {
        id: `risk_header_${Date.now()}`,
        type: 'text',
        x: centerX,
        y: centerY,
        width: 520,
        height: 60,
        content: `Average Risk Score: ${avg.toFixed(2)}\nItems: ${risks.length}`,
        style: { backgroundColor: theme.isDarkMode ? '#111827' : '#ffffff', textColor: theme.isDarkMode ? '#f9fafb' : '#111827', fontSize: 14, fontWeight: 'bold', borderColor: theme.isDarkMode ? '#111827' : '#ffffff', borderWidth: 1 },
        connections: []
      };
      setElements(prev => [...prev, header]);
      risks.forEach((r, idx) => {
        const score = r.p * r.i;
        const bg = score > 3 ? (theme.isDarkMode ? '#7f1d1d' : '#fee2e2') : score > 1.5 ? (theme.isDarkMode ? '#78350f' : '#fef3c7') : (theme.isDarkMode ? '#065f46' : '#d1fae5');
        const fg = score > 3 ? (theme.isDarkMode ? '#fee2e2' : '#7f1d1d') : score > 1.5 ? (theme.isDarkMode ? '#fef3c7' : '#78350f') : (theme.isDarkMode ? '#d1fae5' : '#065f46');
        const el: CanvasElement = {
          id: `risk_${Date.now()}_${idx}`,
          type: 'sticky',
          x: centerX + (idx % 3) * 180,
          y: centerY + 80 + Math.floor(idx / 3) * 120,
          width: 160,
          height: 90,
          content: `${r.name}\nP:${r.p} I:${r.i} S:${score.toFixed(2)}`,
          style: { backgroundColor: bg, textColor: fg, fontSize: 12, fontWeight: 'normal', borderColor: bg, borderWidth: 1 },
          connections: []
        };
        setElements(prev => [...prev, el]);
      });
      return;
    }

    if (genMode === 'raci') {
      // Expect matrix lines: Task | R | A | C | I (comma-separated names allowed)
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const header = 'Task | R | A | C | I\n' + '-'.repeat(32);
      const rows = lines.map(l => l.replace(/\s*\|\s*/g, ' | ')).join('\n');
      const content = `${header}\n${rows}`;
      const el: CanvasElement = {
        id: `raci_${Date.now()}`,
        type: 'text',
        x: centerX,
        y: centerY,
        width: 560,
        height: 240,
        content,
        style: { backgroundColor: theme.isDarkMode ? '#0b1220' : '#ffffff', textColor: theme.isDarkMode ? '#ffffff' : '#111827', fontSize: 12, fontWeight: 'normal', borderColor: theme.isDarkMode ? '#0b1220' : '#ffffff', borderWidth: 1 },
        connections: []
      };
      setElements(prev => [...prev, el]);
      setSelectedElement(el.id);
      return;
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsGenerating(true);
      // If a plugin with handleAI is selected, try it first
      if (selectedElement) {
        const el = elements.find(e => e.id === selectedElement);
        const plugin = el && pluginRegistry.find(p => p.id === el.type);
        if (el && plugin && plugin.handleAI) {
          const res = plugin.handleAI({ prompt: aiPrompt, object: {
            id: el.id,
            type: el.type,
            position: { x: el.x, y: el.y },
            size: { width: el.width, height: el.height },
            content: el.content,
          }});
          if (res?.updatedContent) {
            setElements(prev => prev.map(e => e.id === el.id ? { ...e, content: res.updatedContent! } : e));
            setIsGenerating(false);
            return;
          }
        }
      }
      const context = { currentPage: window.location.pathname };
      // Mode-specific instruction to produce parseable output
      const instructionsMap: Record<string, string> = {
        directive: 'Produce a clear project directive document as structured bullet points and short sections. No code blocks.',
        block: 'Provide a concise, structured text block suitable for a canvas note. No code blocks.',
        notes: 'Output 8-12 short bullet points (one per line) with no numbering, each a concise actionable note.',
        roadmap: 'Output 4-8 phases, each on its own line with a short phase name. No numbering.',
        gantt: 'Output tasks one per line in the format: Task Name | start_week_number | end_week_number. Weeks are integers starting from 1.',
        wbs: 'Output a hierarchical work breakdown structure with indentation using two spaces per level and a leading dash. Example: "- Level 1\n  - Level 2\n    - Level 3".',
        task_strip: 'Output an ordered list of 5-12 tasks, one per line with no numbering or bullets, each a concise phrase.',
        risk_wbs: 'Output risks one per line in the format: Risk Name | P:probability(0-1) | I:impact(1-5).',
        mini_risk: 'Output risks one per line in the format: Risk Name | P:probability(0-1) | I:impact(1-5).',
        raci: 'Output lines with: Task | R | A | C | I (comma-separated names for each role allowed). No header.'
      };
      const modeInstruction = instructionsMap[genMode] || '';
      const prompt = `${aiPrompt}\n\nFormat strictly as instructed: ${modeInstruction}`;
      const result = await aiService.sendMessage(prompt, context, false);
      const text = parseAIResponseToText(result);
      addGeneratedContentToCanvas(text || '');
    } catch (e) {
      // optional: surface error later
    } finally {
      setIsGenerating(false);
    }
  };

  // Create new element
  const createElement = useCallback((type: CanvasElement['type'], x: number, y: number) => {
    const newElement: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      x,
      y,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 40 : 100,
      content: type === 'text' ? 'New Text' : type === 'sticky' ? 'New Note' : `New ${type}`,
      style: {
        backgroundColor: type === 'sticky' ? (theme.isDarkMode ? '#1f2937' : '#fef3c7') : 'transparent',
        textColor: theme.isDarkMode ? '#ffffff' : '#000000',
        fontSize: 14,
        fontWeight: 'normal',
        borderColor: type === 'sticky' ? (theme.isDarkMode ? '#1f2937' : '#fef3c7') : 'transparent',
        borderWidth: 1
      },
      connections: []
    };

    if (type === 'chart') {
      newElement.data = { type: 'bar', data: [10, 20, 15, 25] };
    } else if (type === 'roadmap') {
      newElement.data = { phases: ['Phase 1', 'Phase 2', 'Phase 3'] };
    }

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    return newElement.id;
  }, [theme.isDarkMode]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && tool !== 'select') {
        const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
        createElement(tool as CanvasElement['type'], x, y);
        setTool('select');
      } else {
        setSelectedElement(null);
      }
    }
  }, [tool, createElement, canvasScale, canvasOffset]);

  // Handle element drag
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setDraggedElement(elementId);
      setSelectedElement(elementId);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / canvasScale - element.x,
          y: (e.clientY - rect.top) / canvasScale - element.y
        });
      }
    }
  }, [elements, canvasScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedElement) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        let x = (e.clientX - rect.left - canvasOffset.x) / canvasScale - dragOffset.x;
        let y = (e.clientY - rect.top - canvasOffset.y) / canvasScale - dragOffset.y;
        if (snapToGrid) {
          const grid = 10;
          x = Math.round(x / grid) * grid;
          y = Math.round(y / grid) * grid;
        }
        
        setElements(prev => prev.map(el => 
          el.id === draggedElement ? { ...el, x, y } : el
        ));
      }
    }
  }, [draggedElement, dragOffset, canvasScale, canvasOffset, snapToGrid]);

  const handleMouseUp = useCallback(() => {
    setDraggedElement(null);
  }, []);

  // Load template
  const loadTemplate = useCallback((templateKey: keyof typeof templates) => {
    const template = templates[templateKey];
    const newElements = template.elements.map((el, index) => ({
      ...el,
      id: `template_${Date.now()}_${index}`,
      width: el.type === 'text' ? 200 : 150,
      height: el.type === 'text' ? 40 : 100,
      style: {
        backgroundColor: el.style?.backgroundColor || 'transparent',
        textColor: theme.isDarkMode ? '#ffffff' : '#000000',
        fontSize: el.style?.fontSize || 14,
        fontWeight: el.style?.fontWeight || 'normal',
        borderColor: el.style?.backgroundColor || (theme.isDarkMode ? '#111827' : '#ffffff'),
        borderWidth: 1,
        ...el.style
      },
      connections: []
    })) as CanvasElement[];
    
    setElements(newElements);
    setSelectedElement(null);
  }, [theme.isDarkMode]);

  // Auto-load template if provided from outside
  useEffect(() => {
    if (template && templates[template as keyof typeof templates]) {
      loadTemplate(template as keyof typeof templates);
    }
  }, [template, loadTemplate]);

  // Render element based on type
  const renderElement = useCallback((element: CanvasElement) => {
    // If a plugin matches this element.type, render via plugin to enable extensibility
    const plugin: CanvasPlugin | undefined = pluginRegistry.find(p => p.id === element.type);
    if (plugin) {
      const canvasObj: CanvasObject = {
        id: element.id,
        type: element.type,
        position: { x: element.x, y: element.y },
        size: { width: element.width, height: element.height },
        content: element.content,
      };
      return plugin.render({
        object: canvasObj,
        update: (update) => {
          setElements(prev => prev.map(el => el.id === element.id ? {
            ...el,
            x: update.position?.x ?? el.x,
            y: update.position?.y ?? el.y,
            width: update.size?.width ?? el.width,
            height: update.size?.height ?? el.height,
            content: update.content ?? el.content,
          } : el));
        },
      });
    }
    const isSelected = selectedElement === element.id;
    const baseStyle = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      backgroundColor: element.style.backgroundColor,
      color: element.style.textColor,
      fontSize: element.style.fontSize,
      fontWeight: element.style.fontWeight,
      border: `${element.style.borderWidth}px solid ${isSelected ? (theme.isDarkMode ? '#2563eb' : '#3b82f6') : element.style.borderColor}`,
      borderRadius: element.type === 'sticky' ? '8px' : '4px',
      padding: '8px',
      cursor: 'move',
      userSelect: 'none' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: element.type === 'sticky' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      zIndex: isSelected ? 10 : 1,
      transition: 'all 0.2s ease'
    };

    const handleElementClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedElement(element.id);
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={baseStyle}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const value = (e.target as HTMLElement).innerText;
                setElements(prev => prev.map(el => el.id === element.id ? { ...el, content: value } : el));
              }}
              className="w-full h-full outline-none"
            >
              {element.content}
            </div>
          </div>
        );

      case 'sticky':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.style.backgroundColor || (theme.isDarkMode ? '#1f2937' : '#fef3c7'),
              transform: `rotate(${Math.random() * 6 - 3}deg) ${isSelected ? 'scale(1.02)' : 'scale(1)'}`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            <div
              className="text-center break-words w-full h-full outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const value = (e.target as HTMLElement).innerText;
                setElements(prev => prev.map(el => el.id === element.id ? { ...el, content: value } : el));
              }}
            >
              {element.content}
            </div>
          </div>
        );

      case 'image':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: theme.isDarkMode ? '#111827' : '#ffffff',
              border: `1px solid ${theme.isDarkMode ? '#111827' : '#ffffff'}`,
              borderRadius: '12px',
              padding: '6px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={element.content} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
          </div>
        );

      case 'chart':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: theme.isDarkMode ? '#1f2937' : '#ffffff',
              border: `2px solid ${isSelected ? (theme.isDarkMode ? '#2563eb' : '#3b82f6') : (theme.isDarkMode ? '#1f2937' : '#ffffff')}`,
              borderRadius: '12px',
              padding: '16px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            <div className="w-[520px] h-[360px]">
              <div className="text-xs mb-2 opacity-70">Interactive Graph</div>
              <div className="w-full h-full bg-white rounded-md overflow-hidden">
                {/* @ts-ignore - dynamic import only when used */}
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'></head><body><div id='root'></div><script crossorigin src='https://unpkg.com/react@18/umd/react.production.min.js'></script><script crossorigin src='https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'></script><script src='https://unpkg.com/recharts/umd/Recharts.min.js'></script><script>const {useState}=React;const {ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,BarChart,Bar,AreaChart,Area,ScatterChart,Scatter}=Recharts;function App(){const [chartType,setChartType]=React.useState('line');const [dataset,setDataset]=React.useState('sales');const datasets={sales:[{name:'Jan',value:4000,secondary:2400},{name:'Feb',value:3000,secondary:1398},{name:'Mar',value:2000,secondary:9800},{name:'Apr',value:2780,secondary:3908},{name:'May',value:1890,secondary:4800},{name:'Jun',value:2390,secondary:3800},{name:'Jul',value:3490,secondary:4300}],performance:[{name:'Q1',value:85,secondary:78},{name:'Q2',value:92,secondary:85},{name:'Q3',value:78,secondary:90},{name:'Q4',value:96,secondary:88}],growth:[{name:'2020',value:100,secondary:120},{name:'2021',value:120,secondary:140},{name:'2022',value:180,secondary:200},{name:'2023',value:250,secondary:280},{name:'2024',value:320,secondary:350}],scatter:[{x:100,y:200,z:200},{x:120,y:100,z:260},{x:170,y:300,z:400},{x:140,y:250,z:280},{x:150,y:400,z:500},{x:110,y:280,z:200}]};const labels={sales:{primary:'Revenue',secondary:'Profit',title:'Monthly Sales Data'},performance:{primary:'Team A',secondary:'Team B',title:'Quarterly Performance'},growth:{primary:'Company A',secondary:'Company B',title:'Annual Growth Comparison'},scatter:{primary:'Performance',secondary:'Efficiency',title:'Performance vs Efficiency'}};const data=datasets[dataset];const l=labels[dataset];const common={data:data,margin:{top:5,right:30,left:20,bottom:5}};const render=()=>{switch(chartType){case'line':return React.createElement(LineChart,common,React.createElement(CartesianGrid,{strokeDasharray:'3 3'}),React.createElement(XAxis,{dataKey:'name'}),React.createElement(YAxis,null),React.createElement(Tooltip,null),React.createElement(Legend,null),React.createElement(Line,{type:'monotone',dataKey:'value',stroke:'#2563eb',strokeWidth:3,name:l.primary,dot:{fill:'#2563eb',strokeWidth:2,r:6}}),dataset!=='scatter'&&React.createElement(Line,{type:'monotone',dataKey:'secondary',stroke:'#dc2626',strokeWidth:3,name:l.secondary,dot:{fill:'#dc2626',strokeWidth:2,r:6}}));case'bar':return React.createElement(BarChart,common,React.createElement(CartesianGrid,{strokeDasharray:'3 3'}),React.createElement(XAxis,{dataKey:'name'}),React.createElement(YAxis,null),React.createElement(Tooltip,null),React.createElement(Legend,null),React.createElement(Bar,{dataKey:'value',fill:'#2563eb',name:l.primary}),dataset!=='scatter'&&React.createElement(Bar,{dataKey:'secondary',fill:'#dc2626',name:l.secondary}));case'area':return React.createElement(AreaChart,common,React.createElement(CartesianGrid,{strokeDasharray:'3 3'}),React.createElement(XAxis,{dataKey:'name'}),React.createElement(YAxis,null),React.createElement(Tooltip,null),React.createElement(Legend,null),React.createElement(Area,{type:'monotone',dataKey:'value',stackId:'1',stroke:'#2563eb',fill:'#2563eb',fillOpacity:0.6,name:l.primary}),dataset!=='scatter'&&React.createElement(Area,{type:'monotone',dataKey:'secondary',stackId:'1',stroke:'#dc2626',fill:'#dc2626',fillOpacity:0.6,name:l.secondary}));case'scatter':return React.createElement(ScatterChart,common,React.createElement(CartesianGrid,{strokeDasharray:'3 3'}),React.createElement(XAxis,{dataKey:'x',type:'number'}),React.createElement(YAxis,{dataKey:'y',type:'number'}),React.createElement(Tooltip,{cursor:{strokeDasharray:'3 3'}}),React.createElement(Scatter,{name:'Data Points',data:datasets.scatter,fill:'#2563eb'}));default:return null;}};return React.createElement('div',{className:'w-full h-full p-2'},React.createElement('div',{className:'flex gap-2 mb-2'},React.createElement('select',{value:chartType,onChange:e=>setChartType(e.target.value),className:'px-2 py-1 border rounded'},React.createElement('option',{value:'line'},'Line'),React.createElement('option',{value:'bar'},'Bar'),React.createElement('option',{value:'area'},'Area'),React.createElement('option',{value:'scatter'},'Scatter')),React.createElement('select',{value:dataset,onChange:e=>setDataset(e.target.value),className:'px-2 py-1 border rounded'},React.createElement('option',{value:'sales'},'Sales'),React.createElement('option',{value:'performance'},'Performance'),React.createElement('option',{value:'growth'},'Growth'),chartType==='scatter'&&React.createElement('option',{value:'scatter'},'Scatter'))),React.createElement('div',{className:'w-full h-[300px]'},React.createElement('div',{id:'chart',style:{width:'100%',height:'100%'}},React.createElement(ResponsiveContainer,{width:'100%',height:'100%'},render()))));}
                ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));</script></body></html>`}
                  style={{ border: 'none', width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        );

      case 'roadmap':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              width: element.width || 300,
              height: element.height || 60,
              backgroundColor: theme.isDarkMode ? '#374151' : '#f9fafb',
              border: `2px solid ${isSelected ? (theme.isDarkMode ? '#2563eb' : '#3b82f6') : (theme.isDarkMode ? '#374151' : '#f9fafb')}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            {element.data?.phases?.map((phase: string, index: number) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <input
                  className="ml-2 text-xs font-medium bg-transparent border-b border-transparent focus:border-blue-400 outline-none"
                  defaultValue={phase}
                  onBlur={(e) => {
                    const value = e.target.value;
                    setElements(prev => prev.map(el => el.id === element.id ? { ...el, data: { ...el.data, phases: el.data.phases.map((p: string, i: number) => i === index ? value : p) } } : el));
                  }}
                />
                {index < element.data.phases.length - 1 && (
                  <div className="ml-4 w-6 h-0.5 bg-gray-400"></div>
                )}
                <button className="ml-2 text-gray-400 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setElements(prev => prev.map(el => el.id === element.id ? { ...el, data: { ...el.data, phases: el.data.phases.filter((_: any, i: number) => i !== index) } } : el)); }}>✕</button>
                <button className="ml-1 text-gray-400 hover:text-blue-400" onClick={(e) => { e.stopPropagation(); setElements(prev => prev.map(el => el.id === element.id ? { ...el, data: { ...el.data, phases: [...el.data.phases.slice(0, index + 1), 'New Phase', ...el.data.phases.slice(index + 1)] } } : el)); }}>＋</button>
              </div>
            )) || <div>Roadmap</div>}
          </div>
        );

      case 'mindmap':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.style.backgroundColor || '#fbbf24',
              borderRadius: '50%',
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center' as const,
              fontWeight: 'bold'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            <div className="text-sm outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => {
              const value = (e.target as HTMLElement).innerText;
              setElements(prev => prev.map(el => el.id === element.id ? { ...el, content: value } : el));
            }}>{element.content}</div>
            {/* Add child button */}
            <button
              className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                const childId = createElement('mindmap', element.x + 160, element.y);
                setElements(prev => prev.map(el => el.id === element.id ? { ...el, connections: [...(el.connections || []), childId] } : el));
              }}
            >
              +
            </button>
          </div>
        );

      default:
        return null;
    }
  }, [selectedElement, handleMouseDown, theme.isDarkMode]);

  // Duplicate and delete helpers
  const duplicateSelected = useCallback(() => {
    if (!selectedElement) return;
    setElements(prev => {
      const el = prev.find(e => e.id === selectedElement);
      if (!el) return prev;
      const copy: CanvasElement = { ...el, id: `copy_${Date.now()}`, x: el.x + 20, y: el.y + 20, connections: [] };
      return [...prev, copy];
    });
  }, [selectedElement]);

  const deleteSelected = useCallback(() => {
    if (!selectedElement) return;
    setElements(prev => prev.filter(e => e.id !== selectedElement).map(e => ({ ...e, connections: (e.connections || []).filter(id => id !== selectedElement) })));
    setSelectedElement(null);
  }, [selectedElement]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); }
      if (selectedElement && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = 5;
        setElements(prev => prev.map(el => el.id === selectedElement ? { ...el,
          y: el.y + (e.key === 'ArrowDown' ? delta : e.key === 'ArrowUp' ? -delta : 0),
          x: el.x + (e.key === 'ArrowRight' ? delta : e.key === 'ArrowLeft' ? -delta : 0)
        } : el));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, selectedElement, deleteSelected, duplicateSelected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`w-full h-full max-w-7xl max-h-[90vh] ${theme.isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-bold ${theme.isDarkMode ? 'text-white' : 'text-black'} flex items-center`}>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <Lightbulb size={18} className="text-white" />
              </div>
              ScribbleModule
            </h2>
            
            {/* Templates */}
            <div className="flex space-x-2">
              {Object.entries(templates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => loadTemplate(key as keyof typeof templates)}
                  className={`px-3 py-1 text-xs rounded-full border ${theme.isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} transition-all`}
                >
                  {template.name}
                </button>
              ))}
            </div>

            {/* AI Generate */}
            <div className="hidden md:flex items-center space-x-2 ml-2">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what to generate (e.g., project directives)"
                className={`px-3 py-1 text-xs rounded-md border outline-none w-72 ${theme.isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'}`}
              />
              <select
                value={genMode}
                onChange={(e) => setGenMode(e.target.value as any)}
                className={`px-2 py-1 text-xs rounded-md border ${theme.isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                <option value="block">Text Block</option>
                <option value="notes">Sticky Notes</option>
                <option value="roadmap">Roadmap</option>
              </select>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`px-3 py-1 text-xs rounded-md flex items-center space-x-1 ${theme.isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} disabled:opacity-60`}
              >
                <Wand2 size={14} />
                <span>{isGenerating ? 'Generating…' : 'Generate'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full ${theme.isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-black hover:bg-gray-100'} transition-all`}
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className={`flex items-center justify-between p-3 border-b ${theme.isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center space-x-2">
            {[
              { tool: 'select', icon: Move, label: 'Select' },
              { tool: 'text', icon: Type, label: 'Text' },
              { tool: 'sticky', icon: Plus, label: 'Sticky Note' },
              { tool: 'chart', icon: BarChart3, label: 'Chart' },
              { tool: 'roadmap', icon: Calendar, label: 'Roadmap' },
              { tool: 'mindmap', icon: GitBranch, label: 'Mind Map' }
            ].map(({ tool: toolName, icon: Icon, label }) => (
              <button
                key={toolName}
                onClick={() => setTool(toolName as any)}
                className={`p-2 rounded-lg flex items-center space-x-1 ${tool === toolName ? 'bg-blue-500 text-white' : theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}
              >
                <Icon size={16} />
                <span className="text-xs hidden md:block">{label}</span>
              </button>
            ))}
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`} onClick={() => setShowGrid(v => !v)}>
              <GridIcon size={16} />
            </button>
            {/* Plugins quick-add */}
            <div className="flex items-center space-x-1">
              {pluginRegistry.slice(0, 6).map(p => (
                <button
                  key={p.id}
                  onClick={() => addFromPlugin(p.id)}
                  className={`px-2 py-1 text-[10px] rounded border ${theme.isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  title={`Add ${p.label}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`} onClick={() => setSnapToGrid(v => !v)}>
              Snap
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`} onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
              <ZoomIn size={16} />
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`} onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut size={16} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}>
              <Save size={16} />
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}>
              <Download size={16} />
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}>
              <Share size={16} />
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`} onClick={duplicateSelected} disabled={!selectedElement}>
              <Copy size={16} />
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`} onClick={deleteSelected} disabled={!selectedElement}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={canvasRef}
            className={`w-full h-full ${theme.isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} relative cursor-crosshair`}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              backgroundImage: showGrid ? (theme.isDarkMode 
                ? 'radial-gradient(circle, #374151 1px, transparent 1px)'
                : 'radial-gradient(circle, #d1d5db 1px, transparent 1px)') : 'none',
              backgroundSize: '20px 20px',
              transform: `scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {elements.map(renderElement)}

            {/* Simple connection rendering */}
            <svg className="pointer-events-none absolute inset-0" style={{ width: '100%', height: '100%' }}>
              {elements.flatMap((el) => (el.connections || []).map((targetId) => {
                const target = elements.find(e => e.id === targetId);
                if (!target) return null;
                const x1 = el.x + (el.width || 0) / 2;
                const y1 = el.y + (el.height || 0) / 2;
                const x2 = target.x + (target.width || 0) / 2;
                const y2 = target.y + (target.height || 0) / 2;
                return (
                  <line key={`${el.id}_${targetId}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth={2} markerEnd="url(#arrow)" />
                );
              })).filter(Boolean)}
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L6,3 z" fill={theme.isDarkMode ? '#4b5563' : '#9ca3af'} />
                </marker>
              </defs>
            </svg>
            
            {/* Instruction overlay when empty */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-center p-8 rounded-lg ${theme.isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg max-w-md`}>
                  <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to ScribbleModule!</h3>
                  <p className="text-sm mb-4">Create interactive project plans, mind maps, and visualizations.</p>
                  <div className="text-xs space-y-1">
                    <p>• Select a template above to get started</p>
                    <p>• Choose a tool and click on the canvas</p>
                    <p>• Drag elements to move them around</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className={`flex items-center justify-between px-4 py-2 border-t ${theme.isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'} text-xs`}>
          <div>Elements: {elements.length}</div>
          <div>Selected: {selectedElement ? 'Element' : 'None'}</div>
          <div>Tool: {tool}</div>
        </div>
      </div>
    </div>
  );
};

export default ScribbleModule;
