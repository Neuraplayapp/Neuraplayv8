import { slugify, normalizeText } from './utils';

export interface LabelEntry {
  id: string;         // stable id
  label: string;      // display label (Title Case)
  slug: string;       // normalized form (kebab)
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export class LabelStore {
  private static instance: LabelStore;
  private bySlug: Map<string, LabelEntry> = new Map();

  static getInstance(): LabelStore {
    if (!LabelStore.instance) LabelStore.instance = new LabelStore();
    return LabelStore.instance;
  }

  getAll(): LabelEntry[] { return Array.from(this.bySlug.values()); }

  add(label: string, tags?: string[]): LabelEntry {
    const slug = slugify(label);
    const existing = this.bySlug.get(slug);
    if (existing) return existing;
    const entry: LabelEntry = {
      id: cryptoRandomId(),
      label,
      slug,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.bySlug.set(slug, entry);
    return entry;
  }

  findMatch(normalizedInput: string): LabelEntry | undefined {
    const slug = slugify(normalizedInput);
    return this.bySlug.get(slug);
  }
}

// Small random id without external deps
function cryptoRandomId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const labelStore = LabelStore.getInstance();

