import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './box-block.js';

/** One cell of the 16×16 army grid. */
@customElement('square-space')
export class SquareSpace extends LitElement {
  @property({ type: Boolean }) blocked = false;

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: 1px solid rgba(40, 28, 16, 0.18);
        pointer-events: none;
      }
    `;
  }

  protected override render(): TemplateResult {
    return this.blocked ? html`<box-block></box-block>` : html``;
  }
}
