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

/**
 * True when this one extra wall would cut every route between the two home ranks.
 * Tower cells are not walls: the pawn rank is meant to be fought through.
 * A maze with a single gap still connects y 0 to y 15.
 */
export function placementSeals(blocks: { x: number; y: number }[], x: number, y: number): boolean {
  const blocked = new Set(blocks.map((block) => block.y * 16 + block.x));
  blocked.add(y * 16 + x);
  return !rankReaches(blocked, 15, 0) || !rankReaches(blocked, 0, 15);
}

function rankReaches(blocked: Set<number>, fromY: number, toY: number): boolean {
  const queue: number[] = [];
  const seen = new Set<number>();
  for (let x = 0; x < 16; x += 1) {
    if (blocked.has(fromY * 16 + x)) continue;
    const key = fromY * 16 + x;
    queue.push(key);
    seen.add(key);
  }
  while (queue.length > 0) {
    const current = queue.shift()!;
    const cy = (current / 16) | 0;
    if (cy === toY) return true;
    const cx = current % 16;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
        const key = ny * 16 + nx;
        if (blocked.has(key) || seen.has(key)) continue;
        seen.add(key);
        queue.push(key);
      }
    }
  }
  return false;
}

/** Towers and blocks occupy army cells. Soldiers do not, so lanes can stack. */
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
    const neighbors: Array<{ key: number; dist: number; forward: number }> = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (isBlockedCell(blocked, nx, ny)) continue;
        const key = ny * 16 + nx;
        if (previous.has(key)) continue;
        const forward = side === 'white' ? ny - cy : cy - ny;
        neighbors.push({ key, dist: distToTower(nx, ny, king), forward });
      }
    }
    neighbors.sort((a, b) => a.dist - b.dist || b.forward - a.forward || a.key - b.key);
    for (const neighbor of neighbors) {
      if (previous.has(neighbor.key)) continue;
      previous.set(neighbor.key, current);
      queue.push(neighbor.key);
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
