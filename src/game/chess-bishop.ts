import { LitElement, css, type CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { pieceSvg } from './glyphs.js';
import type { Side } from './types.js';

@customElement('chess-bishop')
export class ChessBishop extends LitElement {
  @property({ type: String }) side: Side = 'white';

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: grid; place-items: center; width: 100%; height: 100%; pointer-events: none; }
      svg { width: 74%; height: 74%; }
    `;
  }

  protected override render() {
    return pieceSvg('bishop', this.side);
  }
}
