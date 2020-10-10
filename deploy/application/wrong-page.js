var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit-element';
import { customElement } from "lit-element/lib/decorators.js";
import { PageViewElement } from '../lazy-loader';
let WrongPage = class WrongPage extends PageViewElement {
    render() {
        return html `

      <section
        style="
          border-radius:          8px;
          -webkit-border-radius:  8px;
          background:             transparent;
          margin-right:           auto;
          margin-left:            auto;">
        <h2>Oops! You hit a 404</h2>
        <p>The page you're looking for doesn't seem to exist. Head back
            <a href="/">home</a> and try again?
        </p>
      </section>

    `;
    }
};
WrongPage = __decorate([
    customElement('wrong-page')
], WrongPage);
export { WrongPage };
