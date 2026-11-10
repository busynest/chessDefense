import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { firebaseConfigAttribute } from '../firebase-config.js';
import { PageViewElement } from '../lazy-loader.js';
import '../prefs/game-settings.js';

@customElement('account-page')
export class AccountPage extends PageViewElement {
  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }

      h2 {
        margin: 0 0 12px;
        color: #f5f5f5;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <h2>Account</h2>
      <game-settings></game-settings>
      <user-settings firebase-config=${firebaseConfigAttribute}></user-settings>
    `;
  }
}
