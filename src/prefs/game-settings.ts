import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { setMuted, setPalette, setVolume } from './prefs_state.js';
import { connectStore, store, type RootState } from '../store.js';

@customElement('game-settings')
export class GameSettings extends connect(connectStore)(LitElement) {
  @state() private muted = false;
  @state() private volume = 0.5;
  @state() private palette: 'classic' | 'bright' = 'classic';

  override stateChanged(state: RootState): void {
    this.muted = state.prefs.muted;
    this.volume = state.prefs.volume;
    this.palette = state.prefs.palette;
  }

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: grid; gap: 10px; color: #f6efe2; margin: 12px 0 20px; }
      label { display: grid; gap: 4px; }
      input { width: min(280px, 100%); }
      button {
        justify-self: start;
        min-height: 44px;
        border-radius: 8px;
        border: 1px solid #e6c98a;
        padding: 0 14px;
        background: #3d4e68;
        color: #fff6e8;
        font-family: Cinzel, Palatino, serif;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <h2>Sound</h2>
      <p>Tones are synthesized in the browser. Nothing is streamed.</p>
      <label>Volume
        <input
          type="range"
          min="0"
          max="100"
          .value=${String(Math.round(this.volume * 100))}
          @input=${(event: Event) => store.dispatch(setVolume(Number((event.target as HTMLInputElement).value) / 100))} />
      </label>
      <button type="button" @click=${() => store.dispatch(setMuted(!this.muted))}>${this.muted ? 'Unmute' : 'Mute'}</button>
      <h2>Teams</h2>
      <p>Bright uses blue and orange, with a circle on White and a diamond on Black.</p>
      <button type="button" @click=${() => store.dispatch(setPalette(this.palette === 'bright' ? 'classic' : 'bright'))}>${this.palette === 'bright' ? 'Classic colors' : 'Bright colors'}</button>
    `;
  }
}
