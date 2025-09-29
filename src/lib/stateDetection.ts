import { STATE_PROFILE_MAP } from "@/data/stateGroundwaterData";

// Basic list for fuzzy detection; can be expanded with regex variants / abbreviations
const STATE_KEYS = Object.keys(STATE_PROFILE_MAP).filter(k => !k.includes(" "));

export interface DetectedStateResult {
  key: string | null;
  confidence: number; // 0-1
  matchedText?: string;
}

// Very lightweight fuzzy matching (substring / edit distance <=2 for short tokens)
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
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

export function detectStateFromText(text: string): DetectedStateResult {
  const lower = text.toLowerCase();
  let best: DetectedStateResult = { key: null, confidence: 0 };

  for (const key of STATE_KEYS) {
    const profile = STATE_PROFILE_MAP[key];
    if (!profile) continue;
    const name = profile.name.toLowerCase();

    if (lower.includes(name)) {
      return { key: profile.key, confidence: 0.98, matchedText: name };
    }

    // token-level fuzzy (only for short names)
    const tokens = lower.split(/[^a-z]+/g).filter(Boolean);
    for (const token of tokens) {
      if (token.length < 3) continue;
      const dist = levenshtein(token, name);
      const maxLen = Math.max(token.length, name.length);
      const score = 1 - dist / maxLen;
      if (score > best.confidence && score > 0.78) {
        best = { key: profile.key, confidence: score, matchedText: token };
      }
    }
  }
  return best;
}

export function pickProfileByText(text: string) {
  const detected = detectStateFromText(text);
  if (detected.key) return STATE_PROFILE_MAP[detected.key];
  return null;
}
