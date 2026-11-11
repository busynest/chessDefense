import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/** A stone barricade. Cracks open as its life falls. */
@customElement('box-block')
export class BoxBlock extends LitElement {
  @property({ type: Number }) ratio = 1;

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; width: 100%; height: 100%; pointer-events: none; }
      svg { width: 100%; height: 100%; }
    `;
  }

  protected override render(): TemplateResult {
    const worn = this.ratio < 0.66;
    const broken = this.ratio < 0.34;
    return html`
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#8d8478"></stop>
            <stop offset="1" stop-color="#4e463e"></stop>
          </linearGradient>
        </defs>
        <rect x="3" y="8" width="34" height="26" rx="2" fill="url(#wall)" stroke="#2a241e" stroke-width="2"></rect>
        <path d="M3 16h34M3 24h34" stroke="#2a241e" stroke-width="1.2" opacity="0.7"></path>
        ${worn ? html`<path d="M12 10 L18 20 L14 32" fill="none" stroke="#1a120c" stroke-width="1.4"></path>` : ''}
        ${broken ? html`<path d="M24 9 L22 22 L30 33" fill="none" stroke="#1a120c" stroke-width="1.6"></path>` : ''}
      </svg>
    `;
  }
}
