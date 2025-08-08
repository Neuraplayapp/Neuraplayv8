import { AssistantConfig } from './AssistantConfig';
import { predefineStore } from './predefines/PredefineStore';
import { memoryStore } from './memory/MemoryStore';

export interface AssembledContext {
  predefines: Array<{ id: string; title: string; content: unknown }>;
  personal: Record<string, unknown>;
}

export function assembleContext(userText: string, opts?: { userId?: string }): AssembledContext {
  const predefines: Array<{ id: string; title: string; content: unknown }> = [];
  const personal: Record<string, unknown> = {};

  if (AssistantConfig.useEducationalPredefines) {
    const matches = predefineStore.search(userText, 3);
    matches.forEach(m => {
      const pd = predefineStore.getById(m.id);
      if (pd) predefines.push({ id: pd.id, title: pd.title, content: pd.content });
    });
  }

  if (AssistantConfig.usePersonalMemory && opts?.userId) {
    // basic example: merge long_term data for the user
    const longTerm = memoryStore.queryByType('long_term').filter((m: any) => m.userId === opts.userId);
    if (longTerm.length) personal['long_term'] = longTerm.map((m: any) => ({ id: m.id, data: m.data, preferences: m.preferences }));
    const episodic = memoryStore.queryByType('episodic').filter((m: any) => m.userId === opts.userId);
    if (episodic.length) personal['episodes'] = episodic.map((m: any) => ({ id: m.id, title: m.title }));
  }

  return { predefines, personal };
}

