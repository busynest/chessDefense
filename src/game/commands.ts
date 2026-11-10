import { towerAt } from './chess.js';
import { chebyshev, mazeVerdict, placementSeals, towerCells } from './pathing.js';
import type { GameState, PlayerCommand, Side, SpellId } from './types.js';
import { reportHarm } from './telemetry.js';
import { BLOCKS, ECONOMY, OVERCHARGE, PIECES, REPAIR, SOLDIERS, SPELLS, combatOf, inBuildZone, isCenterRow, overchargeCost, repairCost, squareName, upgradeCost } from './units.js';
import { reportOvercharge, reportRepair } from './telemetry.js';

export interface MoveResult {
  state: GameState;
  ok: boolean;
  reason: string;
}

function fresh(state: GameState): GameState {
  return structuredClone(state);
}

function nextId(state: GameState): string {
  state.nextId += 1;
  return `u${state.nextId}`;
}

function banner(state: GameState, text: string): void {
  state.banner = { text, until: state.tick + 30 };
}

/** Raise a fixed tower one level. Level 3 is the top. The tower does not move. */
export function tryUpgrade(input: GameState, side: Side, file: number, rank: number): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const tower = towerAt(input, file, rank);
  if (!tower || tower.side !== side) return { state: input, ok: false, reason: 'That is not your tower.' };
  if (tower.level >= 3) return { state: input, ok: false, reason: 'That tower is already level 3.' };
  const cost = upgradeCost(tower.kind, tower.level);
  if (input.gold[side] < cost) return { state: input, ok: false, reason: 'Not enough gold to upgrade.' };

  const state = fresh(input);
  const piece = towerAt(state, file, rank)!;
  state.gold[side] -= cost;
  piece.level += 1;
  const nextHp = combatOf(piece.kind, piece.level).maxHp;
  const healed = nextHp - piece.maxHp;
  piece.maxHp = nextHp;
  piece.hp = Math.min(nextHp, piece.hp + Math.max(0, healed));
  banner(state, `${label(side)} ${PIECES[piece.kind].label} on ${squareName(file, rank)} is now level ${piece.level}.`);
  return { state, ok: true, reason: '' };
}

/** Pay gold to restore a wounded tower. A cooldown stops mid-wave spam. */
export function tryRepair(input: GameState, side: Side, file: number, rank: number): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const tower = towerAt(input, file, rank);
  if (!tower || tower.side !== side) return { state: input, ok: false, reason: 'That is not your tower.' };
  const missing = tower.maxHp - tower.hp;
  if (missing <= 0) return { state: input, ok: false, reason: 'That tower is already whole.' };
  if (input.tick < tower.repairReadyTick) return { state: input, ok: false, reason: 'That tower was just repaired.' };
  const cost = repairCost(missing);
  if (input.gold[side] < cost) return { state: input, ok: false, reason: 'Not enough gold to repair.' };

  const state = fresh(input);
  const piece = towerAt(state, file, rank)!;
  state.gold[side] -= cost;
  piece.hp = piece.maxHp;
  piece.repairReadyTick = state.tick + REPAIR.ticks;
  piece.mendedTick = state.tick;
  reportRepair({ side, kind: piece.kind });
  banner(state, `${label(side)} repairs the ${PIECES[piece.kind].label} on ${squareName(file, rank)}.`);
  return { state, ok: true, reason: '' };
}

/** Level 3 only. Boosts damage, fire rate, and soldiers spawned during the window. */
export function tryOvercharge(input: GameState, side: Side, file: number, rank: number): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const tower = towerAt(input, file, rank);
  if (!tower || tower.side !== side) return { state: input, ok: false, reason: 'That is not your tower.' };
  if (tower.level < 3) return { state: input, ok: false, reason: 'Overcharge needs a level 3 tower.' };
  if (input.tick < tower.overchargeUntil) return { state: input, ok: false, reason: 'That tower is already overcharged.' };
  if (input.tick < tower.overchargeReadyTick) return { state: input, ok: false, reason: 'Overcharge is still cooling down.' };
  const price = overchargeCost(tower.overchargeUses);
  if (input.gold[side] < price) return { state: input, ok: false, reason: 'Not enough gold to overcharge.' };

  const state = fresh(input);
  const piece = towerAt(state, file, rank)!;
  state.gold[side] -= price;
  piece.overchargeUses = (piece.overchargeUses ?? 0) + 1;
  piece.overchargeUntil = state.tick + OVERCHARGE.duration;
  piece.overchargeReadyTick = state.tick + OVERCHARGE.cooldown;
  reportOvercharge({ side, kind: piece.kind });
  banner(state, `${label(side)} overcharges the ${PIECES[piece.kind].label} on ${squareName(file, rank)}.`);
  return { state, ok: true, reason: '' };
}

/**
 * Cast one Queen spell. The Queen has to be alive, and the mana is spent up front.
 * Blessing buffs nearby friendly soldiers. Heal restores nearby friendly towers.
 * Blast damages nearby enemies. All three are centered on the Queen.
 */
