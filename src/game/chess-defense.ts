import { LitElement, css, html, type CSSResultGroup, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { towerAt } from './chess.js';
import {
  applySnapshot,
  beginOnline,
  controlsSide,
  markRecord,
  openOnline,
  playBlock,
  playMove,
  playSpell,
  playUnblock,
  playerSide,
  setOnlineNote,
  setPlacing,
  showMenu,
  startLocal,
  tick,
  togglePause,
  type GameSliceState,
} from './game_state.js';
import { handleSpell } from './input.js';
import { createMatchDoc, joinMatchDoc, matchCode, publishSnapshot, readMatch, signedInUid, watchInputs, watchMatch } from './online.js';
import { loadCareer, recordResult } from './record.js';
import './board-square.js';
import { connectStore, store, type RootState } from '../store.js';
import type { Difficulty, GameState, PlayerCommand, Side, SpellId } from './types.js';
import { PIECES, SPELLS, squareName } from './units.js';
import type { Unsubscribe } from 'firebase/firestore';

@customElement('chess-defense')
export class ChessDefense extends connect(connectStore)(LitElement) {
  @property({ type: Boolean }) active = false;
  @state() private slice: GameSliceState | null = null;
  @state() private signedIn = false;
  @state() private career = '';
  @state() private difficulty: Difficulty = 'normal';
  @state() private joinValue = '';

  private raf = 0;
  private last = 0;
  private acc = 0;
  private code = '';
  private stopMatch: Unsubscribe | null = null;
  private stopInputs: Unsubscribe | null = null;
  private seen = new Set<string>();
  private lastPublish = -1;
  private saving = false;
  private careerUid = '';

  override stateChanged(state: RootState): void {
    this.slice = state.game;
    this.signedIn = state.user.current !== null;
    const uid = state.user.current?.uid ?? '';
    if (uid !== this.careerUid) {
      this.careerUid = uid;
      this.career = '';
      if (uid) void loadCareer(uid).then((record) => { this.career = `${record.wins}–${record.losses}–${record.draws}`; }).catch(() => { this.career = ''; });
    }
  }

  protected override updated(changed: PropertyValues): void {
    this.syncLoop();
    this.syncOnline();
    if (changed.has('slice') || changed.has('active')) void this.persist();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopLoop();
    this.teardown();
  }

  private syncLoop(): void {
    const running = this.active && this.slice?.game.status === 'playing' && this.slice.role !== 'guest';
    if (running && this.raf === 0) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.frame);
    }
    if (!running) this.stopLoop();
  }

  private stopLoop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.acc = 0;
  }

  private frame = (now: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.active || document.hidden) return;
    const slice = store.getState().game;
    if (slice.role === 'guest' || slice.game.status !== 'playing') return;
    if (this.last === 0) this.last = now;
    let delta = now - this.last;
    this.last = now;
    if (delta > 200) delta = 200;
    this.acc += delta;
    while (this.acc >= 100) {
      this.acc -= 100;
      store.dispatch(tick());
    }
  };

  private syncOnline(): void {
    const slice = store.getState().game;
    if (slice.onlineCode !== this.code) {
      this.teardown();
      this.code = slice.onlineCode;
      this.seen.clear();
      this.lastPublish = -1;
      if (this.code) {
        this.stopMatch = watchMatch(this.code, (data) => this.onMatch(data), (message) => store.dispatch(setOnlineNote(message)));
        if (slice.role === 'host') {
          this.stopInputs = watchInputs(this.code, (id, command) => this.onInput(id, command), (message) => store.dispatch(setOnlineNote(message)));
        }
      }
    }
    if (slice.role === 'host' && slice.game.status === 'playing' && slice.game.tick !== this.lastPublish && slice.game.tick % 5 === 0) {
      this.lastPublish = slice.game.tick;
      void publishSnapshot(slice.onlineCode, slice.game).catch((error: unknown) => {
        store.dispatch(setOnlineNote(error instanceof Error ? error.message : 'Could not sync the match.'));
      });
    }
  }

  private teardown(): void {
    this.stopMatch?.();
    this.stopInputs?.();
    this.stopMatch = null;
    this.stopInputs = null;
  }

  private onMatch(data: { guestId: string | null; snapshot?: GameState }): void {
    const slice = store.getState().game;
    if (slice.role === 'host' && data.guestId && slice.game.status === 'lobby') {
      store.dispatch(openOnline());
      void publishSnapshot(slice.onlineCode, store.getState().game.game);
    }
    if (slice.role === 'guest' && data.snapshot) store.dispatch(applySnapshot(data.snapshot));
  }

  private onInput(id: string, command: PlayerCommand): void {
    if (this.seen.has(id)) return;
    this.seen.add(id);
    if (store.getState().game.role !== 'host' || command.side !== 'black') return;
    if (command.type === 'move') {
      store.dispatch(playMove({
        from: { file: command.fromFile, rank: command.fromRank },
        to: { file: command.toFile, rank: command.toRank },
        side: 'black',
      }));
    } else if (command.type === 'spell') {
      store.dispatch(playSpell({ side: 'black', spell: command.spell }));
    } else if (command.type === 'block') {
      store.dispatch(playBlock({ side: 'black', x: command.x, y: command.y }));
    } else {
      store.dispatch(playUnblock({ side: 'black', x: command.x, y: command.y }));
    }
  }

  private async persist(): Promise<void> {
    const slice = store.getState().game;
    if (!this.active || slice.game.status !== 'victory' || slice.record !== 'idle' || this.saving) return;
    if (slice.game.mode === 'local') {
      store.dispatch(markRecord('skipped'));
      return;
    }
    const uid = store.getState().user.current?.uid;
    if (!uid) {
      store.dispatch(markRecord('skipped'));
      return;
    }
    const side = playerSide(slice);
    const winner = slice.game.winner;
    const result = winner === 'draw' || side === null ? 'draw' : winner === side ? 'win' : 'loss';
    this.saving = true;
    try {
      await recordResult(uid, result, slice.game.mode, slice.game.wave);
      store.dispatch(markRecord('saved'));
    } catch {
      store.dispatch(markRecord('error'));
    } finally {
      this.saving = false;
    }
  }

  private start(mode: 'ai' | 'local'): void {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1_000_000_000)) >>> 0 || 1;
    store.dispatch(startLocal({ mode, difficulty: this.difficulty, seed }));
  }

  private async host(): Promise<void> {
    const uid = signedInUid();
    if (!uid) {
      store.dispatch(setOnlineNote('Sign in before hosting a match.'));
      return;
    }
    const code = matchCode();
    const seed = (Date.now() ^ Math.floor(Math.random() * 1_000_000_000)) >>> 0 || 1;
    try {
      await createMatchDoc(code, uid, seed);
      store.dispatch(beginOnline({ seed, role: 'host', code }));
    } catch (error) {
      store.dispatch(setOnlineNote(error instanceof Error ? error.message : 'Could not create the match.'));
    }
  }

  private async join(): Promise<void> {
    const uid = signedInUid();
    if (!uid) {
      store.dispatch(setOnlineNote('Sign in before joining a match.'));
      return;
    }
    const code = this.joinValue.trim().toUpperCase();
    try {
      const data = await readMatch(code);
      if (data.hostId === uid) throw new Error('Open your own match from this browser, or share the code.');
      if (data.guestId && data.guestId !== uid) throw new Error('That match already has two players.');
      if (!data.guestId) await joinMatchDoc(code, uid);
      store.dispatch(beginOnline({ seed: data.seed, role: 'guest', code }));
    } catch (error) {
      store.dispatch(setOnlineNote(error instanceof Error ? error.message : 'Could not join the match.'));
    }
  }

  static override get styles(): CSSResultGroup {
    return css`
      :host { display: block; color: #f6efe2; }
      h1, h2 { font-family: Cinzel, Palatino, serif; letter-spacing: 0.04em; }
      h1 { margin: 0; text-align: center; font-size: 2.4rem; color: #f6e7a8; text-shadow: 0 2px 0 #2a160c; }
      .lede { text-align: center; margin: 6px 0 0; color: #e6d3b4; }
      .menu, .play { display: grid; gap: 14px; }
      .card, .hud, .end {
        background:
          linear-gradient(180deg, rgba(62, 42, 28, 0.92), rgba(22, 14, 10, 0.92));
        border: 1px solid #c4a574;
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
      }
      .choices, .spells, .row { display: flex; flex-wrap: wrap; gap: 8px; }
      button, .link {
        min-height: 44px;
        border-radius: 8px;
        border: 1px solid #e6c98a;
        padding: 0 14px;
        background: linear-gradient(#a24a36, #6d2c22);
        color: #fff6e8;
        font-family: Cinzel, Palatino, serif;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
      }
      button.quiet, .link { background: linear-gradient(#3d4e68, #243044); }
      button:disabled { opacity: 0.45; cursor: default; }
      label { display: grid; gap: 4px; font-size: 0.9rem; }
      select, input {
        min-height: 44px;
        border-radius: 8px;
        border: 1px solid #8d6b4a;
        padding: 0 10px;
        background: #2a211c;
        color: #f6efe2;
      }
      .note { min-height: 1.2em; color: #f6e7a8; }
      .play { align-items: start; }
      @media (min-width: 960px) {
        .play { grid-template-columns: 250px minmax(0, 1fr); }
      }
      .hud { display: grid; gap: 8px; }
      .gold { font-variant-numeric: tabular-nums; }
      .wave {
        font-family: Cinzel, Palatino, serif;
        color: #f6e7a8;
        font-size: 1.05rem;
      }
      .end {
        margin-top: 12px;
        text-align: center;
      }
      .banner { text-align: center; min-height: 1.2em; color: #f6e7a8; font-family: Cinzel, Palatino, serif; }
    `;
  }

  protected override render(): TemplateResult {
    const slice = this.slice;
    if (!slice) return html``;
    if (slice.game.status === 'menu') return this.menu(slice);
    return html`
      <div class="play">
        ${this.hud(slice)}
        <div>
          <p class="banner">${slice.game.banner?.text ?? ''}</p>
          <board-square></board-square>
          ${slice.game.status === 'victory' ? this.victory(slice) : ''}
        </div>
      </div>
    `;
  }

  private menu(slice: GameSliceState): TemplateResult {
    return html`
      <section class="menu">
        <h1>Chess Defense</h1>
        <p style="text-align:center; margin:0;">Two kings. One board. Towers move like chess. Their armies do not.</p>
        <div class="card">
          <div class="choices">
            <label>AI
              <select .value=${this.difficulty} @change=${(event: Event) => { this.difficulty = (event.target as HTMLSelectElement).value as Difficulty; }}>
                <option value="easy">Easy</option>
                <option value="normal" selected>Normal</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <button type="button" @click=${() => this.start('ai')}>Play vs AI</button>
            <button type="button" class="quiet" @click=${() => this.start('local')}>Local 2 player</button>
            <a class="link" href="/how-to">How to play</a>
          </div>
        </div>
        <div class="card">
          <strong>Online 1v1</strong>
          <p>Sign in, then host a code or join one. The host runs the match. You play White when you host, Black when you join.</p>
          <div class="row">
            <button type="button" @click=${() => this.host()}>Host match</button>
            <input .value=${this.joinValue} @input=${(event: Event) => { this.joinValue = (event.target as HTMLInputElement).value; }} placeholder="Code" maxlength="4" aria-label="Match code" />
            <button type="button" class="quiet" @click=${() => this.join()}>Join</button>
          </div>
          <p class="note">${slice.onlineNote}</p>
          <p>${this.signedIn ? `Record ${this.career || '…'}` : 'Sign in with the Login button to save wins and losses.'}</p>
        </div>
      </section>
    `;
  }

  private hud(slice: GameSliceState): TemplateResult {
    const game = slice.game;
    const selected = slice.selected ? towerAt(game, slice.selected.file, slice.selected.rank) : undefined;
    const remain = Math.max(0, (game.nextWaveTick - game.tick) * 0.1);
    const waveLabel = game.wave === 0
      ? `Build · wave 1 in ${remain.toFixed(0)}s`
      : `Wave ${game.wave} · next ${remain.toFixed(0)}s`;
    const sides: Side[] = game.mode === 'local' ? ['white', 'black'] : [playerSide(slice) ?? 'white'];
    return html`
      <aside class="hud">
        <div class="row">
          <button type="button" class="quiet" @click=${() => store.dispatch(togglePause())} ?disabled=${game.status === 'lobby' || game.status === 'victory'}>
            ${game.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button type="button" class="quiet" @click=${() => store.dispatch(showMenu())}>Menu</button>
        </div>
        <div class="wave">${waveLabel}</div>
        <div class="row">
          ${sides.map((side) => html`
            <button
              type="button"
              class=${slice.placing === side ? '' : 'quiet'}
              @click=${() => store.dispatch(setPlacing(slice.placing === side ? null : side))}>
              ${side === 'white' ? 'White walls' : 'Black walls'}
            </button>
          `)}
        </div>
        ${game.mode === 'online' ? html`<div>Code <strong>${slice.onlineCode}</strong> · ${slice.role === 'host' ? 'White' : 'Black'}</div>` : ''}
        <p class="note">${slice.onlineNote}</p>
        ${(['white', 'black'] as const).map((side) => html`
          <div class="gold">${side === 'white' ? 'White' : 'Black'} ${Math.floor(game.gold[side])} gold · ${Math.floor(game.mana[side])} mana</div>
        `)}
        ${selected ? html`
          <div>
            <strong>${selected.side} ${PIECES[selected.kind].label}</strong>
            ${squareName(selected.file, selected.rank)}
            · ${Math.ceil(selected.hp)}/${selected.maxHp}
            · ${selected.moveReadyTick <= game.tick ? `move ${PIECES[selected.kind].moveCost}g` : `walks ${(Math.max(0, selected.moveReadyTick - game.tick) * 0.1).toFixed(1)}s`}
          </div>
        ` : html`<div>Select one of your towers, then a highlighted square.</div>`}
        ${sides.map((side) => this.spells(slice, side))}
      </aside>
    `;
  }

  private spells(slice: GameSliceState, side: Side): TemplateResult {
    const game = slice.game;
    const queen = game.towers.some((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0);
    const allowed = controlsSide(slice, side);
    return html`
      <div class="spells">
        ${(['blessing', 'heal', 'blast'] as SpellId[]).map((spell) => html`
          <button
            type="button"
            ?disabled=${!allowed || !queen || game.mana[side] < SPELLS[spell].mana}
            title=${SPELLS[spell].summary}
            @click=${() => handleSpell(side, spell)}>
            ${side === 'black' && slice.game.mode === 'local' ? 'B ' : ''}${SPELLS[spell].label} ${SPELLS[spell].mana}
          </button>
        `)}
      </div>
    `;
  }

  private victory(slice: GameSliceState): TemplateResult {
    const winner = slice.game.winner;
    const text = winner === 'draw' ? 'Draw' : winner === 'white' ? 'White wins' : 'Black wins';
    const saved = slice.record === 'saved' ? 'Record saved.' : slice.record === 'error' ? 'Could not save the record.' : '';
    return html`
      <div class="end">
        <h2>${text}</h2>
        <p>${winner === 'draw' ? 'Both King towers fell together.' : 'The enemy King tower has fallen.'} Wave ${slice.game.wave}. ${saved}</p>
        <div class="row" style="justify-content:center;">
          ${slice.game.mode === 'online'
            ? html`<button type="button" @click=${() => store.dispatch(showMenu())}>Back to menu</button>`
            : html`<button type="button" @click=${() => this.start(slice.game.mode === 'local' ? 'local' : 'ai')}>Rematch</button>`}
        </div>
      </div>
    `;
  }
}
