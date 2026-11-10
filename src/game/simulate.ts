import { resolveKings, sweepDead } from './commands.js';
import { distToTower, isBlockedCell, pathToward, towerCells, blockedSet } from './pathing.js';
import type { GameState, Projectile, Side, Soldier, Tower } from './types.js';
import { ECONOMY, PIECES, SOLDIERS, TICK_SECONDS, WAVES } from './units.js';
import { aiAct } from './ai.js';

interface Strike {
  x: number;
  y: number;
  tx: number;
  ty: number;
  side: Side;
  kind: Projectile['kind'];
}

/** Advance the match by one fixed step. Pure: the input is not mutated. */
export function step(input: GameState): GameState {
  if (input.status !== 'playing') return input;
  const state = structuredClone(input);
  state.tick += 1;
  gain(state);
  if (state.tick >= state.nextWaveTick) launchWave(state);
  const shots: Strike[] = [];
  towersShoot(state, shots);
  soldiersAct(state, shots);
  for (const shot of shots) {
    state.projectiles.push({
      id: nid(state),
      side: shot.side,
      kind: shot.kind,
      x: shot.x,
      y: shot.y,
      tx: shot.tx,
      ty: shot.ty,
      born: state.tick,
      life: shot.kind === 'shell' ? 4 : 3,
    });
  }
  state.projectiles = state.projectiles.filter((shot) => state.tick <= shot.born + shot.life);
  state.effects = state.effects.filter((effect) => effect.until >= state.tick);
  if (state.banner && state.banner.until < state.tick) state.banner = null;
  bury(state);
  resolveKings(state);
  if (state.status === 'playing' && state.mode === 'ai') aiAct(state);
  return state;
}

function nid(state: GameState): string {
  state.nextId += 1;
  return `u${state.nextId}`;
}

function gain(state: GameState): void {
  for (const side of ['white', 'black'] as const) {
    state.gold[side] = Math.min(ECONOMY.goldCap, state.gold[side] + ECONOMY.goldPerTick);
    state.mana[side] = Math.min(ECONOMY.manaCap, state.mana[side] + ECONOMY.manaPerTick);
  }
}

function launchWave(state: GameState): void {
  state.wave += 1;
  state.nextWaveTick = state.tick + WAVES.gapTicks;
  const count = WAVES.unitsForWave(state.wave);
  const scale = WAVES.statScale(state.wave);
  state.banner = { text: `Wave ${state.wave} marches.`, until: state.tick + 30 };
  for (const tower of state.towers) {
    if (tower.hp <= 0) continue;
    const kind = PIECES[tower.kind].soldier;
    const def = SOLDIERS[kind];
    for (let n = 0; n < count; n += 1) {
      if (sideCount(state, tower.side) >= WAVES.soldierCap) break;
      const cell = spawnCell(state, tower, n);
      if (!cell) break;
      const hp = Math.max(1, Math.round(def.hp * scale));
      state.soldiers.push({
        id: nid(state),
        side: tower.side,
        kind,
        x: cell.x,
        y: cell.y,
        hp,
        maxHp: hp,
        attackReadyTick: state.tick + 2,
        repathTick: state.tick,
        path: [],
        buffUntil: 0,
        buffStr: 0,
        buffSpeed: 1,
        power: scale,
        hurtBy: null,
      });
    }
  }
}

function sideCount(state: GameState, side: Side): number {
  return state.soldiers.filter((soldier) => soldier.side === side && soldier.hp > 0).length;
}

function spawnCell(state: GameState, tower: Tower, n: number): { x: number; y: number } | null {
  const dir = tower.side === 'white' ? 1 : -1;
  const forwardY = tower.side === 'white' ? tower.rank * 2 + 2 : tower.rank * 2 - 1;
  const candidates = [];
  for (let step = 0; step < 4; step += 1) {
    const y = forwardY + dir * (n + step);
    candidates.push({ x: tower.file * 2, y }, { x: tower.file * 2 + 1, y });
  }
  const blocked = new Set(state.blocks.map((block) => block.y * 16 + block.x));
  for (const other of state.towers) {
    if (other.hp <= 0) continue;
    for (const cell of towerCells(other)) blocked.add(cell.y * 16 + cell.x);
  }
  for (const cell of candidates) {
    if (cell.x < 0 || cell.y < 0 || cell.x > 15 || cell.y > 15) continue;
    if (!blocked.has(cell.y * 16 + cell.x)) return cell;
  }
  return null;
}

function towersShoot(state: GameState, shots: Strike[]): void {
  for (const tower of state.towers) {
    if (tower.hp <= 0 || tower.auraReadyTick > state.tick) continue;
    const def = PIECES[tower.kind];
    const foe = nearestSoldier(state, towerCenter(tower), tower.side, def.auraRange);
    if (!foe) continue;
    foe.hp -= def.auraDamage;
    foe.hurtBy = tower.side;
    tower.auraReadyTick = state.tick + def.auraTicks;
    shots.push({
      x: tower.file * 2 + 0.5,
      y: tower.rank * 2 + 0.5,
      tx: foe.x,
      ty: foe.y,
      side: tower.side,
      kind: def.soldier === 'cannon' ? 'shell' : def.soldier === 'archer' ? 'arrow' : 'shot',
    });
  }
}

