import { LitElement, css, type CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { pieceSvg } from './glyphs.js';
import type { Side } from './types.js';

@customElement('chess-king')
export class ChessKing extends LitElement {
  @property({ type: String }) side: Side = 'white';

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: grid; place-items: center; width: 100%; height: 100%; pointer-events: none; }
      svg { width: 80%; height: 80%; }
    `;
  }

  protected override render() {
    return pieceSvg('king', this.side);
  }
}
