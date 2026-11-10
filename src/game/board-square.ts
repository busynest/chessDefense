import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { blockProblem } from './commands.js';
import { towerAt } from './chess.js';
import { pieceSvg } from './glyphs.js';
import { handleCell, handleSquare } from './input.js';
import './one-square.js';
import { soldierSvg } from './soldiers.js';
import { connectStore, type RootState } from '../store.js';
import type { GameState, PieceKind, Side, Square } from './types.js';
import { BLOCKS, WAVES, buildableRows, combatOf, overcharged } from './units.js';

@customElement('board-square')
export class BoardSquare extends connect(connectStore)(LitElement) {
  @state() private game: GameState | null = null;
  @state() private selected: Square | null = null;
  @state() private hover: Square | null = null;
  @state() private placing: 'white' | 'black' | null = null;
  @state() private ghost: SquareCell | null = null;
  private ruins: Ruin[] = [];
  private ashes: Ash[] = [];
  private ruinTimer = 0;

  override stateChanged(state: RootState): void {
    const next = state.game.game;
    if (this.game && next && this.game.status !== 'menu') {
      const ids = new Set(next.towers.map((tower) => tower.id));
      const soldiers = new Set(next.soldiers.map((soldier) => soldier.id));
      const now = performance.now();
      for (const tower of this.game.towers) {
        if (!ids.has(tower.id)) {
          this.ruins.push({ file: tower.file, rank: tower.rank, side: tower.side, kind: tower.kind, born: now });
        }
      }
      for (const soldier of this.game.soldiers) {
        if (!soldiers.has(soldier.id)) {
          this.ashes.push({ x: soldier.x, y: soldier.y, side: soldier.side, born: now });
        }
      }
      this.ruins = this.ruins.filter((ruin) => now - ruin.born < 1500);
      this.ashes = this.ashes.filter((ash) => now - ash.born < 700);
      if (this.ruins.length > 0 || this.ashes.length > 0) {
        window.clearTimeout(this.ruinTimer);
        this.ruinTimer = window.setTimeout(() => this.requestUpdate(), 1600);
      }
    }
    this.game = next;
    this.selected = state.game.selected;
    this.placing = state.game.placing;
  }

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        width: min(100%, 720px);
        margin: 0 auto;
        padding: 10px;
        border-radius: 18px;
        background:
          linear-gradient(180deg, #5c4634, #2a1d14 40%, #1a120e);
        box-shadow:
          0 22px 30px rgba(0, 0, 0, 0.55),
          inset 0 1px 0 rgba(255, 220, 170, 0.35);
      }
      .frame {
        position: relative;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        width: 100%;
        border: 6px solid #3a2c22;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: inset 0 0 0 2px #c4a574, 0 0 22px rgba(255, 160, 70, 0.16);
      }
      .actors, .maze {
        position: absolute;
        inset: 0;
        z-index: 5;
      }
      .actors { pointer-events: none; }
      .maze { touch-action: none; }
      .band { position: absolute; left: 0; right: 0; height: 6.25%; pointer-events: none; }
      .band.allowed { background: rgba(70, 160, 210, 0.34); box-shadow: inset 0 0 18px rgba(140, 210, 255, 0.35); }
      .band.reserved {
        background: repeating-linear-gradient(
          90deg,
          rgba(246, 214, 120, 0.42) 0 8px,
          rgba(90, 60, 24, 0.28) 8px 16px
        );
      }
      .ghost { position: absolute; box-sizing: border-box; }
      .ghost.ok { background: rgba(140, 230, 180, 0.45); box-shadow: 0 0 14px #8dffc0, inset 0 0 0 2px #f3fff8; }
      .ghost.bad { background: rgba(220, 50, 40, 0.5); box-shadow: 0 0 14px #ff6a4a, inset 0 0 0 2px #ffe0d8; }
      .range {
        position: absolute;
        border-radius: 50%;
        border: 2px dashed rgba(246, 231, 168, 0.9);
        background: rgba(246, 214, 120, 0.12);
        box-shadow: inset 0 0 18px rgba(246, 214, 120, 0.2);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .mend {
        position: absolute;
        width: 12%;
        height: 12%;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, rgba(160, 255, 190, 0.55), transparent 70%);
        box-shadow: 0 0 16px rgba(120, 255, 170, 0.8);
        pointer-events: none;
      }
      .unit, .shot, .pulse, .ruin {
        position: absolute;
        transform: translate(-50%, -50%);
      }
      .unit {
        width: 5.4%;
        height: 6.6%;
        transform: translate(-50%, -72%);
        animation: march 0.42s ease-in-out infinite;
      }
      .unit.buff { filter: drop-shadow(0 0 4px #f6e27a); }
      .unit.strike { filter: brightness(1.7) drop-shadow(0 0 4px #fff1c4); }
      .unit svg { width: 100%; height: 100%; }
      .shot { width: 2.6%; height: 0.9%; border-radius: 2px; background: #f4e7b0; box-shadow: 0 0 6px #fff1c0; }
      .shot.shell { width: 3%; height: 3%; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff, #8d8a84 55%, #2a2a28); box-shadow: 0 0 8px #ffb060; }
      .shot.arrow { width: 3.6%; height: 0.7%; background: linear-gradient(90deg, transparent, #f7f1e1 30%, #f7f1e1); }
      .shot.magic { width: 2.8%; height: 2.8%; border-radius: 50%; background: radial-gradient(circle, #fff6c8, #c47bff 70%); box-shadow: 0 0 10px #e4b0ff; }
      .pulse { border-radius: 50%; }
      .pulse i, .pulse b {
        position: absolute;
        border-radius: 50%;
        border: 3px solid currentColor;
        box-shadow: 0 0 16px currentColor, inset 0 0 12px currentColor;
        animation: ring 1.15s ease-out infinite;
      }
      .pulse i { inset: 4%; }
      .pulse b { inset: 22%; animation-delay: 0.4s; }
      .pulse::before {
        content: "";
        position: absolute;
        inset: 12%;
        background:
          radial-gradient(circle at 18% 28%, currentColor 0 4px, transparent 5px),
          radial-gradient(circle at 72% 22%, currentColor 0 3px, transparent 4px),
          radial-gradient(circle at 36% 74%, currentColor 0 4px, transparent 5px),
          radial-gradient(circle at 80% 68%, currentColor 0 3px, transparent 4px);
      }
      .pulse.blessing { color: #ffe38a; background: radial-gradient(circle, rgba(255, 214, 90, 0.62), rgba(255, 190, 60, 0.16) 58%, transparent 74%); }
      .pulse.heal { color: #9dffc4; background: radial-gradient(circle, rgba(120, 230, 160, 0.58), rgba(80, 200, 140, 0.14) 60%, transparent 74%); }
      .pulse.blast { color: #ffb088; background: radial-gradient(circle, rgba(255, 90, 40, 0.62), rgba(255, 60, 20, 0.18) 55%, transparent 72%); }
      .ruin { width: 12%; height: 15%; animation: crumble 1.4s ease-in forwards; filter: drop-shadow(0 0 8px #ffb060); }
      .ruin svg { width: 100%; height: 100%; }
      .ruin::after {
        content: "";
        position: absolute;
        left: 8%;
        right: 8%;
        bottom: -6%;
        height: 36%;
        background:
          radial-gradient(circle at 22% 40%, #f0e2c8 0 5px, transparent 6px),
          radial-gradient(circle at 48% 70%, #8a6a48 0 6px, transparent 7px),
          radial-gradient(circle at 74% 36%, #efe6d4 0 4px, transparent 5px);
      }
      .ash {
        width: 3.2%;
        height: 3.2%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 220, 160, 0.9), rgba(80, 40, 20, 0.2) 70%, transparent);
        animation: puff 0.65s ease-out forwards;
      }
      @keyframes march { 50% { transform: translate(-50%, -80%); } }
      @keyframes ring { to { transform: scale(1.28); opacity: 0; } }
      @keyframes crumble {
        0% { transform: translate(-50%, -62%) rotate(-16deg) scale(1.08); opacity: 1; filter: brightness(1.7) drop-shadow(0 0 10px #ffb060); }
        18% { transform: translate(-40%, -28%) rotate(18deg) scale(0.82); opacity: 1; }
        100% { transform: translate(-50%, 28%) rotate(32deg) scale(0.18); opacity: 0; filter: grayscale(1); }
      }
      @keyframes puff { to { transform: translate(-50%, -80%) scale(1.8); opacity: 0; } }
      @media (prefers-reduced-motion: reduce) {
        .unit, .pulse i, .pulse b, .ruin, .ash { animation: none; }
      }
    `;
  }

  protected override render(): TemplateResult {
    const game = this.game;
    if (!game || game.status === 'menu') return html``;
    const focus = this.selected ?? this.hover;
    const focusTower = focus ? towerAt(game, focus.file, focus.rank) : undefined;
    const fresh = game.wave > 0 && game.nextWaveTick - game.tick > WAVES.gapTicks - 10;
    const squares = [];
    for (let rank = 7; rank >= 0; rank -= 1) {
      for (let file = 0; file < 8; file += 1) {
        const tower = towerAt(game, file, rank);
        const hint = this.selected && this.selected.file === file && this.selected.rank === rank ? 'selected' : '';
        const walls = [
          wallRatio(game, file * 2, rank * 2 + 1),
          wallRatio(game, file * 2 + 1, rank * 2 + 1),
          wallRatio(game, file * 2, rank * 2),
          wallRatio(game, file * 2 + 1, rank * 2),
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
            .level=${tower?.level ?? 1}
            .walls=${walls}
            .etched=${this.placing !== null}
            ?portal=${fresh && !!tower}
            ?charged=${!!tower && overcharged(tower.overchargeUntil, game.tick)}
            .label=${tower ? `${tower.side} ${tower.kind}` : 'empty square'}
            @square-click=${(event: CustomEvent<{ file: number; rank: number }>) => handleSquare(event.detail.file, event.detail.rank)}
            @square-hover=${(event: CustomEvent<{ file: number; rank: number; on: boolean }>) => {
              this.hover = event.detail.on ? { file: event.detail.file, rank: event.detail.rank } : null;
            }}
          ></one-square>
        `);
      }
    }
    return html`
      <div class="frame">
        ${squares}
        ${focusTower ? this.ring(focusTower) : ''}
        ${game.towers.filter((tower) => tower.mendedTick > 0 && game.tick - tower.mendedTick < 24).map((tower) => html`
          <div class="mend" style="left:${(tower.file + 0.5) / 8 * 100}%; top:${(7 - tower.rank + 0.5) / 8 * 100}%"></div>
        `)}
        <div class="actors">
          ${game.effects.map((effect) => {
            const size = effect.spell === 'heal' ? effect.radius * 2 / 8 * 100 : effect.radius * 2 / 16 * 100;
            const left = (effect.file + 0.5) / 8 * 100;
            const top = (7 - effect.rank + 0.5) / 8 * 100;
            return html`<div class="pulse ${effect.spell}" style="left:${left}%; top:${top}%; width:${size}%; height:${size}%"><i></i><b></b></div>`;
          })}
          ${this.ruins.map((ruin) => html`
            <div class="ruin" style="left:${(ruin.file + 0.5) / 8 * 100}%; top:${(7 - ruin.rank + 0.5) / 8 * 100}%">
              ${pieceSvg(ruin.kind, ruin.side, 0.2, 1)}
            </div>
          `)}
          ${game.soldiers.map((soldier) => html`
            <div
              class="unit ${soldier.side} ${soldier.buffUntil >= game.tick ? 'buff' : ''} ${soldier.attackReadyTick - game.tick >= 6 ? 'strike' : ''}"
              style="left:${(soldier.x + 0.5) / 16 * 100}%; top:${(15 - soldier.y + 0.5) / 16 * 100}%">
              ${soldierSvg(soldier.kind, soldier.side)}
            </div>
          `)}
          ${this.ashes.map((ash) => html`
            <div class="ash ${ash.side}" style="left:${(ash.x + 0.5) / 16 * 100}%; top:${(15 - ash.y + 0.5) / 16 * 100}%"></div>
          `)}
          ${game.projectiles.map((shot) => {
            const t = Math.min(1, (game.tick - shot.born) / Math.max(1, shot.life));
            const x = shot.x + (shot.tx - shot.x) * t;
            const y = shot.y + (shot.ty - shot.y) * t;
            const angle = Math.atan2(shot.y - shot.ty, shot.tx - shot.x) * 180 / Math.PI;
            return html`<div class="shot ${shot.kind === 'shot' ? 'magic' : shot.kind}" style="left:${(x + 0.5) / 16 * 100}%; top:${(15 - y + 0.5) / 16 * 100}%; transform: translate(-50%, -50%) rotate(${angle}deg)"></div>`;
          })}
        </div>
        ${this.placing ? this.maze(game) : ''}
      </div>
    `;
  }

  private ring(tower: GameState['towers'][number]): TemplateResult {
    const range = combatOf(tower.kind, tower.level).range;
    const size = range * 2 / 16 * 100;
    const left = (tower.file + 0.5) / 8 * 100;
    const top = (7 - tower.rank + 0.5) / 8 * 100;
    return html`<div class="range" style="left:${left}%; top:${top}%; width:${size}%; height:${size}%"></div>`;
  }

  private maze(game: GameState): TemplateResult {
    const side = this.placing;
    if (!side) return html``;
    const ghost = this.ghost;
    const own = ghost ? game.blocks.some((block) => block.x === ghost.x && block.y === ghost.y && block.hp > 0 && block.side === side) : false;
    const problem = ghost && side && !own ? blockProblem(game, side, ghost.x, ghost.y) : '';
    return html`
      <div
        class="maze"
        @pointermove=${(event: PointerEvent) => this.track(event)}
        @pointerdown=${(event: PointerEvent) => this.track(event)}
        @pointerup=${(event: PointerEvent) => this.drop(event)}>
        ${buildableRows(side).map((y) => html`<div class="band allowed" style="top:${(15 - y) / 16 * 100}%"></div>`)}
        ${BLOCKS.centerRows.map((y) => html`<div class="band reserved" style="top:${(15 - y) / 16 * 100}%"></div>`)}
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

interface Ruin {
  file: number;
  rank: number;
  side: Side;
  kind: PieceKind;
  born: number;
}

interface Ash {
  x: number;
  y: number;
  side: Side;
  born: number;
}

function wallRatio(game: GameState, x: number, y: number): number {
  const block = game.blocks.find((item) => item.x === x && item.y === y && item.hp > 0);
  return block ? block.hp / block.maxHp : -1;
}
