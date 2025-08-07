// ScribbleModule - Interactive Canvas for Project Plans, Mind Maps, Charts & Roadmaps
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Save, Download, Share, Trash2, Move, Type, Image, BarChart3, GitBranch, Calendar, Target, Lightbulb } from 'lucide-react';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'chart' | 'roadmap' | 'mindmap' | 'sticky' | 'connector';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    fontWeight: string;
    borderColor: string;
    borderWidth: number;
  };
  data?: any; // For charts, roadmaps, etc.
  connections?: string[]; // Connected element IDs
}

interface ScribbleModuleProps {
  isOpen: boolean;
  onClose: () => void;
  theme: { isDarkMode: boolean };
}

const ScribbleModule: React.FC<ScribbleModuleProps> = ({ isOpen, onClose, theme }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'text' | 'sticky' | 'chart' | 'roadmap' | 'mindmap'>('select');
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  // Predefined Templates
  const templates = {
    projectPlan: {
      name: '📋 Project Plan',
      elements: [
        { type: 'text', content: '🎯 PROJECT OVERVIEW', x: 50, y: 50, style: { fontSize: 24, fontWeight: 'bold' }},
        { type: 'sticky', content: 'Goals & Objectives', x: 50, y: 120, style: { backgroundColor: '#fef3c7' }},
        { type: 'sticky', content: 'Timeline & Milestones', x: 250, y: 120, style: { backgroundColor: '#dbeafe' }},
        { type: 'sticky', content: 'Resources & Team', x: 450, y: 120, style: { backgroundColor: '#dcfce7' }},
        { type: 'roadmap', content: 'Project Timeline', x: 50, y: 250, data: { phases: ['Planning', 'Development', 'Testing', 'Launch'] }}
      ]
    },
    mindMap: {
      name: '🧠 Mind Map',
      elements: [
        { type: 'mindmap', content: 'Central Idea', x: 300, y: 200, style: { backgroundColor: '#fbbf24', fontSize: 18 }},
        { type: 'sticky', content: 'Branch 1', x: 150, y: 100, style: { backgroundColor: '#60a5fa' }},
        { type: 'sticky', content: 'Branch 2', x: 450, y: 100, style: { backgroundColor: '#34d399' }},
        { type: 'sticky', content: 'Branch 3', x: 150, y: 300, style: { backgroundColor: '#f87171' }},
        { type: 'sticky', content: 'Branch 4', x: 450, y: 300, style: { backgroundColor: '#a78bfa' }}
      ]
    },
    chartDashboard: {
      name: '📊 Chart Dashboard',
      elements: [
        { type: 'text', content: '📈 DATA VISUALIZATION', x: 50, y: 50, style: { fontSize: 24, fontWeight: 'bold' }},
        { type: 'chart', content: 'Sales Trends', x: 50, y: 120, data: { type: 'line', data: [10, 20, 15, 25, 30] }},
        { type: 'chart', content: 'Market Share', x: 350, y: 120, data: { type: 'pie', data: [40, 30, 20, 10] }},
        { type: 'sticky', content: '💡 Key Insights', x: 50, y: 350, style: { backgroundColor: '#fef3c7' }}
      ]
    }
  };

  // Create new element
  const createElement = useCallback((type: CanvasElement['type'], x: number, y: number) => {
    const newElement: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      x,
      y,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 40 : 100,
      content: type === 'text' ? 'New Text' : type === 'sticky' ? 'New Note' : `New ${type}`,
      style: {
        backgroundColor: type === 'sticky' ? '#fef3c7' : 'transparent',
        textColor: theme.isDarkMode ? '#ffffff' : '#000000',
        fontSize: 14,
        fontWeight: 'normal',
        borderColor: '#d1d5db',
        borderWidth: 1
      },
      connections: []
    };

    if (type === 'chart') {
      newElement.data = { type: 'bar', data: [10, 20, 15, 25] };
    } else if (type === 'roadmap') {
      newElement.data = { phases: ['Phase 1', 'Phase 2', 'Phase 3'] };
    }

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    return newElement.id;
  }, [theme.isDarkMode]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && tool !== 'select') {
        const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
        createElement(tool as CanvasElement['type'], x, y);
        setTool('select');
      } else {
        setSelectedElement(null);
      }
    }
  }, [tool, createElement, canvasScale, canvasOffset]);

  // Handle element drag
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setDraggedElement(elementId);
      setSelectedElement(elementId);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / canvasScale - element.x,
          y: (e.clientY - rect.top) / canvasScale - element.y
        });
      }
    }
  }, [elements, canvasScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedElement) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale - dragOffset.x;
        const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale - dragOffset.y;
        
        setElements(prev => prev.map(el => 
          el.id === draggedElement ? { ...el, x, y } : el
        ));
      }
    }
  }, [draggedElement, dragOffset, canvasScale, canvasOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedElement(null);
  }, []);

  // Load template
  const loadTemplate = useCallback((templateKey: keyof typeof templates) => {
    const template = templates[templateKey];
    const newElements = template.elements.map((el, index) => ({
      ...el,
      id: `template_${Date.now()}_${index}`,
      width: el.type === 'text' ? 200 : 150,
      height: el.type === 'text' ? 40 : 100,
      style: {
        backgroundColor: el.style?.backgroundColor || 'transparent',
        textColor: theme.isDarkMode ? '#ffffff' : '#000000',
        fontSize: el.style?.fontSize || 14,
        fontWeight: el.style?.fontWeight || 'normal',
        borderColor: '#d1d5db',
        borderWidth: 1,
        ...el.style
      },
      connections: []
    })) as CanvasElement[];
    
    setElements(newElements);
    setSelectedElement(null);
  }, [theme.isDarkMode]);

  // Render element based on type
  const renderElement = useCallback((element: CanvasElement) => {
    const isSelected = selectedElement === element.id;
    const baseStyle = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      backgroundColor: element.style.backgroundColor,
      color: element.style.textColor,
      fontSize: element.style.fontSize,
      fontWeight: element.style.fontWeight,
      border: `${element.style.borderWidth}px solid ${isSelected ? '#3b82f6' : element.style.borderColor}`,
      borderRadius: element.type === 'sticky' ? '8px' : '4px',
      padding: '8px',
      cursor: 'move',
      userSelect: 'none' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: element.type === 'sticky' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      zIndex: isSelected ? 10 : 1,
      transition: 'all 0.2s ease'
    };

    const handleElementClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedElement(element.id);
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={baseStyle}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            {element.content}
          </div>
        );

      case 'sticky':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.style.backgroundColor || '#fef3c7',
              transform: `rotate(${Math.random() * 6 - 3}deg) ${isSelected ? 'scale(1.02)' : 'scale(1)'}`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            <div className="text-center break-words">{element.content}</div>
          </div>
        );

      case 'chart':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: theme.isDarkMode ? '#1f2937' : '#ffffff',
              border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
              borderRadius: '12px',
              padding: '16px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            <div className="text-center">
              <BarChart3 size={24} className="mx-auto mb-2" />
              <div className="text-sm font-medium">{element.content}</div>
              <div className="text-xs opacity-70">Chart Visualization</div>
            </div>
          </div>
        );

      case 'roadmap':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              width: element.width || 300,
              height: element.height || 60,
              backgroundColor: theme.isDarkMode ? '#374151' : '#f9fafb',
              border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            {element.data?.phases?.map((phase: string, index: number) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <div className="ml-2 text-xs font-medium">{phase}</div>
                {index < element.data.phases.length - 1 && (
                  <div className="ml-4 w-6 h-0.5 bg-gray-400"></div>
                )}
              </div>
            )) || <div>Roadmap</div>}
          </div>
        );

      case 'mindmap':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.style.backgroundColor || '#fbbf24',
              borderRadius: '50%',
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center' as const,
              fontWeight: 'bold'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={handleElementClick}
          >
            <div className="text-sm">{element.content}</div>
          </div>
        );

      default:
        return null;
    }
  }, [selectedElement, handleMouseDown, theme.isDarkMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`w-full h-full max-w-7xl max-h-[90vh] ${theme.isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-bold ${theme.isDarkMode ? 'text-white' : 'text-black'} flex items-center`}>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <Lightbulb size={18} className="text-white" />
              </div>
              ScribbleModule
            </h2>
            
            {/* Templates */}
            <div className="flex space-x-2">
              {Object.entries(templates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => loadTemplate(key as keyof typeof templates)}
                  className={`px-3 py-1 text-xs rounded-full border ${theme.isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} transition-all`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full ${theme.isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-black hover:bg-gray-100'} transition-all`}
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className={`flex items-center justify-between p-3 border-b ${theme.isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center space-x-2">
            {[
              { tool: 'select', icon: Move, label: 'Select' },
              { tool: 'text', icon: Type, label: 'Text' },
              { tool: 'sticky', icon: Plus, label: 'Sticky Note' },
              { tool: 'chart', icon: BarChart3, label: 'Chart' },
              { tool: 'roadmap', icon: Calendar, label: 'Roadmap' },
              { tool: 'mindmap', icon: GitBranch, label: 'Mind Map' }
            ].map(({ tool: toolName, icon: Icon, label }) => (
              <button
                key={toolName}
                onClick={() => setTool(toolName as any)}
                className={`p-2 rounded-lg flex items-center space-x-1 ${tool === toolName ? 'bg-blue-500 text-white' : theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}
              >
                <Icon size={16} />
                <span className="text-xs hidden md:block">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}>
              <Save size={16} />
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}>
              <Download size={16} />
            </button>
            <button className={`p-2 rounded-lg ${theme.isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'} transition-all`}>
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={canvasRef}
            className={`w-full h-full ${theme.isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} relative cursor-crosshair`}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              backgroundImage: theme.isDarkMode 
                ? 'radial-gradient(circle, #374151 1px, transparent 1px)'
                : 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {elements.map(renderElement)}
            
            {/* Instruction overlay when empty */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-center p-8 rounded-lg ${theme.isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg max-w-md`}>
                  <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to ScribbleModule!</h3>
                  <p className="text-sm mb-4">Create interactive project plans, mind maps, and visualizations.</p>
                  <div className="text-xs space-y-1">
                    <p>• Select a template above to get started</p>
                    <p>• Choose a tool and click on the canvas</p>
                    <p>• Drag elements to move them around</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className={`flex items-center justify-between px-4 py-2 border-t ${theme.isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'} text-xs`}>
          <div>Elements: {elements.length}</div>
          <div>Selected: {selectedElement ? 'Element' : 'None'}</div>
          <div>Tool: {tool}</div>
        </div>
      </div>
    </div>
  );
};

export default ScribbleModule;
