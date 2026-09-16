const normalize = (name) => String(name ?? '').toLowerCase()
  .normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Normalized Levenshtein similarity: 1 means identical, 0 means no match.
export const nameSimilarity = (first, second) => {
  const a = normalize(first);
  const b = normalize(second);
  if (!a || !b) return 0;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = next;
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
};
