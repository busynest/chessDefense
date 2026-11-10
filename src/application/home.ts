import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { firebaseConfigAttribute } from '../firebase-config.js';
import '../game/board-square.js';
import { connectStore, type RootState } from '../store.js';

@customElement('home-page')
export class HomePage extends connect(connectStore)(LitElement) {
  @property({ type: Boolean })
  signedIn = false;

  @property({ type: String })
  displayName = '';

  override stateChanged(state: RootState): void {
    const user = state.user.current;
    this.signedIn = user !== null;
    this.displayName = user?.displayName || user?.email || '';
  }

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: grid;
        gap: 16px;
      }

      h1, p {
        text-align: center;
      }

      .welcome {
        margin: 0;
        color: #d7e6c8;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <h1>Chess + Tower Defense</h1>
      <user-login firebase-config=${firebaseConfigAttribute}>
        <p slot="content" class="welcome">
          Signed in${this.displayName ? ` as ${this.displayName}` : ''}. The board is below.
        </p>
      </user-login>
      <board-square active></board-square>
    `;
  }
}
