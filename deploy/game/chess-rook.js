var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html, LitElement } from "lit-element";
let ChessRook = class ChessRook extends LitElement {
    constructor() {
        super();
    }
    rook() {
        this.setAttribute("style", "display: none;");
    }
    static get styles() {
        return css `
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
`;
    }
    render() {
        return html `

    <div id="LT">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" on-click="rook" >
        <circle cx="50" cy="50" r="15" stroke="green" stroke-width="4" fill="yellow" />
      </svg>
    </div>

  `;
    }
};
ChessRook = __decorate([
    customElement('chess-queen')
], ChessRook);
export { ChessRook };
