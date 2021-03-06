var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, html, LitElement } from "lit-element";
let BoxBlock = class BoxBlock extends LitElement {
    constructor() {
        super();
    }
    render() {
        return html `

    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  		<circle cx="100" cy="100" r="100"/>
    </svg>

  `;
    }
};
BoxBlock = __decorate([
    customElement('box-block')
], BoxBlock);
export { BoxBlock };
