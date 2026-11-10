import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageViewElement } from '../lazy-loader.js';

@customElement('contractors-privacy')
export class ContractorsPrivacy extends PageViewElement {
  static override get styles(): CSSResultGroup {
    return css`
      h2 {
        margin: 0;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <section>
        <h2>Privacy</h2>
        <p>
          This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from www.chessdefense.com (the “Site”).
        </p>
        <p>
          Please note that we do not alter our Site’s data collection and use practices when we see a Do Not Track signal from your browser.
        </p>
        <p>
          If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted.
        </p>
        <p>
          We may update this privacy policy from time to time in order to reflect changes to our practices or for other operational, legal, or regulatory reasons.
        </p>
        <p>The Site is not intended for individuals under the age of 18.</p>
      </section>
    `;
  }
}
