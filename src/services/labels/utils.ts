export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set<string>([
  'the','a','an','and','or','but','if','then','else','when','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','once','here','there','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will','just','don','should','now','is','are','was','were','be','been','being','of'
]);

export function tokenizeSignificantWords(input: string): string[] {
  const norm = normalizeText(input);
  return norm.split(' ').filter(t => t && !STOPWORDS.has(t));
}

// Jaro-Winkler similarity
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const m = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches: boolean[] = new Array(a.length).fill(false);
  const bMatches: boolean[] = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - m);
    const end = Math.min(i + m + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const transpositions = t / 2;
  const jaro = (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;
  // Winkler prefix scale
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  const p = 0.1;
  return jaro + prefix * p * (1 - jaro);
}

// Token similarity (Jaccard)
export function tokenJaccard(aTokens: string[], bTokens: string[]): number {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let inter = 0;
  aSet.forEach(t => { if (bSet.has(t)) inter++; });
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : inter / union;
}

export function toTitleCase(input: string): string {
  return input.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1));
}

