import { PolymerElement } from "@polymer/polymer/polymer-element.js";

import "./four-square.js";
import "./board-square.js";
import "./chess-king.js";
import "./chess-queen.js";
import "./chess-rook.js";
import "./chess-knight.js";
import "./chess-bishop.js";
import "./chess-pawn.js";
import "./box-block.js";

export class ChessDefense extends PolymerElement {

  static get is() { return 'chess-defense'; }

  static get properties() {

    return {

      game: { type: String, reflectToAttribute: true, observer: '_homeplayerReady' }

    };

  }

  //static get observers() {
  //    return [ 'thingCountChanged' ];
  //}

  constructor() {
    super();

    for ( var i = 0; i < 3; i++ ) {
      //var backside = document.createElement("four-square");
      //backside.className = 'card';
      //this.ChessDefense.appendChild(backside);
      console.log( i );
    }

  }

  connectedCallback() {
    super.connectedCallback();

    var i;
    for ( i = 0; i < 5; i++ ) {
      console.log( i );

      
    }

    console.log('chess-defense Connected!');
  }

  disconnectedCallback() {

  }

  attributeChangedCallback() {

  }

  ready() {
    super.ready();
    console.log('Chess Defense Ready!');
  }

  static get template() {
    return `
      <style>
        :host {
          height: 100%;
          width: 100%;
        }

        

      </style>

     <board-square></board-square>
     
  `
  }


  _heightWidth() {
    //var cw = document.getElementById("grid").width();
    //document.getElementById("grid").css({'height':cw+'px'});
  }

  _createBoard(n) {
    //document.createElement('one-square');

  }

  _populateBuildings() {

  }

  _homeplayerReady(home) {

  }

  _outsideplayerReady(external) {

  }

}


customElements.define('chess-defense', ChessDefense);

/**

    grid = arena.length;
    for (i = 0; i < grid; i++) {
     "<one-square>" + arena[i] +"</one-square>";
    };

<div class="site">

     <header>
     </header>




    
    </div>

    <footer>
    </footer>

    </div>

**/