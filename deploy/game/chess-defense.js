var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html, LitElement } from "lit-element";
import "./four-square";
import "./board-square";
import "./chess-king";
import "./chess-queen";
import "./chess-rook";
import "./chess-knight";
import "./chess-bishop";
import "./chess-pawn";
import "./box-block";
let ChessDefense = class ChessDefense extends LitElement {
    constructor() {
        super();
    }
    static get styles() {
        return css `
        :host {

        }

        `;
    }
    render() {
        return html `
      

     <board-square></board-square>
     
  `;
    }
    _heightWidth() {
    }
    _createBoard() {
    }
    _populateBuildings() {
    }
    _homeplayerReady() {
    }
    _outsideplayerReady() {
    }
};
ChessDefense = __decorate([
    customElement('chess-defense')
], ChessDefense);
export { ChessDefense };
