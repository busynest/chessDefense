import { refreshAims, resolveKings, sweepDead } from './commands.js';
import { blockedSet, distToTower, fallbackAim, isBlockedCell, pathToTower, towerCells } from './pathing.js';
import { towerAt } from './chess.js';
import type { GameState, Projectile, Side, Soldier, Tower } from './types.js';
import { reportHarm } from './telemetry.js';
import { ECONOMY, OVERCHARGE, PIECES, SOLDIERS, TICK_SECONDS, WAVES, combatOf, leakDamage, overcharged } from './units.js';
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
  const hash = navHash(blockedSet(state));
  if (hash !== state.navHash) {
    state.navHash = hash;
    state.navStamp += 1;
  }
  refreshAims(state);
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
      const grown = scale * combatOf(tower.kind, tower.level).soldierScale * (overcharged(tower.overchargeUntil, state.tick) ? OVERCHARGE.soldier : 1);
      const hp = Math.max(1, Math.round(def.hp * grown));
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
        power: grown,
        rootedUntil: 0,
        slowUntil: 0,
        hurtBy: null,
        aim: aimOf(state, tower.side),
        navStamp: state.navStamp,
        originId: tower.id,
        born: state.tick,
      });
    }
  }
}

function navHash(blocked: Set<number>): number {
  let hash = 2166136261;
  for (let i = 0; i < 256; i += 1) {
    if (!blocked.has(i)) continue;
    hash = Math.imul(hash ^ i, 16777619);
  }
  return hash >>> 0;
}

function aimOf(state: GameState, side: Side): Soldier['aim'] {
  const mark = state.waveTarget[side];
  if (!mark) return null;
  const tower = towerAt(state, mark.file, mark.rank);
  if (!tower || tower.hp <= 0 || tower.side === side) return null;
  return { file: mark.file, rank: mark.rank };
}

function sideCount(state: GameState, side: Side): number {
  return state.soldiers.filter((soldier) => soldier.side === side && soldier.hp > 0).length;
}

function spawnCell(state: GameState, tower: Tower, n: number): { x: number; y: number } | null {
  const dir = tower.side === 'white' ? 1 : -1;
  const homeX = tower.file * 2;
  const frontY = tower.side === 'white' ? tower.rank * 2 + 1 : tower.rank * 2;
  const gateY = tower.side === 'white' ? tower.rank * 2 + 2 : tower.rank * 2 - 1;
  const preferred = n % 2 === 0 ? homeX : homeX + 1;
  const otherX = preferred === homeX ? homeX + 1 : homeX;
  const walls = new Set(state.blocks.map((block) => block.y * 16 + block.x));
  const foreign = new Set<number>();
  for (const other of state.towers) {
    if (other.hp <= 0 || other.id === tower.id) continue;
    for (const cell of towerCells(other)) foreign.add(cell.y * 16 + cell.x);
  }
  const walled = (x: number, y: number) => x < 0 || y < 0 || x > 15 || y > 15 || walls.has(y * 16 + x);
  if (!walled(preferred, frontY)) return { x: preferred, y: frontY };
  if (!walled(otherX, frontY)) return { x: otherX, y: frontY };
  let best: { x: number; y: number } | null = null;
  let bestScore = Infinity;
  for (let forward = 0; forward <= 3; forward += 1) {
    const y = gateY + forward * dir;
    for (let lateral = 0; lateral <= 2; lateral += 1) {
      const files = lateral === 0 ? [preferred, otherX] : [homeX - lateral, homeX + 1 + lateral];
      for (const x of files) {
        if (walled(x, y) || foreign.has(y * 16 + x)) continue;
        const score = forward * 8 + lateral * 3 + Math.abs(x - preferred);
        if (score < bestScore) {
          best = { x, y };
          bestScore = score;
        }
      }
    }
  }
  return best;
}

