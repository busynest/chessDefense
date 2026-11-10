import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

/** A neutral obstacle on one cell of the 256-grid. */
@customElement('box-block')
export class BoxBlock extends LitElement {
  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; width: 100%; height: 100%; pointer-events: none; }
      svg { width: 100%; height: 100%; }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="4" y="6" width="32" height="28" rx="3" fill="#6d6256" stroke="#2c261f" stroke-width="2"></rect>
        <path d="M8 16h24M8 24h24M16 8v24M24 8v24" stroke="#3e362e" stroke-width="1.5"></path>
      </svg>
    `;
  }
}
