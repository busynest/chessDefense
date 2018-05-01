import { PolymerElement } from "@polymer/polymer/polymer-element.js";
import "./one-square.js";

export class FourSquare extends PolymerElement {

  static get is() { return 'four-square'; }

  static get properties() {
    return {
      widthBox:  { type: Number, value: 50, },
    };
  }

  //static get observers() {
  //    return [ 'thingCountChanged' ];
  //}

  constructor() {
    super();

    /*
    var div = document.createElement('div');
    var e1 = document.createElement('one-square');
    e1.className = "white";
    div.appendChild(e1);
    var e2 = document.createElement('one-square');
    e2.className = "white";
    var e3 = document.createElement('one-square');
    e3.className = "white";
    var e4 = document.createElement('one-square');
    e4.className = "white";
    */
    //this.width  = 
    //this.height =
    //const upDown      = this.bigSquare.height() ;
    //const leftRight   = this.bigSquare.width() ;
  }

  connectedCallback() {
    super.connectedCallback();

  }

  disconnectedCallback() {
    
  }

  attributeChangedCallback() {

  }

  ready() {
    super.ready();
    //this.widthBox = parseInt(this.shadowRoot.querySelector('.white').style.width);
   //this.width = FSwidth.width();
  }

  static get template() {
    return `

    	<style>

    		.green {
          background-color: rgb(118,150,86);
    		}

    		.white {
    			background-color:rgb(238,238,210);
        }
        
        .orange {
    			background-color: rgb(238,238,210);
        }
        
        .pink {
    			background-color: rgb(118,150,86);
    		}

    		slot {
      
    		}

    	</style>
       
      <div  style="
            height:   100%;
            width:    100%;
       
            position: relative;
            z-index: 1;

            display:  grid;
            grid-template-columns: 1fr;">

      <slot></slot>
      <div style="height:   100%;
                  width:    100%;
  
                  position: absolute;
                  z-index: -1;
             
                  display:  grid;
                  grid-gap: 2px;
                  grid-template-columns: 1fr 1fr;
                  grid-template-rows: 1fr 1fr;
        					">
          
                  
        <one-square id="aa" class="green">  </one-square>
        <one-square class="white">  </one-square>
        <one-square class="orange"> </one-square>
        <one-square class="pink">   </one-square>
      
      </div>
</div>
      `
  }

  //_thingCountChanged() {

  //}

}

customElements.define('four-square', FourSquare);

//var el1 = document.createElement('one-square');

//var el2 = new OneSquare();