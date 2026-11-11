import type { MatchStatus } from './types.js';

/**
 * Host publishes twice a second while the match is live, and once more when
 * the King falls so the guest sees the same win or loss.
 */
export function shouldPublish(status: MatchStatus, tick: number, lastPublish: number): boolean {
  if (tick === lastPublish) return false;
  if (status === 'victory') return true;
  return status === 'playing' && tick % 5 === 0;
}
