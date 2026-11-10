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
 * When a soldier's marked tower is gone, pick the living enemy tower
 * closest to the soldier among those closer to the enemy King than the
 * soldier is. Null means march on the King.
 */
export function fallbackAim(state: GameState, side: Side, x: number, y: number): { file: number; rank: number } | null {
  const king = state.towers.find((tower) => tower.side !== side && tower.kind === 'king' && tower.hp > 0);
  const kingDist = king ? distToTower(x, y, king) : Infinity;
  const ahead = state.towers.filter((tower) => {
    if (tower.side === side || tower.hp <= 0 || tower.kind === 'king') return false;
    if (!king) return true;
    return distToTower(tower.file * 2 + 0.5, tower.rank * 2 + 0.5, king) < kingDist - 0.5;
  });
  if (ahead.length === 0) return null;
  ahead.sort((a, b) => distToTower(x, y, a) - distToTower(x, y, b) || a.file - b.file || a.rank - b.rank);
  const pick = ahead[0]!;
  return { file: pick.file, rank: pick.rank };
}

const FLOW = new Map<string, Int16Array>();

function navKey(blocked: Set<number>, tower: Tower, range: number): string {
  let hash = 2166136261;
  for (let i = 0; i < 256; i += 1) {
    if (!blocked.has(i)) continue;
    hash = Math.imul(hash ^ i, 16777619);
  }
  return `${tower.file}${tower.rank}:${range}:${hash >>> 0}`;
}

/** Distance, in steps, from every open cell to the tower's attack ring. */
export function flowToTower(state: GameState, tower: Tower, range: number): Int16Array {
  const blocked = blockedSet(state);
  const key = navKey(blocked, tower, range);
  const cached = FLOW.get(key);
  if (cached) return cached;
  const dist = new Int16Array(256);
  dist.fill(-1);
  let nearest = Infinity;
  for (let i = 0; i < 256; i += 1) {
    if (blocked.has(i)) continue;
    const gap = distToTower(i % 16, (i / 16) | 0, tower);
    if (gap < nearest) nearest = gap;
  }
  const ring = nearest <= range ? range : nearest;
  const queue: number[] = [];
  for (let i = 0; i < 256; i += 1) {
    if (blocked.has(i)) continue;
    const gap = distToTower(i % 16, (i / 16) | 0, tower);
    if (gap > 0 && gap <= ring) {
      dist[i] = 0;
      queue.push(i);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const current = queue[head]!;
    head += 1;
    const cx = current % 16;
    const cy = (current / 16) | 0;
    const base = dist[current] ?? 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (isBlockedCell(blocked, nx, ny)) continue;
        const next = ny * 16 + nx;
        if (dist[next] !== -1) continue;
        dist[next] = base + 1;
        queue.push(next);
      }
    }
  }
  if (FLOW.size > 48) FLOW.clear();
  FLOW.set(key, dist);
  return dist;
}

/**
 * Steps toward the attack ring of a tower. Equal shortest steps are spread
 * by `lane` so a wave does not stack on one file. Already in range returns
 * an empty path. Deterministic for the same grid, tower, range, and lane.
 */
export function pathToTower(state: GameState, x: number, y: number, tower: Tower, range: number, lane: number): Cell[] {
  const field = flowToTower(state, tower, range);
  let cursor = Math.round(y) * 16 + Math.round(x);
  if (cursor < 0 || cursor > 255 || (field[cursor] ?? -1) <= 0) return [];
  const cells: Cell[] = [];
  for (let step = 0; step < 10 && (field[cursor] ?? -1) > 0; step += 1) {
    const cx = cursor % 16;
    const cy = (cursor / 16) | 0;
    const options: number[] = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
        const key = ny * 16 + nx;
        if (field[key] === (field[cursor] ?? 0) - 1) options.push(key);
      }
    }
    if (options.length === 0) break;
    options.sort((a, b) => a - b);
    const pick = options[(lane + step) % options.length]!;
    cells.push({ x: pick % 16, y: (pick / 16) | 0 });
    cursor = pick;
  }
  return cells;
}

/**
 * Walk toward the enemy King's attack ring.
 * The king often starts walled in by friendly towers, so the goal is
 * the closest open cell the grid allows.
 */
export function pathToward(state: GameState, x: number, y: number, side: Side): Cell[] {
  const king = state.towers.find((tower) => tower.side !== side && tower.kind === 'king' && tower.hp > 0);
  if (!king) return [];
  return pathToTower(state, x, y, king, 1, 0);
}

/** A faint route from the middle of a side's front to its marked tower. The King draws no preview. */
export function previewRoute(state: GameState, side: Side): Cell[] {
  const mark = state.waveTarget[side];
  if (!mark) return [];
  const tower = state.towers.find((piece) => piece.hp > 0 && piece.file === mark.file && piece.rank === mark.rank && piece.side !== side);
  if (!tower) return [];
  const y = side === 'white' ? 4 : 11;
  return pathToTower(state, 8, y, tower, 1, 0);
}
