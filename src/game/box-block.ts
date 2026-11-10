import { LitElement, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('box-block')
export class BoxBlock extends LitElement {
  protected override render(): TemplateResult {
    return html`
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="100" />
      </svg>
    `;
  }
}
