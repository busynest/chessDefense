import { css, CSSResult, customElement, html, LitElement, TemplateResult } from "lit-element";

import "./four-square";
import "./board-square";
import "./chess-king";
import "./chess-queen";
import "./chess-rook";
import "./chess-knight";
import "./chess-bishop";
import "./chess-pawn";
import "./box-block";

@customElement('chess-defense')
export class ChessDefense extends LitElement {

  // @property ({type: Object}) private game = [];

  constructor() {
    super();
  }

  static get styles():CSSResult  {
    return css`
        :host {

        }

        `
      }

      protected render():TemplateResult {
        return html`
      

     <board-square></board-square>
     
  `
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

}
