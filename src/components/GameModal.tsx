import React from 'react';
import { X } from 'lucide-react';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: {
    id: string;
    title: string;
    description: string;
    component: React.ComponentType<any>;
    color: string;
    difficulty: string;
    skills: string[];
  };
}

const GameModal: React.FC<GameModalProps> = ({ isOpen, onClose, game }) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    setIsFullscreen(f => !f);
    const elem = modalRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (!isOpen) return null;

  const GameComponent = game.component;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[98vh] h-[90vh] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none max-w-none max-h-none h-full' : ''}`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${game.color} text-white p-6`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">{game.title}</h2>
              <p className="text-white/90">{game.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>
                ) : (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3m0-8V5a2 2 0 0 0-2-2h-3"/></svg>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Game Content - fill modal */}
        <div className="w-full h-full flex items-center justify-center p-0 m-0" style={{height: 'calc(100% - 96px)'}}>
          <GameComponent onRequestFullscreen={handleFullscreen} />
        </div>
      </div>
    </div>
  );
};

export default GameModal;