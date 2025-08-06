import React from 'react';

interface RichMessageRendererProps {
  content: string;
}

const RichMessageRenderer: React.FC<RichMessageRendererProps> = ({ content }) => {
  // Enhanced rich text rendering with mathematical formatting
  const formatText = (text: string) => {
    return text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold text-lg">$1</strong>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mt-6 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400 mt-6 mb-4">$1</h1>')
      // Mathematical expressions (LaTeX-like)
      .replace(/\$(.*?)\$/g, '<span class="inline-block bg-gray-800 px-2 py-1 rounded text-yellow-300 font-mono">$1</span>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 border border-gray-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-green-400 font-mono">$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-cyan-300 font-mono">$1</code>')
      // Lists
      .replace(/^[\s]*-[\s]+(.*$)/gim, '<li class="ml-6 mb-2 text-gray-100">• $1</li>')
      // Line breaks
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div 
      className="rich-message-content prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
    />
  );
};

export default RichMessageRenderer;