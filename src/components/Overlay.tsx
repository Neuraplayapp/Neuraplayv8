import React, { useEffect } from 'react';

type OverlayMode = 'compact' | 'default' | 'fullscreen';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  mode?: OverlayMode;
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ open, onClose, title, mode = 'default', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  // Dedicated fullscreen rendering to avoid centered/padded container artifacts
  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-[1000] pointer-events-auto">
        <div className="w-full h-full flex flex-col bg-transparent">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white/80 dark:bg-black/60 border-black/10 dark:border-white/10">
            <div className="font-medium text-lg">{title}</div>
            <button onClick={onClose} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:opacity-80" aria-label="Close">✕</button>
          </div>
          {/* Body fills the remaining space fully */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  }

  const sizeClass = mode === 'compact'
    ? 'max-w-md mt-2 px-2 max-h-[90vh]'
    : mode === 'fullscreen'
      ? 'w-full h-full px-0 mt-0'
      : 'max-w-3xl mt-6 px-4';
  const padClass = mode === 'compact' ? 'p-2' : 'p-4';
  const bodyClass = mode === 'compact' ? 'prose-sm' : '';

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pointer-events-none">
      <div className={`w-full ${sizeClass} pointer-events-auto`}> 
        <div className={`rounded-xl border backdrop-blur-md shadow-2xl ${padClass} ${mode==='fullscreen' ? 'h-full rounded-none' : ''} bg-white/80 dark:bg-black/60 border-black/10 dark:border-white/10`}>
          {/* Header */}
          <div className={`flex items-center justify-between ${mode==='fullscreen' ? 'pb-2 border-b border-white/10' : 'pb-2'}`}>
            <div className={`font-medium ${mode==='compact' ? 'text-sm' : 'text-base'}`}>{title}</div>
            <button onClick={onClose} className={`p-1 rounded-md ${mode==='compact' ? 'text-sm' : 'text-base'} text-gray-600 dark:text-gray-300 hover:opacity-80`} aria-label="Close">✕</button>
          </div>
          {/* Body */}
          <div className={`${mode==='fullscreen' ? 'h-[calc(100%-2.5rem)]' : ''} overflow-auto ${bodyClass}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overlay;

