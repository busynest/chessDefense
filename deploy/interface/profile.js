var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css } from 'lit-element';
import { customElement, property } from "lit-element/lib/decorators.js";
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { PageViewElement } from '../lazy-loader';
import { _publicProfile } from '../interface/functions';
let PublicProfile = class PublicProfile extends connect(store)(PageViewElement) {
    constructor() {
        super();
        this._photoURL = '';
        this._website = "";
        this._name = '';
        this._describe = '';
        this._profile = '';
        this._getPublicContractor();
    }
    stateChanged(state) {
        this._photoURL = state.settings.individual_photo;
        this._website = state.settings.individual_website;
        this._name = state.settings.individual_name;
        this._describe = state.settings.individual_info;
    }
    _getPublicContractor() {
        const user = window.location.hash;
        firestore
            .collection('contractors')
            .doc(user)
            .get()
            .then((doc) => {
            if (doc.exists) {
                const articleData = [];
                articleData
                    .push(doc.data());
                _publicProfile(user);
            }
        }).catch((error) => { console.log(error); });
    }
    firstUpdated() {
    }
    static get styles() {
        return css `



      `;
    }
    render() {
        return html `

      <section> <!-- ?on="\${!this._edit}" -->

        <h2>Profile</h2>

        <button class="edit">Edit</button>  

        <label class="demoUpload">
          <input type="image" src="${this._photoURL}">
        </label>

        <p class="display">
          <a class='site' href="${this._website}">Website</a>
        </p>

        <p class="article">
          <a href="">${this._profile}</a>
          <br/>${this._describe}
        </p>

        <p>Contact Name:${this._name}</p>

      </section>

    `;
    }
};
__decorate([
    property({ type: String })
], PublicProfile.prototype, "_photoURL", void 0);
__decorate([
    property({ type: String })
], PublicProfile.prototype, "_website", void 0);
__decorate([
    property({ type: String })
], PublicProfile.prototype, "_name", void 0);
__decorate([
    property({ type: String })
], PublicProfile.prototype, "_describe", void 0);
__decorate([
    property({ type: String })
], PublicProfile.prototype, "_profile", void 0);
PublicProfile = __decorate([
    customElement('public-profile')
], PublicProfile);
export { PublicProfile };
