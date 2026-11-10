import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('chess-rook')
export class ChessRook extends LitElement {
  rook(): void {
    this.setAttribute('style', 'display: none;');
  }

  static override get styles(): CSSResultGroup {
    return css`
      .rook {
        background-color: green;
        display: grid;
        grid-template-columns: 1fr;
        height: 100%;
        width: 100%;
      }

      .myPath {
        background-color: black;
        clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <div id="LT">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          @click=${this.rook}>
          <circle cx="50" cy="50" r="15" stroke="green" stroke-width="4" fill="yellow" />
        </svg>
      </div>
    `;
  }
}
