import { css, CSSResult, customElement, html, LitElement, TemplateResult } from "lit-element";

@customElement('chess-pawn')
export class ChessPawn extends LitElement {

  constructor() {
    super();
  }

  _pawn() {
 
  }

  static get styles():CSSResult  {
    return css`

      :host {
        
      }

      svg { width: 100%; height: 100%; }

    `
  }

  protected render():TemplateResult {
    return html`

    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" on-click="_pawn">
        <circle stroke="green" stroke-width="4" fill="white" cx="50" cy="50" r="15" />
      </svg>
    </div>

  `
  }
}