function soldiersAct(state: GameState, shots: Strike[]): void {
  const blocked = blockedSet(state);
  for (const soldier of state.soldiers) {
    if (soldier.hp <= 0) continue;
    const stats = statsOf(soldier, state.tick);
    const foe = nearestFoe(state, soldier, stats.range);
    if (foe && soldier.attackReadyTick <= state.tick) {
      if (foe.soldier) {
        foe.soldier.hp -= stats.strength;
        foe.soldier.hurtBy = soldier.side;
      } else if (foe.tower) {
        foe.tower.hp -= stats.strength;
        foe.tower.hurtBy = soldier.side;
      }
      soldier.attackReadyTick = state.tick + stats.attackTicks;
      shots.push({
        x: soldier.x,
        y: soldier.y,
        tx: foe.x,
        ty: foe.y,
        side: soldier.side,
        kind: soldier.kind === 'cannon' ? 'shell' : soldier.kind === 'archer' || soldier.kind === 'mage' ? 'arrow' : 'shot',
      });
      continue;
    }
    if (foe) continue;
    const wall = nearestBlock(state, soldier);
    if (wall && soldier.attackReadyTick <= state.tick) {
      wall.hp -= stats.strength;
      wall.hurtBy = soldier.side;
      soldier.attackReadyTick = state.tick + stats.attackTicks;
      shots.push({ x: soldier.x, y: soldier.y, tx: wall.x, ty: wall.y, side: soldier.side, kind: 'shot' });
      continue;
    }
    if (wall) continue;
    if (soldier.repathTick <= state.tick || soldier.path.length === 0) {
      soldier.path = pathToward(state, soldier.x, soldier.y, soldier.side);
      soldier.repathTick = state.tick + 10;
    }
    const next = soldier.path[0];
    if (!next) continue;
    if (isBlockedCell(blocked, next.x, next.y)) {
      soldier.path = pathToward(state, soldier.x, soldier.y, soldier.side);
      soldier.repathTick = state.tick + 10;
      continue;
    }
    const dx = next.x - soldier.x;
    const dy = next.y - soldier.y;
    const dist = Math.hypot(dx, dy);
    const travel = stats.speed * TICK_SECONDS;
    if (dist <= travel || dist < 0.04) {
      soldier.x = next.x;
      soldier.y = next.y;
      soldier.path.shift();
    } else {
      soldier.x += (dx / dist) * travel;
      soldier.y += (dy / dist) * travel;
    }
  }
}

function bury(state: GameState): void {
  sweepDead(state);
}

function statsOf(soldier: Soldier, tick: number): { strength: number; speed: number; range: number; attackTicks: number } {
  const base = SOLDIERS[soldier.kind];
  const buffed = soldier.buffUntil >= tick;
  return {
    strength: Math.max(1, Math.round(base.strength * soldier.power) + (buffed ? soldier.buffStr : 0)),
    speed: base.speed * (buffed ? soldier.buffSpeed : 1),
    range: base.range,
    attackTicks: base.attackTicks,
  };
}

function towerCenter(tower: Tower): { x: number; y: number } {
  return { x: tower.file * 2 + 0.5, y: tower.rank * 2 + 0.5 };
}

function nearestSoldier(state: GameState, origin: { x: number; y: number }, side: Side, range: number): Soldier | null {
  let best: Soldier | null = null;
  let bestDist = range + 0.001;
  for (const soldier of state.soldiers) {
    if (soldier.side === side || soldier.hp <= 0) continue;
    const dist = Math.max(Math.abs(soldier.x - origin.x), Math.abs(soldier.y - origin.y));
    if (dist < bestDist) {
      best = soldier;
      bestDist = dist;
    }
  }
  return best;
}

function nearestBlock(state: GameState, soldier: Soldier): GameState['blocks'][number] | null {
  let best: GameState['blocks'][number] | null = null;
  let bestDist = 1.001;
  for (const block of state.blocks) {
    if (block.hp <= 0) continue;
    const dist = Math.max(Math.abs(block.x - soldier.x), Math.abs(block.y - soldier.y));
    if (dist < bestDist) {
      best = block;
      bestDist = dist;
    }
  }
  return best;
}

function nearestFoe(state: GameState, soldier: Soldier, range: number): { soldier?: Soldier; tower?: Tower; x: number; y: number } | null {
  const unit = nearestSoldier(state, soldier, soldier.side, range);
  if (unit) return { soldier: unit, x: unit.x, y: unit.y };
  let best: Tower | null = null;
  let bestDist = range + 0.001;
  for (const tower of state.towers) {
    if (tower.side === soldier.side || tower.hp <= 0) continue;
    const dist = distToTower(soldier.x, soldier.y, tower);
    if (dist < bestDist) {
      best = tower;
      bestDist = dist;
    }
  }
  if (!best) return null;
  const cell = towerCells(best)[0]!;
  return { tower: best, x: cell.x, y: cell.y };
}
