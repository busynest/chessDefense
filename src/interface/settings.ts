
import {
  html,
  css,
  TemplateResult,
  CSSResult
} from 'lit-element';

import { customElement, property }  from "lit-element/lib/decorators.js"
import { connect }                  from 'pwa-helpers/connect-mixin';
import { store, RootState }         from '../store';
import { PageViewElement }          from '../lazy-loader';
import { p_publishContractor }      from './public_state';
import { user_Photo }               from './settings_state';
import './titles';
import './account';

@customElement('contractor-profile')
export class ContractorProfile extends connect(store)(PageViewElement) {

  // ACCOUNT // CONTRACTOR - PRIVATE
  @property({type: String})   private _contractorName      :any = '';
  @property({type: String})   private _contractorPhoto     :any = '';
  @property({type: String})   private _contractorEmail     :any = '';
  @property({type: String})   private _contractorPhone     :any = '';
  @property({type: String})   private _contractorInfo      :any = '';
  @property({type: String})   private _contractorProfile   :any = '';
  @property({type: String})   private _contractorWebsite   :any = '';
  @property({type: Boolean})  private _publish_Contractor  :any = false;
  @property({type: Boolean})  private _verify              :any = false;
  @property({type: String})   private _id                  :any = '';
  @property({type: String})   private _title               :any = '';

/*
  static get properties() {
    return {
        // PROJECT MANAGEMENT
        place:              { type: String },
        industry:           { type: String },
        residential:        { type: Array },
        commercial:         { type: Array },
        posts:              { type: Number },
        test:               { type: Array }
    }
  }
*/

  constructor() {
    super();
  }

  stateChanged(state: RootState) {
    this._title                 = state.settings!.topic;
    this._verify                = state.settings!.verified;
    this._id                    = state.settings!.individual_id;
    this._publish_Contractor    = state.settings!.individual_contract;
    this._contractorName        = state.settings!.individual_name;
    this._contractorPhoto       = state.settings!.individual_photo;
    this._contractorEmail       = state.settings!.individual_email;
    this._contractorPhone       = state.settings!.individual_phone;
    this._contractorWebsite     = state.settings!.individual_website;
    this._contractorInfo        = state.settings!.individual_info;
  }

