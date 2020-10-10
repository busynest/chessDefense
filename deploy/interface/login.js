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
let CreateUser = class CreateUser extends connect(store)(LitElement) {
    constructor() {
        super();
        this._method = false;
        this._error = '';
    }
    _create() {
        let email = this.shadowRoot.querySelector('.newEmail');
        let password = this.shadowRoot.querySelector('.newSignal');
        firebase
            .auth()
            .createUserWithEmailAndPassword(email.value, password.value)
            .catch((error) => { this._error = error, console.log("error: ", error); });
    }
    _signIn() {
        let email = this.shadowRoot.querySelector('.existingEmail');
        let password = this.shadowRoot.querySelector('.existingSignal');
        firebase
            .auth()
            .signInWithEmailAndPassword(email.value, password.value)
            .catch((error) => { this._error = error, console.log("error: ", error); });
    }
    firstUpdated() {
    }
    static get styles() {
        return css `

        :host {
          display:                      grid;
          grid-gap:                     8px;
          padding-bottom:               8px;
      /*    --primary-blue:               #184A78;
          --primary-blue-light:         #3F9EF5;
          --secondary-blue:             #FF5F2D;
          --type-color:                 #171D29;
          --secondary-background-blue:  #E5EEF3;*/
          --mdc-theme-primary:          var(--primary-orange);  /* #03a9f4; */
          --mdc-theme-on-primary:       whitesmoke;
        }

        @media only screen and (max-width: 600px) {
          h2[title] { font-size: 1.3em }
          :host{ font-size: 14px }
        }

        form {
          display: grid;
          grid-gap: 8px;
        }

            `;
    }
    render() {
        return html `

  ${this._method ? html ` 
      <form autocomplete="on">

        <p>Sign up to advertise your business with us.</p>

        <input filled autocomplete="email"
          type          = "email"
          class         = "newEmail"
          placeholder   = "New Email"
          iconTrailing  = "mail"
          style = "
            margin:   auto;
            width:    100%;" />

        <input filled autocomplete="password"
          type          = "password"
          class         = "newSignal"
          placeholder         = "New Password"
          iconTrailing  = "lock"
          style = "
            margin:   auto;
            width:    100%;" />
        <!-- /* this.gtag_report_conversion, */ -->

        <button raised autocomplete
          label   = "Sign up"
          style   = "width: 100%;"
          @click  = "${this._create}">Sign up</button>

        ${this._error}

        <p
          style="
            color: whitesmoke;
            text-align: center;">
          By clicking "sign up" you agree to our <br />
          <a href="/terms">Terms of Service </a> & <a href="privacy">Privacy Policy</a>.
        </p>
      </form>
  ` : html `

        <form autocomplete="on"
          style="
            display:    grid;
            grid-gap:   8px;">

            <input filled autocomplete
              autocomplete  = "email"
              type          = "email"
              class         = "existingEmail"
              label         = "Email"
              iconTrailing  = "mail"
              style = "
                margin:   auto;
                width:    100%;" />

            <input filled autocomplete="password"
              autocomplete  = "password"
              type          = "password"
              class         = "existingSignal"
              label         = "Password"
              iconTrailing  = "lock"
              style = "
                margin:   auto;
                width:    100%;" />

            <button raised
              label   = "login"
              style   = "width: 100%"
              @click  ="${this._signIn}">Sign in</button>

            <p style="text-align:center;">${this._error}</p>

            <a
              href  ="/reset"
              style="
              text-decoration:  none;
              color:            blue;
              text-align:       center;">

                <button filled
                  label = "Forgot Password"
                  style = "width: 100%"></button>

            </a>
      </form>
  <!--  </form>  -->

  `}

    `;
    }
};
__decorate([
    property({ type: Boolean })
], CreateUser.prototype, "_method", void 0);
__decorate([
    property({ type: String })
], CreateUser.prototype, "_error", void 0);
CreateUser = __decorate([
    customElement('create-user')
], CreateUser);
export { CreateUser };
