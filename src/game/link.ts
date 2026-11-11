import type { GameState, Side } from './types.js';

/** Emulator and local delay profile: 150ms, ±50ms, 2% loss. */
export const WIRE = { latencyMs: 150, jitterMs: 50, dropRate: 0.02 } as const;

/** A peer with no pulse for this long is treated as dropped. */
export const STALE_MS = 4_000;

/** How long a dropped peer may return before the match is forfeited. */
export const RECONNECT_MS = 30_000;

export interface WireProfile {
  latencyMs: number;
  jitterMs: number;
  dropRate: number;
}

export type LinkPhase = 'live' | 'reconnecting' | 'forfeit';

/**
 * One transit decision. `roll` and `jitterRoll` are in [0, 1).
 * A drop still reports the delay, so a retry waits like a late packet.
 */
export function transit(roll: number, jitterRoll: number, profile: WireProfile = WIRE): { drop: boolean; delayMs: number } {
  const swing = (jitterRoll * 2 - 1) * profile.jitterMs;
  return {
    drop: roll < profile.dropRate,
    delayMs: Math.max(0, Math.round(profile.latencyMs + swing)),
  };
}

/**
 * `peerSeen` is the peer's last pulse, in ms. Zero means they have not
 * connected yet, which stays live so a lobby does not forfeit itself.
 */
export function linkPhase(now: number, peerSeen: number, noticedAt: number | null): { phase: LinkPhase; noticedAt: number | null } {
  if (peerSeen <= 0 || now - peerSeen <= STALE_MS) return { phase: 'live', noticedAt: null };
  const since = noticedAt ?? now;
  if (now - since >= RECONNECT_MS) return { phase: 'forfeit', noticedAt: since };
  return { phase: 'reconnecting', noticedAt: since };
}

export function secondsLeft(now: number, noticedAt: number | null): number {
  if (noticedAt == null) return Math.ceil(RECONNECT_MS / 1000);
  return Math.max(0, Math.ceil((RECONNECT_MS - (now - noticedAt)) / 1000));
}

/** Ids in `incoming` that have not been applied. Order is kept. Duplicates collapse. */
export function unseenIds(known: ReadonlySet<string>, incoming: readonly string[]): string[] {
  const fresh: string[] = [];
  const seen = new Set(known);
  for (const id of incoming) {
    if (seen.has(id)) continue;
    seen.add(id);
    fresh.push(id);
  }
  return fresh;
}

export class Presence {
  noticedAt: number | null = null;
  phase: LinkPhase = 'live';

  see(now: number, peerSeen: number): LinkPhase {
    const next = linkPhase(now, peerSeen, this.noticedAt);
    this.noticedAt = next.noticedAt;
    this.phase = next.phase;
    return this.phase;
  }
}

/** Online end. Towers are left as they were. The banner names who dropped. */
export function forfeitState(state: GameState, winner: Side, whoLeft: Side): GameState {
  const next = structuredClone(state);
  next.status = 'victory';
  next.winner = winner;
  const name = whoLeft === 'white' ? 'White' : 'Black';
  next.banner = { text: `${name} left the match.`, until: next.tick + 99999 };
  return next;
}
