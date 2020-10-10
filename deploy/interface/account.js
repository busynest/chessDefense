var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css, customElement, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { PageViewElement } from '../lazy-loader';
import { user_Photo } from './settings_state';
let ProfileAccount = class ProfileAccount extends connect(store)(PageViewElement) {
    constructor() {
        super();
        this._contractorName = '';
        this._contractorPhoto = '';
        this._contractorEmail = '';
        this._contractorPhone = '';
        this._id = '';
        this._title = '';
        this._error = '';
    }
    stateChanged(state) {
        this._contractorName = state.settings.individual_name;
        this._contractorPhoto = state.settings.individual_photo;
        this._contractorEmail = state.settings.individual_email;
        this._contractorPhone = state.settings.individual_phone;
        this._title = state.settings.topic;
        this._id = state.settings.individual_id;
    }
    _saveAccount() {
        const profile_name = this.shadowRoot.querySelector('#contractorName');
        const contractorPayload = {
            displayName: profile_name.value,
            photoURL: this._contractorPhoto
        };
        console.log('Published ', contractorPayload);
        firebase
            .auth()
            .onAuthStateChanged((user) => {
            if (user) {
                const user = firebase.auth().currentUser;
                user.updateProfile({
                    displayName: profile_name.value,
                    photoURL: this._contractorPhoto
                }).then(() => { }).catch((error) => { console.log(error); });
                const save = firestore
                    .collection('users')
                    .doc(user.uid);
                save
                    .update(contractorPayload)
                    .catch((error) => { this._error = error; });
                const publish = firestore
                    .collection('contractors')
                    .doc(user.uid);
                publish
                    .get()
                    .then((doc) => {
                    if (doc.exists) {
                        publish.update(contractorPayload);
                    }
                    else {
                        const newDocument = {
                            displayName: profile_name.value,
                            photoURL: this._contractorPhoto,
                        };
                        publish.set(newDocument);
                    }
                })
                    .catch((error) => { this._error = error; });
            }
        });
    }
    _handleImage(id) {
        const storageRef = firebase
            .storage()
            .ref();
        const user = firebase
            .auth()
            .currentUser;
        const uploader = this.shadowRoot.querySelector('.uploader');
        const file = this.shadowRoot.querySelector('.contractorPhoto');
        const metadata = { 'contentType': file.files[0].type };
        storageRef
            .child('/images/' + id + "/" + file.files[0].name)
            .put(file.files[0], metadata)
            .then((snapshot) => {
            const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 0;
            uploader.value = percentage;
            snapshot
                .ref
                .getDownloadURL()
                .then((url) => {
                const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploader.value = percentage;
                user
                    .updateProfile({ photoURL: url })
                    .then(() => { })
                    .catch((error) => { console.log("An error has occured: " + error); });
                store.dispatch(user_Photo(url));
                console.log('url', url);
            });
        }).catch(() => { });
    }
    alertEmail(error) { console.log('Problem: ' + error); }
    _updateEmail() {
        const email = this.shadowRoot.querySelector('#contractorEmail');
        const user = firebase
            .auth()
            .currentUser;
        user
            .updateEmail(email.value)
            .then(() => { console.log("Email update successful!"); })
            .catch((error) => { this.alertEmail(error); console.error('Error writing new message to Firebase Database', error); });
        user
            .sendEmailVerification()
            .then(() => { console.log("Email Verification successful!"); })
            .catch((error) => { this.alertEmail(error); console.error('Error writing new message to Firebase Database', error); });
    }
    alertPassword(error) { console.log("Problem: " + error.messge); }
    _updatePassword() {
        const newPassword = this.shadowRoot.querySelector('#newPass');
        console.log("Password successful!: ", newPassword.value);
        const user = firebase
            .auth()
            .currentUser;
        const newer = newPassword.value;
        user
            .updatePassword(newer)
            .then(() => { console.log("Password successful!"); })
            .catch((error) => { this.alertPassword(error); });
    }
    firstUpdated() {
        this.shadowRoot.querySelector(".contractorPhoto").addEventListener('change', () => { this._handleImage(this._id); });
        this.shadowRoot.querySelector('.saveAccount').addEventListener('click', () => { this._saveAccount(); });
        this.shadowRoot.querySelector('.emailUpdate').addEventListener('click', () => { this._updateEmail(); });
        this.shadowRoot.querySelector('.passUpdate').addEventListener('click', () => { this._updatePassword(); });
    }
    static get styles() {
        return css `
  
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
  
          `;
    }
    render() {
        return html `
  
          <section ?on="${this._title === 'account'}"
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
                    src     ="${this._contractorPhoto ? this._contractorPhoto : './images/person-24px.svg'}" 
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

                  <button ?on="${this._contractorPhoto !== null}"
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
                  value         ="${this._contractorName}"
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
};
__decorate([
    property({ type: String })
], ProfileAccount.prototype, "_contractorName", void 0);
__decorate([
    property({ type: String })
], ProfileAccount.prototype, "_contractorPhoto", void 0);
__decorate([
    property({ type: String })
], ProfileAccount.prototype, "_contractorEmail", void 0);
__decorate([
    property({ type: String })
], ProfileAccount.prototype, "_contractorPhone", void 0);
__decorate([
    property({ type: String })
], ProfileAccount.prototype, "_id", void 0);
__decorate([
    property({ type: String })
], ProfileAccount.prototype, "_title", void 0);
__decorate([
    property({ type: String })
], ProfileAccount.prototype, "_error", void 0);
ProfileAccount = __decorate([
    customElement('profile-account')
], ProfileAccount);
export { ProfileAccount };