  // MOVE TO ARTICLE
  private _publishContractor() {
    // const user_photo     :any = this.shadowRoot!.querySelector( '.contractorPhoto' ); // URL
    const user_name      :any = this.shadowRoot!.querySelector( '#contractorName' );
    const user_phone     :any = this.shadowRoot!.querySelector( '#contractorPhone' );
    const user_email     :any = this.shadowRoot!.querySelector( '#contractorEmail' );
    const user_website   :any = this.shadowRoot!.querySelector( '#contractorWebsite' );
    const user_info      :any = this.shadowRoot!.querySelector( '#contractorInfo' );
    const b              :any = this.slugify(name);
    const text           :any = '/user/' + '#' + b ;
    const contractorPayload:any = {
      // publishContractor:    contract    .checked,
      contractorInfo:       user_info      .value,
      contractorPhoto:      this._contractorPhoto,
      contractorWebsite:    user_website   .value,      
      contractorName:       user_name      .value,
      contractorPhone:      user_phone     .value,
      contractorEmail:      user_email     .value,
      contractorURL:        text.toString(),
      // contractorBusiness      :business,
    }

    console.log( 'Published ', contractorPayload );

      // @ts-ignore
      firebase
        .auth()
        .onAuthStateChanged( (user:any) => {
          if (user) {

        // @ts-ignore - Save Public User Data
        const save:any = firestore
          .collection ( 'users' )
          .doc( user.uid );

        save
          .update( contractorPayload ) // .set
          .catch( ( error:any ) => { console.log('Publish Error: ', error) } );

          // @ts-ignore - Save Public User Data
          const publish:any = firestore
            .collection( 'contractors' )
            .doc( user.uid );

          publish
            .get()
            .then(
              (doc:any) => {

                  if (doc.exists) { publish.update( contractorPayload ) }
                  else            {
                    console.log(  );
                    // New Document Object.
                    const newDocument:any = {

                      //@ts-ignore
                      timestamp:            firebase.firestore.FieldValue.serverTimestamp(),
                      userID:               user.uid,

                      /** Contractor */
                      // publishContractor:    contract    .checked,
                      contractorInfo:       user_info      .value,
                      contractorPhoto:      this._contractorPhoto, // c_photo     .value, // user.photoURL
                      contractorWebsite:    user_website   .value,      
                      contractorName:       user_name      .value, // user.displayName
                      contractorEmail:      user.email,
                      contractorPhone:      user.phoneNumber,
                      contractorURL:        text.toString(),
       
                      /*
                      contractorName:           user.displayName,
                      contractorPhoto:          user.photoURL,
                      contractorEmail:          user.email,
                      contractorPhone:          user.phoneNumber,
                      */
                    }
                    publish.set      ( newDocument );
                  }

              }
            )
            .catch( ( error:any ) => { console.log('Publish Error: ', error) } );
            
          
        }

    })

  }
/*
  private _verified() {
    if ( 'user photo, email, phone name description' ) [
      'change publish to true, change init to accepted / verified / '
    ]
  }
*/
  public slugify(text:any) {
    return text
      .toString     ()                    // Cast to string
      .toLowerCase  ()                    // Convert the string to lowercase letters
      .normalize    ('NFD')               // The normalize() method returns the Unicode Normalization Form of a given string.
      .trim         ()                    // Remove whitespace from both sides of a string
      .replace      (/\s+/g, '-')         // Replace spaces with -
      .replace      (/[^\w\-]+/g, '')     // Remove all non-word chars
      .replace      (/\-\-+/g, '-');      // Replace multiple - with single -
  }

/*
private _phonePassword() {

  // @ts-ignore
  const recaptchaVerifier:any = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      'size': 'invisible',
      'callback': (response:any) => {
        console.log(response);
      //  onSignInSubmit();
      }
    });

  const phoneNumber:any   = this.shadowRoot!.querySelector('.contractorPhone');
  const code:any          = this.shadowRoot!.querySelector('.phoneVerify');
  const appVerifier       = recaptchaVerifier;
  
  
  // @ts-ignore
  firebase
    .auth()
    .signInWithPhoneNumber(phoneNumber, appVerifier)
    .then( (confirmationResult:any) => {
  
      confirmationResult
        .confirm(code)
        .then( (result:any) => { var user = result.user; console.log( 'telephone user: ', user ); })
        .catch( (error:any) => { console.log(error); } );
    
      }).catch( (error:any) => { console.log(error) });
  
    }
*/

