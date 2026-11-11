export interface LocalResult {
  mode: string;
  winner: string;
  wave: number;
  seconds: number;
  at: number;
}

const KEY = 'chessdefense-history';

export function recentMatches(): LocalResult[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalResult[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function rememberMatch(result: LocalResult): void {
  try {
    const next = [result, ...recentMatches()].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}
