import type { Cell, GameState, Side, Tower } from './types.js';

export function towerCells(tower: Tower): Cell[] {
  const x = tower.file * 2;
  const y = tower.rank * 2;
  return [
    { x, y },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x + 1, y: y + 1 },
  ];
}

export function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function distToTower(x: number, y: number, tower: Tower): number {
  let best = Infinity;
  for (const cell of towerCells(tower)) {
    const dist = chebyshev(x, y, cell.x, cell.y);
    if (dist < best) best = dist;
  }
  return best;
}

/** Towers and neutral blocks occupy army cells. Soldiers do not, so lanes can stack. */
export function blockedSet(state: GameState): Set<number> {
  const blocked = new Set<number>();
  for (const block of state.blocks) blocked.add(block.y * 16 + block.x);
  for (const tower of state.towers) {
    if (tower.hp <= 0) continue;
    for (const cell of towerCells(tower)) blocked.add(cell.y * 16 + cell.x);
  }
  return blocked;
}

export function isBlockedCell(blocked: Set<number>, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x > 15 || y > 15) return true;
  return blocked.has(y * 16 + x);
}

/**
 * Walk toward the closest reachable cell to the enemy king.
 * The king often starts walled in by friendly towers, so the goal is
 * "as close as the grid allows" rather than a free square beside the king.
 * Returns steps after the current cell, capped so state stays small.
 */
export function pathToward(state: GameState, x: number, y: number, side: Side): Cell[] {
  const king = state.towers.find((tower) => tower.side !== side && tower.kind === 'king' && tower.hp > 0);
  if (!king) return [];
  const blocked = blockedSet(state);
  const sx = Math.round(x);
  const sy = Math.round(y);
  if (sx < 0 || sy < 0 || sx > 15 || sy > 15) return [];
  const start = sy * 16 + sx;
  const previous = new Map<number, number>();
  const queue: number[] = [start];
  previous.set(start, -1);
  let best = start;
  let bestDist = distToTower(sx, sy, king);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const cx = current % 16;
    const cy = (current / 16) | 0;
    const dist = distToTower(cx, cy, king);
    if (dist < bestDist) {
      best = current;
      bestDist = dist;
    }
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (isBlockedCell(blocked, nx, ny)) continue;
        const key = ny * 16 + nx;
        if (previous.has(key)) continue;
        previous.set(key, current);
        queue.push(key);
      }
    }
  }
  if (best === start) return [];
  const cells: Cell[] = [];
  let cursor = best;
  while (cursor !== start && cursor >= 0) {
    cells.push({ x: cursor % 16, y: (cursor / 16) | 0 });
    cursor = previous.get(cursor) ?? -1;
  }
  cells.reverse();
  return cells.slice(0, 12);
}
