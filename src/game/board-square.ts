import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { blockProblem } from './commands.js';
import { legalMoves, towerAt } from './chess.js';
import { handleCell, handleSquare } from './input.js';
import './one-square.js';
import { connectStore, type RootState } from '../store.js';
import type { GameState, Square } from './types.js';

@customElement('board-square')
export class BoardSquare extends connect(connectStore)(LitElement) {
  @state() private game: GameState | null = null;
  @state() private selected: Square | null = null;
  @state() private placing: 'white' | 'black' | null = null;
  @state() private ghost: SquareCell | null = null;

  override stateChanged(state: RootState): void {
    this.game = state.game.game;
    this.selected = state.game.selected;
    this.placing = state.game.placing;
  }

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; width: min(100%, 720px); margin: 0 auto; }
      .frame {
        position: relative;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        width: 100%;
        border: 3px solid #3a2a1c;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
      }
      .actors, .maze {
        position: absolute;
        inset: 0;
        z-index: 5;
      }
      .actors { pointer-events: none; }
      .maze { touch-action: none; }
      .half { position: absolute; left: 0; right: 0; height: 50%; pointer-events: none; }
      .half.top { top: 0; background: rgba(180, 60, 60, 0.18); }
      .half.bottom { bottom: 0; background: rgba(40, 90, 180, 0.18); }
      .half.own { background: rgba(70, 170, 90, 0.38); }
      .ghost { position: absolute; box-sizing: border-box; }
      .ghost.ok { background: rgba(40, 160, 70, 0.55); }
      .ghost.bad { background: rgba(200, 40, 40, 0.5); }
      .token, .shot, .pulse {
        position: absolute;
        transform: translate(-50%, -50%);
      }
      .token {
        width: 4.2%;
        height: 4.2%;
        border-radius: 50%;
        display: grid;
        place-items: end center;
      }
      .token.white { background: #d7ecff; box-shadow: 0 0 0 1px #16324a; }
      .token.black { background: #ffb4b4; box-shadow: 0 0 0 1px #4a1616; }
      .token.knight { border-radius: 2px; transform: translate(-50%, -50%) rotate(45deg); }
      .token.archer { clip-path: polygon(50% 0, 100% 100%, 0 100%); border-radius: 0; }
      .token.cannon { border-radius: 2px; }
      .token.mage { clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); }
      .token.buff { outline: 2px solid #f6d56a; }
      .bar { width: 140%; height: 2px; background: rgba(0,0,0,.4); }
      .bar span { display: block; height: 100%; background: #3dba5c; }
      .shot { width: 1.6%; height: 1.6%; border-radius: 50%; background: #f4e27a; }
      .shot.shell { width: 2.2%; height: 2.2%; background: #e7e2d6; }
      .shot.arrow { background: #d7ecff; }
      .pulse {
        border-radius: 50%;
        border: 3px solid transparent;
        opacity: 0.85;
      }
      .pulse.blessing { border-color: #f6d56a; background: rgba(246, 213, 106, 0.18); }
      .pulse.heal { border-color: #7ddea0; background: rgba(80, 180, 110, 0.16); }
      .pulse.blast { border-color: #ff8a4a; background: rgba(255, 90, 40, 0.22); }
    `;
  }

  protected override render(): TemplateResult {
    const game = this.game;
    if (!game || game.status === 'menu') return html``;
    const selectedTower = this.selected ? towerAt(game, this.selected.file, this.selected.rank) : undefined;
    const moves = selectedTower ? legalMoves(game, selectedTower) : [];
    const blocks = new Set(game.blocks.map((block) => block.y * 16 + block.x));
    const squares = [];
    for (let rank = 7; rank >= 0; rank -= 1) {
      for (let file = 0; file < 8; file += 1) {
        const tower = towerAt(game, file, rank);
        const move = moves.find((square) => square.file === file && square.rank === rank);
        const hint = this.selected && this.selected.file === file && this.selected.rank === rank
          ? 'selected'
          : move
            ? (tower ? 'capture' : 'move')
            : '';
        const blocked = [
          blocks.has((rank * 2 + 1) * 16 + file * 2),
          blocks.has((rank * 2 + 1) * 16 + file * 2 + 1),
          blocks.has((rank * 2) * 16 + file * 2),
          blocks.has((rank * 2) * 16 + file * 2 + 1),
        ];
        squares.push(html`
          <one-square
            .file=${file}
            .rank=${rank}
            .dark=${(file + rank) % 2 === 0}
            .hint=${hint}
            .kind=${tower?.kind ?? ''}
            .side=${tower?.side ?? ''}
            .hp=${tower?.hp ?? 0}
            .maxHp=${tower?.maxHp ?? 1}
            .blocked=${blocked}
            .label=${tower ? `${tower.side} ${tower.kind}` : 'empty square'}
            @square-click=${(event: CustomEvent<{ file: number; rank: number }>) => handleSquare(event.detail.file, event.detail.rank)}
          ></one-square>
        `);
      }
    }
    return html`
      <div class="frame">
        ${squares}
        <div class="actors">
          ${game.effects.map((effect) => {
            const size = effect.spell === 'heal' ? effect.radius * 2 / 8 * 100 : effect.radius * 2 / 16 * 100;
            const left = (effect.file + 0.5) / 8 * 100;
            const top = (7 - effect.rank + 0.5) / 8 * 100;
            return html`<div class="pulse ${effect.spell}" style="left:${left}%; top:${top}%; width:${size}%; height:${size}%"></div>`;
          })}
          ${game.soldiers.map((soldier) => html`
            <div
              class="token ${soldier.side} ${soldier.kind} ${soldier.buffUntil >= game.tick ? 'buff' : ''}"
              style="left:${(soldier.x + 0.5) / 16 * 100}%; top:${(15 - soldier.y + 0.5) / 16 * 100}%">
              <div class="bar"><span style="width:${Math.max(0, soldier.hp / soldier.maxHp) * 100}%"></span></div>
            </div>
          `)}
          ${game.blocks.filter((block) => block.hp > 0).map((block) => html`
            <div class="token" style="left:${(block.x + 0.5) / 16 * 100}%; top:${(15 - block.y + 0.5) / 16 * 100}%; width:5%; height:5%; background:transparent; box-shadow:none;">
              <div class="bar"><span style="width:${Math.max(0, block.hp / block.maxHp) * 100}%"></span></div>
            </div>
          `)}
          ${game.projectiles.map((shot) => {
            const t = Math.min(1, (game.tick - shot.born) / Math.max(1, shot.life));
            const x = shot.x + (shot.tx - shot.x) * t;
            const y = shot.y + (shot.ty - shot.y) * t;
            return html`<div class="shot ${shot.kind}" style="left:${(x + 0.5) / 16 * 100}%; top:${(15 - y + 0.5) / 16 * 100}%"></div>`;
          })}
        </div>
        ${this.placing ? this.maze(game) : ''}
      </div>
    `;
  }

  private maze(game: GameState): TemplateResult {
    const side = this.placing;
    const ghost = this.ghost;
    const own = ghost ? game.blocks.some((block) => block.x === ghost.x && block.y === ghost.y && block.hp > 0 && block.side === side) : false;
    const problem = ghost && side && !own ? blockProblem(game, side, ghost.x, ghost.y) : '';
    return html`
      <div
        class="maze"
        @pointermove=${(event: PointerEvent) => this.track(event)}
        @pointerdown=${(event: PointerEvent) => this.track(event)}
        @pointerup=${(event: PointerEvent) => this.drop(event)}>
        <div class="half top ${side === 'black' ? 'own' : ''}"></div>
        <div class="half bottom ${side === 'white' ? 'own' : ''}"></div>
        ${ghost ? html`<div class="ghost ${own || problem === '' ? 'ok' : 'bad'}" style="left:${ghost.x / 16 * 100}%; top:${(15 - ghost.y) / 16 * 100}%; width:${100 / 16}%; height:${100 / 16}%"></div>` : ''}
      </div>
    `;
  }

  private cellAt(event: PointerEvent): SquareCell | null {
    const frame = event.currentTarget as HTMLElement;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.min(15, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * 16)));
    const y = 15 - Math.min(15, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * 16)));
    return { x, y };
  }

  private track(event: PointerEvent): void {
    this.ghost = this.cellAt(event);
  }

  private drop(event: PointerEvent): void {
    const cell = this.cellAt(event);
    this.ghost = cell;
    if (cell) handleCell(cell.x, cell.y);
  }
}

interface SquareCell {
  x: number;
  y: number;
}
