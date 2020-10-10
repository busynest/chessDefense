
import { html, css, TemplateResult, CSSResult }     from 'lit-element';
import { customElement, property } from "lit-element/lib/decorators.js"
import { connect }                      from 'pwa-helpers/connect-mixin';
import { store, RootState }                        from '../store';
import { PageViewElement }              from '../lazy-loader';

@customElement('contractors-questions')
export class ContractorsQuestions extends connect(store)(PageViewElement) {

  @property({type: Boolean}) private _user  = false;
  @property({type: String})  private _photo = '';

  constructor() {
    super();
  }

  stateChanged(state: RootState) {
    this._user  = state.settings!.currentUser;
    this._photo = state.settings!.individual_photo;
  }

  protected firstUpdated() {
    this.shadowRoot!.getElementById('send')!.addEventListener('click', (e:Event) => { e.preventDefault(); this.activateFeedback(); } );
  }

  private activateFeedback() {
    let text:any = this.shadowRoot!.querySelector('#texts')!;
    let feed:any = this.shadowRoot!.querySelector('#feedback')!
    if ( this._user === true ) {
      this.sendFeedback(text.value);
      feed.reset();
      text.value = "Thank you!";
      text.setAttribute("disabled", "true");
    } else { feed.reset(); text.value = "Please sign in"; }
  }

  private sendFeedback(messageText: any) {

    // @ts-ignore - External Resources
    return firebase
    .firestore()
    .collection('feedback')
    .add({
      name:           this._user,
      text:           messageText,
      profilePicUrl:  this._photo,
      // @ts-ignore -- External Resourse
      timestamp:      firebase.firestore.FieldValue.serverTimestamp()
    }).catch( (error: any) => { console.error('Error writing message', error); });
  
  };

  static get styles():CSSResult {
    return css`

        :host { display: block; }
        h2 { margin: 0; }
        .spec[on]     { display:           block; }
        .spec         { display:           none; }

        .visible[on]  { visibility:        visible; }
        .visible      { visibility:        hidden; }

        input[type=submit]:hover {
          background-color:   #45a049;
        }

    `
  }

  protected render():TemplateResult {
    return html`

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
  }
