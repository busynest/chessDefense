import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageViewElement } from '../lazy-loader.js';
import { PIECES, SOLDIERS, SPELLS } from '../game/units.js';
import type { PieceKind, SoldierKind, SpellId } from '../game/types.js';

@customElement('how-to-page')
export class HowToPage extends PageViewElement {
  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; color: #f5f5f5; }
      a { color: #f6d56a; }
      table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
      th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.15); }
      h1, h2 { margin: 0 0 8px; }
      section { display: grid; gap: 8px; margin-bottom: 18px; }
    `;
  }

  protected override render(): TemplateResult {
    const pieces = Object.keys(PIECES) as PieceKind[];
    const soldiers = Object.keys(SOLDIERS) as SoldierKind[];
    const spells = Object.keys(SPELLS) as SpellId[];
    return html`
      <section>
        <h1>How to play</h1>
        <p>Two medieval kings defend their towns on one board. The 8×8 squares are towers. Each square is split into four, and those 256 cells are where the armies march.</p>
        <p><a href="/">Back to the match</a></p>
      </section>
      <section>
        <h2>Towers</h2>
        <p>Towers start in the chess starting position and move by the real chess rules, slowly. A move spends gold and then the tower has to wait. Pieces cannot stack. Moving onto an enemy tower captures it. There is no castling, no en passant, and pawns do not promote. Every tower can be destroyed. Destroy the enemy King tower and you win.</p>
        <table>
          <tr><th>Tower</th><th>Each wave</th><th>Life</th><th>Move</th></tr>
          ${pieces.map((kind) => {
            const piece = PIECES[kind];
            return html`<tr>
              <td>${piece.label}</td>
              <td>${SOLDIERS[piece.soldier].label}</td>
              <td>${piece.hp}</td>
              <td>${piece.moveCost} gold, ${piece.moveTicks / 10}s</td>
            </tr>`;
          })}
        </table>
      </section>
      <section>
        <h2>Soldiers</h2>
        <p>Waves leave every living tower at once. The first march is 12 seconds in, then every 15 seconds. Later waves send more soldiers, with more life and strength. They walk the 16×16 grid toward the enemy King tower. Strength is the damage of one hit. Speed is cells per second. Walls cost 12 gold, have 28 life, and refund 6. White builds on the bottom half. Black builds on the top half.</p>
        <table>
          <tr><th>Soldier</th><th>Strength</th><th>Life</th><th>Speed</th><th>Range</th></tr>
          ${soldiers.map((kind) => {
            const soldier = SOLDIERS[kind];
            return html`<tr>
              <td>${soldier.label}</td>
              <td>${soldier.strength}</td>
              <td>${soldier.hp}</td>
              <td>${soldier.speed}</td>
              <td>${soldier.range}</td>
            </tr>`;
          })}
        </table>
      </section>
      <section>
        <h2>Queen magic</h2>
        <p>Only a living Queen can cast, and every spell is centered on her.</p>
        <ul>
          ${spells.map((spell) => html`<li><strong>${SPELLS[spell].label}</strong> (${SPELLS[spell].mana} mana) — ${SPELLS[spell].summary}</li>`)}
        </ul>
      </section>
      <section>
        <h2>Controls</h2>
        <ul>
          <li>Click or tap your tower, then a highlighted square. Green is a move, red is a capture.</li>
          <li>Spell buttons sit in the panel. They stay quiet until you can afford them.</li>
          <li>Pause freezes the armies. Menu leaves the match.</li>
          <li>Versus AI, you are White. Local play is simultaneous: both colors can be moved on this screen while the clock runs. Online, the host is White and runs the match; the guest is Black and sends orders to the host.</li>
        </ul>
      </section>
    `;
  }
}
