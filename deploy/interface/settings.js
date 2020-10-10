var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css } from 'lit-element';
import { customElement, property } from "lit-element/lib/decorators.js";
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { PageViewElement } from '../lazy-loader';
import { p_publishContractor } from './public_state';
import { user_Photo } from './settings_state';
import './titles';
import './account';
let ContractorProfile = class ContractorProfile extends connect(store)(PageViewElement) {
    constructor() {
        super();
        this._contractorName = '';
        this._contractorPhoto = '';
        this._contractorEmail = '';
        this._contractorPhone = '';
        this._contractorInfo = '';
        this._contractorProfile = '';
        this._contractorWebsite = '';
        this._publish_Contractor = false;
        this._verify = false;
        this._id = '';
        this._title = '';
    }
    stateChanged(state) {
        this._title = state.settings.topic;
        this._verify = state.settings.verified;
        this._id = state.settings.individual_id;
        this._publish_Contractor = state.settings.individual_contract;
        this._contractorName = state.settings.individual_name;
        this._contractorPhoto = state.settings.individual_photo;
        this._contractorEmail = state.settings.individual_email;
        this._contractorPhone = state.settings.individual_phone;
        this._contractorWebsite = state.settings.individual_website;
        this._contractorInfo = state.settings.individual_info;
    }
    _publishContractor() {
        const user_name = this.shadowRoot.querySelector('#contractorName');
        const user_phone = this.shadowRoot.querySelector('#contractorPhone');
        const user_email = this.shadowRoot.querySelector('#contractorEmail');
        const user_website = this.shadowRoot.querySelector('#contractorWebsite');
        const user_info = this.shadowRoot.querySelector('#contractorInfo');
        const b = this.slugify(name);
        const text = '/user/' + '#' + b;
        const contractorPayload = {
            contractorInfo: user_info.value,
            contractorPhoto: this._contractorPhoto,
            contractorWebsite: user_website.value,
            contractorName: user_name.value,
            contractorPhone: user_phone.value,
            contractorEmail: user_email.value,
            contractorURL: text.toString(),
        };
        console.log('Published ', contractorPayload);
        firebase
            .auth()
            .onAuthStateChanged((user) => {
            if (user) {
                const save = firestore
                    .collection('users')
                    .doc(user.uid);
                save
                    .update(contractorPayload)
                    .catch((error) => { console.log('Publish Error: ', error); });
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
                        console.log();
                        const newDocument = {
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            userID: user.uid,
                            contractorInfo: user_info.value,
                            contractorPhoto: this._contractorPhoto,
                            contractorWebsite: user_website.value,
                            contractorName: user_name.value,
                            contractorEmail: user.email,
                            contractorPhone: user.phoneNumber,
                            contractorURL: text.toString(),
                        };
                        publish.set(newDocument);
                    }
                })
                    .catch((error) => { console.log('Publish Error: ', error); });
            }
        });
    }
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }
    disconnectedCallback() {
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
    updateEmail() {
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
    updatePassword() {
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
    deleteUser() {
        const d = confirm("Delete Account?");
        if (d == true) {
            firebase.auth().currentUser.delete();
        }
    }
    _changeBusiness() {
        let payload = this.shadowRoot.querySelector('#publishCompany');
        store.dispatch(p_publishContractor(payload.checked));
    }
    firstUpdated() {
        this.shadowRoot.querySelector(".contractorPhoto").addEventListener('change', () => { this._handleImage(this._id); });
        this.shadowRoot.querySelector('.save').addEventListener('click', () => { this._publishContractor(); });
        this.shadowRoot.querySelector('.emailUpdate').addEventListener('click', () => { this.updateEmail(); });
        this.shadowRoot.querySelector('.passUpdate').addEventListener('click', () => { this.updatePassword(); });
        this.shadowRoot.querySelector('.deleteUser').addEventListener('click', () => { this.deleteUser(); });
        this.shadowRoot.querySelector('#publishCompany').addEventListener('change', () => { this._changeBusiness(); });
    }
    static get styles() {
        return css `

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

        `;
    }
    render() {
        return html `

<setting-titles></setting-titles>

<section ?on="${this._title === 'individual'}"
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

<profile-account ?active="${this._title === 'account'}"></profile-account>

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
    checked="${this._publish_Contractor}">
  
  <!-- DELETE -->
  <button class = "deleteUser">Delete</button>
  ${this._contractorName}
  ${this._contractorPhoto}
  ${this._contractorEmail}
  ${this._contractorPhone}

      `;
    }
};
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_contractorName", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_contractorPhoto", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_contractorEmail", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_contractorPhone", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_contractorInfo", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_contractorProfile", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_contractorWebsite", void 0);
__decorate([
    property({ type: Boolean })
], ContractorProfile.prototype, "_publish_Contractor", void 0);
__decorate([
    property({ type: Boolean })
], ContractorProfile.prototype, "_verify", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_id", void 0);
__decorate([
    property({ type: String })
], ContractorProfile.prototype, "_title", void 0);
ContractorProfile = __decorate([
    customElement('contractor-profile')
], ContractorProfile);
export { ContractorProfile };
