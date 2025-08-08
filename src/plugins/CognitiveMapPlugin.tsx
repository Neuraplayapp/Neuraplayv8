import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const CognitiveMapPlugin: CanvasPlugin = {
  id: 'cog-map',
  label: 'Cognitive Map Tracker',
  createObject: () => ({
    id: '',
    type: 'cog-map',
    position: { x: 500, y: 150 },
    size: { width: 360, height: 180 },
    content:
      'Focus Log:\n- Selected: Goal Tree\n- Edited: Markdown Block\n- Shifted to: Simulation Node',
  }),
  render: ({ object }) => (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        width: object.size.width,
        backgroundColor: '#fefdd0',
        border: '1px solid #aaa',
        padding: '10px',
      }}
    >
      🧠 <strong>Cognitive Map</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{object.content}</pre>
    </div>
  ),
  simulateAgent: ({ prompt }) => [
    {
      output: `Detected cognitive drift. Prompt: ${prompt}`,
    },
    {
      output:
        'Suggestion: Refocus on final objective or summarize current canvas state.',
    },
  ],
};

