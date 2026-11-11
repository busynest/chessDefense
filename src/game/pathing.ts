import type { Cell, GameState, Side, Tower } from './types.js';
import { BLOCKS } from './units.js';

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

/**
 * Nearest cell. A point halfway between two cells steps toward the board's
 * center, so a soldier and its mirror pick mirrored cells.
 */
export function cellIndex(value: number): number {
  const floor = Math.floor(value + 1e-9);
  const frac = value - floor;
  if (Math.abs(frac - 0.5) > 1e-6) return Math.round(value);
  return value < 7.5 ? floor + 1 : floor;
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

export interface WallCell {
  x: number;
  y: number;
  hp: number;
}

/**
 * '' when every living tower can still reach every enemy attack ring
 * without adding more than BLOCKS.extraSteps to the open-board route.
 * 'cut' when a ring cannot be reached. 'long' when the detour is too far.
 * The walk starts on the tower's own front cell and may cross friendly
 * towers, matching the way a soldier leaves home.
 */
export function mazeVerdict(towers: Tower[], blocks: WallCell[], extra?: { x: number; y: number }): '' | 'cut' | 'long' {
  const key = mazeKey(towers, blocks, extra);
  const cached = MAZE.get(key);
  if (cached !== undefined) return cached;
  const verdict = judgeMaze(towers, blocks, extra);
  if (MAZE.size > 64) MAZE.clear();
  MAZE.set(key, verdict);
  return verdict;
}

/** Longest soldier route, in steps, from any living tower to any enemy ring. */
export function longestRoute(towers: Tower[], blocks: WallCell[]): number {
  const survey = surveyRoutes(living(towers), wallMask(blocks, null));
  return survey.cut ? Infinity : survey.longest;
}

const MAZE = new Map<string, '' | 'cut' | 'long'>();

function mazeKey(towers: Tower[], blocks: WallCell[], extra?: { x: number; y: number }): string {
  let towersKey = '';
  for (const tower of towers) {
    if (tower.hp <= 0) continue;
    towersKey += tower.id;
    towersKey += ',';
  }
  const mask = wallMask(blocks, extra ?? null);
  let wallsKey = '';
  for (let i = 0; i < 256; i += 1) {
    if (mask[i] !== 1) continue;
    wallsKey += i.toString(16);
    wallsKey += '.';
  }
  return `${towersKey}|${wallsKey}`;
}

function living(towers: Tower[]): Tower[] {
  return towers.filter((tower) => tower.hp > 0);
}

function wallMask(blocks: WallCell[], extra: { x: number; y: number } | null): Uint8Array {
  const mask = new Uint8Array(256);
  for (const block of blocks) {
    if (block.hp <= 0) continue;
    mask[block.y * 16 + block.x] = 1;
  }
  if (extra) mask[extra.y * 16 + extra.x] = 1;
  return mask;
}

function judgeMaze(towers: Tower[], blocks: WallCell[], extra?: { x: number; y: number }): '' | 'cut' | 'long' {
  const pieces = living(towers);
  if (pieces.length === 0) return '';
  const towerBlocked = towerMask(pieces);
  const walled = mergeMasks(towerBlocked, wallMask(blocks, extra ?? null));
  const nearest = nearestOf(pieces, towerBlocked);
  for (const source of pieces) {
    const openDist = openDistances(pieces, source, towerBlocked);
    const wallDist = distancesFrom(source, pieces, walled);
    for (const target of pieces) {
      if (target.side === source.side) continue;
      const limit = nearest.get(target.id) ?? Infinity;
      const openBest = ringDistance(openDist, towerBlocked, target, limit);
      const wallBest = ringDistance(wallDist, walled, target, limit);
      if (!Number.isFinite(openBest) || !Number.isFinite(wallBest)) return 'cut';
      if (wallBest > openBest + BLOCKS.extraSteps) return 'long';
    }
  }
  return '';
}

const OPEN_DIST = new Map<string, Int16Array>();

function openDistances(pieces: Tower[], source: Tower, towerBlocked: Uint8Array): Int16Array {
  const key = `${pieces.map((tower) => tower.id).join(',')}:${source.id}`;
  const cached = OPEN_DIST.get(key);
  if (cached) return cached;
  const dist = distancesFrom(source, pieces, towerBlocked);
  if (OPEN_DIST.size > 64) OPEN_DIST.clear();
  OPEN_DIST.set(key, dist);
  return dist;
}

function surveyRoutes(pieces: Tower[], walls: Uint8Array): { longest: number; cut: boolean } {
  const towerBlocked = towerMask(pieces);
  const blocked = mergeMasks(towerBlocked, walls);
  const nearest = nearestOf(pieces, towerBlocked);
  let longest = 0;
  for (const source of pieces) {
    const dist = distancesFrom(source, pieces, blocked);
    for (const target of pieces) {
      if (target.side === source.side) continue;
      const best = ringDistance(dist, blocked, target, nearest.get(target.id) ?? Infinity);
      if (!Number.isFinite(best)) return { longest, cut: true };
      if (best > longest) longest = best;
    }
  }
  return { longest, cut: false };
}

function towerMask(pieces: Tower[]): Uint8Array {
  const mask = new Uint8Array(256);
  for (const tower of pieces) {
    for (const cell of towerCells(tower)) mask[cell.y * 16 + cell.x] = 1;
  }
  return mask;
}

function nearestOf(pieces: Tower[], blocked: Uint8Array): Map<string, number> {
  const nearest = new Map<string, number>();
  for (const tower of pieces) nearest.set(tower.id, nearestOpen(tower, blocked));
  return nearest;
}

function ringDistance(dist: Int16Array, blocked: Uint8Array, target: Tower, limit: number): number {
  let best = Infinity;
  for (let i = 0; i < 256; i += 1) {
    if (blocked[i] !== 0 || dist[i] < 0) continue;
    const gap = distToTower(i % 16, (i / 16) | 0, target);
    if (gap <= 0 || gap > limit) continue;
    if (dist[i]! < best) best = dist[i]!;
  }
  return best;
}

function mergeMasks(towers: Uint8Array, walls: Uint8Array): Uint8Array {
  const mask = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) mask[i] = towers[i] || walls[i] ? 1 : 0;
  return mask;
}

