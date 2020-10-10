import { customElement, html, LitElement, TemplateResult } from "lit-element";

@customElement('box-block')
export class BoxBlock extends LitElement {

  constructor() {
    super();
  }

  protected render():TemplateResult {
    return html`

    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  		<circle cx="100" cy="100" r="100"/>
    </svg>

  `
  }

}