import type { GameState, Square, Tower } from './types.js';

const KNIGHT: ReadonlyArray<readonly [number, number]> = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];

const BISHOP: ReadonlyArray<readonly [number, number]> = [
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const ROOK: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

const KING: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export function onBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

export function towerAt(state: GameState, file: number, rank: number): Tower | undefined {
  return state.towers.find((tower) => tower.hp > 0 && tower.file === file && tower.rank === rank);
}

export function occupancy(state: GameState): Map<string, Tower> {
  const map = new Map<string, Tower>();
  for (const tower of state.towers) {
    if (tower.hp > 0) map.set(`${tower.file},${tower.rank}`, tower);
  }
  return map;
}

/**
 * Legal chess moves for a tower.
 * No castling, no en passant, and pawns do not promote.
 * A move onto an enemy tower is a capture. Friendly towers block the square.
 * Sliding pieces cannot jump. Knights can.
 */
export function legalMoves(state: GameState, tower: Tower): Square[] {
  if (tower.hp <= 0) return [];
  const occ = occupancy(state);
  if (tower.kind === 'pawn') return pawnMoves(tower, occ);
  if (tower.kind === 'knight') return jumpMoves(tower, occ, KNIGHT);
  if (tower.kind === 'king') return jumpMoves(tower, occ, KING);
  if (tower.kind === 'bishop') return slideMoves(tower, occ, BISHOP, 7);
  if (tower.kind === 'rook') return slideMoves(tower, occ, ROOK, 7);
  return slideMoves(tower, occ, KING, 7);
}

function pawnMoves(tower: Tower, occ: Map<string, Tower>): Square[] {
  const dir = tower.side === 'white' ? 1 : -1;
  const start = tower.side === 'white' ? 1 : 6;
  const moves: Square[] = [];
  const one = tower.rank + dir;
  if (onBoard(tower.file, one) && !occ.has(`${tower.file},${one}`)) {
    moves.push({ file: tower.file, rank: one });
    const two = tower.rank + dir * 2;
    if (tower.rank === start && onBoard(tower.file, two) && !occ.has(`${tower.file},${two}`)) {
      moves.push({ file: tower.file, rank: two });
    }
  }
  for (const file of [tower.file - 1, tower.file + 1]) {
    const rank = tower.rank + dir;
    if (!onBoard(file, rank)) continue;
    const target = occ.get(`${file},${rank}`);
    if (target && target.side !== tower.side) moves.push({ file, rank });
  }
  return moves;
}

function jumpMoves(
  tower: Tower,
  occ: Map<string, Tower>,
  deltas: ReadonlyArray<readonly [number, number]>,
): Square[] {
  const moves: Square[] = [];
  for (const [dx, dy] of deltas) {
    const file = tower.file + dx;
    const rank = tower.rank + dy;
    if (!onBoard(file, rank)) continue;
    const target = occ.get(`${file},${rank}`);
    if (!target || target.side !== tower.side) moves.push({ file, rank });
  }
  return moves;
}

function slideMoves(
  tower: Tower,
  occ: Map<string, Tower>,
  deltas: ReadonlyArray<readonly [number, number]>,
  max: number,
): Square[] {
  const moves: Square[] = [];
  for (const [dx, dy] of deltas) {
    for (let step = 1; step <= max; step += 1) {
      const file = tower.file + dx * step;
      const rank = tower.rank + dy * step;
      if (!onBoard(file, rank)) break;
      const target = occ.get(`${file},${rank}`);
      if (!target) {
        moves.push({ file, rank });
        continue;
      }
      if (target.side !== tower.side) moves.push({ file, rank });
      break;
    }
  }
  return moves;
}
