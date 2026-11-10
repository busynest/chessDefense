import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import './one-square.js';

@customElement('four-square')
export class FourSquare extends LitElement {
  static override get styles(): CSSResultGroup {
    return css`
      .green {
        background-color: rgb(118, 150, 86);
      }

      .white {
        background-color: rgb(238, 238, 210);
      }

      .orange {
        background-color: rgb(238, 238, 210);
      }

      .pink {
        background-color: rgb(118, 150, 86);
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <div
        style="
          height: 100%;
          width: 100%;
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr;">
        <slot></slot>
        <div
          style="
            height: 100%;
            width: 100%;
            position: absolute;
            z-index: -1;
            display: grid;
            grid-gap: 2px;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;">
          <one-square id="aa" class="green"></one-square>
          <one-square class="white"></one-square>
          <one-square class="orange"></one-square>
          <one-square class="pink"></one-square>
        </div>
      </div>
    `;
  }
}
