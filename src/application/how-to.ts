import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageViewElement } from '../lazy-loader.js';
import { BLOCKS, PIECES, SOLDIERS, SPELLS, WAVES } from '../game/units.js';
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
        <p>Towers stand on the chess starting squares for the whole match. They never move and never capture. Gold upgrades a tower to level 3, which hits harder and sends stronger soldiers. Every tower can be destroyed. Soldiers and Queen spells are what bring one down. Destroy the enemy King tower and you win. If both King towers fall on the same step, the match is a draw.</p>
        <table>
          <tr><th>Tower</th><th>Role</th><th>Life</th><th>Shot</th><th>Upgrade</th></tr>
          ${pieces.map((kind) => {
            const piece = PIECES[kind];
            return html`<tr>
              <td>${piece.label}</td>
              <td>${piece.role}</td>
              <td>${piece.hp}</td>
              <td>${piece.damage} every ${piece.attackTicks / 10}s, range ${piece.range}</td>
              <td>${piece.upgrade} gold, then ${Math.round(piece.upgrade * 1.6)}</td>
            </tr>`;
          })}
        </table>
      </section>
      <section>
        <h2>Soldiers</h2>
        <p>Each soldier leaves from the tower that built it, stepping out of that tower's own gate. If that tower is destroyed, its soldiers fade and no bounty is paid. A side that already has ${WAVES.soldierCap} soldiers out does not save the rest for later. Waves leave every living tower at once. The first march is ${WAVES.firstWaveTick / 10} seconds in, then every ${WAVES.gapTicks / 10} seconds. Later waves send more soldiers, with more life and strength. They walk the 16×16 grid toward the enemy King tower. Strength is the damage of one hit. Speed is cells per second. Walls cost ${BLOCKS.cost} gold, have ${BLOCKS.hp} life, and refund ${BLOCKS.refund}. White builds on the two ranks in front of the white pawns (army rows ${BLOCKS.zoneRows.white.join(', ')}). Black builds on the two ranks in front of the black pawns (army rows ${BLOCKS.zoneRows.black.join(', ')}). The center rows ${BLOCKS.centerRows.join(' and ')} never take a wall. Every row keeps at least one open cell, and a wall that seals every route is still rejected.</p>
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
          <li>Tap a tower to see its range and stats. Upgrade spends gold and stops at level 3. Repair spends gold to restore missing life, then waits 8 seconds. Overcharge, on a level 3 tower, costs 36 gold the first time and 28 more each time that same tower buys it again. The boost lasts 8 seconds and then waits 30.</li>
          <li>Tap an enemy tower, then Target or T. The next wave locks onto that tower until it falls. Clear, or T again, sends the wave back to the King. The mark is free.</li>
          <li>Keys: P or Space pauses, Escape pauses or cancels a wall, M returns to the menu, T targets the selected enemy tower, W toggles walls, U upgrades the selected tower, R repairs it, O overcharges it, and B, H, and L cast Blessing, Heal, and Blast.</li>
          <li>The wall button shades the two ranks in front of your towers. The gold strip across the middle is reserved. A green ghost is legal and a red ghost is not. Each row must keep a gap. Tap your own wall to sell it.</li>
          <li>Spell buttons sit in the panel. They stay quiet until you can afford them.</li>
          <li>Pause freezes the armies. Menu leaves the match.</li>
          <li>Versus AI, you are White. Easy spends spare gold on pawn upgrades and a few walls, and it repairs. Normal and Hard upgrade, place walls, repair, cast, and overcharge. Hard does it more often and prefers the strongest towers.</li>
          <li>Local play is simultaneous: both colors can upgrade, repair, overcharge, place walls, and cast on this screen while the armies march. Online, the host is White and runs the match. The guest is Black and sends those same orders. A guest cannot command White's towers.</li>
        </ul>
      </section>
    `;
  }
}
