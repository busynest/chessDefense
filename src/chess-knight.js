import { PolymerElement } from "@polymer/polymer/polymer-element.js";

//import "../node_modules/@polymer/iron-iconset-svg/iron-iconset-svg.js"

export class ChessKnight extends PolymerElement {

  constructor() {
  super();
  //console.log('chess-knight was created!');
  }

  ready() {
    super.ready();
    console.log('Knight Ready!');
  }

  static get template() {
    return`
    <style>
      :host {
        
      }

      svg { width: 100%; height: 100%; }

    </style>

    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" >
        <circle cx="50" cy="50" r="15" stroke="green" stroke-width="4" fill="yellow" />
      </svg>
    </div>

  `
  }
  static get is() { return 'chess-knight'; }

  static get properties() {
          return {


          };
   }
}

customElements.define('chess-knight', ChessKnight);