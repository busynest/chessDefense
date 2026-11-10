/**
 * Headless AI vs AI batch. Both sides act through the same deterministic step.
 * Usage: node scripts/playtest-batch.mjs [out.json]
 */
import { writeFile } from 'node:fs/promises';

import { aiAct } from '../out/game/ai.js';
import { createMatch } from '../out/game/setup.js';
import { step } from '../out/game/simulate.js';
import { listenHarm, listenOvercharge, listenRepair } from '../out/game/telemetry.js';
import { ECONOMY, TICK_SECONDS } from '../out/game/units.js';

const MAX_TICKS = 6000;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const KINDS = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const SOLDIERS = ['peasant', 'knight', 'archer', 'cannon', 'mage', 'guard'];

const MATCHUPS = [
  ['easy', 'easy'],
  ['normal', 'normal'],
  ['hard', 'hard'],
  ['easy', 'normal'],
  ['normal', 'easy'],
  ['easy', 'hard'],
  ['hard', 'easy'],
  ['normal', 'hard'],
  ['hard', 'normal'],
];

function blankSide() {
  return { gained: 0, spent: 0, capGold: 0, capMana: 0, manaGained: 0, manaSpent: 0 };
}

function act(state, side, difficulty) {
  const saved = { humanSide: state.humanSide, difficulty: state.difficulty, mode: state.mode };
  state.humanSide = side === 'white' ? 'black' : 'white';
  state.difficulty = difficulty;
  state.mode = 'ai';
  aiAct(state);
  state.humanSide = saved.humanSide;
  state.difficulty = saved.difficulty;
  state.mode = saved.mode;
}

function fingerprint(state) {
  const towers = state.towers
    .map((tower) => `${tower.id}:${tower.file}${tower.rank}:${tower.hp}`)
    .sort()
    .join(',');
  return `${state.status}|${state.winner}|${state.tick}|${state.wave}|${state.gold.white}|${state.gold.black}|${state.rng}|${towers}`;
}

