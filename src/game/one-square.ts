import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './four-square.js';
import './chess-pawn.js';
import './chess-knight.js';
import './chess-bishop.js';
import './chess-rook.js';
import './chess-queen.js';
import './chess-king.js';
import type { PieceKind, Side } from './types.js';

/** One square of the 8×8 tower grid. */
@customElement('one-square')
export class OneSquare extends LitElement {
  @property({ type: Number }) file = 0;
  @property({ type: Number }) rank = 0;
  @property({ type: Boolean, reflect: true }) dark = false;
  @property({ type: String, reflect: true }) hint = '';
  @property({ type: String }) kind: PieceKind | '' = '';
  @property({ type: String }) side: Side | '' = '';
  @property({ type: Number }) hp = 0;
  @property({ type: Number }) maxHp = 1;
  @property({ type: Array }) walls: number[] = [-1, -1, -1, -1];
  @property({ type: Boolean, reflect: true }) etched = false;
  @property({ type: Boolean, reflect: true }) portal = false;
  @property({ type: String }) label = '';

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        position: relative;
        display: block;
        min-width: 0;
        aspect-ratio: 1;
        background:
          linear-gradient(155deg, rgba(255, 228, 190, 0.28), transparent 36%),
          repeating-linear-gradient(90deg, rgba(70, 40, 16, 0.07) 0 1px, transparent 1px 7px),
          repeating-linear-gradient(0deg, rgba(50, 28, 12, 0.05) 0 1px, transparent 1px 9px),
          radial-gradient(circle at 28% 18%, #c4a882, #7a5340 82%);
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 220, 0.7),
          inset 0 -3px 0 rgba(48, 26, 10, 0.48),
          inset 3px 0 5px rgba(40, 20, 8, 0.16);
      }
      :host([dark]) {
        background:
          linear-gradient(155deg, rgba(255, 200, 150, 0.12), transparent 40%),
          repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.18) 0 1px, transparent 1px 7px),
          repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.12) 0 1px, transparent 1px 9px),
          radial-gradient(circle at 28% 18%, #6a4032, #241610 84%);
        box-shadow:
          inset 0 1px 0 rgba(255, 220, 180, 0.28),
          inset 0 -3px 0 rgba(8, 4, 2, 0.62),
          inset 3px 0 6px rgba(0, 0, 0, 0.22);
      }
      :host([hint='selected']) {
        box-shadow: inset 0 0 0 2px #f6e7a8, 0 0 14px rgba(246, 214, 120, 0.85);
        z-index: 2;
      }
      :host([portal]) .piece { filter: drop-shadow(0 0 7px #f0c56a) drop-shadow(0 4px 2px rgba(0, 0, 0, 0.5)); }
      four-square { position: absolute; inset: 0; }
      .piece {
        position: absolute;
        inset: -10% -4% 5%;
        filter: drop-shadow(0 4px 2px rgba(0, 0, 0, 0.5));
      }
      .hp {
        position: absolute;
        left: 12%;
        right: 12%;
        bottom: 3%;
        height: 5px;
        border-radius: 4px;
        background: rgba(12, 8, 6, 0.72);
        box-shadow: 0 0 0 1px rgba(232, 206, 150, 0.45);
        overflow: hidden;
        z-index: 3;
      }
      .hp span { display: block; height: 100%; background: linear-gradient(#d8f5c8, #3dba5c); }
      .hp.low span { background: linear-gradient(#ffd0c4, #c0392b); }
      .mark {
        position: absolute;
        width: 34%;
        height: 34%;
        left: 33%;
        top: 33%;
        border-radius: 50%;
        z-index: 2;
      }
      .mark.move {
        background: radial-gradient(circle, rgba(190,255,210,0.95), rgba(40,160,80,0.15) 70%);
        box-shadow: 0 0 10px #8dffc0;
      }
      .mark.capture {
        background: radial-gradient(circle, rgba(255,180,160,0.95), rgba(160,30,20,0.2) 70%);
        box-shadow: 0 0 10px #ff6a4a;
      }
      button {
        position: absolute;
        inset: 0;
        z-index: 4;
        border: 0;
        padding: 0;
        background: transparent;
        cursor: pointer;
        touch-action: manipulation;
      }
      .coord {
        position: absolute;
        z-index: 3;
        font-size: 9px;
        line-height: 1;
        color: rgba(40, 24, 8, 0.7);
        pointer-events: none;
      }
      .file { right: 2px; bottom: 2px; }
      .rank { left: 2px; top: 2px; }
    `;
  }

  private choose(): void {
    this.dispatchEvent(new CustomEvent('square-click', {
      detail: { file: this.file, rank: this.rank },
      bubbles: true,
      composed: true,
    }));
  }

  protected override render(): TemplateResult {
    const ratio = this.maxHp > 0 ? Math.max(0, Math.min(1, this.hp / this.maxHp)) : 0;
    const showRank = this.file === 0;
    const showFile = this.rank === 0;
    return html`
      <four-square .walls=${this.walls} ?etched=${this.etched}></four-square>
      ${this.kind === 'pawn' ? html`<chess-pawn class="piece" .side=${this.side || 'white'} .hp=${this.hp} .maxHp=${this.maxHp}></chess-pawn>` : ''}
      ${this.kind === 'knight' ? html`<chess-knight class="piece" side=${this.side || 'white'} .hp=${this.hp} .maxHp=${this.maxHp}></chess-knight>` : ''}
      ${this.kind === 'bishop' ? html`<chess-bishop class="piece" .side=${this.side || 'white'} .hp=${this.hp} .maxHp=${this.maxHp}></chess-bishop>` : ''}
      ${this.kind === 'rook' ? html`<chess-rook class="piece" .side=${this.side || 'white'} .hp=${this.hp} .maxHp=${this.maxHp}></chess-rook>` : ''}
      ${this.kind === 'queen' ? html`<chess-queen class="piece" .side=${this.side || 'white'} .hp=${this.hp} .maxHp=${this.maxHp}></chess-queen>` : ''}
      ${this.kind === 'king' ? html`<chess-king class="piece" .side=${this.side || 'white'} .hp=${this.hp} .maxHp=${this.maxHp}></chess-king>` : ''}
      ${this.kind ? html`<div class="hp ${ratio < 0.35 ? 'low' : ''}"><span style="width:${ratio * 100}%"></span></div>` : ''}
      ${this.hint === 'move' || this.hint === 'capture' ? html`<div class="mark ${this.hint}"></div>` : ''}
      ${showRank ? html`<span class="coord rank">${this.rank + 1}</span>` : ''}
      ${showFile ? html`<span class="coord file">${'abcdefgh'[this.file]}</span>` : ''}
      <button type="button" aria-label=${this.label || 'square'} @click=${this.choose}></button>
    `;
  }
}