function towersShoot(state: GameState, shots: Strike[]): void {
  const hits: Array<{ tower: Tower; foe: Soldier; amount: number; control: number; controlKind: 'root' | 'slow' | 'none' }> = [];
  for (const tower of state.towers) {
    if (tower.hp <= 0 || tower.attackReadyTick > state.tick) continue;
    const stats = combatOf(tower.kind, tower.level);
    const origin = towerCenter(tower);
    const foes = soldiersInRange(state, origin, tower.side, stats.range);
    if (foes.length === 0) continue;
    const bonus = kingAura(state, tower);
    const charged = overcharged(tower.overchargeUntil, state.tick);
    const damage = Math.max(1, Math.round(stats.damage * bonus * (charged ? OVERCHARGE.damage : 1)));
    const style = PIECES[tower.kind].style;
    const queue = (foe: Soldier, amount: number, control: number, controlKind: 'root' | 'slow' | 'none') => {
      hits.push({ tower, foe, amount, control, controlKind });
    };
    if (style === 'cleave') {
      for (const foe of foes) queue(foe, damage, stats.controlTicks, 'root');
    } else if (style === 'pierce') {
      const hit = foes.slice(0, stats.pierce);
      for (const foe of hit) queue(foe, damage, stats.controlTicks, 'slow');
      const far = hit[hit.length - 1] ?? foes[0]!;
      shots.push(bolt(tower, far, 'magic'));
    } else if (style === 'splash') {
      const primary = foes[0]!;
      queue(primary, damage, 0, 'none');
      for (const foe of foes) {
        if (foe === primary) continue;
        if (chebyshevSoldier(foe, primary) > stats.splash) continue;
        queue(foe, Math.max(1, Math.round(damage * 0.5)), 0, 'none');
      }
      shots.push(bolt(tower, primary, 'shell'));
    } else if (style === 'nova') {
      const primary = foes[0]!;
      for (const foe of foes) {
        if (chebyshevSoldier(foe, primary) > stats.splash) continue;
        queue(foe, damage, 0, 'none');
      }
      shots.push(bolt(tower, primary, 'magic'));
    } else {
      const foe = foes[0]!;
      queue(foe, damage, 0, 'none');
      shots.push(bolt(tower, foe, style === 'arrow' ? 'arrow' : 'shot'));
    }
    const haste = charged ? OVERCHARGE.haste : 1;
    tower.attackReadyTick = state.tick + Math.max(3, Math.round(stats.attackTicks * haste));
  }
  for (const hit of hits) strikeSoldier(state, hit.tower, hit.foe, hit.amount, hit.control, hit.controlKind);
}

function kingAura(state: GameState, tower: Tower): number {
  let bonus = 1;
  for (const king of state.towers) {
    if (king.side !== tower.side || king.kind !== 'king' || king.hp <= 0 || king.id === tower.id) continue;
    const dist = Math.max(Math.abs(king.file - tower.file), Math.abs(king.rank - tower.rank));
    if (dist > 2) continue;
    bonus += combatOf('king', king.level).aura;
  }
  return bonus;
}

function soldiersInRange(state: GameState, origin: { x: number; y: number }, side: Side, range: number): Soldier[] {
  return state.soldiers
    .filter((soldier) => soldier.side !== side && soldier.hp > 0 && chebyshevPoint(soldier, origin) <= range)
    .sort((a, b) => chebyshevPoint(a, origin) - chebyshevPoint(b, origin));
}

function strikeSoldier(state: GameState, tower: Tower, foe: Soldier, amount: number, control: number, controlKind: 'root' | 'slow' | 'none'): void {
  foe.hp -= amount;
  foe.hurtBy = tower.side;
  if (controlKind === 'root') foe.rootedUntil = Math.max(foe.rootedUntil, state.tick + control);
  if (controlKind === 'slow') foe.slowUntil = Math.max(foe.slowUntil, state.tick + control);
  reportHarm({
    source: 'tower',
    kind: tower.kind,
    side: tower.side,
    target: 'soldier',
    targetKind: foe.kind,
    amount,
    lethal: foe.hp <= 0,
  });
}

function bolt(tower: Tower, foe: Soldier, kind: Projectile['kind']): Strike {
  return {
    x: tower.file * 2 + 0.5,
    y: tower.rank * 2 + 0.5,
    tx: foe.x,
    ty: foe.y,
    side: tower.side,
    kind,
  };
}

function chebyshevPoint(soldier: { x: number; y: number }, origin: { x: number; y: number }): number {
  return Math.max(Math.abs(soldier.x - origin.x), Math.abs(soldier.y - origin.y));
}

