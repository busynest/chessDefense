var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html, LitElement } from "lit-element";
let ChessPawn = class ChessPawn extends LitElement {
    constructor() {
        super();
    }
    _pawn() {
    }
    static get styles() {
        return css `

      :host {
        
      }

      svg { width: 100%; height: 100%; }

    `;
    }
    render() {
        return html `

    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" on-click="_pawn">
        <circle stroke="green" stroke-width="4" fill="white" cx="50" cy="50" r="15" />
      </svg>
    </div>

  `;
    }
};
ChessPawn = __decorate([
    customElement('chess-pawn')
], ChessPawn);
export { ChessPawn };
