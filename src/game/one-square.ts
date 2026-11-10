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
  @property({ type: Array }) blocked: boolean[] = [false, false, false, false];
  @property({ type: String }) label = '';

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        position: relative;
        display: block;
        background: #efd9b5;
        min-width: 0;
        aspect-ratio: 1;
      }
      :host([dark]) { background: #b58863; }
      :host([hint='selected']) { box-shadow: inset 0 0 0 3px #f6d56a; }
      four-square { position: absolute; inset: 0; }
      .piece { position: absolute; inset: 8% 6% 16%; }
      .hp {
        position: absolute;
        left: 8%;
        right: 8%;
        bottom: 6%;
        height: 5px;
        border-radius: 3px;
        background: rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }
      .hp span { display: block; height: 100%; background: #3dba5c; }
      .hp.low span { background: #e04b3a; }
      .mark {
        position: absolute;
        width: 28%;
        height: 28%;
        left: 36%;
        top: 36%;
        border-radius: 50%;
        z-index: 2;
      }
      .mark.move { background: rgba(32, 130, 48, 0.72); }
      .mark.capture { background: rgba(176, 32, 32, 0.78); box-shadow: inset 0 0 0 2px #ffd7d0; }
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
      <four-square .blocked=${this.blocked}></four-square>
      ${this.kind === 'pawn' ? html`<chess-pawn class="piece" .side=${this.side || 'white'}></chess-pawn>` : ''}
      ${this.kind === 'knight' ? html`<chess-knight class="piece" side=${this.side || 'white'}></chess-knight>` : ''}
      ${this.kind === 'bishop' ? html`<chess-bishop class="piece" .side=${this.side || 'white'}></chess-bishop>` : ''}
      ${this.kind === 'rook' ? html`<chess-rook class="piece" .side=${this.side || 'white'}></chess-rook>` : ''}
      ${this.kind === 'queen' ? html`<chess-queen class="piece" .side=${this.side || 'white'}></chess-queen>` : ''}
      ${this.kind === 'king' ? html`<chess-king class="piece" .side=${this.side || 'white'}></chess-king>` : ''}
      ${this.kind ? html`<div class="hp ${ratio < 0.35 ? 'low' : ''}"><span style="width:${ratio * 100}%"></span></div>` : ''}
      ${this.hint === 'move' || this.hint === 'capture' ? html`<div class="mark ${this.hint}"></div>` : ''}
      ${showRank ? html`<span class="coord rank">${this.rank + 1}</span>` : ''}
      ${showFile ? html`<span class="coord file">${'abcdefgh'[this.file]}</span>` : ''}
      <button type="button" aria-label=${this.label || 'square'} @click=${this.choose}></button>
    `;
  }
}