function chebyshevSoldier(a: Soldier, b: Soldier): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function focusTower(state: GameState, soldier: Soldier): Tower | null {
  if (soldier.aim) {
    const marked = towerAt(state, soldier.aim.file, soldier.aim.rank);
    if (marked && marked.hp > 0 && marked.side !== soldier.side) return marked;
    soldier.aim = fallbackAim(state, soldier.side, soldier.x, soldier.y);
    soldier.path = [];
    soldier.navStamp = -1;
  }
  if (soldier.aim) {
    const next = towerAt(state, soldier.aim.file, soldier.aim.rank);
    if (next && next.hp > 0) return next;
  }
  return state.towers.find((tower) => tower.side !== soldier.side && tower.kind === 'king' && tower.hp > 0) ?? null;
}

function soldiersAct(state: GameState, shots: Strike[]): void {
  const blocked = blockedSet(state);
  const attacks: Array<{ soldier: Soldier; foe: ReturnType<typeof nearestFoe>; wall: GameState['blocks'][number] | null; stats: ReturnType<typeof statsOf> }> = [];
  const movers: Soldier[] = [];
  for (const soldier of state.soldiers) {
    if (soldier.hp <= 0 || soldier.rootedUntil > state.tick) continue;
    const stats = statsOf(soldier, state.tick);
    const foe = nearestFoe(state, soldier, stats.range);
    if (foe?.soldier && soldier.attackReadyTick <= state.tick) {
      attacks.push({ soldier, foe, wall: null, stats });
      continue;
    }
    if (foe?.soldier) continue;
    const focus = focusTower(state, soldier);
    const focusClose = focus !== null && distToTower(soldier.x, soldier.y, focus) <= stats.range;
    if (focusClose && soldier.attackReadyTick <= state.tick) {
      const cell = towerCells(focus)[0]!;
      attacks.push({ soldier, foe: { tower: focus, x: cell.x, y: cell.y }, wall: null, stats });
      soldier.path = [];
      continue;
    }
    if (focusClose) {
      soldier.path = [];
      continue;
    }
    if (foe?.tower && soldier.attackReadyTick <= state.tick) {
      attacks.push({ soldier, foe, wall: null, stats });
      continue;
    }
    if (soldier.navStamp !== state.navStamp || soldier.path.length === 0) {
      soldier.path = focus
        ? pathToTower(state, soldier.x, soldier.y, focus, stats.range, laneOf(soldier))
        : [];
      if (soldier.path.length === 0 && focus) {
        const blocker = nearestTower(state, soldier);
        if (blocker && blocker.id !== focus.id) {
          soldier.path = pathToTower(state, soldier.x, soldier.y, blocker, stats.range, laneOf(soldier));
        }
      }
      soldier.navStamp = state.navStamp;
      soldier.repathTick = state.tick + 12;
    }
    if (onFriendlyTower(state, soldier)) {
      const out = exitStep(state, soldier, blocked);
      if (out) stepToward(soldier, out, stats.speed);
      soldier.path = [];
      soldier.navStamp = -1;
      continue;
    }
    const next = soldier.path[0];
    if (!next || isBlockedCell(blocked, next.x, next.y)) {
      const wall = nearestBlock(state, soldier);
      if (wall && soldier.attackReadyTick <= state.tick) attacks.push({ soldier, foe: null, wall, stats });
      soldier.path = focus
        ? pathToTower(state, soldier.x, soldier.y, focus, stats.range, laneOf(soldier))
        : [];
      soldier.navStamp = state.navStamp;
      continue;
    }
    movers.push(soldier);
  }
  for (const attack of attacks) {
    const { soldier, foe, wall, stats } = attack;
    if (foe?.soldier) {
      foe.soldier.hp -= stats.strength;
      foe.soldier.hurtBy = soldier.side;
      reportHarm({
        source: 'soldier',
        kind: soldier.kind,
        side: soldier.side,
        target: 'soldier',
        targetKind: foe.soldier.kind,
        amount: stats.strength,
        lethal: foe.soldier.hp <= 0,
      });
    } else if (foe?.tower) {
      const dealt = leakDamage(foe.tower.kind, stats.strength);
      foe.tower.hp -= dealt;
      foe.tower.hurtBy = soldier.side;
      reportHarm({
        source: 'soldier',
        kind: soldier.kind,
        side: soldier.side,
        target: 'tower',
        targetKind: foe.tower.kind,
        amount: dealt,
        lethal: foe.tower.hp <= 0,
      });
    } else if (wall) {
      wall.hp -= stats.strength;
      wall.hurtBy = soldier.side;
      reportHarm({
        source: 'soldier',
        kind: soldier.kind,
        side: soldier.side,
        target: 'block',
        targetKind: 'block',
        amount: stats.strength,
        lethal: wall.hp <= 0,
      });
    }
    soldier.attackReadyTick = state.tick + stats.attackTicks;
    const target = foe ?? wall;
    if (!target) continue;
    shots.push({
      x: soldier.x,
      y: soldier.y,
      tx: target.x,
      ty: target.y,
      side: soldier.side,
      kind: soldier.kind === 'cannon' ? 'shell' : soldier.kind === 'archer' || soldier.kind === 'mage' ? 'arrow' : 'shot',
    });
  }
  for (const soldier of movers) {
    if (soldier.hp <= 0) continue;
    const stats = statsOf(soldier, state.tick);
    const next = soldier.path[0];
    if (!next || isBlockedCell(blocked, next.x, next.y)) continue;
    if (stepToward(soldier, next, stats.speed)) soldier.path.shift();
  }
}

