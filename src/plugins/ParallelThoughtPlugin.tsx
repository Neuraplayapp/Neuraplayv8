import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const ParallelThoughtPlugin: CanvasPlugin = {
  id: 'parallel-thought',
  label: 'Parallel Thought Space',
  createObject: () => ({
    id: '',
    type: 'parallel',
    position: { x: 600, y: 300 },
    size: { width: 400, height: 220 },
    content: 'Path A: Continue as planned\nPath B: Refactor the flow\nPath C: Explore new tools',
  }),
  render: ({ object }) => (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        width: object.size.width,
        backgroundColor: '#f0f8ff',
        border: '1px solid #4682b4',
        padding: '10px',
      }}
    >
      🧭 <strong>Parallel Thought Space</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{object.content}</pre>
    </div>
  ),
  simulateAgent: ({ prompt }) => [
    {
      output: `Exploring branch alternatives for: ${prompt || 'unspecified decision'}`,
    },
    {
      output: 'Option B shows highest potential. Suggest merging with current path.',
    },
  ],
};

