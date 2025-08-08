import { labelStore } from './LabelStore';
import { normalizeText, tokenizeSignificantWords, slugify, jaroWinkler, tokenJaccard, toTitleCase } from './utils';

export function suggestLabel(input: { name?: string; text?: string; tags?: string[] }): { label: string; is_new: boolean } {
  const source = (input.name || input.text || '').trim();
  const norm = normalizeText(source);
  const tokens = tokenizeSignificantWords(source);

  // 1) Exact/normalized match
  const exact = labelStore.findMatch(norm);
  if (exact) return { label: exact.label, is_new: false };

  // 2) Similarity search among existing labels
  const labels = labelStore.getAll();
  let best: { entry: typeof labels[number]; score: number } | null = null;
  for (const entry of labels) {
    const jw = jaroWinkler(slugify(source), entry.slug);
    const jac = tokenJaccard(tokens, tokenizeSignificantWords(entry.label));
    const score = 0.7 * jw + 0.3 * jac;
    if (!best || score > best.score) best = { entry, score };
  }
  if (best && best.score >= 0.88) {
    return { label: best.entry.label, is_new: false };
  }

  // 3) Generate concise new label (2–4 significant words)
  const significant = tokens.slice(0, 4);
  const title = toTitleCase(significant.join(' ')) || 'General';
  const created = labelStore.add(title, input.tags);
  return { label: created.label, is_new: true };
}