  disconnectedCallback() {
    // this.shadowRoot!.querySelector('.auth')!.removeEventListener('change', (e:any) => { store.dispatch( navigate(e.target.value) ); }, false )
  }

private _handleImage(id:any) {

  // @ts-ignore - Reference Project Storage Bucket
  const storageRef:any  = firebase
    .storage()
    .ref();

  // @ts-ignore - Reference current User
  const user:any        = firebase
    .auth()
    .currentUser;

  const uploader:any    = this.shadowRoot!.querySelector('.uploader');  // Select Progress Bar
  const file:any        = this.shadowRoot!.querySelector('.contractorPhoto')!;     // Select image
  const metadata:any    = { 'contentType': file.files[0].type };        // Create image metadata

  // Reference path name
  storageRef
    .child  ( '/images/'+ id + "/" + file.files[0].name )
    .put    ( file.files[0], metadata )
    .then   ( ( snapshot:any ) => {

      // Reset progress bar
      const percentage  = ( snapshot.bytesTransferred / snapshot.totalBytes ) * 0;
      uploader.value    = percentage;

      // storage snapshot reference
      snapshot
        .ref
        .getDownloadURL()
        .then( (url:any) => {

          // show progress bar upload
          const percentage  = ( snapshot.bytesTransferred / snapshot.totalBytes ) * 100;
          uploader.value    = percentage;

          // update user photo URL
          user
            .updateProfile  ( { photoURL: url } )
            .then           (  () => { /*console.log("Photo uploaded: " + url); */})
            .catch          ( (error: any) => { console.log("An error has occured: " + error); } );

          // update Redux image state
          store.dispatch( user_Photo(url) );
          console.log('url', url);

        });
    // Handle errors for storage snapshot
    }).catch( () => {} );

}

/* Update email */
private alertEmail(error:any)  { console.log( 'Problem: ' + error );/* if (this._user) { this.updateEmail(); } else { alert('Please Login'); } */ }
private updateEmail() {

  const email:any = this.shadowRoot!.querySelector('#contractorEmail')!;
  
  // @ts-ignore - Reference the current user
  const user:any  = firebase
    .auth()
    .currentUser;

  user
    .updateEmail(email.value)
    .then   ( () => { console.log("Email update successful!" ); })
    .catch  ( (error: object) => {this.alertEmail(error); console.error('Error writing new message to Firebase Database', error); });

  user
    .sendEmailVerification()
    .then   ( () => { console.log("Email Verification successful!");})
    .catch  ( (error: object) => { this.alertEmail(error); console.error('Error writing new message to Firebase Database', error); });
}

/* Update Password */
private alertPassword(error:any)  { console.log("Problem: "+ error.messge)/* if (this._user) { this.updatePassword(); } else { alert('Please Login'); } */ }
private updatePassword() {

  // Select password input
  const newPassword:any = this.shadowRoot!.querySelector('#newPass')!;
  console.log("Password successful!: ", newPassword.value);
  // @ts-ignore - Reference the current user
  const user:any = firebase
    .auth()
    .currentUser;

  const newer:any = newPassword.value;

  user
    .updatePassword(newer)
    .then   ( () => { console.log("Password successful!"); })
    .catch  ( (error: object) => { this.alertPassword(error); });
}

// verified user deletion
private deleteUser() {
  // a confirmation message to set Boolean for verification
  const d:any = confirm("Delete Account?");
  // @ts-ignore - if confirm box is true, delete the user
  if ( d == true ) { firebase.auth().currentUser.delete(); }
}
/*
private verifyEmail() {

  if ( this._init === 'introduction' ) {

  }

  // @ts-ignore - Reference the current user
  const user:any  = firebase
    .auth()
    .currentUser;

  user
    .sendEmailVerification()
    .then   ( () => { console.log("Email Verification successful!");})
    .catch  ( (error: object) => { this.alertEmail(error); console.error('Error writing new message to Firebase Database', error); });
}
*/

private _changeBusiness() {
  let payload:any = this.shadowRoot!.querySelector('#publishCompany');
  store.dispatch(p_publishContractor(payload.checked));
}

protected firstUpdated() {
  this.shadowRoot!.querySelector(".contractorPhoto")!   .addEventListener('change', () => { this._handleImage(this._id) } ); /*,  { passive: false } */
  this.shadowRoot!.querySelector('.save')!              .addEventListener('click',  () => { this._publishContractor() } );
  this.shadowRoot!.querySelector('.emailUpdate')!       .addEventListener('click',  () => { this.updateEmail() } );
  this.shadowRoot!.querySelector('.passUpdate')!        .addEventListener('click',  () => { this.updatePassword() } );
  this.shadowRoot!.querySelector('.deleteUser')!        .addEventListener('click',  () => { this.deleteUser(); });
  this.shadowRoot!.querySelector('#publishCompany')!    .addEventListener('change', () => { this._changeBusiness(); });
  // this.shadowRoot!.querySelector('.verifyEmail')!       .addEventListener('click',  () => { this.verifyEmail(); });
}

