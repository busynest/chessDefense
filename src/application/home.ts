import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '../game/chess-defense.js';

@customElement('home-page')
export class HomePage extends LitElement {
  @property({ type: Boolean }) active = false;

  protected override render(): TemplateResult {
    return html`<chess-defense ?active=${this.active}></chess-defense>`;
  }
}
