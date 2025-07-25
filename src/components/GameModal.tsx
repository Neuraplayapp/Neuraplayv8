import React from 'react';
import { X } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  component: React.FC<{ onClose: () => void; }>;
  //... other game properties
}

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

const GameModal: React.FC<GameModalProps> = ({ isOpen, onClose, game }) => {
  if (!isOpen) return null;

  const GameComponent = game.component;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-6xl max-h-[90vh] relative">
        {/* The main game window is now a glass panel */}
        <div className="w-full h-full bg-slate-900/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <GameComponent onClose={onClose} />
        </div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-[-10px] right-[-10px] bg-white text-slate-800 p-2 rounded-full shadow-lg hover:bg-slate-200 transition-transform hover:scale-110"
          aria-label="Close game"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default GameModal;