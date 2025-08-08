import React from 'react';
import Overlay from './Overlay';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  compact?: boolean;
  children: React.ReactNode;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, compact = false, children }) => {
  return (
    <Overlay open={isOpen} onClose={onClose} mode={compact ? 'compact' : 'default'} title="Search Results">
      <div className={`prose max-w-none ${compact ? 'prose-sm' : ''}`}>
        {children}
      </div>
    </Overlay>
  );
};

export default SearchOverlay;

