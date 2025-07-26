import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Settings, Trophy } from 'lucide-react';

interface TheCubeGameProps {
  onClose: () => void;
}

const TheCubeGame: React.FC<TheCubeGameProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [gameUrl, setGameUrl] = useState('');

  useEffect(() => {
    // Set the game URL to the cube game's index.html
    setGameUrl('/imports/the-cube/dist/index.html');
    setIsLoading(false);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">The Cube</h2>
              <p className="text-sm opacity-90">3D Rubik's Cube Puzzle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Game Container */}
        <div className="w-full h-full pt-16">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading The Cube...</p>
              </div>
            </div>
          ) : (
            <iframe
              src={gameUrl}
              className="w-full h-full border-0"
              title="The Cube Game"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        {/* Instructions Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4" />
                <span>Drag to rotate</span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings available</span>
              </div>
            </div>
            <div className="text-xs opacity-75">
              Double tap to start
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheCubeGame; 