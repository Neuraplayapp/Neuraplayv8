import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const HypothesisTesterPlugin: CanvasPlugin = {
  id: 'hypothesis-tester',
  label: 'Hypothesis Tester',
  createObject: () => ({
    id: '',
    type: 'hypothesis',
    position: { x: 200, y: 500 },
    size: { width: 400, height: 200 },
    content: 'Hypothesis: Automating report generation reduces time by 50%',
  }),
  render: ({ object }) => (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        width: object.size.width,
        backgroundColor: '#e8fff3',
        border: '1px solid #2e8b57',
        padding: '10px',
      }}
    >
      🧪 <strong>Hypothesis Tester</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{object.content}</pre>
    </div>
  ),
  simulateAgent: ({ prompt }) => [
    {
      output: `Testing hypothesis against scenario: ${prompt || 'No scenario provided'}`,
    },
    {
      output: 'Result: Time savings estimated at 47%. Confidence: 0.87',
    },
  ],
};

