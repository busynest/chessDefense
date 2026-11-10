import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

/** Dusk battlefield behind the war table. Decorative only. */
@customElement('war-field')
export class WarField extends LitElement {
  static override get styles(): CSSResultGroup {
    return css`
      :host {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        background:
          radial-gradient(ellipse at 50% 100%, rgba(120, 50, 20, 0.45), transparent 46%),
          linear-gradient(180deg, #24160f 0%, #3a2418 38%, #1a100c 72%, #0d0907 100%);
      }
      .ridge {
        position: absolute;
        left: -10%;
        right: -10%;
        bottom: 18%;
        height: 28%;
        background:
          linear-gradient(180deg, transparent, rgba(8, 5, 4, 0.2)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200' preserveAspectRatio='none'><path d='M0 160 L40 120 L90 150 L140 70 L190 140 L250 40 L310 130 L370 80 L430 150 L500 30 L560 120 L620 90 L680 150 L740 60 L800 140 L800 200 L0 200 Z' fill='%23140e0b'/></svg>");
        background-size: 100% 100%;
        opacity: 0.9;
      }
      .castle {
        position: absolute;
        bottom: 34%;
        width: 70px;
        height: 48px;
        background: #100c0a;
        clip-path: polygon(0 100%, 0 40%, 12% 40%, 12% 18%, 22% 18%, 22% 40%, 40% 40%, 50% 8%, 60% 40%, 78% 40%, 78% 16%, 88% 16%, 88% 40%, 100% 40%, 100% 100%);
        opacity: 0.85;
      }
      .castle.left { left: 12%; }
      .castle.right { right: 14%; transform: scaleX(-1); }
      .fog {
        position: absolute;
        left: -20%;
        right: -20%;
        bottom: 8%;
        height: 24%;
        background: radial-gradient(ellipse at 50% 50%, rgba(210, 190, 170, 0.16), transparent 70%);
        animation: drift 28s linear infinite;
      }
      .ember {
        position: absolute;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: #ffb15a;
        box-shadow: 0 0 6px #ff8a2a;
        animation: rise 7s linear infinite;
      }
      .ember:nth-child(1) { left: 18%; bottom: 20%; animation-duration: 6s; }
      .ember:nth-child(2) { left: 46%; bottom: 12%; animation-duration: 8s; animation-delay: 1s; }
      .ember:nth-child(3) { left: 72%; bottom: 18%; animation-duration: 5.5s; animation-delay: 2s; }
      .torch {
        position: absolute;
        bottom: 22%;
        width: 8px;
        height: 16px;
        background: radial-gradient(circle, #ffe1a0, #ff7a1a 60%, transparent 70%);
        animation: flicker 1.6s ease-in-out infinite;
      }
      .torch.left { left: 8%; }
      .torch.right { right: 8%; }
      @keyframes drift { 50% { transform: translateX(4%); } }
      @keyframes rise { to { transform: translateY(-120px); opacity: 0; } }
      @keyframes flicker { 50% { opacity: 0.55; transform: scale(0.92); } }
      @media (prefers-reduced-motion: reduce) {
        .fog, .ember, .torch { animation: none; }
      }
      @media (max-width: 700px) {
        .castle { width: 46px; height: 32px; bottom: 42%; }
        .ridge { bottom: 28%; }
      }
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <div class="ridge"></div>
      <div class="castle left"></div>
      <div class="castle right"></div>
      <div class="fog"></div>
      <i class="ember"></i>
      <i class="ember"></i>
      <i class="ember"></i>
      <i class="torch left"></i>
      <i class="torch right"></i>
    `;
  }
}
