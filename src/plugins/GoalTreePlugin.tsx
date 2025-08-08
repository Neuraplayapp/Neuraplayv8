import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const GoalTreePlugin: CanvasPlugin = {
  id: 'goal-tree',
  label: 'Goal Task Tree',
  createObject: () => ({
    id: '',
    type: 'goal-tree',
    position: { x: 150, y: 250 },
    size: { width: 350, height: 200 },
    content: 'Goal: Build AI Plugin System\n- Subgoal: Create registry\n- Subgoal: Implement UI',
  }),
  render: ({ object }) => (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        width: object.size.width,
        backgroundColor: '#ffe',
        border: '1px solid #aaa',
        padding: '10px',
      }}
    >
      🌲 <strong>Goal Tree</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{object.content}</pre>
    </div>
  ),
  simulateAgent: ({ state, prompt }) => [
    {
      output: `Analyzing goal state... ${prompt || 'No prompt provided.'}`,
      nextAction: 'Split goal into subgoals',
    },
    {
      output: 'Updated progress: 2/3 subgoals completed',
    },
  ],
};

