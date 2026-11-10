import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './square-space.js';

/**
 * The 2×2 army grid inside one chess square.
 * `blocked` is top-left, top-right, bottom-left, bottom-right.
 */
@customElement('four-square')
export class FourSquare extends LitElement {
  @property({ type: Array }) blocked: boolean[] = [false, false, false, false];

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; width: 100%; height: 100%; pointer-events: none; }
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
    const flags = this.blocked;
    return html`
      <div class="grid">
        <square-space .blocked=${flags[0] === true}></square-space>
        <square-space .blocked=${flags[1] === true}></square-space>
        <square-space .blocked=${flags[2] === true}></square-space>
        <square-space .blocked=${flags[3] === true}></square-space>
      </div>
    `;
  }
}
