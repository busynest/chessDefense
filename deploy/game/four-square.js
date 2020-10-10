var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, customElement, html, LitElement } from "lit-element";
import "./one-square.js";
let FourSquare = class FourSquare extends LitElement {
    constructor() {
        super();
    }
    static get styles() {
        return css `

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
        
        `;
    }
    render() {
        return html `

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
      `;
    }
};
FourSquare = __decorate([
    customElement('four-square')
], FourSquare);
export { FourSquare };
