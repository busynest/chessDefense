var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html } from "lit-element";
import { PageViewElement } from "../lazy-loader";
let BoardSquare = class BoardSquare extends PageViewElement {
    constructor() {
        super();
    }
    firstUpdated() {
    }
    _rook() {
    }
    _block() {
    }
    static get styles() {
        return css `

    :host {
    }

    .grid {

      height: 100%;
      max-width: 800px;
      margin: auto;
      display: grid;
      grid-gap: 2px;
      grid-template-columns:  1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
      grid-template-rows:     1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    }

    four-square {
 
    }

    chess-pawn, chess-rook, chess-knight, chess-bishop, chess-king, chess-queen {

     
   
    }

    @media only screen and (min-width: 800px) { .grid { height: 700px; width: 700px; } }
    @media only screen and (max-width: 800px) { .grid { height: 700px; width: 700px; } }
    @media only screen and (max-width: 700px) { .grid { height: 600px; width: 600px; } }
    @media only screen and (max-width: 600px) { .grid { height: 500px; width: 500px; } }
    @media only screen and (max-width: 500px) { .grid { height: 400px; width: 400px; } }
    @media only screen and (max-width: 400px) { .grid { height: 300px; width: 300px; } }
    @media only screen and (max-width: 300px) { .grid { height: 260px; width: 260px; } }


        `;
    }
    render() {
        return html `

     

     <!--

            position:   absolute;
          z-index:    3;

     width:      100%;
     height:     100%;

     -->

     <!-- Chess Defense Game -->
     <div id="grid" class="grid">
    	
     <!-- 1 -->
     <four-square id="a1">
        <chess-rook id="RLB" on-click="_rook" new="pop"></chess-rook>
     </four-square>

     <!-- 2 -->
     <four-square id="b1">
       <chess-knight></chess-knight>
     </four-square>

     <!-- 3 -->
     <four-square id="c1">
       <chess-bishop myWidth="{{widthThis}}"></chess-bishop>
     </four-square>

     <!-- 4 -->
     <four-square id="d1">
       <chess-king></chess-king>
     </four-square>

     <!-- 5 -->
     <four-square id="e1">
       <chess-queen></chess-queen>
     </four-square>

     <!-- 6 -->
     <four-square id="f1">
       <chess-bishop></chess-bishop>
     </four-square>

     <!-- 7 -->
     <four-square id="g1">
       <chess-knight></chess-knight>
     </four-square>

     <!-- 8 -->
     <four-square id="h1">
       <chess-rook on-click="_rook"></chess-rook>
     </four-square>
     

     
     <!-- 9 -->
     <four-square id="a2">
       <chess-pawn></chess-pawn>
     </four-square>

     <!-- 10 -->
     <four-square id="b2">
       <chess-pawn></chess-pawn>
     </four-square>

     <!-- 11 -->
     <four-square id="c2">
       <chess-pawn></chess-pawn>
     </four-square>

     <!-- 12 -->
     <four-square id="d2">
       <chess-pawn></chess-pawn>
     </four-square>

     <!-- 13 -->
     <four-square id="e2">
       <chess-pawn></chess-pawn>
     </four-square>

     <!-- 14 -->
     <four-square id="f2">
       <chess-pawn></chess-pawn>
     </four-square>

     <!-- 15 -->
     <four-square id="g2">
       <chess-pawn></chess-pawn>
     </four-square>

     <!-- 16 -->
     <four-square id="h2">
       <chess-pawn></chess-pawn>
     </four-square>
     

     
     <!-- 17 -->
     <four-square>
     </four-square>
     <!-- 18 -->
     <four-square>
     </four-square>
     <!-- 19 -->
     <four-square>
     </four-square>
     <!-- 20 -->
     <four-square>
     </four-square>
     <!-- 21 -->
     <four-square>
     </four-square>
     <!-- 22 -->
     <four-square>
     </four-square>
     <!-- 23 -->
     <four-square>
     </four-square>
     <!-- 24 -->
     <four-square>
     </four-square>
     
     

     <!-- 25 -->
     <four-square>
     </four-square>
     <!-- 26 -->
     <four-square>
     </four-square>
     <!-- 27 -->
     <four-square>
     </four-square>
     <!-- 28 -->
     <four-square>
     </four-square>
     <!-- 29 -->
     <four-square>
     </four-square>
     <!-- 30 -->
     <four-square>
     </four-square>
     <!-- 31 -->
     <four-square>
     </four-square>
     <!-- 32 -->
     <four-square>
     </four-square>
     

     
     <!-- 33 -->
     <four-square>
     </four-square>
     <!-- 34 -->
     <four-square>
     </four-square>
     <!-- 35 -->
     <four-square>
     </four-square>
     <!-- 36 -->
     <four-square>
     </four-square>
     <!-- 37 -->
     <four-square>
     </four-square>
     <!-- 38 -->
     <four-square>
     </four-square>
     <!-- 39 -->
     <four-square>
     </four-square>
     <!-- 40 -->
     <four-square>
     </four-square>
     

     
     <!-- 41 -->
     <four-square>
     </four-square>
     <!-- 42 -->
     <four-square>
     </four-square>
     <!-- 43 -->
     <four-square>
     </four-square>
     <!-- 44 -->
     <four-square>
     </four-square>
     <!-- 45 -->
     <four-square>
     </four-square>
     <!-- 47 -->
     <four-square>
     </four-square>
     <!-- 48 -->
     <four-square>
     </four-square>
     <!-- 49 -->
     <four-square>
     </four-square>
     

     
     <!-- 50 -->
     <four-square id="a7">
           <chess-pawn></chess-pawn>
     </four-square>      
     <!-- 51 -->
     <four-square id="b7">
           <chess-pawn></chess-pawn>
     </four-square>
     <!-- 52 -->
     <four-square id="c7">
           <chess-pawn></chess-pawn>
     </four-square>
     <!-- 53 -->
     <four-square id="d7">
           <chess-pawn></chess-pawn>
     </four-square>
     <!-- 54 -->
     <four-square id="e7">
           <chess-pawn></chess-pawn>
     </four-square>
     <!-- 55 -->
     <four-square id="f7">
           <chess-pawn></chess-pawn>
     </four-square>
     <!-- 56 -->
     <four-square id="g7">
           <chess-pawn></chess-pawn>
     </four-square>
     <!-- 57 -->
     <four-square id="h7">
           <chess-pawn></chess-pawn>
     </four-square>
     
     

     <!-- 58 -->
     <four-square id="a8">
           <chess-rook on-click="_rook"></chess-rook>
     </four-square>
     <!-- 59 -->
     <four-square id="b8">
           <chess-knight></chess-knight>
     </four-square>
     <!-- 60 -->
     <four-square id="c8">
           <chess-bishop></chess-bishop>
     </four-square>
     <!-- 61 -->
     <four-square id="d8">
           <chess-king></chess-king>
     </four-square>
     <!-- 62 -->
     <four-square id="e8">
           <chess-queen></chess-queen>
     </four-square>
     <!-- 63 -->
     <four-square id="f8">
           <chess-bishop></chess-bishop>
     </four-square>
     <!-- 64 -->
     <four-square id="g8">
           <chess-knight></chess-knight>
     </four-square>
     <!-- 64 -->
     <four-square id="h8">
           <chess-rook on-click="_rook"></chess-rook>
     </four-square>

     </div>

	`;
    }
};
BoardSquare = __decorate([
    customElement('board-square')
], BoardSquare);
export { BoardSquare };
