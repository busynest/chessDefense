import { PolymerElement } from "@polymer/polymer/polymer-element.js";

export class OneSquare extends PolymerElement {

	static get is() { return 'one-square'; }

	static get properties() {
    return {
    	
    	pressed: {
        type: Boolean,
        notify: true,
        reflectToAttribute: true,
        value: false
      },

      toggleThis: {
        type: String
      },

      lifeCount: {
      	value: 0,
      	//observer: 'thingCountChanged',
      	notify: true
    	},

      pop: String,

      clicks: String

  	};
  }

  static get observers() {
  }

  constructor() {
    super();
    //console.log('one-square constructor!');
  }

  //createBLock() {
    //var longClick;
    //var istrue = false;
    //var delay = 3000
    //timer = setTimeout(function(){ makeChange();},delay);
      //if (longCLick) {
      
      //} else {
        
    //}

  //   this.pressed = !this.pressed;
  //}

  connectedCallback() {
    super.connectedCallback();
  }

  ready() {
    //Create Block on Double Tap
    //this.ensureAttribue('tabIndex', 0);
    super.ready();
  }

  _box()  {
    this.setAttribute("style", "background-color: brown;");
  }

  static get template() {
    return `
      
    	<style>

      :host {

      }

      .box {
        border-bottom: 2px dotted blue;
      }

      div::before {
        background-color: blue;
      }

      div::atfer {
        background-color: black;
      }

    		div {
    			height:100%;
    			width:100%;
    		}

        div:pressed {
          background-color: black;
        }

        slot {
          height: 100%;
          width: 100%;
        }

    	</style>
	
			<div pressed id="box" on-click="_box"></div>

      `
  }

}

customElements.define('one-square', OneSquare);