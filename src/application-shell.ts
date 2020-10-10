
/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/


// LIBRARY ELEMENTS
import { LitElement, html, css, TemplateResult, CSSResult, customElement, property } from 'lit-element';

// WEBSITE APPLICATION HELPERS
import { connect }                    from 'pwa-helpers/connect-mixin';
import { installRouter }              from 'pwa-helpers/router';
import { installOfflineWatcher }      from 'pwa-helpers/network';
import { updateMetadata }             from 'pwa-helpers/metadata';

// REDUX
import { store, RootState }           from './store';
import { navigate, updateOffline }    from './application/application_state';
import { setDrawer }                  from './interface/drawer_state';

// CUSTOM ELEMENTS
import './application/offline';
import './interface/drawer';
import './interface/login';

// RUN
import { _initializeData }    from './initialize-data';
// import { googleSignIn }       from './interface/functions';

const profileIcon   = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="whitesmoke" width="18px" height="18px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/></svg>`;
const settingsIcon  = html`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" fill="whitesmoke" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`;

// const faceIcon = html`<svg viewBox="0 0 24 24" height="175px" width="175px"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"></path></svg>`;

@customElement('application-shell')
export class ApplicationShell extends connect(store)(LitElement) {

  @property({type: Boolean})  private _user                     = false;
  @property({type: Boolean})  private _drawer:any               = false;
  @property({type: Boolean})  private _offlineNote:boolean      = false;
  @property({type: Boolean})  private _offlineTxt:boolean       = false;
  @property({type: String})   private _page:any                 = '';
  @property({type: String})   private _photoURL:any             = '';
  @property({type: String})   private _id:any                   = '';

  constructor() {
    super();
  }

  stateChanged(state: RootState) {
    this._user            = state.settings!.currentUser;
    this._id              = state.settings!.individual_id;
    this._photoURL        = state.settings!.individual_photo;
    this._drawer          = state.drawer!.drawer;
    this._page            = state.app!.page;
    this._offlineNote     = state.app!.snackbarOpened;
    this._offlineTxt      = state.app!.offline;
  }

  protected updated(changedProps:any) {
    if (changedProps.has('_page')) {
      const pageTitle:any = this._page;
      let txt:any = "";
      // if (this._page === "")  { txt = "" }
      updateMetadata({
        title: pageTitle,
        description: txt
        // This object also takes an image property, that points to an img src.
      });
    }
  }

private toggleDrawers() { store.dispatch( setDrawer() ) }
// @ts-ignore 
private _anon() { firebase.auth().signInAnonymously(); }

protected firstUpdated() {
  // ROUTER
  installRouter( (location) => { store.dispatch( navigate( decodeURIComponent(location.pathname) ) ) /*, setMetaTag('name', 'twitter:title', this. ) */ } );
  // OFFLINE
  installOfflineWatcher( (offline) => store.dispatch( updateOffline(offline) ) );
  // Initiate profile document data.
  _initializeData();
}

