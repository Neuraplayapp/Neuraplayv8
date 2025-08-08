import React, { useEffect, useState } from 'react';
import { create } from 'zustand';

type EditorState = {
  text: string;
  preview: string;
  setText: (t: string) => void;
  setPreview: (p: string) => void;
  clear: () => void;
  // Word-like layout
  fontFamily: string;
  fontSize: number; // px
  lineHeight: number; // em
  align: 'left'|'center'|'right'|'justify';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  setLayout: (p: Partial<Pick<EditorState,'fontFamily'|'fontSize'|'lineHeight'|'align'|'bold'|'italic'|'underline'|'color'>>) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  text: '',
  preview: '',
  setText: (t) => set({ text: t }),
  setPreview: (p) => set({ preview: p }),
  clear: () => set({ text: '', preview: '' }),
  // Defaults
  fontFamily: 'Inter, system-ui, Arial, sans-serif',
  fontSize: 14,
  lineHeight: 1.6,
  align: 'left',
  bold: false,
  italic: false,
  underline: false,
  color: '#111827',
  setLayout: (p) => set(p as any),
}));

const normalizeMarkdown = (input: string) => {
  // Remove stray asterisks while preserving list and headings
  return input
    .replace(/\*{3,}/g, '')
    .replace(/\*\*(?!\s)/g, '**')
    .replace(/(^|\s)\*(?!\s)/g, '$1')
    .replace(/\s+\*/g, ' *');
};

interface ToolbarProps { compact?: boolean }
const Toolbar: React.FC<ToolbarProps> = ({ compact }) => {
  const { text, setText, setPreview, clear, fontFamily, fontSize, lineHeight, align, bold, italic, underline, color, setLayout } = useEditorStore();

  const insert = (snippet: string) => setText(text ? text + '\n' + snippet : snippet);
  const erase = (target: string) => setText(text.split(target).join(''));
  const replaceAt = (target: string, next: string) => setText(text.split(target).join(next));
  const normalize = () => setText(normalizeMarkdown(text));
  const clearAll = () => clear();

  useEffect(() => {
    const onInsert = (e: any) => insert(e?.detail?.text || '');
    const onErase = (e: any) => erase(e?.detail?.text || '');
    const onReplace = (e: any) => replaceAt(e?.detail?.target || '', e?.detail?.with || '');
    const onNormalize = () => normalize();
    window.addEventListener('scribble_editor_insert', onInsert as EventListener);
    window.addEventListener('scribble_editor_erase', onErase as EventListener);
    window.addEventListener('scribble_editor_replace', onReplace as EventListener);
    window.addEventListener('scribble_editor_normalize', onNormalize as EventListener);
    return () => {
      window.removeEventListener('scribble_editor_insert', onInsert as EventListener);
      window.removeEventListener('scribble_editor_erase', onErase as EventListener);
      window.removeEventListener('scribble_editor_replace', onReplace as EventListener);
      window.removeEventListener('scribble_editor_normalize', onNormalize as EventListener);
    };
  }, [text]);

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40">
      {/* Font */}
      <select className="px-2 py-1 text-xs rounded border" value={fontFamily} onChange={(e)=>setLayout({ fontFamily: e.target.value })}>
        <option value="Inter, system-ui, Arial, sans-serif">Inter</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Times New Roman, Times, serif">Times</option>
        <option value="Arial, Helvetica, sans-serif">Arial</option>
        <option value="Courier New, monospace">Courier New</option>
      </select>
      <select className="px-2 py-1 text-xs rounded border" value={fontSize} onChange={(e)=>setLayout({ fontSize: parseInt(e.target.value,10) })}>
        {[12,14,16,18,20,24].map(s=> <option key={s} value={s}>{s}px</option>)}
      </select>
      {!compact && (
        <select className="px-2 py-1 text-xs rounded border" value={lineHeight} onChange={(e)=>setLayout({ lineHeight: parseFloat(e.target.value) })}>
          {[1.2,1.4,1.6,1.8,2.0].map(l=> <option key={l} value={l}>{l} line</option>)}
        </select>
      )}
      <input className="w-6 h-6" type="color" value={color} onChange={(e)=>setLayout({ color: e.target.value })} />
      {/* Text style */}
      <button className={`px-2 py-1 text-xs rounded border ${bold?'bg-black text-white dark:bg-white dark:text-black':''}`} onClick={()=>setLayout({ bold: !bold })}>B</button>
      <button className={`px-2 py-1 text-xs rounded border ${italic?'bg-black text-white dark:bg-white dark:text-black':''}`} onClick={()=>setLayout({ italic: !italic })}>I</button>
      {!compact && (
        <button className={`px-2 py-1 text-xs rounded border ${underline?'bg-black text-white dark:bg-white dark:text-black':''}`} onClick={()=>setLayout({ underline: !underline })}>U</button>
      )}
      {/* Align */}
      <select className="px-2 py-1 text-xs rounded border" value={align} onChange={(e)=>setLayout({ align: e.target.value as any })}>
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
        {!compact && <option value="justify">Justify</option>}
      </select>
      {/* Markdown helpers */}
      <button className="px-2 py-1 text-xs rounded border" onClick={() => insert('## Heading')}>H2</button>
      <button className="px-2 py-1 text-xs rounded border" onClick={() => insert('- item')}>•</button>
      <button className="px-2 py-1 text-xs rounded border" onClick={normalize}>Normalize</button>
      <button className="px-2 py-1 text-xs rounded border" onClick={() => setPreview(text)}>Preview</button>
      <button className="px-2 py-1 text-xs rounded border" onClick={clearAll}>Clear</button>
    </div>
  );
};

const EditorPane: React.FC = () => {
  const { text, setText } = useEditorStore();
  return (
    <textarea className="w-full h-full p-3 outline-none bg-white dark:bg-black text-sm" value={text} onChange={(e) => setText(e.target.value)} />
  );
};

const PreviewPane: React.FC = () => {
  const { preview, fontFamily, fontSize, lineHeight, align, bold, italic, underline, color } = useEditorStore();
  return (
    <div className="w-full h-full overflow-auto p-3">
      <div className="prose max-w-none" style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight,
        textAlign: align as any,
        color,
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: underline ? 'underline' : 'none'
      }}>
        {preview.split('\n').map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </div>
  );
};

interface TextWorkbenchProps { compact?: boolean }
const TextWorkbench: React.FC<TextWorkbenchProps> = ({ compact }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <Toolbar compact={compact} />
      <div className="flex-1 grid grid-cols-3">
        <div className="col-span-1 border-r border-black/10 dark:border-white/10">
          <EditorPane />
        </div>
        <div className="col-span-2">
          <PreviewPane />
        </div>
      </div>
    </div>
  );
};

export default TextWorkbench;

