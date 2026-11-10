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
  /** 1, 2, or 3. Gold raises this. Towers never leave their square. */
  level: number;
  attackReadyTick: number;
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
  /** Wave scaling times the parent tower's level. 1 is a level-1 wave-1 soldier. */
  power: number;
  rootedUntil: number;
  slowUntil: number;
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
  side: Side;
  hp: number;
  maxHp: number;
  hurtBy: Side | null;
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

export interface UpgradeCommand {
  type: 'upgrade';
  side: Side;
  file: number;
  rank: number;
}

export interface SpellCommand {
  type: 'spell';
  side: Side;
  spell: SpellId;
}

export interface BlockCommand {
  type: 'block';
  side: Side;
  x: number;
  y: number;
}

export interface UnblockCommand {
  type: 'unblock';
  side: Side;
  x: number;
  y: number;
}

export type PlayerCommand = UpgradeCommand | SpellCommand | BlockCommand | UnblockCommand;
