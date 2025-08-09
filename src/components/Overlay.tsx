import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type OverlayMode = 'compact' | 'default' | 'fullscreen';
type OverlayAnchor = 'center' | 'top' | 'bottom-left' | 'bottom-right';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  mode?: OverlayMode;
  anchor?: OverlayAnchor; // where to attach in non-fullscreen
  closeOnBackdrop?: boolean; // allow backdrop to close in non-fullscreen
  anchorSelector?: string; // CSS selector to anchor to a specific element (compact/default only)
  zIndex?: number; // z-index for overlay root
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ open, onClose, title, mode = 'default', anchor = 'center', closeOnBackdrop = false, anchorSelector, zIndex = 10000, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const [anchorRect, setAnchorRect] = React.useState<{ top: number; left: number; width: number; bottom: number } | null>(null);
  useEffect(() => {
    if (!open || !anchorSelector || mode === 'fullscreen') { setAnchorRect(null); return; }
    const compute = () => {
      const el = document.querySelector(anchorSelector) as HTMLElement | null;
      if (!el) { setAnchorRect(null); return; }
      const rect = el.getBoundingClientRect();
      setAnchorRect({ top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, bottom: rect.bottom + window.scrollY });
    };
    // compute now and on next frames to catch layout changes
    compute();
    const raf1 = requestAnimationFrame(compute);
    const raf2 = requestAnimationFrame(compute);
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, { passive: true } as any);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute as any);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open, anchorSelector, mode]);

  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } as const;
  const panelVariants = {
    compact: {
      hidden: { opacity: 0, y: 16, scale: 0.98 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
      exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } }
    },
    default: {
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } },
      exit: { opacity: 0, y: 24, transition: { duration: 0.18 } }
    },
    fullscreen: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.15 } }
    }
  } as const;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0" style={{ zIndex }} initial="hidden" animate="visible" exit="exit" variants={backdropVariants}>
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40"
            onClick={() => {
              if (mode !== 'fullscreen' && closeOnBackdrop) onClose();
            }}
            aria-hidden
          />

          {mode === 'fullscreen' ? (
            <motion.div className="relative w-full h-full pointer-events-auto" variants={panelVariants.fullscreen} onMouseDown={(e)=>e.stopPropagation()}>
              <div className="w-full h-full flex flex-col">
                <motion.div
                  className="flex items-center justify-between px-4 py-3 border-b bg-white/80 dark:bg-black/60 border-black/10 dark:border-white/10"
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <div className="font-medium text-lg">{title}</div>
                  <button onClick={onClose} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:opacity-80" aria-label="Close">✕</button>
                </motion.div>
                <div className="flex-1 overflow-hidden">{children}</div>
              </div>
            </motion.div>
          ) : (
            <div className={`absolute inset-0 ${anchorRect ? '' : `flex ${anchor === 'top' ? 'items-start' : 'items-center'} justify-center`} pointer-events-none`}>
              <motion.div
                className={`pointer-events-auto`}
                style={anchorRect ? (
                  anchor === 'bottom-left'
                    ? { position: 'fixed', left: anchorRect.left, bottom: Math.max(0, window.innerHeight - anchorRect.bottom), width: Math.min(anchorRect.width, 480) }
                    : anchor === 'bottom-right'
                      ? { position: 'fixed', right: Math.max(0, window.innerWidth - (anchorRect.left + anchorRect.width)), bottom: Math.max(0, window.innerHeight - anchorRect.bottom), width: Math.min(anchorRect.width, 480) }
                      : { position: 'fixed', top: anchorRect.top, left: anchorRect.left, width: Math.min(anchorRect.width, 640) }
                ) : {}}
                initial={(anchor === 'bottom-left' || anchor === 'bottom-right') ? { opacity: 0, y: 16, scale: 0.98 } : panelVariants[mode].hidden}
                animate={(anchor === 'bottom-left' || anchor === 'bottom-right') ? { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } } : panelVariants[mode].visible}
                exit={(anchor === 'bottom-left' || anchor === 'bottom-right') ? { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } } : panelVariants[mode].exit}
              >
                <div className={`rounded-xl border backdrop-blur-md shadow-2xl ${mode === 'compact' ? 'p-2' : 'p-4'} ${!anchorRect ? (anchor === 'top' ? 'mt-2' : 'mt-6') : ''} bg-white/90 border-black/10`}> 
                  <div className={`flex items-center justify-between ${mode==='fullscreen' ? 'pb-2 border-b border-white/10' : 'pb-2'}`}>
                    <div className={`font-medium ${mode==='compact' ? 'text-sm' : 'text-base'}`}>{title}</div>
                    <button onClick={onClose} className={`p-1 rounded-md ${mode==='compact' ? 'text-sm' : 'text-base'} text-gray-600 dark:text-gray-300 hover:opacity-80`} aria-label="Close">✕</button>
                  </div>
                  <div className={`${mode==='fullscreen' ? 'h-[calc(100%-2.5rem)]' : ''} overflow-auto ${mode==='compact' ? 'prose-sm' : ''}`}>{children}</div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Overlay;

