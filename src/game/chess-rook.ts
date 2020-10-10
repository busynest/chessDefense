import { css, CSSResult, customElement, html, LitElement, TemplateResult } from "lit-element";

@customElement('chess-queen')
export class ChessRook extends LitElement {

  constructor() {
    super();
  }

  rook() {
    this.setAttribute("style", "display: none;")
  }

  static get styles():CSSResult  {
    return css`
      :host {
        
      }

      .rook {
        background-color:           green;
        display:                    grid;
        grid-template-columns:      1fr;
        height:                     100%;
        width:                      100%;
      }

      .myPath {
        background-color: black;
        -webkit-clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
        clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
      }
`
}

protected render():TemplateResult {
  return html`

    <div id="LT">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" on-click="rook" >
        <circle cx="50" cy="50" r="15" stroke="green" stroke-width="4" fill="yellow" />
      </svg>
    </div>

  `
  }

}