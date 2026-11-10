import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('chess-knight')
export class ChessKnight extends LitElement {
  static override get styles(): CSSResultGroup {
    return css`
      svg {
        width: 100%;
        height: 100%;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="15" stroke="green" stroke-width="4" fill="yellow" />
        </svg>
      </div>
    `;
  }
}