  static get styles():CSSResult {
    return css`

        :host         { grid-gap: 14px;}
        .pageTitle    { margin:   0; }
        .verify       { fill:     orange; }
        .verify[on]   { fill:     green; }
        section, profile-account { display: none; }
        section[on], profile-account[active] { display:grid; }
        progress[value]::-webkit-progress-bar {
          background-color:   #eee;
          border-radius:      2px;
          box-shadow:         0 2px 5px rgba(0, 0, 0, 0.25) inset;
        }

        progress[value]::-webkit-progress-value {
          background-image:
            -webkit-linear-gradient(-45deg, 
                                    transparent 33%, rgba(0, 0, 0, .1) 33%, 
                                    rgba(0,0, 0, .1) 66%, transparent 66%),
            -webkit-linear-gradient(top, 
                                    rgba(255, 255, 255, .25), 
                                    rgba(0, 0, 0, .25)),
            -webkit-linear-gradient(left, #09c, #f44);

          border-radius: 2px; 
          background-size: 35px 20px, 100% 100%, 100% 100%;

        }

          @keyframes optic {
            0%   {opacity: 0; -webkit-opacity: 0;}
            100% {opacity: 1; -webkit-opacity: 1;}
          }

          /** LOGO MOBILE */
          @media only screen and (max-width: 768px) {
            .uiBody     { grid-template-columns:  1fr; }
            .navAction  { grid-template-columns: 0px 80px 1fr 80px; }
            .uiCompany  { grid-template-columns: 1fr; }
          }

          /** LOGO DESKTOP */
          @media only screen and (min-width: 768px) {
            .uiBody       { grid-template-columns: 205px 1fr;} /* 210px 1fr; */
            .navAction    { grid-template-columns: 1fr 80px 0px 80px; }
            .conInterface { margin: 0 0 0 8px; }
            .uiCompany    { grid-template-columns: 120px 1fr; }
          }

        `
    }
  
