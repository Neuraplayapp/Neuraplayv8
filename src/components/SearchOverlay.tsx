import React from 'react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  children: React.ReactNode;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, isDarkMode, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pointer-events-none">
      <div className="w-full max-w-3xl mt-6 px-4 pointer-events-auto">
        <div className={`rounded-2xl border backdrop-blur-md shadow-2xl ${isDarkMode ? 'bg-black/50 border-white/10' : 'bg-white/70 border-black/10'}`}>
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm font-medium`}>Search Results</div>
            <button onClick={onClose} className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} p-1 rounded-md`}>✕</button>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;


