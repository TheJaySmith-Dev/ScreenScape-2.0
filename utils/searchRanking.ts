export function tokenize(input: string): string[] {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // Early exit for large length differences
  if (Math.abs(m - n) > 2) return Math.abs(m - n);
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function fuzzyTokenMatch(queryToken: string, targetToken: string): boolean {
  // Allow exact, prefix, or edit distance <= 1
  if (queryToken === targetToken) return true;
  if (targetToken.startsWith(queryToken)) return true;
  return levenshtein(queryToken, targetToken) <= 1;
}

export function computeMatchScore(title: string, query: string): number {
  if (!title || !query) return 0;
  const q = query.toLowerCase().trim();
  const t = title.toLowerCase();

  let score = 0;

  // Strong exact/startsWith boosts
  if (t === q) score += 100;
  if (t.startsWith(q)) score += 40;
  if (t.includes(q)) score += 25;

  const qTokens = tokenize(q);
  const tTokens = tokenize(t);

  // Token-based scoring: prefix and fuzzy matches
  for (const qt of qTokens) {
    for (const tt of tTokens) {
      if (!qt || !tt) continue;
      if (qt.length >= 2 && tt.startsWith(qt)) score += 10;
      if (qt === tt) score += 15;
      if (fuzzyTokenMatch(qt, tt)) score += 8;
    }
  }

  // Prefer more popular titles when tie-breaking handled externally
  return score;
}

export function rankByQuery<T extends { title?: string; name?: string; popularity?: number }>(
  items: T[],
  query: string
): { item: T; score: number }[] {
  return items
    .map((item) => ({
      item,
      score: computeMatchScore(item.title || item.name || '', query),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ap = (a.item.popularity ?? 0) as number;
      const bp = (b.item.popularity ?? 0) as number;
      return bp - ap;
    });
}

