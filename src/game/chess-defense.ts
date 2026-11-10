import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import './board-square.js';

@customElement('chess-defense')
export class ChessDefense extends LitElement {
  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`<board-square active></board-square>`;
  }
}