function onFriendlyTower(state: GameState, soldier: Soldier): boolean {
  const x = Math.round(soldier.x);
  const y = Math.round(soldier.y);
  return state.towers.some((tower) => tower.side === soldier.side && tower.hp > 0 && towerCells(tower).some((cell) => cell.x === x && cell.y === y));
}

function exitStep(state: GameState, soldier: Soldier, blocked: Set<number>): { x: number; y: number } | null {
  const dir = soldier.side === 'white' ? 1 : -1;
  const x = Math.round(soldier.x);
  const y = Math.round(soldier.y);
  let best: { x: number; y: number } | null = null;
  let bestScore = Infinity;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
      const friendly = state.towers.some((tower) => tower.side === soldier.side && tower.hp > 0 && towerCells(tower).some((cell) => cell.x === nx && cell.y === ny));
      const open = !blocked.has(ny * 16 + nx);
      if (!open && !friendly) continue;
      const score = (open ? 0 : 8) - dy * dir * 3 + Math.abs(dx);
      if (score < bestScore) {
        best = { x: nx, y: ny };
        bestScore = score;
      }
    }
  }
  return best;
}

function stepToward(soldier: Soldier, next: { x: number; y: number }, speed: number): boolean {
  const dx = next.x - soldier.x;
  const dy = next.y - soldier.y;
  const dist = Math.hypot(dx, dy);
  const travel = speed * TICK_SECONDS;
  if (dist <= travel || dist < 0.04) {
    soldier.x = next.x;
    soldier.y = next.y;
    return true;
  }
  soldier.x += (dx / dist) * travel;
  soldier.y += (dy / dist) * travel;
  return false;
}

function laneOf(soldier: Soldier): number {
  let lane = 0;
  for (let i = 0; i < soldier.id.length; i += 1) lane = (lane + soldier.id.charCodeAt(i) * (i + 1)) % 97;
  return lane;
}

function bury(state: GameState): void {
  sweepDead(state);
}

function statsOf(soldier: Soldier, tick: number): { strength: number; speed: number; range: number; attackTicks: number } {
  const base = SOLDIERS[soldier.kind];
  const buffed = soldier.buffUntil >= tick;
  return {
    strength: Math.max(1, Math.round(base.strength * soldier.power) + (buffed ? soldier.buffStr : 0)),
    speed: base.speed * (buffed ? soldier.buffSpeed : 1) * (soldier.slowUntil >= tick ? 0.55 : 1),
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

function nearestTower(state: GameState, soldier: Soldier): Tower | null {
  let best: Tower | null = null;
  let bestDist = Infinity;
  for (const tower of state.towers) {
    if (tower.side === soldier.side || tower.hp <= 0) continue;
    const dist = distToTower(soldier.x, soldier.y, tower);
    if (dist < bestDist) {
      best = tower;
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
