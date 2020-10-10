var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, LitElement, css } from 'lit-element';
import { customElement, property } from "lit-element/lib/decorators.js";
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { closeDrawer } from './drawer_state';
import { logOut, googleSignIn } from './functions';
import './login';
let UserDrawer = class UserDrawer extends connect(store)(LitElement) {
    constructor() {
        super();
        this._user = false;
    }
    stateChanged(state) {
        this._user = state.settings.currentUser;
    }
    static get styles() {
        return css `

        :host {
          display:              inline-grid;
          position:             fixed;
          right:                0;
          z-index:              2;
          width:                100%;
          max-width:            500px;
          margin:               auto;
          background-color:     rgba(228, 241, 254, 1);
          color:                #303030;
          padding:              24px 12px;
          border:               1.5px #303030 solid;

          box-sizing:           border-box;
          -webkit-box-sizing:   border-box;

          border-radius:          20px;
          -webkit-border-radius:  20px;
          will-change:          transform;

          transform:            translate3d(0, -150%, 0);
          -webkit-transform:    translate3d(0, -150%, 0);

          transition-property:          visibility, transform;
          -webkit-transition-property:  visibility, transform;

          transition-duration:          .6s;
          -webkit-transition-duration:  .6s;

        }
        :host([on]) {
          transform:            translate3d(0, 0, 0);
          -webkit-transform:    translate3d(0, 0, 0);
        }

        /** DISPLAY */
        h2 { color: var(--primary-orange); }
        h2, create-user, .setLog, #googleOne { display: none; }
        h2[active], create-user[active], #googleOne[active] { display: block; }

        .setLog[on] { display: block; }
        .google:hover { cursor: pointer; }

        /*.divide       { border: 2px solid #606060; margin: 6px 0 0 0; border-radius: 50%; }*/
        @media (max-width: 460px) { .google { font-size: .8em; } }

      `;
    }
    render() {
        return html `

<!-- Toggle EXIT -->
<button
  id      ="close"
  @click  ="${store.dispatch(closeDrawer(false))}"
  style ="
    position:         absolute;
    top:              0;
    right:            0;
    height:           36px;
    width:            36px;
    margin:           auto;
    background-color: transparent;
    border:           0px;
    fill:             red;
    opacity:          .8;
    -webkit-opacity:  .8;"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
    </button>

    <h2 ?active ="${!this._user}" style="text-align: center;">Welcome Back</h2>

    <!-- Logged OUT-->
    <create-user ?active="${!this._user}"></create-user>


   <!-- GOOGLE SIGN IN-->
   <button
      id      ="googleOne"
      class   ="google"
      @click  ="${googleSignIn}"
      ?active ="${!this._user}"
      style   ="
      margin:                   auto auto 8px;;
      color:                    #444;
      width:                    210px;
      border:                   thin solid #888;
      box-shadow:               1px 1px 1px grey;
      white-space:              nowrap;
      background-color:         #ffffff;
      size:                     14px;
      font:                     Roboto-Medium;
      line-height:              26px;
      padding:                  8dp;
      border-color:             #4267b2;
      font-weight:              bold;
      text-align:               center;
      text-shadow:              none;
      border-radius:            10px;
      -webkit-border-radius:    10px;
      -webkit-font-smoothing:   antialiased;
      justify-content:          center;
      -webkit-justify-content:  center;">
        <span
          class="icon"
          style="
            background:       url('/images/google.png') transparent 5px 50% no-repeat;
            display:          inline-block;
            vertical-align:   middle;
            width:            42px;
            height:           42px;"></span>
        <span class="buttonText">sign-in with Google</span>
    </button>

<!-- Logged IN -->
<div class="setLog" ?on="${this._user === true}">
  <p
    class   = "leave"
    @click  = "${logOut(), store.dispatch(closeDrawer())}"
    style = "
      cursor: pointer;
      margin: 12px;
      box-sizing: border-box;
      text-transform:   uppercase; 
      text-align:       center;
      font-weight:      800;
      margin:           0;"><a href="/explore" style="text-decoration: none; color: #303030;">Log Out</a>
  </p>
</div>

<a href="https://www.contractorscentre.com"></a>

      `;
    }
};
__decorate([
    property({ type: Boolean })
], UserDrawer.prototype, "_user", void 0);
UserDrawer = __decorate([
    customElement('user-drawer')
], UserDrawer);
export { UserDrawer };
