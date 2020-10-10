var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, css } from 'lit-element';
import { customElement } from "lit-element/lib/decorators.js";
import { PageViewElement } from '../lazy-loader';
let ContractorsPrivacy = class ContractorsPrivacy extends PageViewElement {
    static get styles() {
        return css `
      h2 { margin: 0; }
      `;
    }
    render() {
        return html `
        <section
         style="
          border-radius:          8px;
          -webkit-border-radius:  8px;
          background:             transparent;
          margin-right:           auto;
          margin-left:            auto;"> 

          <h2>Privacy Privacy</h2>

          <p>
            This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from www.contractorscentre.com (the “Site”).
          </p>

          <p>
            DO NOT TRACK
            Please note that we do not alter our Site’s data collection and use practices when we see a Do Not Track signal from your browser.
          </p>

          <p>
            YOUR RIGHTS
            If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.

            Additionally, if you are a European resident we note that we are processing your information in order to fulfill contracts we might have with you (for example if you make an order through the Site), or otherwise to pursue our legitimate business interests listed above. Additionally, please note that your information will be transferred outside of Europe, including to Canada and the United States.
          </p>

          <p>
            DATA RETENTION
            When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
          </p>

          <p>
            CHANGES
            We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.
          </p>

          <p>
            MINORS
            The Site is not intended for individuals under the age of 18.
          </p>

        </section>
        
      `;
    }
};
ContractorsPrivacy = __decorate([
    customElement('contractors-privacy')
], ContractorsPrivacy);
export { ContractorsPrivacy };
