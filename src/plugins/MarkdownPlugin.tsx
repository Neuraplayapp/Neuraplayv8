import React from 'react';
import { CanvasPlugin } from './PluginInterface';

export const MarkdownPlugin: CanvasPlugin = {
  id: 'markdown',
  label: 'Markdown Block',
  createObject: () => ({
    id: '',
    type: 'markdown',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 200 },
    content: '## Hello World',
  }),
  render: ({ object, update }) => (
    <div style={{ position: 'absolute', left: object.position.x, top: object.position.y }}>
      <textarea
        value={object.content}
        onChange={(e) => update({ content: e.target.value })}
        style={{ width: object.size.width, height: object.size.height }}
      />
    </div>
  ),
  handleAI: ({ prompt, object }) => {
    if (prompt.includes('summarize')) {
      return { updatedContent: 'This is a summary of the markdown content.' };
    }
    return null;
  },
};