    protected render(): TemplateResult {
      return html`

<setting-titles></setting-titles>

<section ?on="${ this._title === 'individual' }"
  style="
    border: 10px solid #184A78;
    background-color: #184A78;
    border-radius: 8px;
    box-shadow: 1px 1px black;
    padding: 8px;
    box-sizing: border-box;">

  <div
    class="profiles"
    style="
      display:                grid;
      grid-gap:               8px;
      -webkit-grid-gap:       8px;">

    <!-- Navigation -->
    <nav
      style="
        display:                grid;
        grid-template-columns:  1fr;
        box-sizing:             border-box;
        padding:                8px;">

      <div
        style="margin: auto">

        <div
          style="
            display:                grid;
            grid-template-columns:  28px 135px;
            margin:                 auto;">

          <!-- verified Checkmark -->
          <div
            class = "verify"
            ?on   = "${this._verify}"
            style = "margin: auto;"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" class="checkmarked"style="fill:green;"><path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none"/><path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
          </div>

          <h2
            style="
              color: orange;
              text-transform: uppercase;
              margin: 0;" >Individual</h2>

        </div>

      </div>

    </nav>

    <!-- DASHBOARD UI -->
    <div
      class="uiBody"
      style="
        display: grid;
        grid-gap: 16px;">


        <!-- LOGO 
        <label
          for     ="companyLogo"
          style   = "
            box-shadow:     2px 2px 2px black;
            border-radius:  8px;
            display:        grid;
            padding:        0;
            margin:         auto;
            overflow:       hidden;
            position:       relative;">

          <progress
            class   ="uploader"
            value   ="0"
            max     ="100"
            style   ="
              height:       6px;
              width:        64px;
              border:       0;
              -webkit-appearance:   none;
              appearance:           none;"></progress>

          <input
            type    ="image"
            alt     ="user"
            height  ="64px"
            width   ="64px"
            src     ="\${this._companyLogo}" />

          <input
            type    ="file"
            name    ="companyLogo"
            class   ="companyLogo"
            accept  ="image/*"
            style   ="
              width:            64px;
              height:           64px;
              position:         absolute;
              cursor:           pointer;
              opacity:          0; 
              -webkit-opacity:  0;" />

          <button
            class="delete">Delete Photo</button>

        </label>
        <!-- END LOGO -->


          <!-- SAVE / CANCEL -->
          <div
            class="navAction"
            style="
              display: grid;">

            <span></span>

            <!-- Cancel / Public Profile -->
            <a
              href="/">
                <mwc-button
                class ="cancel"
                label ="cancel"></mwc-button>
            </a>

            <span></span>

            <!-- Publish -->
            <mwc-button raised
              class ="save"
              label ="Save">
            </mwc-button>

          </div>
          <!-- END SAVE / CANCEL -->

      <!-- PHOTO 
      <label
        for     ="photoURL"
        style   = "
          box-shadow:     2px 2px 2px black;
          border-radius:  8px;
          display:        grid;
          padding:        0;
          margin:         auto;
          overflow:       hidden;
          position:       relative;" >

        <progress
          class   ="uploader"
          value   ="0"
          max     ="100"
          style   ="
            height:               6px;
            width:                200px;
            border:               0;
            -webkit-appearance:   none;
            appearance:           none;"></progress>

        <input
          type    ="image"
          alt     ="user"
          height  ="200px"
          width   ="200px"
          src     ="\${this._contractorPhoto ? this._contractorPhoto :'./images/person-24px.svg' }" /> <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg> 

        <input
          type    ="file"
          name    ="photoURL"
          class   ="contractorPhoto"
          accept  ="image/*"
          style   ="
            width:            200px;
            height:           200px;
            position:         absolute;
            cursor:           pointer;
            opacity:          0; 
            -webkit-opacity:  0;" />

        <button
          class="delete">Delete Photo</button>

      </label>
      <!-- END PHOTO -->


      <!-- INFORMATION INTERFACE -->
      <div
        class='conInterface'
        style="
          display:  grid;
          grid-gap: 8px;">



          <!-- PROFILE -->
          <select raised
            id      ="contractorProfile"
            class   ="info"
            label   ="Profile"
            name    ="profile"
            form    ="contractor"
            style   ="width: 100%;"> <!-- selected=\${this.stakeholder} -->
            
            <option
              value     ="Homeowner"
              ?selected ="${this._contractorProfile === "Homeowner"}">Homeowner</option>
              
            <option
              value     ="Contractor"
              ?selected ="${this._contractorProfile === "Contractor"}">Contractor</option>
          
              <option
              value     ="Supplier"
              ?selected ="${this._contractorProfile === "Supplier"}">Supplier</option>
              
            <option
              value     ="Realtor"
              ?selected ="${this._contractorProfile === "Realtor"}">Realtor</option>

          </select>

          
      <!-- BACKLINK -->
      <input
        id      ="contractorWebsite"
        placeholder   ="Social Profile"
        value   ="${this._contractorWebsite}" />

      </div><!-- END INFORMATION INTERFACE -->

    </div> <!-- END DASHBOARD UI -->

  </div>

      <!-- INFO -->
      <mwc-textarea
        id      ="contractorInfo"
        type    ='text'
        label   ="Resume"
        value   ="${this._contractorInfo}"
        rows    ="10">
      </mwc-textarea>

</section>

<profile-account ?active="${ this._title === 'account' }"></profile-account>

<!--

<section ?on="\${ this._title === 'account' }"
  style="
    border: 10px solid #184A78;
    background-color: #184A78;
    border-radius: 8px;
    box-shadow: 1px 1px black;
    padding: 8px;
    box-sizing: border-box;">

      <h2
            style="
              color: orange;
              text-transform: uppercase;
              margin: 0;" >Account</h2>

      
      <!-- Contact Name --
      <mwc-textfield
        class         ="info" 
        id            ="contractorName"
        type          ="text"
        label         ="Full Name"
        value         ="\${ this._contractorName }"
        style = "
          margin: auto;
          width:  100%;">
      </mwc-textfield>

      <!-- PHONE --
      <div style="display: grid; grid-template-columns: 1fr 80px;">
        <mwc-textfield
          id            ="contractorPhone"
          type          ="tel"
          name          ="phone"
          label         ="telephone"
          value         ="\${this._contractorPhone}"
          style ="
            margin: auto;
            width:  100%;">
        </mwc-textfield>

        <button>update</button>
      </div>

      <input
        class ="phoneVerify"
        type  ="text" />

      <!-- EMAIL --
      <div style="display: grid; grid-template-columns: 1fr 80px;">
         <mwc-textfield
          id            = "contractorEmail"
          value         = "\${this._contractorEmail}"
          class         = "email"
          type          = "email"
          label         = "Account Email"
          style = "
            margin: auto;
            width:  100%;">
        </mwc-textfield>
        <button class="emailUpdate">update</button>
      </div>

      <!-- PASSWORD --
      <div style="display: grid; grid-template-columns: 1fr 80px;">
        <mwc-textfield
          id    = "newPass"
          type  = "Password"
          label = "Update Password"
          style = "
            margin: auto;
            width:  100%;">
        </mwc-textfield>
        <button class="passUpdate">update</button>
      </div>

      
      </section>

    -->

  <!-- Accept Contractor -->
  <input
    type="checkbox"
    style="display: none;"
    checked="${ this._publish_Contractor }">
  
  <!-- DELETE -->
  <button class = "deleteUser">Delete</button>
  ${this._contractorName}
  ${this._contractorPhoto}
  ${this._contractorEmail}
  ${this._contractorPhone}

      `;
    }
  }


