var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html } from 'lit-element';
import { customElement, property } from "lit-element/lib/decorators.js";
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { PageViewElement } from '../lazy-loader';
let ResetOptions = class ResetOptions extends connect(store)(PageViewElement) {
    constructor() {
        super();
        this._userEmail = '';
    }
    stateChanged(state) {
        this._userEmail = state.settings.individual_email;
    }
    _restPassword() {
        var auth = firebase.auth();
        var emailAddress = this._userEmail;
        auth
            .sendPasswordResetEmail(emailAddress)
            .then(() => { })
            .catch((error) => { console.log(error); });
    }
    firstUpdated() {
        this.shadowRoot.querySelector(".reset").addEventListener("click", () => { this._restPassword(); });
    }
    render() {
        return html `

<form class="resetPass">

  <input
    class       ="email"
    type        ="text"
    placeholder ="email">

  <input
    type        ="submit"
    class       ="reset"/>

</form>

  <input
    class ="phoneVerify"
    type  ="text" />

  `;
    }
};
__decorate([
    property({ type: String })
], ResetOptions.prototype, "_userEmail", void 0);
ResetOptions = __decorate([
    customElement('reset-options')
], ResetOptions);
export { ResetOptions };
