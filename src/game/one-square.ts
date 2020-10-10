import { css, CSSResult, customElement, html, LitElement, TemplateResult } from "lit-element";

@customElement('one-square')
export class OneSquare extends LitElement {

    	/*
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
*/


  constructor() {
    super();
  }

  _box()  {
    this.setAttribute("style", "background-color: brown;");
  }

  static get styles():CSSResult  {
    return css`

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
        `
      }
      
      protected render():TemplateResult {
        return html`
	
			<div pressed id="box" on-click="_box"></div>

      `
  }

}