/*
  private _changeEmail(e:any) {
    e.preventDefault();
    this._newEmail = !this._newEmail;
  }

  private _changePassword(e:any) {
    e.preventDefault();
    this._newPass = !this._newPass;
  }
*/

  // this.shadowRoot!.querySelector('#publishCompany')!  .addEventListener('change',  (e:any) => { e.target.checked =  });
  // this.shadowRoot!.querySelector('#publishCompany')!  .addEventListener('change',  (e:any) => { console.log(e.target.checked) });
  // this.shadowRoot!.querySelector('.publishCompany')!  .addEventListener('change',  () => { this._contract = !this._contract });
  // this._formed();

  /**
   * 
   *   <!--
  <h2
    class = "pageTitle">Delete Account</h2>
  
  <p>Permanently delete the user account and data related to:</p>
    <mwc-button
      class = "deleteUser">Delete</mwc-button>
    -->
   * 
   */
// @property({type: String})   private _trade:any          = '';
// @property({type: String})   private _userMail:any        = '';
// @property({type: String})   private _profileTopic:any    = '';
// this._trade             = state.article!.occupation;
// this._profileTopic      = state.settings!.page;
// this._userMail          = state.user!.email;

/**
 * <!--
  <mwc-textfield
    class         ="emailVerify"
    type          ="email"
    label         ="Verify Email"
    iconTrailing  ="mail"
    style         ="max-width: 300px; margin: auto; width: 100%;">
  </mwc-textfield>
  -->

    <mwc-textfield
    class         ="passVerify"
    type          ="Password"
    label         ="passVerify"
    iconTrailing  ="lock"
    style         ="max-width: 300px; margin: auto; width: 100%;">
  </mwc-textfield><!-- pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" -->
 * 
 */

 /*
   private _formed() {
    const x:any = this.querySelector("myForm");
    var txt = "";
    var i;
    for (i = 0; i < x.length; i++) {
      txt = txt + x.elements[i].value + "<br>";
    }
    console.log('txt',txt);
   }
*/


/**
 * 
 *         <!-- SHOW ACTIONS 
        <div
          style="
            display: grid;
            grid-template-columns: 1fr 1fr;">

          <mwc-button @click="\${ this._changePassword }"  >change Password</mwc-button>
          <mwc-button @click="\${ this._changeEmail }"     >change Email</mwc-button>
        </div>

        <div
          class ="showEmail"
          ?on   ="\${ this._newEmail }"
          style ="
            grid-template-columns: 1fr 90px;">

          <mwc-textfield
                      id = "contractorEmail"
                   class = "email"
                    type = "email"
                   label = "Email"
            iconTrailing = "mail"
                   style = "
                    margin: auto;
                    width:  100%;">
          </mwc-textfield>

          <mwc-button
            class="update">update</mwc-button>
        </div>

        <div
          class="showPass"
          style="
            grid-template-columns: 1fr 90px;"
            ?on="\${ this._newPass }">

          <mwc-textfield
            class         ="newPass"
            type          ="Password"
            label         ="Password"
            iconTrailing  ="lock"
            style         ="margin: auto; width: 100%;">
          </mwc-textfield> <!-- pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}">

          <mwc-button
            class="pass">update</mwc-button>
        </div>

      </div>   -->
 * 
 */