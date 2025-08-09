import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type OverlayMode = 'compact' | 'default' | 'fullscreen';
type OverlayAnchor = 'center' | 'top';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  mode?: OverlayMode;
  anchor?: OverlayAnchor; // where to attach in non-fullscreen
  closeOnBackdrop?: boolean; // allow backdrop to close in non-fullscreen
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ open, onClose, title, mode = 'default', anchor = 'center', closeOnBackdrop = true, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

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
        <motion.div className="fixed inset-0 z-[1000]" initial="hidden" animate="visible" exit="exit" variants={backdropVariants}>
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40"
            onClick={() => {
              if (mode !== 'fullscreen' && closeOnBackdrop) onClose();
            }}
            aria-hidden
          />

          {mode === 'fullscreen' ? (
            <motion.div className="relative w-full h-full pointer-events-auto" variants={panelVariants.fullscreen}>
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
            <div className={`absolute inset-0 flex ${anchor === 'top' ? 'items-start' : 'items-center'} justify-center pointer-events-none`}>
              <motion.div
                className={`w-full ${mode === 'compact' ? 'max-w-md px-2' : 'max-w-3xl px-4'} ${anchor === 'top' ? 'mt-2' : 'mt-6'} pointer-events-auto`}
                initial={panelVariants[mode].hidden}
                animate={panelVariants[mode].visible}
                exit={panelVariants[mode].exit}
              >
                <div className={`rounded-xl border backdrop-blur-md shadow-2xl ${mode === 'compact' ? 'p-2' : 'p-4'} bg-white/80 dark:bg-black/60 border-black/10 dark:border-white/10`}>
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

