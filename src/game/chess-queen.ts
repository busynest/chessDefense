import { LitElement, css, type CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { pieceSvg } from './glyphs.js';
import type { Side } from './types.js';

@customElement('chess-queen')
export class ChessQueen extends LitElement {
  @property({ type: String }) side: Side = 'white';
  @property({ type: Number }) hp = 1;
  @property({ type: Number }) maxHp = 1;

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: grid; place-items: center; width: 100%; height: 100%; pointer-events: none; }
      svg { width: 80%; height: 80%; }
    `;
  }

  protected override render() {
    return pieceSvg('queen', this.side, this.maxHp > 0 ? this.hp / this.maxHp : 1);
  }
}
