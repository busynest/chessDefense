import { LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

/** A page that renders only while `active` is set. */
export class PageViewElement extends LitElement {
  @property({ type: Boolean })
  active = false;

  protected override shouldUpdate(_changed: PropertyValues): boolean {
    return this.active;
  }
}
