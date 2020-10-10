var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css, customElement, property, LitElement } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { changeTopic } from './settings_state';
let SettingTitles = class SettingTitles extends connect(store)(LitElement) {
    constructor() {
        super(...arguments);
        this.aboutTopic = '';
    }
    firstUpdated() {
        this.shadowRoot.querySelector("#learn").addEventListener('change', (e) => { console.log('e:', e.target.value); store.dispatch(changeTopic(e.target.value)); });
    }
    stateChanged(state) {
        this.aboutTopic = state.profiles.topic;
    }
    static get styles() {
        return css `
    label > input { display: none; }

    .topButton {
      color:                    grey;
      /*margin: 0 auto;*/
      font-weight:              800;
      font-size:                .7em;
      border-bottom: solid 1px grey;
      padding-top: 2px;
    }
    
    .topButton[on] {
      /*background-color: #A8D5BA;*/
      color: black ;
      border: 1px solid lightseagreen;
      border-top: 2px solid lightseagreen;
      border-bottom: 0;
      border-radius: 8px 8px 0 0;
    }
    /*.topButton[on] > p {
margin-bottom: 2px;
    }*/
    
    .topButton:hover {
      cursor: pointer;
    }
    
    .topButton > p {
      margin: 0 auto;
      text-align: center;
    }
    
    @media (min-width: 480px) {
      .topButton { font-size:  .9em; }
    }
    label:nth-child(1) {
     /* background-color: rgb(0,255,36);*/
    }
/*
    label     { transform: skew(30deg); }
    label > p { transform: skew(-30deg); }
*/
    `;
    }
    render() {
        return html `
  <nav>

    <form
      id="learn"
      style="
        display: grid;
        grid-template-columns: 1fr 1fr;">

      <!-- OPTION #2 -->
      <label
        form="learn"
        name="topic"
        class="topButton"
        ?on="${this.aboutTopic === 'account'}">

        <input
          type="radio"
          name="learn"
          value="account"
          ?checked="${this.aboutTopic === 'account'}">

        <p>Account</p>
          
      </label>

      <!-- OPTION #1 -->
      <label
        form="learn"
        name="topic"
        class="topButton"
        ?on="${this.aboutTopic === 'individual'}">

        <input
          type="radio"
          name="learn"
          value="individual"
          ?checked="${this.aboutTopic === 'individual'}" />

        <p>Profile</p>

      </label>
  
    </form>

  </nav>
    `;
    }
};
__decorate([
    property({ type: String })
], SettingTitles.prototype, "aboutTopic", void 0);
SettingTitles = __decorate([
    customElement('setting-titles')
], SettingTitles);
export { SettingTitles };
