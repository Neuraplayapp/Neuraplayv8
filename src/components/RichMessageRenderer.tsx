import React from 'react';

interface RichMessageRendererProps {
  text: string;
  isUser?: boolean;
  isDarkMode?: boolean;
  toolResults?: any[];
}

interface RichContent {
  type: 'text' | 'image' | 'math_diagram' | 'chart' | 'table' | 'formula' | 'weather_table' | 'tool_result';
  content: string;
  metadata?: any;
}

const RichMessageRenderer: React.FC<RichMessageRendererProps> = ({ 
  text, 
  isUser, 
  isDarkMode, 
  toolResults = [] 
}) => {
  
  // Parse message for rich mathematical and visual content
  const parseRichContent = (text: string, toolResults: any[]): RichContent[] => {
    const content: RichContent[] = [];
    let processedText = text;
    
    // Handle tool results (server-generated diagrams and data)
    toolResults.forEach((result, index) => {
      if (result.data?.image_url && result.data.diagram_type) {
        content.push({
          type: 'math_diagram',
          content: result.data.image_url,
          metadata: {
            title: result.data.title || 'Mathematical Diagram',
            diagramType: result.data.diagram_type,
            style: result.data.style || 'colorful'
          }
        });
      } else if (result.success && result.data) {
        content.push({
          type: 'tool_result',
          content: result.message || 'Tool executed successfully',
          metadata: result.data
        });
      }
    });
    
    // Parse IMAGE_GENERATED format
    const imageRegex = /IMAGE_GENERATED:([^:]+):(.+)/g;
    let match;
    while ((match = imageRegex.exec(processedText)) !== null) {
      content.push({
        type: 'image',
        content: match[1], // base64 data URL
        metadata: { caption: match[2] }
      });
      processedText = processedText.replace(match[0], `[IMAGE_RENDERED]`);
    }
    
    // Parse mathematical formulas $$...$$
    const formulaRegex = /\$\$([\s\S]+?)\$\$/g;
    while ((match = formulaRegex.exec(processedText)) !== null) {
      content.push({
        type: 'formula',
        content: match[1],
        metadata: { inline: false }
      });
      processedText = processedText.replace(match[0], `[FORMULA_RENDERED]`);
    }
    
    // Parse weather tables and structured data
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
    while ((match = tableRegex.exec(processedText)) !== null) {
      content.push({
        type: 'table',
        content: match[0],
        metadata: { 
          headers: match[1].split('|').filter(h => h.trim()),
          isWeatherTable: match[0].includes('°C') || match[0].includes('Temperature') || match[0].includes('Humidity')
        }
      });
      processedText = processedText.replace(match[0], `[TABLE_RENDERED]`);
    }
    
    // Add formatted text as final content
    if (processedText.trim()) {
      content.push({
        type: 'text',
        content: formatText(processedText)
      });
    }
    
    return content;
  };

  // Render mathematical diagrams with beautiful styling
  const renderMathDiagram = (content: string, metadata: any) => (
    <div className="math-diagram-container my-8 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-600 shadow-2xl">
      <div className="diagram-header mb-6">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center">
          <span className="mr-3 text-3xl">📊</span>
          {metadata.title}
        </h3>
        <p className="text-sm text-slate-400 capitalize mt-2 flex items-center">
          <span className="mr-2">🎯</span>
          {metadata.diagramType} • {metadata.style} style • Interactive visualization
        </p>
      </div>
      
      <div className="diagram-content bg-black/40 rounded-xl p-6 border border-slate-700 backdrop-blur-sm">
        <img 
          src={content} 
          alt={metadata.title}
          className="w-full max-w-5xl mx-auto rounded-lg shadow-2xl"
          style={{ 
            imageRendering: 'crisp-edges',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) brightness(1.1) contrast(1.05)'
          }}
        />
      </div>
      
      <div className="diagram-footer mt-4 text-xs text-slate-400 text-center">
        ✨ Pedagogical visualization designed for enhanced learning
      </div>
    </div>
  );

  // Render generated images with elegant presentation
  const renderImage = (content: string, metadata: any) => (
    <div className="image-container my-8 p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-600 shadow-2xl">
      <div className="image-header mb-4">
        <h4 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center">
          <span className="mr-2 text-2xl">🎨</span>
          AI Generated Image
        </h4>
      </div>
      
      <div className="image-content bg-black/40 rounded-xl p-4 border border-gray-700 backdrop-blur-sm">
        <img 
          src={content} 
          alt={metadata.caption || "AI Generated image"}
          className="w-full max-w-3xl mx-auto rounded-xl shadow-2xl"
          style={{ 
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5)) brightness(1.05)'
          }}
        />
      </div>
      
      {metadata.caption && (
        <p className="text-center mt-4 text-sm text-gray-300 italic flex items-center justify-center">
          <span className="mr-2">✨</span>
          {metadata.caption}
        </p>
      )}
    </div>
  );

  // Render mathematical formulas with beautiful styling
  const renderFormula = (content: string, metadata: any) => (
    <div className={`formula-container my-6 p-6 rounded-2xl ${
      metadata.inline 
        ? 'inline-block bg-slate-800 border border-slate-600' 
        : 'bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border border-indigo-500 shadow-2xl'
    }`}>
      <div className="formula-content text-center">
        <div className="text-2xl text-yellow-200 font-mono font-bold leading-relaxed">
          {content}
        </div>
      </div>
      {!metadata.inline && (
        <div className="formula-footer text-xs text-center text-slate-400 mt-3 flex items-center justify-center">
          <span className="mr-2">📐</span>
          Mathematical Expression
        </div>
      )}
    </div>
  );

  // Render beautiful interactive tables
  const renderTable = (content: string, metadata: any) => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split('|').filter(h => h.trim()).map(h => h.trim());
    const rows = lines.slice(2).map(line => 
      line.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
    );

    const isWeatherTable = metadata.isWeatherTable;
    
    return (
      <div className={`table-container my-8 p-6 rounded-2xl shadow-2xl ${
        isWeatherTable 
          ? 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900 border border-cyan-500' 
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-600'
      }`}>
        <div className="table-header mb-4">
          <h4 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center">
            <span className="mr-2 text-2xl">{isWeatherTable ? '🌤️' : '📊'}</span>
            {isWeatherTable ? 'Weather Data' : 'Data Table'}
          </h4>
        </div>
        
        <div className="table-content bg-black/30 rounded-xl p-4 border border-slate-700 backdrop-blur-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                {headers.map((header, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-cyan-300 bg-slate-800/50">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-gray-200">
                      {/* Highlight numbers and units */}
                      <span dangerouslySetInnerHTML={{
                        __html: cell.replace(/(\d+(?:\.\d+)?)\s*(°C|°F|%|kph|mph)/g,
                          '<span class="px-2 py-1 bg-green-800/40 border border-green-600/50 rounded text-green-300 font-bold">$1</span><span class="text-green-400 text-xs ml-1">$2</span>'
                        )
                      }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Enhanced text formatting with mathematical and visual enhancements
  const formatText = (text: string) => {
    return text
      // Mathematical concepts - special highlighting
      .replace(/\b(distance|formula|equation|theorem|proof|calculate|graph|chart|diagram|temperature|humidity|weather|climate)\b/gi, 
        '<span class="px-2 py-1 bg-blue-800/30 border border-blue-600/50 rounded text-blue-300 font-semibold">$&</span>')
      
      // Numbers and units - enhanced formatting
      .replace(/(\d+(?:\.\d+)?)\s*(km|miles|°C|°F|%|kph|mph|meters|feet|seconds|minutes|hours)/g,
        '<span class="px-2 py-1 bg-emerald-800/30 border border-emerald-600/50 rounded text-emerald-300 font-bold">$1</span><span class="text-emerald-400 text-sm ml-1 font-medium">$2</span>')
      
      // Bold text with beautiful gradients
      .replace(/\*\*(.*?)\*\*/g, 
        '<strong class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">$1</strong>')
      
      // Headers with mathematical styling and icons
      .replace(/^### (.*$)/gim, 
        '<h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mt-8 mb-4 flex items-center"><span class="mr-3 text-2xl">📐</span>$1</h3>')
      .replace(/^## (.*$)/gim, 
        '<h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-8 mb-6 flex items-center"><span class="mr-3 text-3xl">🧮</span>$1</h2>')
      .replace(/^# (.*$)/gim, 
        '<h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400 mt-8 mb-6 flex items-center"><span class="mr-3 text-4xl">🌟</span>$1</h1>')
      
      // Mathematical expressions with enhanced styling
      .replace(/\$(.*?)\$/g, 
        '<span class="inline-block bg-gradient-to-r from-yellow-900 to-orange-900 px-4 py-2 rounded-xl text-yellow-200 font-mono border border-yellow-600/50 shadow-lg backdrop-blur-sm">$1</span>')
      
      // Code blocks with enhanced syntax highlighting
      .replace(/```([\s\S]*?)```/g, 
        '<pre class="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 my-8 overflow-x-auto shadow-2xl backdrop-blur-sm"><code class="text-green-400 font-mono text-sm leading-relaxed">$1</code></pre>')
      
      // Inline code with better styling
      .replace(/`([^`]+)`/g, 
        '<code class="bg-gray-800 px-3 py-1 rounded-lg text-cyan-300 font-mono border border-gray-600">$1</code>')
      
      // Enhanced lists with beautiful bullets and spacing
      .replace(/^[\s]*-[\s]+(.*$)/gim, 
        '<li class="ml-8 mb-3 text-gray-100 flex items-start"><span class="text-blue-400 mr-3 mt-1 text-lg">▸</span><span class="flex-1">$1</span></li>')
      
      // Special formatting for weather conditions
      .replace(/\b(Clear|Sunny|Cloudy|Rainy|Stormy|Snowy)\b/g,
        '<span class="px-2 py-1 bg-sky-800/30 border border-sky-600/50 rounded text-sky-300 font-medium">$&</span>')
      
      // Line breaks
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  // Parse content and render all components
  const richContent = parseRichContent(text, toolResults);
  
  return (
    <div className="rich-message-content prose prose-invert max-w-none">
      {richContent.map((item, index) => {
        switch (item.type) {
          case 'math_diagram':
            return <div key={index}>{renderMathDiagram(item.content, item.metadata)}</div>;
          case 'image':
            return <div key={index}>{renderImage(item.content, item.metadata)}</div>;
          case 'formula':
            return <div key={index}>{renderFormula(item.content, item.metadata)}</div>;
          case 'table':
            return <div key={index}>{renderTable(item.content, item.metadata)}</div>;
          case 'tool_result':
            return (
              <div key={index} className="tool-result my-4 p-4 bg-green-900/20 border border-green-600/50 rounded-xl">
                <div className="flex items-center mb-2">
                  <span className="mr-2 text-green-400">✅</span>
                  <span className="text-green-300 font-medium">Tool Executed Successfully</span>
                </div>
                <div className="text-gray-300">{item.content}</div>
              </div>
            );
          case 'text':
          default:
            return (
              <div 
                key={index}
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            );
        }
      })}
    </div>
  );
};

export default RichMessageRenderer;