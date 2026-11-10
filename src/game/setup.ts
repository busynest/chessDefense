import type { Difficulty, GameState, Mode, PieceKind, Side, Tower } from './types.js';
import { PIECES, WAVES } from './units.js';

const BACK: PieceKind[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

export function createMatch(options: { mode: Mode; difficulty: Difficulty; seed: number; humanSide?: Side }): GameState {
  const seed = options.seed >>> 0 || 1;
  const towers: Tower[] = [];
  let nextId = 1;
  const add = (side: Side, kind: PieceKind, file: number, rank: number, stagger: number) => {
    const def = PIECES[kind];
    towers.push({
      id: `t${nextId}`,
      side,
      kind,
      file,
      rank,
      hp: def.hp,
      maxHp: def.hp,
      moveReadyTick: 0,
      auraReadyTick: 6 + (stagger % 5),
      hurtBy: null,
    });
    nextId += 1;
  };

  BACK.forEach((kind, file) => add('white', kind, file, 0, file));
  for (let file = 0; file < 8; file += 1) add('white', 'pawn', file, 1, file);
  BACK.forEach((kind, file) => add('black', kind, file, 7, file));
  for (let file = 0; file < 8; file += 1) add('black', 'pawn', file, 6, file + 8);

  return {
    tick: 0,
    status: 'playing',
    mode: options.mode,
    difficulty: options.difficulty,
    humanSide: options.humanSide ?? 'white',
    winner: null,
    seed,
    rng: seed,
    nextId,
    wave: 0,
    nextWaveTick: WAVES.firstWaveTick,
    gold: { white: 48, black: 48 },
    mana: { white: 18, black: 18 },
    towers,
    soldiers: [],
    projectiles: [],
    blocks: [],
    effects: [],
    banner: { text: 'Destroy the enemy King tower. Wave 1 has not marched.', until: WAVES.firstWaveTick },
  };
}

export function createMenu(): GameState {
  const match = createMatch({ mode: 'ai', difficulty: 'normal', seed: 1 });
  match.status = 'menu';
  match.towers = [];
  match.blocks = [];
  match.banner = null;
  return match;
}
