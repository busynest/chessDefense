
import {
    html,
    css,
    TemplateResult,
    CSSResult,
    customElement,
    property
  } from 'lit-element';

  import { connect }                  from 'pwa-helpers/connect-mixin';
  import { store, RootState }         from '../store';
  import { PageViewElement }          from '../lazy-loader';
  import { user_Photo }               from './settings_state';
  
  @customElement('profile-account')
  export class ProfileAccount extends connect(store)(PageViewElement) {
  
    // ACCOUNT // CONTRACTOR - PRIVATE
    @property({type: String})   private _contractorName      :any = '';
    @property({type: String})   private _contractorPhoto     :any = '';
    @property({type: String})   private _contractorEmail     :any = '';
    @property({type: String})   private _contractorPhone     :any = '';
    @property({type: String})   private _id                  :any = '';
    @property({type: String})   private _title               :any = '';
    @property({type: String})   private _error               :any = '';

    constructor() {
      super();
    }
  
    stateChanged(state: RootState) {
      this._contractorName        = state.settings!.individual_name;
      this._contractorPhoto       = state.settings!.individual_photo;
      this._contractorEmail       = state.settings!.individual_email;
      this._contractorPhone       = state.settings!.individual_phone;
      this._title                 = state.settings!.topic;
      this._id                    = state.settings!.individual_id;
    }
    
  
    // MOVE TO ARTICLE
    private _saveAccount() {

      const profile_name      :any = this.shadowRoot!.querySelector( '#contractorName' );
     // const profile_photo     :any = this.shadowRoot!.querySelector( '.contractorPhoto' ); // URL

      const contractorPayload:any = {
        displayName:  profile_name.value,
        photoURL:     this._contractorPhoto
      }
      console.log( 'Published ', contractorPayload );
  
        // @ts-ignore
        firebase
          .auth()
          .onAuthStateChanged( (user:any) => {
            if (user) {

              // @ts-ignore
              const user:any = firebase.auth().currentUser;
              user.updateProfile({
                displayName:  profile_name.value,
                photoURL:     this._contractorPhoto
              }).then( () => {  }).catch( (error:any) => { console.log(error) });

          // @ts-ignore - SAVE PROFILE
          const save:any = firestore
            .collection ( 'users' )
            .doc( user.uid );
  
          save
            .update( contractorPayload ) // .set
            .catch( ( error:any ) => { this._error = error } );

            // @ts-ignore - PUBLISH PROFILE
            const publish:any = firestore
              .collection( 'contractors' )
              .doc( user.uid );
  
            // publish.update( contractorPayload );
            // publish.set   ( contractorPayload );
  
            publish
              .get()
              .then(
                (doc:any) => {
  
                    if (doc.exists) { publish.update( contractorPayload ); }
                    
                    // FIRST PUBLISH TO PUBLIC
                    else {
                      // New Document Object.
                      const newDocument:any = {
                        displayName:   profile_name.value,
                        photoURL:      this._contractorPhoto,
                      }
                      publish.set      ( newDocument );
                    }
  
                }
              )
              .catch( ( error:any ) => { this._error = error } );
              
          }
  
      })
  
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
  private _updateEmail() {
  
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
  private _updatePassword() {
  
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
  /*
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
  
  
  protected firstUpdated() {
    this.shadowRoot!.querySelector(".contractorPhoto")!   .addEventListener('change', () => { this._handleImage(this._id) } ); /*,  { passive: false } */
    this.shadowRoot!.querySelector('.saveAccount')!       .addEventListener('click',  () => { this._saveAccount() } );
    this.shadowRoot!.querySelector('.emailUpdate')!       .addEventListener('click',  () => { this._updateEmail() } );
    this.shadowRoot!.querySelector('.passUpdate')!        .addEventListener('click',  () => { this._updatePassword() } );
    // this.shadowRoot!.querySelector('.deleteUser')!        .addEventListener('click',  () => { this.deleteUser(); });
    // this.shadowRoot!.querySelector('.verifyEmail')!       .addEventListener('click',  () => { this.verifyEmail(); });
  }
  
    static get styles():CSSResult {
      return css`
  
          :host         { display:  grid; grid-gap: 14px; }
          .pageTitle    { margin:   0; }
          .verify       { fill:     orange; }
          .verify[on]   { fill:     green; }
          section { display: none; }
          section[on] { display:grid; }
          progress[value]::-webkit-progress-bar {
            background-color:   #eee;
            border-radius:      2px;
            box-shadow:         0 2px 5px rgba(0, 0, 0, 0.25) inset;
          }

          .delete { display: none; }
          .delete[on] { display: block; }
  
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

            .progress-ring__circle {
              -webkit-transition: 0.35s stroke-dashoffset;
              transition: 0.35s stroke-dashoffset;
              -webkit-transform: rotate(-90deg);
                      transform: rotate(-90deg);
              -webkit-transform-origin: 50% 50%;
                      transform-origin: 50% 50%;
            }
  
          `
      }
    
      protected render(): TemplateResult {
        return html`
  
          <section ?on="${ this._title === 'account' }"
            style="
              grid-gap:           14px;
              border:             10px solid #184A78;
              background-color:   #184A78;
              border-radius:      8px;
              box-shadow:         1px 1px black;
              padding:            8px;
              box-sizing:         border-box;">

          
              <progress
                class   ="uploader"
                value   ="0"
                max     ="100"
                style   ="
                  height:               6px;
                  width:                100%;
                  border:               0;
                  -webkit-appearance:   none;
                  appearance:           none;"></progress>
<form>
                <!-- PHOTO -->
                <label
                  for     ="photoURL"
                  style   ="
                    border-radius:  8px;
                    display:        grid;
                    grid-gap:       14px;
                    padding:        0;
                    margin:         auto;
                    position:       relative;" >
          
                  <input
                    class   ="loadedPhoto"
                    type    ="image"
                    alt     ="user"
                    height  ="200px"
                    width   ="200px"
                    src     ="${this._contractorPhoto ? this._contractorPhoto :'./images/person-24px.svg' }" 
                    style   ="
                      border-radius:  50%;
                      box-shadow:     0 0 8px whitesmoke;
                      object-fit:     cover;" /> <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg> -->
          
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

                  <button ?on="${ this._contractorPhoto !== null }"
                    class="delete">Delete Photo</button>
          
                </label>
                <!-- END PHOTO -->
          
                <!-- SAVE / CANCEL -->
                <div
                  class="navAction"
                  style="
                    display: grid;">

                  ${this._error}

                  <!-- Cancel / Public Profile -->
                  <a
                    href="/">
                      <mwc-button
                      class ="cancel"
                      label ="cancel"></mwc-button>
                  </a>

                  <span></span>

                  <!-- Publish  class ="saveAccount" -->
                  <mwc-button raised

                    label ="Save">
                  </mwc-button>

                </div>
                <!-- END SAVE / CANCEL -->
                
                <!-- Contact Name -->
                <input required
                  class         ="info" 
                  id            ="contractorName"
                  type          ="text"
                  placeholder   ="Full Name"
                  value         ="${ this._contractorName }"
                  style = "
                    margin: auto;
                    width:  100%;" />
          
                <!-- PHONE -->
                <div style="display: grid; grid-template-columns: 1fr 80px;">
                  <input
                    id            ="contractorPhone"
                    type          ="tel"
                    name          ="phone"
                    placeholder   ="telephone"
                    value         ="${this._contractorPhone}"
                    style ="
                      margin: auto;
                      width:  100%;" />
          
                  <button>update</button>
                </div>
          
                <!-- EMAIL -->
                <div style="display: grid; grid-template-columns: 1fr 80px;">
                  <input
                    id            = "contractorEmail"
                    value         = "${this._contractorEmail}"
                    class         = "email"
                    type          = "email"
                    placeholder   = "Account Email"
                    style = "
                      margin: auto;
                      width:  100%;" />

                  <button class="emailUpdate">update</button>
                </div>
          
                <!-- PASSWORD -->
                <div style="display: grid; grid-template-columns: 1fr 80px;">
                  <input
                    id    = "newPass"
                    type  = "Password"
                    style = "
                      margin: auto;
                      width:  100%;" />

                  <button class="passUpdate">update</button>
                </div>       
        
              </form>
                </section>
          
  
        `;
      }
    }