export function trySpell(input: GameState, side: Side, spell: SpellId): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const queen = input.towers.find((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0);
  if (!queen) return { state: input, ok: false, reason: 'Your Queen has fallen.' };
  const def = SPELLS[spell];
  if (input.mana[side] < def.mana) return { state: input, ok: false, reason: 'Not enough mana.' };

  const state = fresh(input);
  const caster = state.towers.find((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0)!;
  state.mana[side] -= def.mana;
  const cx = caster.file * 2 + 0.5;
  const cy = caster.rank * 2 + 0.5;
  if (spell === 'blessing') {
    for (const soldier of state.soldiers) {
      if (soldier.side !== side || soldier.hp <= 0) continue;
      if (chebyshev(soldier.x, soldier.y, cx, cy) > def.radius) continue;
      soldier.buffStr = def.strength;
      soldier.buffSpeed = def.speed;
      soldier.buffUntil = state.tick + def.durationTicks;
      soldier.hp = Math.min(soldier.maxHp, soldier.hp + def.heal);
    }
  } else if (spell === 'heal') {
    for (const tower of state.towers) {
      if (tower.side !== side || tower.hp <= 0) continue;
      const distance = Math.max(Math.abs(tower.file - caster.file), Math.abs(tower.rank - caster.rank));
      if (distance > def.radius) continue;
      tower.hp = Math.min(tower.maxHp, tower.hp + def.heal);
    }
  } else {
    for (const soldier of state.soldiers) {
      if (soldier.side === side || soldier.hp <= 0) continue;
      if (chebyshev(soldier.x, soldier.y, cx, cy) > def.radius) continue;
      soldier.hp -= def.damage;
      soldier.hurtBy = side;
      reportHarm({
        source: 'blast',
        kind: 'blast',
        side,
        target: 'soldier',
        targetKind: soldier.kind,
        amount: def.damage,
        lethal: soldier.hp <= 0,
      });
    }
    for (const tower of state.towers) {
      if (tower.side === side || tower.hp <= 0) continue;
      const distance = Math.max(Math.abs(tower.file - caster.file), Math.abs(tower.rank - caster.rank));
      if (distance > 2) continue;
      tower.hp -= def.towerDamage;
      tower.hurtBy = side;
      reportHarm({
        source: 'blast',
        kind: 'blast',
        side,
        target: 'tower',
        targetKind: tower.kind,
        amount: def.towerDamage,
        lethal: tower.hp <= 0,
      });
    }
  }
  state.effects.push({
    id: nextId(state),
    side,
    spell,
    file: caster.file,
    rank: caster.rank,
    until: state.tick + def.durationTicks,
    radius: def.radius,
  });
  if (state.status === 'playing') banner(state, `${label(side)} Queen casts ${def.label}.`);
  sweepDead(state);
  resolveKings(state);
  return { state, ok: true, reason: '' };
}

export function sweepDead(state: GameState): void {
  const standing = new Set(state.towers.filter((tower) => tower.hp > 0).map((tower) => tower.id));
  for (const soldier of state.soldiers) {
    if (soldier.hp <= 0 || !soldier.originId || standing.has(soldier.originId)) continue;
    soldier.hp = 0;
    soldier.hurtBy = null;
  }
  for (const soldier of state.soldiers) {
    if (soldier.hp > 0 || !soldier.hurtBy) continue;
    const bounty = SOLDIERS[soldier.kind].bounty;
    state.gold[soldier.hurtBy] = Math.min(ECONOMY.goldCap, state.gold[soldier.hurtBy] + bounty);
  }
  state.soldiers = state.soldiers.filter((soldier) => soldier.hp > 0);
  for (const tower of state.towers) {
    if (tower.hp > 0 || !tower.hurtBy || tower.kind === 'king') continue;
    state.gold[tower.hurtBy] = Math.min(ECONOMY.goldCap, state.gold[tower.hurtBy] + PIECES[tower.kind].bounty);
  }
  state.towers = state.towers.filter((tower) => tower.hp > 0);
  state.blocks = state.blocks.filter((block) => block.hp > 0);
}

export function resolveKings(state: GameState): void {
  const white = state.towers.some((tower) => tower.side === 'white' && tower.kind === 'king' && tower.hp > 0);
  const black = state.towers.some((tower) => tower.side === 'black' && tower.kind === 'king' && tower.hp > 0);
  if (white && black) return;
  if (!white && !black) finish(state, 'draw');
  else finish(state, white ? 'white' : 'black');
}

export function finish(state: GameState, winner: Side | 'draw'): void {
  state.status = 'victory';
  state.winner = winner;
  state.banner = {
    text: winner === 'draw'
      ? 'Both King towers fell together. Draw.'
      : `${label(winner)} destroyed the enemy King tower.`,
    until: state.tick + 99999,
  };
}

function rowWouldClose(input: GameState, x: number, y: number): boolean {
  let open = 0;
  for (let file = 0; file < 16; file += 1) {
    if (file === x) continue;
    const wall = input.blocks.some((block) => block.x === file && block.y === y && block.hp > 0);
    const tower = input.towers.some((piece) => piece.hp > 0 && towerCells(piece).some((cell) => cell.x === file && cell.y === y));
    if (!wall && !tower) open += 1;
  }
  return open === 0;
}

/** Free. Marks the tower the next wave will march on. file < 0 clears it back to the King. */
export function tryAim(input: GameState, side: Side, file: number, rank: number): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const state = fresh(input);
  if (file < 0 || rank < 0) {
    state.waveTarget[side] = null;
    banner(state, `${label(side)} will send the next wave at the enemy King.`);
    return { state, ok: true, reason: '' };
  }
  const tower = towerAt(state, file, rank);
  if (!tower || tower.side === side) return { state: input, ok: false, reason: 'That is not an enemy tower.' };
  state.waveTarget[side] = { file, rank };
  banner(state, `${label(side)} marks the ${PIECES[tower.kind].label} on ${squareName(file, rank)}.`);
  return { state, ok: true, reason: '' };
}

