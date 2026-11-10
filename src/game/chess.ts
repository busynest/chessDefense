import type { GameState, Tower } from './types.js';

export function towerAt(state: GameState, file: number, rank: number): Tower | undefined {
  return state.towers.find((tower) => tower.hp > 0 && tower.file === file && tower.rank === rank);
}
