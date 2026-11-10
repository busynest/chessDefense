export type Side = 'white' | 'black';
export type PieceKind = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type SoldierKind = 'peasant' | 'knight' | 'archer' | 'cannon' | 'mage' | 'guard';
export type SpellId = 'blessing' | 'heal' | 'blast';
export type Mode = 'ai' | 'local' | 'online';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type MatchStatus = 'menu' | 'lobby' | 'playing' | 'paused' | 'victory';

export interface Square {
  file: number;
  rank: number;
}

export interface Cell {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  side: Side;
  kind: PieceKind;
  file: number;
  rank: number;
  hp: number;
  maxHp: number;
  moveReadyTick: number;
  spawnReadyTick: number;
  auraReadyTick: number;
  hurtBy: Side | null;
}

export interface Soldier {
  id: string;
  side: Side;
  kind: SoldierKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attackReadyTick: number;
  repathTick: number;
  path: Cell[];
  buffUntil: number;
  buffStr: number;
  buffSpeed: number;
  hurtBy: Side | null;
}

export interface Projectile {
  id: string;
  side: Side;
  kind: 'shot' | 'arrow' | 'shell' | 'magic';
  x: number;
  y: number;
  tx: number;
  ty: number;
  born: number;
  life: number;
}

export interface Block {
  x: number;
  y: number;
}

export interface Pulse {
  id: string;
  side: Side;
  spell: SpellId;
  file: number;
  rank: number;
  until: number;
  radius: number;
}

export interface Banner {
  text: string;
  until: number;
}

export interface GameState {
  tick: number;
  status: MatchStatus;
  mode: Mode;
  difficulty: Difficulty;
  /** The side played by the human in a vs-AI match. Online host is white. */
  humanSide: Side;
  winner: Side | 'draw' | null;
  seed: number;
  rng: number;
  nextId: number;
  wave: number;
  nextWaveTick: number;
  gold: Record<Side, number>;
  mana: Record<Side, number>;
  towers: Tower[];
  soldiers: Soldier[];
  projectiles: Projectile[];
  blocks: Block[];
  effects: Pulse[];
  banner: Banner | null;
}

export interface MoveCommand {
  type: 'move';
  side: Side;
  fromFile: number;
  fromRank: number;
  toFile: number;
  toRank: number;
}

export interface SpellCommand {
  type: 'spell';
  side: Side;
  spell: SpellId;
}

export type PlayerCommand = MoveCommand | SpellCommand;