/** If the marked tower fell before the launch, the next wave goes to the King. */
export function refreshAims(state: GameState): void {
  for (const side of ['white', 'black'] as const) {
    const mark = state.waveTarget[side];
    if (!mark) continue;
    const tower = towerAt(state, mark.file, mark.rank);
    if (tower && tower.hp > 0 && tower.side !== side) continue;
    state.waveTarget[side] = null;
    banner(state, `The marked tower fell. ${label(side)}'s next wave marches on the King.`);
  }
}

export function blockProblem(input: GameState, side: Side, x: number, y: number): string {
  if (input.status !== 'playing') return 'The match is not running.';
  if (x < 0 || y < 0 || x > 15 || y > 15) return 'That cell is off the board.';
  if (isCenterRow(y)) return 'The center crossing must stay open';
  if (!inBuildZone(side, y)) return 'Build only in your two front ranks';
  if (input.gold[side] < BLOCKS.cost) return 'Not enough gold for a block.';
  if (input.blocks.some((block) => block.x === x && block.y === y && block.hp > 0)) return 'A block is already there.';
  const occupied = input.towers.some((tower) => tower.hp > 0 && towerCells(tower).some((cell) => cell.x === x && cell.y === y));
  if (occupied) return 'A tower stands on that cell.';
  const owned = input.blocks.filter((block) => block.side === side && block.hp > 0).length;
  if (owned >= BLOCKS.max) return `Wall limit reached (${owned}/${BLOCKS.max})`;
  if (rowWouldClose(input, x, y)) return 'Each row must keep a gap';
  if (placementSeals(input.blocks, x, y)) return 'That would seal every path to a King.';
  const verdict = mazeVerdict(input.towers, input.blocks, { x, y });
  if (verdict === 'cut') return 'That would cut a tower off from the enemy';
  if (verdict === 'long') return 'That maze runs too long';
  return '';
}

export function tryPlaceBlock(input: GameState, side: Side, x: number, y: number): MoveResult {
  const problem = blockProblem(input, side, x, y);
  if (problem) return { state: input, ok: false, reason: problem };

  const state = fresh(input);
  state.gold[side] -= BLOCKS.cost;
  state.blocks.push({ x, y, side, hp: BLOCKS.hp, maxHp: BLOCKS.hp, hurtBy: null });
  banner(state, `${label(side)} places a block.`);
  return { state, ok: true, reason: '' };
}

export function tryRemoveBlock(input: GameState, side: Side, x: number, y: number): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const found = input.blocks.find((block) => block.x === x && block.y === y && block.hp > 0);
  if (!found || found.side !== side) return { state: input, ok: false, reason: 'That is not your block.' };
  const state = fresh(input);
  state.blocks = state.blocks.filter((block) => !(block.x === x && block.y === y));
  state.gold[side] = Math.min(ECONOMY.goldCap, state.gold[side] + BLOCKS.refund);
  banner(state, `${label(side)} sells a block for ${BLOCKS.refund} gold.`);
  return { state, ok: true, reason: '' };
}

export function label(side: Side): string {
  return side === 'white' ? 'White' : 'Black';
}

/** Apply one networked command. The caller rejects a command from the wrong seat first. */
export function applyCommand(input: GameState, command: PlayerCommand): MoveResult {
  switch (command.type) {
    case 'upgrade':
      return tryUpgrade(input, command.side, command.file, command.rank);
    case 'repair':
      return tryRepair(input, command.side, command.file, command.rank);
    case 'overcharge':
      return tryOvercharge(input, command.side, command.file, command.rank);
    case 'spell':
      return trySpell(input, command.side, command.spell);
    case 'block':
      return tryPlaceBlock(input, command.side, command.x, command.y);
    case 'unblock':
      return tryRemoveBlock(input, command.side, command.x, command.y);
    case 'target':
      return tryAim(input, command.side, command.file, command.rank);
    default:
      return { state: input, ok: false, reason: 'Unknown command.' };
  }
}
