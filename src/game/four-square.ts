import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './square-space.js';

/**
 * The 2×2 army grid inside one chess square.
 * `walls` is top-left, top-right, bottom-left, bottom-right: -1 if empty, otherwise life ratio.
 */
@customElement('four-square')
export class FourSquare extends LitElement {
  @property({ type: Array }) walls: number[] = [-1, -1, -1, -1];
  @property({ type: Boolean, reflect: true }) etched = false;

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; width: 100%; height: 100%; pointer-events: none; opacity: 0.28; }
      :host([etched]) { opacity: 1; }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        width: 100%;
        height: 100%;
      }
    `;
  }

  protected override render(): TemplateResult {
    const walls = this.walls;
    return html`
      <div class="grid">
        ${[0, 1, 2, 3].map((index) => html`<square-space .ratio=${walls[index] ?? -1}></square-space>`)}
      </div>
    `;
  }
}
