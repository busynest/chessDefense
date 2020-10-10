var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit-element';
import { customElement, property } from "lit-element/lib/decorators.js";
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import '../interface/login';
import '../game/board-square';
let HomePage = class HomePage extends connect(store)(LitElement) {
    constructor() {
        super();
        this._message = '';
        this._user = false;
    }
    stateChanged(state) {
        this._user = state.settings.currentUser;
    }
    _anon() {
        firebase.auth().signInAnonymously().catch((error) => { this._message = error.code + error.message; });
    }
    firstUpdated() {
    }
    static get styles() {
        return css `

    :host {
        /* grid-template-columns: 1fr 1fr; */
        /* max-width: 1000px; */
      }

      board-square {display:none;}
      board-square[active] {display:grid;}

    a {
      height: 64px;
      border: solid 1.5px black;
      border-radius: 8px;
    }

    @media only screen and (min-width: 768px) {
    /*  :host { grid-template-columns: 1fr 1fr;}
      .occupation{ grid-column: 1/3; }  */
    }


    @media only screen and (max-width: 768px) {
     /* :host { grid-template-columns: 1fr; }
      .occupation{ grid-column: 1/2; } */
    }
    
    h1, p { text-align: center; }
    a {
      text-decoration:  none;
      color:            olivedrab;
      height:           70px;
      line-height:      70px;
    }

    `;
    }
    render() {
        return html `
<!--
    <board-square
      active="\${this._user}"></board-square>
-->
    <create-user
      _method="true" ></create-user>

    <button
      @click="${this._anon}">Temporary / Anonymous Account</button>

    ${this._message}

    `;
    }
};
__decorate([
    property({ type: String })
], HomePage.prototype, "_message", void 0);
__decorate([
    property({ type: Boolean })
], HomePage.prototype, "_user", void 0);
HomePage = __decorate([
    customElement('home-page')
], HomePage);
export { HomePage };
