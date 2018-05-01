import { PolymerElement } from "@polymer/polymer/polymer-element.js";

//import "../node_modules/@polymer/iron-iconset-svg/iron-iconset-svg.js"

export class ChessPawn extends PolymerElement {

  static get properties() {
    return {
      new: { type: String, notify: true }
    };
  }

  constructor() {
  super();
  //console.log('chess-pawn was created!');
  }

  ready() {
    super.ready();
    console.log('Pawn Ready!');
  }

  _pawn() {
    this.new.setAttribute("style", "dsiplay: none;")
  }

  static get template() {
    return`
    <style>
      :host {
        
      }

      svg { 
        background: transparent;
        width: 100%; height: 100%; }

    </style>
    
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" on-click="_pawn">
        <circle stroke="green" stroke-width="4" fill="white" cx="50" cy="50" r="15" />
      </svg>
    </div>

  `
  }
  static get is() { return 'chess-pawn'; }

  static get properties() {
          return {


          };
   }
}

customElements.define('chess-pawn', ChessPawn);