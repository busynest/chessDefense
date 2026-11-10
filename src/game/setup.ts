import type { Difficulty, GameState, Mode, PieceKind, Side, Tower } from './types.js';
import { ECONOMY, PIECES } from './units.js';

const BACK: PieceKind[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

/**
 * Neutral obstacles on the 256-grid. They sit in the center with a two-cell
 * gap, plus open files on both wings, so armies can route around them.
 */
export const START_BLOCKS = [
  { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 },
  { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 },
];

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
      spawnReadyTick: 8 + stagger,
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
    wave: 1,
    nextWaveTick: ECONOMY.waveEveryTicks,
    gold: { white: 36, black: 36 },
    mana: { white: 18, black: 18 },
    towers,
    soldiers: [],
    projectiles: [],
    blocks: START_BLOCKS.map((block) => ({ ...block })),
    effects: [],
    banner: { text: 'The towns are mustering.', until: 30 },
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
