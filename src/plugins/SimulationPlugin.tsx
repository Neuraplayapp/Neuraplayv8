import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const SimulationPlugin: CanvasPlugin = {
  id: 'agent-simulator',
  label: 'Agent Simulator',
  createObject: () => ({
    id: '',
    type: 'simulator',
    position: { x: 100, y: 400 },
    size: { width: 300, height: 150 },
    content: 'Simulation Panel',
  }),
  render: ({ object }) => (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        padding: '10px',
        backgroundColor: '#fdf',
        width: object.size.width,
        border: '1px solid purple',
      }}
    >
      🎲 {object.content}
    </div>
  ),
  simulateAgent: ({ prompt }) => [
    { output: `Simulating response to: ${prompt}` },
    { output: 'Determined next step', nextAction: 'Execute simulation' },
  ],
};

