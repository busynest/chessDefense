import {
  LitElement,
  html,
  css,
  TemplateResult,
  CSSResult
} from 'lit-element';

import { customElement, property } from "lit-element/lib/decorators.js"

import { connect } from 'pwa-helpers/connect-mixin';
import { RootState, store } from '../store';

import '../interface/login';
import '../game/board-square';
// import { firebase } from 'googleapis/build/src/apis/firebase';


@customElement('home-page')
export class HomePage extends connect(store)(LitElement) {

  @property({type: String})  private _message = '';
  @property({type: Boolean})  private _user = false;

  constructor() {
    super();
  }

  stateChanged(state: RootState) {
    this._user = state.settings!.currentUser;
  }


private _anon() {
  //@ts-ignore
  firebase.auth().signInAnonymously().catch( (error) => { this._message = error.code + error.message; /** user.uid; */ });
}

/*


auth.currentUser.linkWithCredential(credential)
  .then(function(usercred) {
    var user = usercred.user;
    console.log("Anonymous account successfully upgraded", user);
  }).catch(function(error) {
    console.log("Error upgrading anonymous account", error);
  });


*/
  protected firstUpdated(){

  }

static get styles():CSSResult {
  return css`

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

    `
}

protected render():TemplateResult {
  return html`
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
}