function nearestOpen(tower: Tower, blocked: Uint8Array): number {
  let nearest = Infinity;
  for (let i = 0; i < 256; i += 1) {
    if (blocked[i] !== 0) continue;
    const gap = distToTower(i % 16, (i / 16) | 0, tower);
    if (gap < nearest) nearest = gap;
  }
  return nearest;
}

function frontKey(tower: Tower): number {
  const x = tower.file * 2;
  const y = tower.side === 'white' ? tower.rank * 2 + 1 : tower.rank * 2;
  return y * 16 + x;
}

function distancesFrom(source: Tower, pieces: Tower[], blocked: Uint8Array): Int16Array {
  const friendly = new Uint8Array(256);
  for (const tower of pieces) {
    if (tower.side !== source.side) continue;
    for (const cell of towerCells(tower)) friendly[cell.y * 16 + cell.x] = 1;
  }
  const dist = new Int16Array(256);
  dist.fill(-1);
  const start = frontKey(source);
  dist[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head]!;
    head += 1;
    const x = current % 16;
    const y = (current / 16) | 0;
    const base = dist[current] ?? 0;
    const onFriend = friendly[current] === 1;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
        const next = ny * 16 + nx;
        if (dist[next] !== -1) continue;
        const open = blocked[next] === 0;
        if (onFriend) {
          if (!open && friendly[next] !== 1) continue;
        } else if (!open) continue;
        dist[next] = base + 1;
        queue.push(next);
      }
    }
  }
  return dist;
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
  const forward = side === 'white' ? 1 : -1;
  ahead.sort((a, b) => distToTower(x, y, a) - distToTower(x, y, b)
    || a.file - b.file
    || (b.rank - a.rank) * forward);
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
export function pathToTower(state: GameState, x: number, y: number, tower: Tower, range: number, lane: number, compass: 'symmetric' | 'north' | 'south' = 'symmetric'): Cell[] {
  const field = flowToTower(state, tower, range);
  let cursor = cellIndex(y) * 16 + cellIndex(x);
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
    const tx = tower.file * 2 + 0.5;
    const ty = tower.rank * 2 + 0.5;
    const goalNorth = ty >= cy ? 1 : -1;
    options.sort((a, b) => {
      const north = (((b / 16) | 0) - ((a / 16) | 0)) * goalNorth;
      const forward = lane < 0 || compass === 'south' ? -north : north;
      if (compass === 'symmetric' && lane >= 0) return compareStep(a, b, cx, cy, tx, ty);
      return forward || compareStep(a, b, cx, cy, tx, ty);
    });
    const pick = options[(Math.abs(lane) + step) % options.length]!;
    cells.push({ x: pick % 16, y: (pick / 16) | 0 });
    cursor = pick;
  }
  return cells;
}

/** Equal steps prefer the one closer to the tower, then the one nearer its file. A west tie-break is the same for both colors. */
function compareStep(a: number, b: number, cx: number, cy: number, tx: number, ty: number): number {
  const ax = a % 16;
  const ay = (a / 16) | 0;
  const bx = b % 16;
  const by = (b / 16) | 0;
  return chebyshev(ax, ay, tx, ty) - chebyshev(bx, by, tx, ty)
    || Math.abs(ax - tx) - Math.abs(bx - tx)
    || Math.abs(ay - ty) - Math.abs(by - ty)
    || Math.abs(ax - cx) - Math.abs(bx - cx)
    || Math.abs(ay - cy) - Math.abs(by - cy)
    || ax - bx;
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
