export type MemoryType =
  | 'short_term'        // current conversation/session
  | 'long_term'         // past sessions, preferences, progress
  | 'episodic'          // specific events/tasks
  | 'semantic'          // extracted facts
  | 'education_predefine'; // preloaded structured packs

export interface BaseMemory {
  id: string;
  type: MemoryType;
  tags?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ShortTermMemory extends BaseMemory {
  type: 'short_term';
  sessionId: string;
  data: Record<string, unknown>;
}

export interface LongTermMemory extends BaseMemory {
  type: 'long_term';
  userId: string;
  preferences?: Record<string, unknown>;
  progress?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface EpisodicMemory extends BaseMemory {
  type: 'episodic';
  userId: string;
  title: string;
  description?: string;
}

export interface SemanticMemory extends BaseMemory {
  type: 'semantic';
  subject: string;
  facts: string[];
}

export type AnyMemory = ShortTermMemory | LongTermMemory | EpisodicMemory | SemanticMemory | BaseMemory;

