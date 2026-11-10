import type { Difficulty, GameState, Mode, Personality, PieceKind, Side, Tower } from './types.js';
import { emptyLedger } from './ledger.js';
import { ECONOMY, PIECES, WAVES } from './units.js';

const BACK: PieceKind[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

export function createMatch(options: { mode: Mode; difficulty: Difficulty; seed: number; humanSide?: Side; personality?: Personality }): GameState {
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
      level: 1,
      attackReadyTick: 4 + (stagger % 5),
      repairReadyTick: 0,
      mendedTick: 0,
      overchargeUntil: 0,
      overchargeReadyTick: 0,
      overchargeUses: 0,
      hurtBy: null,
    });
    nextId += 1;
  };

  BACK.forEach((kind, file) => add('white', kind, file, 0, file));
  for (let file = 0; file < 8; file += 1) add('white', 'pawn', file, 1, file);
  BACK.forEach((kind, file) => add('black', kind, file, 7, file));
  for (let file = 0; file < 8; file += 1) add('black', 'pawn', file, 6, file);

  return {
    tick: 0,
    status: 'playing',
    mode: options.mode,
    difficulty: options.difficulty,
    ...(options.personality ? { personality: options.personality } : {}),
    humanSide: options.humanSide ?? 'white',
    winner: null,
    seed,
    rng: seed,
    rngBlack: (Math.imul(seed, 1664525) ^ 0x9e3779b9) >>> 0 || 1,
    nextId,
    wave: 0,
    nextWaveTick: WAVES.firstWaveTick,
    gold: { white: ECONOMY.startingGold, black: ECONOMY.startingGold },
    mana: { white: ECONOMY.startingMana, black: ECONOMY.startingMana },
    towers,
    soldiers: [],
    projectiles: [],
    blocks: [],
    effects: [],
    banner: { text: 'Towers are fixed. Destroy the enemy King tower.', until: WAVES.firstWaveTick },
    waveTarget: { white: null, black: null },
    navHash: 0,
    navStamp: 0,
    ledger: emptyLedger(),
    initiative: seed % 2 === 0 ? 'white' : 'black',
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
