
import { html, css, TemplateResult, CSSResult }  from 'lit-element';
import { customElement, property }  from "lit-element/lib/decorators.js";
import { connect }                  from 'pwa-helpers/connect-mixin';
import { store, RootState }         from '../store';
import { PageViewElement }          from '../lazy-loader';
import { _publicProfile }           from '../interface/functions';

@customElement('public-profile')
export class PublicProfile extends connect(store)(PageViewElement) { // PageViewElement

  @property({type: String}) private _photoURL :any     = '';
  @property({type: String}) private _website  :string  = "";
  @property({type: String}) private _name     :any     = '';
  @property({type: String}) private _describe :any     = '';
  @property({type: String}) private _profile  :any     = '';

  

  constructor() {
    super();
    this._getPublicContractor();
  }

  stateChanged(state: RootState) {
    this._photoURL    = state.settings!.individual_photo;
    this._website     = state.settings!.individual_website;
    this._name        = state.settings!.individual_name;
    this._describe    = state.settings!.individual_info;
  }

  private _getPublicContractor() {

   const user:any = window.location.hash;

  // @ts-ignore
  firestore
    .collection ( 'contractors' )
    .doc        ( user )
    .get        ( )
    .then       ( ( doc: any ) => {

        //If doument exists
        if (doc.exists) {

            const articleData:any = [];

            articleData
              .push( doc.data() );

              _publicProfile( user ) ;

        }

    }).catch( (error:any) => { console.log(error); } );

  }
/*
  public slugify(text:any) {
    return text
      .toString()                     // Cast to string
      .toLowerCase()                  // Convert the string to lowercase letters
      .normalize('NFD')               // The normalize() method returns the Unicode Normalization Form of a given string.
      .trim()                         // Remove whitespace from both sides of a string
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-');        // Replace multiple - with single -
  }
*/

  protected firstUpdated() {
   // let path:any = window.location.hash
   // _runContractor(path.slice(1));
  }

  static get styles():CSSResult {
    return css`



      `
  }

  protected render():TemplateResult {
    return html`

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

        <p>Contact Name:${ this._name }</p>

      </section>

    `
  }

}

