
import { html, TemplateResult } from 'lit-element';
import { customElement } from "lit-element/lib/decorators.js"
import { PageViewElement }    from '../lazy-loader';

@customElement('wrong-page')
export class WrongPage extends PageViewElement {

  protected render():TemplateResult {
    return html`

      <section
        style="
          border-radius:          8px;
          -webkit-border-radius:  8px;
          background:             transparent;
          margin-right:           auto;
          margin-left:            auto;">
        <h2>Oops! You hit a 404</h2>
        <p>The page you're looking for doesn't seem to exist. Head back
            <a href="/">home</a> and try again?
        </p>
      </section>

    `
  }
}