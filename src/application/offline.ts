import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('snack-bar')
export class SnackBar extends LitElement {
  @property({ type: Boolean })
  active = false;

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 12px;
        background: #f5f5f5;
        color: #212121;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        text-align: center;
        transform: translate3d(0, 100%, 0);
        visibility: hidden;
        transition: transform 0.2s, visibility 0.2s;
      }

      :host([active]) {
        visibility: visible;
        transform: translate3d(0, 0, 0);
      }

      @media (min-width: 460px) {
        :host {
          width: 320px;
          margin: auto;
        }
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
