import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageViewElement } from '../lazy-loader.js';

@customElement('reset-page')
export class ResetPage extends PageViewElement {
  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }

      h2 {
        margin: 0 0 12px;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <h2>Reset password</h2>
      <email-reset active></email-reset>
    `;
  }
}
