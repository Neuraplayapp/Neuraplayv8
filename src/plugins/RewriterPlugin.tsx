import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const RewriterPlugin: CanvasPlugin = {
  id: 'canvas-rewriter',
  label: 'Canvas Rewriter',
  createObject: () => ({
    id: '',
    type: 'rewriter',
    position: { x: 300, y: 100 },
    size: { width: 300, height: 100 },
    content: 'Organize this canvas better.',
  }),
  render: ({ object }) => (
    <div style={{ position: 'absolute', left: object.position.x, top: object.position.y }}>
      <button>⚙️ {object.content}</button>
    </div>
  ),
  handleAI: ({ prompt }) => ({ updatedContent: `Rewrote layout based on prompt: ${prompt}` }),
};

