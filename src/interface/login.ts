

import { LitElement, html, css, CSSResult, TemplateResult } from 'lit-element';
import { customElement, property } from "lit-element/lib/decorators.js"
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';

@customElement('create-user')
export class CreateUser extends connect(store)(LitElement) {

  @property({type: Boolean}) private _method  = false;
  @property({type: String})  private _error   = '';

  constructor() {
    super();
  }


  private _create() {
    let email:any     = this.shadowRoot!.querySelector('.newEmail')!;
    let password:any  = this.shadowRoot!.querySelector('.newSignal')!;
    // @ts-ignore 
    firebase
      .auth()
      .createUserWithEmailAndPassword(email.value, password.value)
      // .then( this.gtag_report_conversion(window.location) );
      .catch( (error:any) => { this._error = error, console.log( "error: ", error ); });
  }

  private _signIn() {
    let email:any = this.shadowRoot!.querySelector('.existingEmail')!;
    let password:any = this.shadowRoot!.querySelector('.existingSignal')!;
    // @ts-ignore 
    firebase
      .auth()
      .signInWithEmailAndPassword(email.value, password.value)
      .catch( (error:any) => { this._error = error, console.log( "error: ", error ); });
  }

  /*
  private gtag_report_conversion(url:any) {
    var callback = function () {
      if (typeof(url) != 'undefined') {
        window.location = url;
      }
    };
    // @ts-ignore
    gtag('event', 'conversion', {
      'send_to': 'AW-937270922/YDL4CKjKuNIBEIq99r4D',
      'event_callback': callback
    });
    return false;
  }
*/

  protected firstUpdated() {

  }

  static get styles():CSSResult {
    return css`

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

            `
  }

  protected render():TemplateResult {
    return html`

  ${ this._method ? html` 
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
          @click  = "${ this._create }">Sign up</button>

        ${this._error}

        <p
          style="
            color: whitesmoke;
            text-align: center;">
          By clicking "sign up" you agree to our <br />
          <a href="/terms">Terms of Service </a> & <a href="privacy">Privacy Policy</a>.
        </p>
      </form>
  ` : html`

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
              @click  ="${ this._signIn }">Sign in</button>

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

    `
  }
}