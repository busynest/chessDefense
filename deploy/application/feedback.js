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
let ContractorsQuestions = class ContractorsQuestions extends connect(store)(PageViewElement) {
    constructor() {
        super();
        this._user = false;
        this._photo = '';
    }
    stateChanged(state) {
        this._user = state.settings.currentUser;
        this._photo = state.settings.individual_photo;
    }
    firstUpdated() {
        this.shadowRoot.getElementById('send').addEventListener('click', (e) => { e.preventDefault(); this.activateFeedback(); });
    }
    activateFeedback() {
        let text = this.shadowRoot.querySelector('#texts');
        let feed = this.shadowRoot.querySelector('#feedback');
        if (this._user === true) {
            this.sendFeedback(text.value);
            feed.reset();
            text.value = "Thank you!";
            text.setAttribute("disabled", "true");
        }
        else {
            feed.reset();
            text.value = "Please sign in";
        }
    }
    sendFeedback(messageText) {
        return firebase
            .firestore()
            .collection('feedback')
            .add({
            name: this._user,
            text: messageText,
            profilePicUrl: this._photo,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch((error) => { console.error('Error writing message', error); });
    }
    ;
    static get styles() {
        return css `

        :host { display: block; }
        h2 { margin: 0; }
        .spec[on]     { display:           block; }
        .spec         { display:           none; }

        .visible[on]  { visibility:        visible; }
        .visible      { visibility:        hidden; }

        input[type=submit]:hover {
          background-color:   #45a049;
        }

    `;
    }
    render() {
        return html `

      <h2>Feedback</h2>

      <form
        id="feedback"
        style="
          box-sizing: border-box;" >

        <p>Please leave your comments with us. </p>
        <textarea id="texts" class="texts"></textarea>
        <input
          type  = "submit"
          id    = "send"
          class = "send"
          style = "
            box-sizing:         border-box;
            -webkit-box-sizing: border-box;

            border-radius:          4px;
            -webkit-border-radius:  4px;

            width:              100%;
            background-color:   #4CAF50;
            color:              white;
            padding:            14px 20px;
            margin:             8px 0;
            border:             none;
            cursor:             pointer;">

      </form>

    `;
    }
};
__decorate([
    property({ type: Boolean })
], ContractorsQuestions.prototype, "_user", void 0);
__decorate([
    property({ type: String })
], ContractorsQuestions.prototype, "_photo", void 0);
ContractorsQuestions = __decorate([
    customElement('contractors-questions')
], ContractorsQuestions);
export { ContractorsQuestions };
