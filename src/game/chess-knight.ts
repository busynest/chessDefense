import { LitElement, css, type CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { pieceSvg } from './glyphs.js';
import type { Side } from './types.js';

@customElement('chess-knight')
export class ChessKnight extends LitElement {
  @property({ type: String, reflect: true }) side: Side = 'white';
  @property({ type: Number }) hp = 1;
  @property({ type: Number }) maxHp = 1;
  @property({ type: Number }) level = 1;

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: grid; place-items: center; width: 100%; height: 100%; pointer-events: none; }
      :host([side='black']) svg { transform: scaleX(-1); }
      svg { width: 96%; height: 96%; }
    `;
  }

  protected override render() {
    return pieceSvg('knight', this.side, this.maxHp > 0 ? this.hp / this.maxHp : 1, this.level);
  }
}
