import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './box-block.js';

/** One cell of the 16×16 army grid. `ratio` is -1 when the cell is open. */
@customElement('square-space')
export class SquareSpace extends LitElement {
  @property({ type: Number }) ratio = -1;

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: 1px solid rgba(255, 236, 200, 0.14);
        pointer-events: none;
      }
    `;
  }

  protected override render(): TemplateResult {
    return this.ratio >= 0 ? html`<box-block .ratio=${this.ratio}></box-block>` : html``;
  }
}
