import { PolymerElement } from "@polymer/polymer/polymer-element.js";

//import "../node_modules/@polymer/iron-iconset-svg/iron-iconset-svg.js"

export class ChessBishop extends PolymerElement {

  static get is() { return 'chess-bishop'; }

  static get properties() {
    return {
      myWidth:  Number,
      myHeight: Number
    };
  }

  constructor() {
    super();

  }

  ready() {
    super.ready();
    console.log('Bishop Ready!');
    //this.$.sv.setAttribute("style", "transform: scale(.5,.5);");
    //this.$.sv.setAttribute("width", "200");
    //this.$.sv.setAttribute("height", "200");
    //var scale = Math.min( 
    //  availableWidth / contentWidth, 
    //  availableHeight / contentHeight 
    //);
  }

  static get template() {
    return `
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

}

customElements.define('chess-bishop', ChessBishop);