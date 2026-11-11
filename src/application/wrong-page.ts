import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageViewElement } from '../lazy-loader.js';

@customElement('wrong-page')
export class WrongPage extends PageViewElement {
  protected override render(): TemplateResult {
    return html`
      <section>
        <h2>Oops! You hit a 404</h2>
        <p>
          The page you're looking for doesn't seem to exist. Head back
          <a href="/">home</a> and try again?
        </p>
      </section>
    `;
  }
}
