var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html, LitElement } from "lit-element";
let OneSquare = class OneSquare extends LitElement {
    constructor() {
        super();
    }
    _box() {
        this.setAttribute("style", "background-color: brown;");
    }
    static get styles() {
        return css `

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
        `;
    }
    render() {
        return html `
	
			<div pressed id="box" on-click="_box"></div>

      `;
    }
};
OneSquare = __decorate([
    customElement('one-square')
], OneSquare);
export { OneSquare };
