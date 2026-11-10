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
  playAim,
  playBlock,
  playUpgrade,
  playRepair,
  playOvercharge,
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
import { handleAim, handleOvercharge, handleRepair, handleSpell, handleUpgrade } from './input.js';
import { rememberMatch, recentMatches } from './history.js';
import { closeMatch, createMatchDoc, joinMatchDoc, matchCode, publishSnapshot, readMatch, signedInUid, watchInputs, watchMatch } from './online.js';
import { shouldPublish } from './publish.js';
import { loadCareer, recordResult } from './record.js';
import { playTap, playVictory, playWave } from './sound.js';
import './board-square.js';
import { markTutorial, setDifficulty, setMuted } from '../prefs/prefs_state.js';
import { connectStore, store, type RootState } from '../store.js';
import type { Difficulty, GameState, PlayerCommand, Side, SpellId } from './types.js';
import { PIECES, SPELLS, combatOf, overchargeCost, overcharged, repairCost, squareName, upgradeCost } from './units.js';
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
  private heardWave = -1;
  private heardEnd = false;
  @state() private tutorial = -1;
  @state() private muted = false;

  private readonly steps = [
    'Tap one of your pawns. The ring is its range. Towers never move.',
    'Upgrade spends gold. Level 3 is as high as a tower goes.',
    'White walls shades the two ranks in front of your towers. The gold strip in the middle stays open. A green cell can take a block, and a red cell cannot. Each row keeps a gap.',
    'When the build timer ends, each living tower sends its soldier out of its own gate. If the tower falls, those soldiers fade with it.',
    'Tap an enemy tower and press T. The next wave marches on it. Clear sends them back to the King.',
    'Spell buttons belong to the Queen. Pause freezes the clock. Menu leaves the match.',
  ];

  override stateChanged(state: RootState): void {
    this.slice = state.game;
    this.difficulty = state.prefs.difficulty;
    this.muted = state.prefs.muted;
    this.signedIn = state.user.current !== null;
    const uid = state.user.current?.uid ?? '';
    if (uid !== this.careerUid) {
      this.careerUid = uid;
      this.career = '';
      if (uid) void loadCareer(uid).then((record) => { this.career = `${record.wins}–${record.losses}–${record.draws}`; }).catch(() => { this.career = ''; });
    }
  }

  protected override firstUpdated(): void {
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('pagehide', this.abandonIfHost);
  }

  protected override updated(changed: PropertyValues): void {
    this.syncLoop();
    this.syncOnline();
    this.syncSound();
    if (changed.has('slice') || changed.has('active')) void this.persist();
  }

  override disconnectedCallback(): void {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('pagehide', this.abandonIfHost);
    super.disconnectedCallback();
    this.stopLoop();
    this.teardown();
  }

  private onKey = (event: KeyboardEvent): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    const slice = store.getState().game;
    if (slice.game.status === 'menu') return;
    const key = event.key.toLowerCase();
    if (key === 'p' || event.key === ' ') {
      event.preventDefault();
      if (slice.game.status === 'playing' || slice.game.status === 'paused') store.dispatch(togglePause());
      return;
    }
    if (key === 'escape') {
      if (slice.placing) store.dispatch(setPlacing(null));
      else if (slice.game.status === 'playing' || slice.game.status === 'paused') store.dispatch(togglePause());
      return;
    }
    if (key === 'm') {
      this.leave();
      return;
    }
    if (slice.game.status !== 'playing') return;
    const side = playerSide(slice);
    if (!side) return;
    const selected = slice.selected;
    if (key === 'w') {
      store.dispatch(setPlacing(slice.placing === side ? null : side));
    } else if (selected && key === 'u') {
      handleUpgrade(side, selected.file, selected.rank);
    } else if (selected && key === 'r') {
      handleRepair(side, selected.file, selected.rank);
    } else if (selected && key === 'o') {
      handleOvercharge(side, selected.file, selected.rank);
    } else if (key === 'b') {
      handleSpell(side, 'blessing');
    } else if (key === 'h') {
      handleSpell(side, 'heal');
    } else if (key === 'l') {
      handleSpell(side, 'blast');
    } else if (key === 't' && selected) {
      const marked = towerAt(slice.game, selected.file, selected.rank);
      if (!marked) return;
      const attacker: Side = marked.side === 'white' ? 'black' : 'white';
      if (!controlsSide(slice, attacker)) return;
      const current = slice.game.waveTarget[attacker];
      if (current && current.file === marked.file && current.rank === marked.rank) handleAim(attacker, -1, -1);
      else handleAim(attacker, marked.file, marked.rank);
    }
  };

  private abandonIfHost = (): void => {
    const slice = store.getState().game;
    if (slice.role !== 'host' || !slice.onlineCode) return;
    if (slice.game.status === 'victory' || slice.game.status === 'menu') return;
    void closeMatch(slice.onlineCode).catch(() => undefined);
  };

  private leave(): void {
    this.abandonIfHost();
    this.tutorial = -1;
    store.dispatch(showMenu());
  }

  private syncSound(): void {
    const game = this.slice?.game;
    if (!game || game.status === 'menu') {
      this.heardWave = -1;
      this.heardEnd = false;
      return;
    }
    if (game.wave > 0 && game.wave !== this.heardWave) {
      this.heardWave = game.wave;
      playWave();
    }
    if (game.status === 'victory' && !this.heardEnd) {
      this.heardEnd = true;
      playVictory();
    }
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
    if (slice.role === 'host' && shouldPublish(slice.game.status, slice.game.tick, this.lastPublish)) {
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

  private onMatch(data: { guestId: string | null; status?: string; snapshot?: GameState }): void {
    const slice = store.getState().game;
    if (slice.role === 'host' && data.guestId && slice.game.status === 'lobby') {
      store.dispatch(openOnline());
      const live = store.getState().game.game;
      void publishSnapshot(slice.onlineCode, live).catch((error: unknown) => {
        store.dispatch(setOnlineNote(error instanceof Error ? error.message : 'Could not open the match.'));
      });
    }
    if (slice.role === 'guest' && data.status === 'abandoned') {
      store.dispatch(setOnlineNote('The host left the match.'));
    }
    if (slice.role === 'guest' && data.snapshot) {
      store.dispatch(applySnapshot(data.snapshot));
      const status = data.status === 'abandoned' ? 'abandoned' : data.snapshot.status;
      const note = status === 'abandoned'
        ? 'The host left the match.'
        : status === 'victory'
          ? (data.snapshot.winner === 'black' ? 'Black won.' : data.snapshot.winner === 'white' ? 'White won.' : 'Draw.')
          : status === 'playing' ? 'Match live.' : '';
      if (note) store.dispatch(setOnlineNote(note));
    }
  }

  private onInput(id: string, command: PlayerCommand): void {
    if (this.seen.has(id)) return;
    this.seen.add(id);
    if (store.getState().game.role !== 'host' || command.side !== 'black') return;
    if (command.type === 'upgrade') {
      store.dispatch(playUpgrade({ file: command.file, rank: command.rank, side: 'black' }));
    } else if (command.type === 'repair') {
      store.dispatch(playRepair({ file: command.file, rank: command.rank, side: 'black' }));
    } else if (command.type === 'overcharge') {
      store.dispatch(playOvercharge({ file: command.file, rank: command.rank, side: 'black' }));
    } else if (command.type === 'spell') {
      store.dispatch(playSpell({ side: 'black', spell: command.spell }));
    } else if (command.type === 'block') {
      store.dispatch(playBlock({ side: 'black', x: command.x, y: command.y }));
    } else if (command.type === 'target') {
      store.dispatch(playAim({ side: 'black', file: command.file, rank: command.rank }));
    } else {
      store.dispatch(playUnblock({ side: 'black', x: command.x, y: command.y }));
    }
  }

  private async persist(): Promise<void> {
    const slice = store.getState().game;
    if (!this.active || slice.game.status !== 'victory' || slice.record !== 'idle' || this.saving) return;
    rememberMatch({
      mode: slice.game.mode,
      winner: slice.game.winner ?? 'draw',
      wave: slice.game.wave,
      seconds: Math.round(slice.game.tick / 10),
      at: Date.now(),
    });
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
    const seen = store.getState().prefs.seenTutorial;
    store.dispatch(startLocal({ mode, difficulty: this.difficulty, seed }));
    this.tutorial = mode === 'ai' && !seen ? 0 : -1;
    this.heardWave = -1;
    this.heardEnd = false;
    playTap();
  }

  private advanceTutorial(skip: boolean): void {
    if (skip || this.tutorial >= this.steps.length - 1) {
      this.tutorial = -1;
      store.dispatch(markTutorial());
      return;
    }
    this.tutorial += 1;
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
      if (data.status === 'abandoned' || data.status === 'victory') throw new Error('That match is already over.');
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
      button.repair { background: linear-gradient(#2f6b45, #1c4630); }
      button.charge { background: linear-gradient(#c9862a, #8a4e12); color: #fff8e8; }
      .role { margin: 0; line-height: 1.35; }
      .actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .actions button, .actions .level { min-height: 40px; }
      @media (max-width: 720px) {
        .role, .gold { font-size: 0.92rem; }
        button, .link { padding: 0 10px; font-size: 0.82rem; }
        .actions { gap: 6px; }
      }
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
      .coach { margin: 0; color: #f3e6cf; font-size: 0.92rem; }
      @media (max-width: 720px) {
        .play { display: flex; flex-direction: column; }
        .table { order: -1; }
        .hud { padding: 10px; }
        h1 { font-size: 1.7rem; }
      }
    `;
  }

  protected override render(): TemplateResult {
    const slice = this.slice;
    if (!slice) return html``;
    if (slice.game.status === 'menu') return this.menu(slice);
    return html`
      <div class="play">
        ${this.hud(slice)}
        <div class="table">
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
        <p style="text-align:center; margin:0;">Two kings. One board. The towers never move. Their soldiers do.</p>
        <div class="card">
          <div class="choices">
            <label>AI
              <select .value=${this.difficulty} @change=${(event: Event) => store.dispatch(setDifficulty((event.target as HTMLSelectElement).value as Difficulty))}>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
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
          <p>${this.signedIn ? `Record ${this.career || '…'}` : 'Sign in with the Login button to save wins and losses. Local and versus-AI matches do not need an account.'}</p>
          ${recentMatches().length ? html`
            <p>Recent on this browser: ${recentMatches().map((row) => `${row.winner} in ${row.seconds}s`).join(' · ')}</p>
          ` : ''}
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
          <button type="button" class="quiet" @click=${() => this.leave()}>Menu</button>
          <button type="button" class="quiet" @click=${() => store.dispatch(setMuted(!this.muted))}>${this.muted ? 'Unmute' : 'Mute'}</button>
        </div>
        <div class="wave">${waveLabel}</div>
        ${(['white', 'black'] as const).filter((side) => controlsSide(slice, side)).map((side) => {
          const mark = game.waveTarget[side];
          const marked = mark ? towerAt(game, mark.file, mark.rank) : undefined;
          const name = marked ? `${PIECES[marked.kind].label} ${squareName(marked.file, marked.rank)}` : 'Enemy King';
          return html`<div>Next wave target: ${name}${mark ? html` <button type="button" class="quiet" @click=${() => handleAim(side, -1, -1)}>Clear</button>` : ''}</div>`;
        })}
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
        ${this.tutorial >= 0 ? html`
          <p class="coach">Step ${this.tutorial + 1} of ${this.steps.length}. ${this.steps[this.tutorial]}</p>
          <div class="row">
            <button type="button" @click=${() => this.advanceTutorial(false)}>Next</button>
            <button type="button" class="quiet" @click=${() => this.advanceTutorial(true)}>Skip tutorial</button>
          </div>
        ` : game.wave === 0 ? html`<p class="coach">Towers stay on their squares. Each tower sends its soldiers out of its own gate, and those soldiers fade if the tower falls. Tap an enemy tower and press T to aim the next wave. Keys: P pause, T target, W walls, U upgrade, R repair, O overcharge, B H L spells.</p>` : ''}
        ${selected ? this.inspect(selected) : html`<div>Tap one of your towers to upgrade it.</div>`}
        ${sides.map((side) => this.spells(slice, side))}
      </aside>
    `;
  }

  private inspect(tower: GameState['towers'][number]): TemplateResult {
    const slice = this.slice;
    const stats = combatOf(tower.kind, tower.level);
    const piece = PIECES[tower.kind];
    const cost = tower.level < 3 ? upgradeCost(tower.kind, tower.level) : 0;
    const mine = slice ? controlsSide(slice, tower.side) : false;
    const attacker: Side = tower.side === 'white' ? 'black' : 'white';
    const canAim = slice ? controlsSide(slice, attacker) : false;
    const marked = slice?.game.waveTarget[attacker];
    const aimed = !!marked && marked.file === tower.file && marked.rank === tower.rank;
    return html`
      <div>
        <strong>${tower.side} ${piece.label}</strong>
        ${squareName(tower.file, tower.rank)}
        · level ${tower.level}
        · ${Math.ceil(tower.hp)}/${tower.maxHp}
      </div>
      <p class="role">${piece.role}</p>
      <div>${stats.damage} damage · range ${stats.range.toFixed(1)} · every ${(stats.attackTicks / 10).toFixed(1)}s${overcharged(tower.overchargeUntil, this.slice?.game.tick ?? 0) ? ' · overcharged' : ''}</div>
      <div class="actions">
        ${mine && tower.level < 3 ? html`
          <button type="button" @click=${() => handleUpgrade(tower.side, tower.file, tower.rank)}>Upgrade ${cost}</button>
        ` : mine ? html`<span class="level">Level 3</span>` : ''}
        ${mine ? this.repairButton(tower) : ''}
        ${mine ? this.chargeButton(tower) : ''}
        ${canAim ? html`
          <button type="button" @click=${() => handleAim(attacker, aimed ? -1 : tower.file, aimed ? -1 : tower.rank)}>${aimed ? 'Clear target' : 'Target'}</button>
        ` : ''}
      </div>
    `;
  }

  private repairButton(tower: GameState['towers'][number]): TemplateResult {
    const slice = this.slice;
    const missing = Math.max(0, tower.maxHp - tower.hp);
    const cost = repairCost(missing);
    const wait = slice ? Math.max(0, tower.repairReadyTick - slice.game.tick) : 0;
    const label = missing <= 0 ? 'Whole' : wait > 0 ? `Repair ${(wait / 10).toFixed(0)}s` : `Repair ${cost}`;
    return html`
      <button
        type="button"
        class="repair"
        ?disabled=${missing <= 0 || wait > 0}
        @click=${() => handleRepair(tower.side, tower.file, tower.rank)}>
        ${label}
      </button>
    `;
  }

  private chargeButton(tower: GameState['towers'][number]): TemplateResult {
    if (tower.level < 3) return html``;
    const tick = this.slice?.game.tick ?? 0;
    const active = overcharged(tower.overchargeUntil, tick);
    const wait = Math.max(0, tower.overchargeReadyTick - tick);
    const label = active
      ? `Charged ${Math.ceil((tower.overchargeUntil - tick) / 10)}s`
      : wait > 0
        ? `Charge ${Math.ceil(wait / 10)}s`
        : `Overcharge ${overchargeCost(tower.overchargeUses)}`;
    return html`
      <button
        type="button"
        class="charge"
        ?disabled=${active || wait > 0}
        @click=${() => handleOvercharge(tower.side, tower.file, tower.rank)}>
        ${label}
      </button>
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
    const game = slice.game;
    const winner = game.winner;
    const text = winner === 'draw' ? 'Draw' : winner === 'white' ? 'White wins' : 'Black wins';
    const saved = slice.record === 'saved' ? 'Record saved.' : slice.record === 'error' ? 'Could not save the record.' : slice.record === 'skipped' ? 'Played on this browser.' : '';
    const whiteLeft = game.towers.filter((tower) => tower.side === 'white' && tower.hp > 0).length;
    const blackLeft = game.towers.filter((tower) => tower.side === 'black' && tower.hp > 0).length;
    const seconds = Math.round(game.tick / 10);
    return html`
      <div class="end">
        <h2>${text}</h2>
        <p>${winner === 'draw' ? 'Both King towers fell together.' : 'The enemy King tower has fallen.'}</p>
        <p>Wave ${game.wave} · ${seconds}s · White towers ${whiteLeft} · Black towers ${blackLeft}. ${saved}</p>
        <div class="row" style="justify-content:center;">
          ${game.mode === 'online' ? '' : html`<button type="button" @click=${() => this.start(game.mode === 'local' ? 'local' : 'ai')}>Rematch</button>`}
          <button type="button" @click=${() => this.leave()}>Back to menu</button>
        </div>
      </div>
    `;
  }
}
