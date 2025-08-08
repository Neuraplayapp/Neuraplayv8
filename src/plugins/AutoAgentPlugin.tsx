import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const AutoAgentPlugin: CanvasPlugin = {
  id: 'auto-agent',
  label: 'Auto Agent Node',
  autoConnect: true,
  createObject: () => ({
    id: '',
    type: 'agent',
    position: { x: 200, y: 200 },
    size: { width: 200, height: 150 },
    content: 'Agent: Planning',
  }),
  render: ({ object }) => (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        border: '1px solid blue',
        padding: '8px',
        width: object.size.width,
        backgroundColor: '#eef',
      }}
    >
      🤖 {object.content}
    </div>
  ),
  simulateAgent: ({ state }) => [
    { output: 'Analyzed dependencies', nextAction: 'Link relevant blocks' },
    { output: 'Planned execution steps' },
  ],
};

