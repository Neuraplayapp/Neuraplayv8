import type { EducationPredefine, PredefineMatch } from './PredefineTypes';
import predefines from '../../data/predefines.json';

export class PredefineStore {
  private static instance: PredefineStore;
  private items: EducationPredefine[] = [];

  constructor() {
    // Basic runtime validation
    this.items = (predefines as EducationPredefine[]).filter(p => p && p.id && p.type === 'education_predefine');
  }

  static getInstance(): PredefineStore {
    if (!PredefineStore.instance) PredefineStore.instance = new PredefineStore();
    return PredefineStore.instance;
  }

  list(): EducationPredefine[] { return this.items; }

  getById(id: string) { return this.items.find(i => i.id === id); }

  // Simple term match over title/tags; can be upgraded to embeddings later
  search(query: string, topK = 3): PredefineMatch[] {
    const q = query.toLowerCase();
    const scores = this.items.map(p => {
      const hay = [p.title, ...(p.tags || [])].join(' ').toLowerCase();
      let score = 0;
      if (hay.includes(q)) score += 1.0;
      // tag overlap bonus for multi-word queries
      const parts = q.split(/\s+/).filter(Boolean);
      score += parts.reduce((acc, w) => acc + (hay.includes(w) ? 0.1 : 0), 0);
      return { id: p.id, title: p.title, score };
    });
    return scores.sort((a,b) => b.score - a.score).slice(0, topK).filter(s => s.score > 0);
  }
}

export const predefineStore = PredefineStore.getInstance();

