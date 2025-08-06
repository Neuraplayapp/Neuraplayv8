import React from 'react';

interface RichMessageRendererProps {
  text: string;
  isUser?: boolean;
  isDarkMode?: boolean;
}

// Enhanced markdown parser for AI responses
const RichMessageRenderer: React.FC<RichMessageRendererProps> = ({ text, isUser = false, isDarkMode = false }) => {
  
  // Function to parse and render rich text content
  const parseRichText = (content: string): JSX.Element[] => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentTableRows: string[][] = [];
    let inTable = false;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let elementKey = 0;

    const flushTable = () => {
      if (currentTableRows.length > 0) {
        elements.push(
          <div key={elementKey++} className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'} border-b-2 border-purple-400`}>
                  {currentTableRows[0]?.map((header, idx) => (
                    <th key={idx} className="text-left px-4 py-3 font-bold text-sm uppercase tracking-wide">
                      {parseInlineFormatting(header.replace(/\*/g, '').trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTableRows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className={`border-b ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'} hover:bg-purple-50/10`}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm">
                        {parseInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTableRows = [];
        inTable = false;
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <div key={elementKey++} className="my-4">
            <pre className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-800'} text-green-400 text-sm rounded-lg p-4 overflow-x-auto border-l-4 border-purple-400`}>
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine === '```' || trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          flushTable();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle table rows
      if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
        if (!inTable) {
          inTable = true;
        }
        const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          currentTableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable();
      }

      // Handle different line types
      if (trimmedLine === '') {
        if (!inTable && !inCodeBlock) {
          elements.push(<div key={elementKey++} className="h-4"></div>);
        }
      } else if (trimmedLine === '---') {
        elements.push(<hr key={elementKey++} className="my-6 border-t-2 border-purple-400/30" />);
      } else if (trimmedLine.startsWith('# ')) {
        elements.push(
          <h1 key={elementKey++} className="text-2xl font-bold mb-4 text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {parseInlineFormatting(trimmedLine.slice(2))}
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(
          <h2 key={elementKey++} className="text-xl font-bold mb-3 text-purple-300 border-b border-purple-400/30 pb-1">
            {parseInlineFormatting(trimmedLine.slice(3))}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(
          <h3 key={elementKey++} className="text-lg font-semibold mb-2 text-purple-200">
            {parseInlineFormatting(trimmedLine.slice(4))}
          </h3>
        );
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        elements.push(
          <div key={elementKey++} className="flex items-start mb-2">
            <span className="text-purple-400 mr-3 mt-1">●</span>
            <span className="text-sm leading-relaxed">
              {parseInlineFormatting(trimmedLine.slice(2))}
            </span>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s(.+)/);
        if (match) {
          elements.push(
            <div key={elementKey++} className="flex items-start mb-2">
              <span className="text-purple-400 mr-3 mt-1 font-semibold min-w-[1.5rem]">{match[1]}.</span>
              <span className="text-sm leading-relaxed">
                {parseInlineFormatting(match[2])}
              </span>
            </div>
          );
        }
      } else if (trimmedLine.startsWith('> ')) {
        elements.push(
          <blockquote key={elementKey++} className={`border-l-4 border-purple-400 pl-4 py-2 my-3 italic ${isDarkMode ? 'bg-gray-800/30' : 'bg-purple-50/20'}`}>
            <span className="text-sm leading-relaxed">
              {parseInlineFormatting(trimmedLine.slice(2))}
            </span>
          </blockquote>
        );
      } else {
        // Regular paragraph
        elements.push(
          <p key={elementKey++} className="text-sm leading-relaxed mb-3">
            {parseInlineFormatting(trimmedLine)}
          </p>
        );
      }
    });

    // Flush any remaining content
    flushTable();
    flushCodeBlock();

    return elements;
  };

  // Function to handle inline formatting (bold, italic, code, etc.)
  const parseInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let remainingText = text;
    let partKey = 0;

    // Handle inline code
    remainingText = remainingText.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__CODE_${partKey}__`;
      parts.push(
        <code key={partKey++} className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-700'} text-green-400 px-2 py-1 rounded text-xs font-mono`}>
          {code}
        </code>
      );
      return placeholder;
    });

    // Handle bold text
    remainingText = remainingText.replace(/\*\*([^*]+)\*\*/g, (match, boldText) => {
      const placeholder = `__BOLD_${partKey}__`;
      parts.push(
        <strong key={partKey++} className="font-bold text-white">
          {boldText}
        </strong>
      );
      return placeholder;
    });

    // Handle italic text
    remainingText = remainingText.replace(/\*([^*]+)\*/g, (match, italicText) => {
      const placeholder = `__ITALIC_${partKey}__`;
      parts.push(
        <em key={partKey++} className="italic text-purple-200">
          {italicText}
        </em>
      );
      return placeholder;
    });

    // Split by placeholders and reconstruct
    const finalParts: (string | JSX.Element)[] = [];
    const placeholderRegex = /__(?:CODE|BOLD|ITALIC)_\d+__/g;
    let lastIndex = 0;
    let match;

    while ((match = placeholderRegex.exec(remainingText)) !== null) {
      // Add text before placeholder
      if (match.index > lastIndex) {
        finalParts.push(remainingText.substring(lastIndex, match.index));
      }
      
      // Add the corresponding element
      const placeholderIndex = parseInt(match[0].match(/_(\d+)__/)?.[1] || '0');
      if (parts[placeholderIndex]) {
        finalParts.push(parts[placeholderIndex]);
      }
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < remainingText.length) {
      finalParts.push(remainingText.substring(lastIndex));
    }

    return finalParts.length > 0 ? finalParts : [text];
  };

  const processedText = text.replace(/Synapse/gi, 'Neural AI').replace(/synapse/gi, 'Neural AI');
  
  return (
    <div className={`rich-message-content ${isUser ? 'user-message' : 'assistant-message'}`}>
      {parseRichText(processedText)}
    </div>
  );
};

export default RichMessageRenderer;