  static get styles():CSSResult  {
    return css`

        :host {
          box-sizing: border-box;
          --primary:    #4CAF50; /*#FF5F2D; /* #ff9501; */
        }
      /* svg{ margin: auto; width: 40px; height: 40px; } */

        /** VISIBILITY */
        user-drawer       { visibility: hidden; }
        user-drawer[on]   { visibility: visible; }

        svg {
          color:              #03a9f4; /*  #03a9f4; /** bisque */
          height:    28px;
          width:     28px;
        }

        #subscribe[backed] { background-color: transparent; }
        #subscribe  {
          background-color:             var(--primary); /* #03a9f4; */
         /* -webkit-text-stroke-width:    1px;
          -webkit-text-stroke-color:    #184A78;*/
          font-weight:                  800;
          color:                        whitesmoke;
          text-transform:               uppercase;
         }

        #subscribe {
          margin:         auto 3px auto auto;
          height:         36px;
          width:          80px;
          border:         2px solid var(--primary);
          border-radius:  8px;
        }

        #subscribe[on] {
          height:         42px;
          width:          42px;
          border:         0;
          border-radius:  50%;
        }
        
        /** DISPLAY */
        home-page, create-user,
        nav,
        .page,
        section           { display: none; }

        home-page[active], create-user[active],
        .page[active],
        section[active]   { display: grid; }
 

        nav[on]           { display: block; }

        /** FOCUS */
        a[selected]   { background-color: rgba(255,255,255, 0.9); }
        a[logo]:hover { background-color: lightgrey; }

        .top-actions   { display: grid; grid-template-columns: 1fr 32px 32px 32px; }

        .top-actions[on]   { display: none; }

        @media (max-width: 460px) { .google { font-size: .8em; } }

        /** LOGO MOBILE */
        @media only screen and (max-width: 768px) {
          header { padding: 20px; }
          .banner { grid-template-columns: 1fr; }
          #subscribe[on] {margin: auto;}
        }

        /** LOGO DESKTOP */
        @media only screen and (min-width: 768px) {
          header { padding: 30px; }
          .banner { grid-template-columns: 1fr 1fr; grid-gap: 16px;}
          .actions { display: none; }
          .slogan { margin: auto; }
          #subscribe[on] {
            margin-top:     auto;
            margin-bottom:  auto;
            margin-right:   0;
            margin-left:    auto;
          }
        }
        
        .toolbar-top {
          grid-template-columns:            180px 1fr 100px;
          -webkit-grid-template-columns:    180px 1fr 100px;
        }
    
        /** DESKTOP */
        @media only screen and (min-width: 600px) {

          .toolbar-top[user] {
            grid-template-columns:            180px 1fr 48px;
            -webkit-grid-template-columns:    180px 1fr 48px;
          }


          nav{ text-align: right; }
        }

        /** MOBILE */
        @media only screen and (max-width: 600px) {

          nav{ text-align: center;}
        
          .toolbar-top[user] {
            grid-template-columns:            180px 1fr 80px;
            -webkit-grid-template-columns:    180px 1fr 80px;
          }


          .google { font-size: .8em; }
        }

        .visual { animation: first 1s infinite ease-in-out; }

        @keyframes first {
          0%   {  left: 0; } 
          100% { right: 0; }
        }


        `
    }

protected render():TemplateResult {
    return html`
    
<!-- \?round="\${ this._page === "contractor" || this._page === "project" || this._page === "company" }" -->
<header
  style = "
    display:            grid;
    grid-gap:           20px;
    background-color:   #184A78;
    color:              #fff;
    box-shadow:         0 0 8px 0 rgba(0, 0, 0, 1);
    border-bottom:      1.5px solid #303030;
    border-radius:      0 0 8px 8px;">

  <!-- FIRST TOOLBAR -->
  <div
    class ="toolbar-top"
    ?user ="${this._user}"
    style = "
      display:  grid;">

    <!-- LOGO / HOME BUTTON -->
    <a
      logo  =""
      href  ="/"
      class ="logo"
      style = "
        text-decoration:  none;
        margin:           auto;

        background-image:   url('/images/logo--white.png');
        height:             48px;
        width:              180px;

        -webkit-background-size:  cover;
        -moz-background-size:     cover;
        -o-background-size:       cover;
        background-size:          cover;

        -moz-background-position: center;
        -o-background-position:   center;
        background-position:      center;"></a>

        <!-- ICON NAVIGATION BAR -->
        <span>
          <div
            class     = "top-actions"
            ?on       = "${ !this._user }"
            style="height: 100%;" >

            <span></span>

            <a
              href="/contractor#${this._id}"
              style="margin: auto;">
              ${profileIcon}
            </a>

            <a
              href="/profile"
              style="margin: auto;">
              ${settingsIcon}
            </a>

          </div>
        </span>

        <!-- LOGIN / MENU TOGGLE -->
        <button
          id          ="subscribe"
          @click      ="${ this.toggleDrawers }"
          ?on         ="${ this._user }"
          ?backed     ="${ this._user }"
          style = "
            display:              block;
            padding:              0;
            background-image:     url('${this._user ? this._photoURL : '' }');
            background-position:  center;
            background-repeat:    no-repeat; 
            background-size:      cover;
            box-shadow:           4px 4px 6px -3px #303030;"><!--  background-image: url('\${ this._user ? this._photoURL : '' }'); -->

            ${this._user ? html`  ` : html` Login ` }
        </button>

    </div> <!-- CLOSE FIRST TOOLBAR -->

    <!-- DRAWER -->
    <user-drawer ?on="${ this._drawer === true }"></user-drawer>

    <!-- OPEN SECOND TOOLBAR -->
    <div
      class="page"
      style="
        grid-template-columns:    1fr;
        padding:                  8px 0 0 0;"
      ?active = "${ this._page === 'network'}">

      <div
        class   = "banner"
        style="
          display: grid;
          grid-gap: 20px;">

        <div
          style="
            display:            grid;
            background-repeat:  no-repeat;
            background-size:    cover;
            border-radius:      8px;
            border:             1.5px solid grey;
            box-shadow:         0 4px 8px 0 rgba(0, 0, 0, 1);">
          <h2
            class = "slogan"
            style = "
              text-align:         center;
              color:              whitesmoke;
              border-radius:      10px;
              text-align:         center;
              backdrop-filter:    blur(2px);
              padding:            8px;
              text-shadow:        2px 2px black;">Chess<br />+<br />Tower Defense</h2>
        </div>

      </div>
    
    </div>

</header>

<!-- PAGES -->
<main id="main"
  style="
  display:              block;
  box-sizing:           border-box;
  -webkit-box-sizing:   border-box;
  padding:              0 14px;
  width:                100%;
  max-width:            1000px;
  min-height:           50vh;
  margin:               auto;
  margin-top:           14px;">
    

  <!-- APPLICATION PAGES -->

  <home-page                class="page" ?active="${ !this._user && this._page === 'home'}"></home-page>
  <contractors-questions    class="page" ?active="${ this._page === 'feedback' }"         ></contractors-questions>
  <reset-options            class="page" ?active="${ this._page === 'reset' }"            ></reset-options>
  <wrong-page               class="page" ?active="${ this._page === 'oops' }"             ></wrong-page>

  <!-- INPUT -->

  <contractor-profile
    class="page"
    ?active="${ this._page === 'settings'}"></contractor-profile>

  <!-- PUBLIC-->

  <public-profile
    class="page"
    ?active="${ this._page === 'profile'}"></public-profile>

</main>

<!-- FOOTER -->
<footer
  style="
    display:                grid;
    background-color:       #184A78;
    width:                  100%;
    text-align:             center;
    font-style:             italic;
    margin:                 32px 0 0 0;
    padding:                32px 0;
    box-shadow:             0 0 8px 0 rgba(0, 0, 0, 1);">

  <!-- LOGO -->
  <div>

    <a href="/" >
      <img
        src="/images/logo--white.png"
        style="
          width: 136px;" />
    </a>

    <p style="color: whitesmoke;">©copyright Modern Projects</p>

  </div>

  <div>

    <p>
      <a
        href="/feedback"
        style="
          color: whitesmoke;
          text-decoration: none;">Feedback</a>
    </p>

  </div>

</footer>

<!--OFFLINE -->
<snack-bar
  ?active="${ this._offlineNote }">You are now ${ this._offlineTxt ? 'offline' : 'online' }.</snack-bar>

    `;
  }
  
}
