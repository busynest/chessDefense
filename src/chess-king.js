import {Element as PolymerElement}
  from "../node_modules/@polymer/polymer/polymer-element.js"

import "../node_modules/@polymer/iron-iconset-svg/iron-iconset-svg.js"

export class ChessKing extends PolymerElement {

  constructor() {
  super();
  //console.log('chess-king was created!');
  }

  ready() {
    super.ready();
    console.log('King Ready!');
  }

  static get template() {
    return`
    <style>
      :host {
        
      }
    </style>

    <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg">
    <g id="arrow-back">
    <path id="svg_1" d="m1.995,10.55105l8.02134,0l2.47866,-8.02131l2.47866,8.02131l8.02134,0l-6.48939,4.95738l2.47879,8.02131l-6.48939,-4.95752l-6.48939,4.95752l2.47879,-8.02131l-6.48939,-4.95738z" stroke-width="1.5" stroke="#000" fill="#fff"/>
    </svg>

  `
  }
  static get is() { return 'chess-king'; }

  static get properties() {
          return {


          };
   }
}

customElements.define('chess-king', ChessKing);