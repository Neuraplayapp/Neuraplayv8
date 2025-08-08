import type { AnyMemory, MemoryType } from './Types';

// In-memory placeholder store; swap with DB/IndexedDB as needed
export class MemoryStore {
  private static instance: MemoryStore;
  private items: Map<string, AnyMemory> = new Map();

  static getInstance(): MemoryStore {
    if (!MemoryStore.instance) MemoryStore.instance = new MemoryStore();
    return MemoryStore.instance;
  }

  upsert(memory: AnyMemory) {
    this.items.set(memory.id, { ...memory, updatedAt: new Date().toISOString() });
  }

  getById(id: string): AnyMemory | undefined { return this.items.get(id); }

  queryByType(type: MemoryType): AnyMemory[] {
    return Array.from(this.items.values()).filter(m => m.type === type);
  }

  queryByTags(tags: string[]): AnyMemory[] {
    return Array.from(this.items.values()).filter(m => (m.tags || []).some(t => tags.includes(t)));
  }
}

export const memoryStore = MemoryStore.getInstance();

