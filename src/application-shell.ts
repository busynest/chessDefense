import { LitElement, css, html, type CSSResultGroup, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';
import { installRouter } from 'pwa-helpers/router.js';

import './auth.js';
import 'pwa-auth';

import { navigate, updateOffline } from './application/application_state.js';
import { firebaseConfigAttribute } from './firebase-config.js';
import { connectStore, store, type RootState } from './store.js';
import './application/offline.js';
import './application/battlefield.js';

const pageTitles: Record<string, string> = {
  home: 'Chess Defense',
  feedback: 'Feedback',
  'how-to': 'How to play',
  settings: 'Settings',
  profile: 'Profile',
  reset: 'Reset password',
  privacy: 'Privacy',
  oops: 'Not found',
};

@customElement('application-shell')
export class ApplicationShell extends connect(connectStore)(LitElement) {
  @property({ type: String })
  page = '';

  @property({ type: Boolean })
  offlineNote = false;

  @property({ type: Boolean })
  offline = false;

  override stateChanged(state: RootState): void {
    this.page = state.app.page;
    this.offlineNote = state.app.snackbarOpened;
    this.offline = state.app.offline;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('page')) {
      const title = pageTitles[this.page] ?? 'Chess Defense';
      updateMetadata({
        title,
        description: 'ChessDefense is a new type of game, a cross between chess and tower defense.',
      });
    }
  }

  protected override firstUpdated(): void {
    installRouter((location) => {
      store.dispatch(navigate(decodeURIComponent(location.pathname)));
    });
    installOfflineWatcher((offline) => {
      store.dispatch(updateOffline(offline));
    });
  }

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        position: relative;
        box-sizing: border-box;
        max-width: 100%;
        min-height: 100vh;
        color: #f6efe2;
        font-family: Spectral, Palatino, "Palatino Linotype", serif;
        --pwa_inset: 12px;
        --pwa_max_width: 420px;
        --pwa_background: #1c1612;
        --pwa_input_background_color: #2a211c;
        --pwa_drawer_text_color: #f3e6cf;
        --pwa_label_text_color: #f3e6cf;
        --pwa_header_color: #f6e7a8;
        --pwa_line_color: #6b5344;
        --pwa_input_border_color: #8d6b4a;
        --pwa_action_background_color: #8c3a2a;
        --pwa_action_border_color: #5c2418;
        --pwa_action_text_color: #fff6e8;
        --pwa_icon_background_color: #8c3a2a;
        --pwa_icon_hover_color: #5c2418;
        --pwa_focus: #f6e7a8;
      }

      war-field { position: absolute; inset: 0; }

      header, main, footer { position: relative; z-index: 1; }

      header {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: linear-gradient(180deg, #3a2418, #1a100c);
        border-bottom: 1px solid #c4a574;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
        text-decoration: none;
        font-weight: 800;
      }

      .logo img {
        width: 48px;
        height: 48px;
        border-radius: 8px;
      }

      nav {
        display: flex;
        gap: 14px;
      }

      nav a {
        color: #fff;
        text-decoration: none;
        font-weight: 700;
      }

      main {
        box-sizing: border-box;
        width: 100%;
        max-width: 1100px;
        min-height: 50vh;
        margin: 16px auto;
        padding: 0 14px;
      }

      .page {
        display: none;
      }

      .page[active] {
        display: block;
      }

      footer {
        display: grid;
        justify-items: center;
        gap: 8px;
        margin-top: 32px;
        padding: 32px 16px;
        background: linear-gradient(180deg, transparent, rgba(12, 8, 6, 0.72));
        text-align: center;
      }

      footer a {
        color: #f5f5f5;
        text-decoration: none;
      }

      footer img {
        width: 72px;
        height: 72px;
      }

      @media (max-width: 640px) {
        header {
          gap: 8px;
          padding: 10px 12px;
        }
        .logo {
          font-size: 0.95rem;
          white-space: nowrap;
        }
        .logo img {
          width: 36px;
          height: 36px;
        }
        nav {
          gap: 8px;
          font-size: 0.9rem;
        }
      }
    `;
  }

  protected override render(): TemplateResult {
    const config = firebaseConfigAttribute;
    return html`
      <war-field></war-field>
      <header>
        <a class="logo" href="/">
          <img src="/images/manifest/logo-192.png" alt="" />
          Chess Defense
        </a>
        <nav>
          <a href="/settings">Settings</a>
          <a href="/feedback">Feedback</a>
        </nav>
        <user-icon firebase-config=${config}></user-icon>
      </header>

      <user-drawer firebase-config=${config} url="/settings">
        <a slot="before" href="/how-to">How to play</a>
        <a href="/feedback">Feedback</a>
        <a href="/privacy">Privacy</a>
        <a href="/reset">Reset password</a>
      </user-drawer>

      <main>
        <home-page class="page" ?active=${this.page === 'home'}></home-page>
        <how-to-page class="page" ?active=${this.page === 'how-to'}></how-to-page>
        <contractors-questions class="page" ?active=${this.page === 'feedback'}></contractors-questions>
        <account-page class="page" ?active=${this.page === 'settings' || this.page === 'profile'}></account-page>
        <reset-page class="page" ?active=${this.page === 'reset'}></reset-page>
        <contractors-privacy class="page" ?active=${this.page === 'privacy'}></contractors-privacy>
        <wrong-page class="page" ?active=${this.page === 'oops'}></wrong-page>
      </main>

      <footer>
        <a href="/">
          <img src="/images/manifest/logo-192.png" alt="" />
        </a>
        <p>© Modern Projects</p>
        <p><a href="/how-to">How to play</a> · <a href="/feedback">Feedback</a> · <a href="/privacy">Privacy</a></p>
      </footer>

      <snack-bar ?active=${this.offlineNote}>
        You are now ${this.offline ? 'offline' : 'online'}.
      </snack-bar>
    `;
  }
}
