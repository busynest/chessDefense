import { PolymerElement } from "@polymer/polymer/polymer-element.js";

//import "../node_modules/@polymer/iron-iconset-svg/iron-iconset-svg.js"

export class ChessRook extends PolymerElement {

  static get is() { return 'chess-rook'; }

  static get properties() {
          return {
            life: { type: Number, observer: '_pageChanged', notify: true }
          };
   }

   static get observers() {
      
  }

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedcCallback();
  }

  attributeChangedCallback() {
    super.attributeChangedCallback();
  }

  ready() {
    super.ready();
    //this.addEventListener('keypress', e => this.handlePress(e));
  }

  rook() {
    this.setAttribute("style", "display: none;")
  }

  static get template() {
    return`
    <style>
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

    </style>

    <div id="LT">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" on-click="rook" >
        <circle cx="50" cy="50" r="15" stroke="green" stroke-width="4" fill="yellow" />
      </svg>
    </div>

  `
  }

}

customElements.define('chess-rook', ChessRook);

//        <img src="../img/queen.svg" alt="Rook" height="auto" width="auto">