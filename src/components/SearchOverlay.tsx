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
    <div className="fixed inset-0 z-[1000] flex items-start justify-center md:justify-center pointer-events-none">
      <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mt-4 sm:mt-6 px-2 sm:px-4 pointer-events-auto">
        <div className={`rounded-xl sm:rounded-2xl border backdrop-blur-md shadow-2xl ${isDarkMode ? 'bg-black/60 border-white/10' : 'bg-white/80 border-black/10'}`}>
          <div className="flex items-center justify-between px-3 py-2 sm:p-3 border-b border-white/10">
            <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm font-medium`}>Search Results</div>
            <button onClick={onClose} className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} p-1 rounded-md`} aria-label="Close overlay">✕</button>
          </div>
          <div className="p-3 sm:p-4 max-h-[60vh] overflow-auto">
            <div className="prose max-w-none">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;