function play(seed, whiteDiff, blackDiff) {
  let state = createMatch({ mode: 'local', difficulty: 'normal', seed, humanSide: 'white' });
  const economy = { white: blankSide(), black: blankSide() };
  const harm = [];
  const spells = { blessing: 0, heal: 0, blast: 0 };
  const seenEffects = new Set();
  const firstDeaths = [];
  const alive = new Set(state.towers.map((tower) => tower.id));
  const towerKind = new Map(state.towers.map((tower) => [tower.id, `${tower.side}:${tower.kind}`]));
  let blocksPlaced = { white: 0, black: 0 };
  let blocksDestroyed = { white: 0, black: 0 };
  let repairs = 0;
  let overcharges = 0;
  let error = '';
  listenHarm((event) => harm.push(event));
  listenRepair(() => { repairs += 1; });
  listenOvercharge(() => { overcharges += 1; });
  try {
    while (state.status === 'playing' && state.tick < MAX_TICKS) {
      const goldBefore = { ...state.gold };
      const manaBefore = { ...state.mana };
      const blocksBefore = state.blocks.map((block) => `${block.side}:${block.x}:${block.y}`);
      state = step(state);
      for (const side of ['white', 'black']) {
        const goldDelta = state.gold[side] - goldBefore[side];
        const manaDelta = state.mana[side] - manaBefore[side];
        if (state.gold[side] >= ECONOMY.goldCap) economy[side].capGold += 1;
        if (state.mana[side] >= ECONOMY.manaCap) economy[side].capMana += 1;
        if (goldDelta > 0) economy[side].gained += goldDelta;
        if (manaDelta > 0) economy[side].manaGained += manaDelta;
      }
      const periods = { easy: 50, normal: 25, hard: 12 };
      const whiteDue = state.tick % periods[whiteDiff] === 0;
      const blackDue = state.tick % periods[blackDiff] === 0;
      const blackFirst = whiteDue && blackDue && Math.floor(state.tick / periods[whiteDiff]) % 2 === 1;
      const order = blackFirst ? ['black', 'white'] : ['white', 'black'];
      for (const side of order) {
        const beforeGold = state.gold[side];
        const beforeMana = state.mana[side];
        const beforeBlocks = new Set(state.blocks.filter((block) => block.side === side).map((block) => `${block.x}:${block.y}`));
        act(state, side, side === 'white' ? whiteDiff : blackDiff);
        const spent = beforeGold - state.gold[side];
        const manaSpent = beforeMana - state.mana[side];
        if (spent > 0) economy[side].spent += spent;
        if (manaSpent > 0) economy[side].manaSpent += manaSpent;
        const afterBlocks = new Set(state.blocks.filter((block) => block.side === side).map((block) => `${block.x}:${block.y}`));
        for (const key of afterBlocks) if (!beforeBlocks.has(key)) blocksPlaced[side] += 1;
      }
      for (const key of blocksBefore) {
        const [side, x, y] = key.split(':');
        if (!state.blocks.some((block) => block.side === side && block.x === Number(x) && block.y === Number(y))) {
          blocksDestroyed[side] += 1;
        }
      }
      for (const effect of state.effects) {
        if (seenEffects.has(effect.id)) continue;
        seenEffects.add(effect.id);
        spells[effect.spell] += 1;
      }
      for (const id of alive) {
        if (!state.towers.some((tower) => tower.id === id)) {
          alive.delete(id);
          firstDeaths.push({ id, who: towerKind.get(id), tick: state.tick, wave: state.wave });
        }
      }
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.stack ?? caught.message : String(caught);
  } finally {
    listenHarm(null);
    listenRepair(null);
    listenOvercharge(null);
  }
  const towersLeft = { white: 0, black: 0 };
  for (const tower of state.towers) towersLeft[tower.side] += 1;
  return {
    seed,
    white: whiteDiff,
    black: blackDiff,
    status: state.status,
    winner: state.winner,
    tick: state.tick,
    seconds: Math.round(state.tick * TICK_SECONDS),
    wave: state.wave,
    unfinished: state.status === 'playing',
    error,
    towersLeft,
    economy,
    spells,
    repairs,
    overcharges,
    blocksPlaced,
    blocksDestroyed,
    firstDeath: firstDeaths[0] ?? null,
    deathOrder: firstDeaths.slice(0, 6).map((death) => death.who),
    harm,
    fingerprint: fingerprint(state),
  };
}

function addHarm(bucket, events) {
  for (const event of events) {
    const key = `${event.source}:${event.kind}`;
    const row = bucket[key] ?? { damage: 0, kills: 0, hits: 0 };
    row.damage += event.amount;
    row.hits += 1;
    if (event.lethal) row.kills += 1;
    bucket[key] = row;
  }
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(games) {
  const byMatchup = {};
  const harm = {};
  const firstDeath = {};
  let draws = 0;
  let unfinished = 0;
  let errors = 0;
  let capGoldTicks = 0;
  let capManaTicks = 0;
  let gained = 0;
  let spent = 0;
  let manaGained = 0;
  let manaSpent = 0;
  let blocksPlaced = 0;
  let blocksDestroyed = 0;
  let repairs = 0;
  let overcharges = 0;
  const spells = { blessing: 0, heal: 0, blast: 0 };
  for (const game of games) {
    const key = `${game.white}-vs-${game.black}`;
    const row = byMatchup[key] ?? { games: 0, white: 0, black: 0, draw: 0, unfinished: 0, waves: [], seconds: [], whiteTowers: [], blackTowers: [] };
    row.games += 1;
    if (game.error) errors += 1;
    if (game.unfinished) {
      unfinished += 1;
      row.unfinished += 1;
    } else if (game.winner === 'draw') {
      draws += 1;
      row.draw += 1;
    } else if (game.winner === 'white') row.white += 1;
    else if (game.winner === 'black') row.black += 1;
    row.waves.push(game.wave);
    row.seconds.push(game.seconds);
    row.whiteTowers.push(game.towersLeft.white);
    row.blackTowers.push(game.towersLeft.black);
    byMatchup[key] = row;
    addHarm(harm, game.harm);
    if (game.firstDeath) firstDeath[game.firstDeath.who] = (firstDeath[game.firstDeath.who] ?? 0) + 1;
    for (const side of ['white', 'black']) {
      capGoldTicks += game.economy[side].capGold;
      capManaTicks += game.economy[side].capMana;
      gained += game.economy[side].gained;
      spent += game.economy[side].spent;
      manaGained += game.economy[side].manaGained;
      manaSpent += game.economy[side].manaSpent;
      blocksPlaced += game.blocksPlaced[side];
      blocksDestroyed += game.blocksDestroyed[side];
    }
    spells.blessing += game.spells.blessing;
    spells.heal += game.spells.heal;
    spells.blast += game.spells.blast;
    repairs += game.repairs;
    overcharges += game.overcharges;
  }
  const table = {};
  for (const [key, row] of Object.entries(byMatchup)) {
    const decided = row.white + row.black + row.draw;
    table[key] = {
      games: row.games,
      whiteWins: row.white,
      blackWins: row.black,
      draws: row.draw,
      unfinished: row.unfinished,
      whiteWinRate: decided ? Number((row.white / decided).toFixed(3)) : null,
      meanWaves: Number(mean(row.waves).toFixed(2)),
      meanSeconds: Number(mean(row.seconds).toFixed(1)),
      meanTowersLeft: {
        white: Number(mean(row.whiteTowers).toFixed(2)),
        black: Number(mean(row.blackTowers).toFixed(2)),
      },
    };
  }
  return {
    games: games.length,
    draws,
    unfinished,
    errors,
    economy: {
      goldGained: gained,
      goldSpent: spent,
      goldFloatedAtCapTicks: capGoldTicks,
      manaGained: Number(manaGained.toFixed(1)),
      manaSpent: Number(manaSpent.toFixed(1)),
      manaFloatedAtCapTicks: capManaTicks,
      spendRatio: gained ? Number((spent / gained).toFixed(3)) : null,
      manaSpendRatio: manaGained ? Number((manaSpent / manaGained).toFixed(3)) : null,
    },
    blocksPlaced,
    blocksDestroyed,
    repairs,
    overcharges,
    spells,
    firstTowerDeath: firstDeath,
    harm,
    matchups: table,
  };
}

const games = [];
for (const [white, black] of MATCHUPS) {
  for (const seed of SEEDS) {
    const game = play(seed, white, black);
    games.push(game);
    process.stderr.write(`${white} vs ${black} seed ${seed}: ${game.winner ?? 'unfinished'} wave ${game.wave} ${game.seconds}s\n`);
  }
}

const mirrors = games.filter((game) => game.white === game.black && game.white === 'normal' && game.seed <= 3);
const desyncs = [];
for (const game of mirrors) {
  const again = play(game.seed, game.white, game.black);
  if (again.fingerprint !== game.fingerprint) {
    desyncs.push({ seed: game.seed, first: game.fingerprint, second: again.fingerprint });
  }
}

const report = {
  maxTicks: MAX_TICKS,
  tickSeconds: TICK_SECONDS,
  seeds: SEEDS,
  note: 'Both sides are AI. White acts before Black on a shared tick. Mode is local so the engine does not add a third decision. There is no stalemate status; a match still playing at the tick cap is unfinished.',
  summary: summarize(games),
  desyncs,
  games: games.map(({ harm, fingerprint, ...rest }) => rest),
};

const target = process.argv[2] ?? '/tmp/playtest-before.json';
await writeFile(target, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ target, games: report.summary.games, desyncs: desyncs.length, unfinished: report.summary.unfinished, errors: report.summary.errors, matchups: report.summary.matchups }, null, 2));
