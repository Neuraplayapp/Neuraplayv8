import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const ProblemResolverPlugin: CanvasPlugin = {
  id: 'problem-resolver',
  label: 'Problem Resolver Agent',
  createObject: () => ({
    id: '',
    type: 'resolver',
    position: { x: 400, y: 200 },
    size: { width: 350, height: 160 },
    content: 'Monitoring... No issues detected.',
  }),
  render: ({ object }) => (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        width: object.size.width,
        backgroundColor: '#ffe0e0',
        border: '1px solid red',
        padding: '10px',
      }}
    >
      🧠 <strong>Problem Resolver</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{object.content}</pre>
    </div>
  ),
  simulateAgent: ({ state, prompt }) => [
    {
      output: 'Scanning for bottlenecks in task flow...',
      nextAction: 'Evaluate stalled nodes',
    },
    {
      output: `Suggested fix: Reprioritize 'Implement UI' subgoal`,
    },
  ],
};

