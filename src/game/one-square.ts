import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('one-square')
export class OneSquare extends LitElement {
  _box(): void {
    this.setAttribute('style', 'background-color: brown;');
  }

  static override get styles(): CSSResultGroup {
    return css`
      .box {
        border-bottom: 2px dotted blue;
      }

      div {
        height: 100%;
        width: 100%;
      }

      div[pressed] {
        background-color: black;
      }

      slot {
        height: 100%;
        width: 100%;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`<div pressed id="box" @click=${this._box}></div>`;
  }
}
