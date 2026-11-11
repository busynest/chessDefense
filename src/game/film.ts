import type { GameState } from './types.js';

/** One pose every half second, kept for the last 30 seconds. Paths are dropped. */
export function rememberPose(film: GameState[], game: GameState): void {
  if (game.status !== 'playing' && game.status !== 'victory') return;
  if (game.tick % 5 !== 0 && game.status !== 'victory') return;
  const last = film[film.length - 1];
  if (last && last.tick === game.tick) return;
  const pose = structuredClone(game);
  for (const soldier of pose.soldiers) soldier.path = [];
  pose.projectiles = [];
  film.push(pose);
  const minTick = game.tick - 300;
  while (film.length > 1 && film[0]!.tick < minTick) film.shift();
}
