import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { db } from 'pwa-auth';

import { PageViewElement } from '../lazy-loader.js';
import { connectStore, type RootState } from '../store.js';

@customElement('contractors-questions')
export class ContractorsQuestions extends connect(connectStore)(PageViewElement) {
  @property({ type: Boolean })
  signedIn = false;

  @property({ type: String })
  photo = '';

  @property({ type: String })
  name = '';

  override stateChanged(state: RootState): void {
    const user = state.user.current;
    this.signedIn = user !== null;
    this.photo = user?.photoURL ?? '';
    this.name = user?.displayName || user?.email || '';
  }

  private async activateFeedback(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const text = form.querySelector('#texts') as HTMLTextAreaElement;

    if (!this.signedIn) {
      text.value = 'Please sign in';
      return;
    }

    try {
      await addDoc(collection(db, 'feedback'), {
        name: this.name,
        text: text.value,
        profilePicUrl: this.photo,
        timestamp: serverTimestamp(),
      });
      form.reset();
      text.value = 'Thank you!';
      text.disabled = true;
    } catch (error) {
      console.error('Error writing message', error);
    }
  }

  static override get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }

      h2 {
        margin: 0 0 8px;
      }

      textarea {
        box-sizing: border-box;
        width: 100%;
        min-height: 120px;
      }

      input[type='submit'] {
        box-sizing: border-box;
        width: 100%;
        margin: 8px 0;
        padding: 14px 20px;
        border: none;
        border-radius: 4px;
        background: #4caf50;
        color: white;
        cursor: pointer;
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <h2>Feedback</h2>
      <form @submit=${this.activateFeedback}>
        <p>Please leave your comments with us.</p>
        <textarea id="texts"></textarea>
        <input type="submit" value="Send" />
      </form>
    `;
  }
}
