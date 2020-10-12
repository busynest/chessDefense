import { html, css, customElement, property, LitElement, TemplateResult, CSSResult }   from 'lit-element';
import { connect }            from 'pwa-helpers/connect-mixin';
import { store, RootState }   from '../store';
import { changeTopic }        from './settings_state';

@customElement('setting-titles')
export class SettingTitles extends connect(store)(LitElement) {

@property({ type: String }) private aboutTopic:any = '';

protected firstUpdated(){
  this.shadowRoot!.querySelector("#learn")!.addEventListener('change', (e: any) => { console.log('e:', e.target.value); store.dispatch( changeTopic(e.target.value) ); /* this.aboutChanged( e.target.value ); */ })
}


stateChanged(state: RootState) {
  this.aboutTopic = state.settings!.topic;
}


static get styles():CSSResult {
  return css`
    label > input { display: none; }

    .topButton {
      color:                    grey;
      /*margin: 0 auto;*/
      font-weight:              800;
      font-size:                .7em;
      border-bottom: solid 1px grey;
      padding-top: 2px;
    }
    
    .topButton[on] {
      /*background-color: #A8D5BA;*/
      color: black ;
      border: 1px solid lightseagreen;
      border-top: 2px solid lightseagreen;
      border-bottom: 0;
      border-radius: 8px 8px 0 0;
    }
    /*.topButton[on] > p {
margin-bottom: 2px;
    }*/
    
    .topButton:hover {
      cursor: pointer;
    }
    
    .topButton > p {
      margin: 0 auto;
      text-align: center;
    }
    
    @media (min-width: 480px) {
      .topButton { font-size:  .9em; }
    }
    label:nth-child(1) {
     /* background-color: rgb(0,255,36);*/
    }
/*
    label     { transform: skew(30deg); }
    label > p { transform: skew(-30deg); }
*/
    `
}
/*
private aboutChanged(e: any) {
  console.log('e:', e);
  store.dispatch( changeTopic(e) );
}
*/
protected render():TemplateResult {
  return html`
  <nav>

    <form
      id="learn"
      style="
        display: grid;
        grid-template-columns: 1fr 1fr;">

      <!-- OPTION #2 -->
      <label
        form="learn"
        name="topic"
        class="topButton"
        ?on="${ this.aboutTopic === 'account' }">

        <input
          type="radio"
          name="learn"
          value="account"
          ?checked="${ this.aboutTopic === 'account' }">

        <p>Account</p>
          
      </label>

      <!-- OPTION #1 -->
      <label
        form="learn"
        name="topic"
        class="topButton"
        ?on="${ this.aboutTopic === 'individual'}">

        <input
          type="radio"
          name="learn"
          value="individual"
          ?checked="${ this.aboutTopic === 'individual' }" />

        <p>Profile</p>

      </label>
  
    </form>

  </nav>
    `;
  }
}