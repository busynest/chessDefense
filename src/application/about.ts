import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageViewElement } from '../lazy-loader.js';

@customElement('about-page')
export class AboutPage extends PageViewElement {
  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; color: #f6efe2; }
      a { color: #f6d56a; }
      h1 { font-family: Cinzel, Palatino, serif; }
      section { display: grid; gap: 10px; max-width: 40rem; }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <section>
        <h1>About</h1>
        <p>Chess Defense is a tower-defense game played on a chessboard. The pieces are towers. They never move. Their soldiers march on the 16×16 grid between the towns.</p>
        <p>The board, the piece pictures, and the sound are original. Cinzel and Spectral are served by Google Fonts under the SIL Open Font License.</p>
        <p>Sign in to keep a win-loss record on this browser's Firebase emulators, or on the live project when the site is hosted. Local and versus-AI matches can be played signed out.</p>
        <p><a href="/">Back to the match</a> · <a href="/how-to">How to play</a></p>
      </section>
    `;
  }
}
