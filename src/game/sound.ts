import { store } from '../store.js';

/** Original tones synthesized in the browser. No recordings. */

let context: AudioContext | null = null;
let armed = false;
let music: { stop: () => void } | null = null;

/** The page stays silent until the first click or key. A saved mute still wins after that. */
export function armAudio(): void {
  if (armed) return;
  armed = true;
  const prefs = store.getState().prefs;
  if (prefs.music) syncMusic(true);
}

export function audioArmed(): boolean {
  return armed;
}

function audio(): AudioContext | null {
  if (!armed) return null;
  const prefs = store.getState().prefs;
  if (prefs.muted || prefs.volume <= 0) return null;
  if (!context) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    context = new Ctx();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(frequency: number, duration: number, type: OscillatorType, gain: number, delay = 0): void {
  const ctx = audio();
  if (!ctx) return;
  const volume = store.getState().prefs.volume;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const start = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(gain * volume, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

let lastHit = 0;

export function playHit(): void {
  const now = performance.now();
  if (now - lastHit < 90) return;
  lastHit = now;
  tone(520, 0.05, 'square', 0.03);
}

export function playStrike(kind: string): void {
  if (kind === 'shell') {
    tone(90, 0.12, 'sawtooth', 0.05);
    tone(140, 0.08, 'square', 0.03, 0.04);
    return;
  }
  if (kind === 'arrow') {
    tone(880, 0.06, 'sine', 0.04);
    return;
  }
  if (kind === 'magic') {
    tone(520, 0.08, 'triangle', 0.04);
    tone(780, 0.1, 'sine', 0.03, 0.05);
    return;
  }
  tone(360, 0.05, 'square', 0.035);
}

export function playSoldier(kind: string): void {
  if (kind === 'peasant') {
    tone(180, 0.07, 'square', 0.04);
    return;
  }
  if (kind === 'knight') {
    tone(140, 0.06, 'sawtooth', 0.045);
    tone(220, 0.05, 'square', 0.03, 0.04);
    return;
  }
  if (kind === 'archer') {
    tone(740, 0.05, 'sine', 0.035);
    tone(520, 0.04, 'triangle', 0.02, 0.03);
    return;
  }
  if (kind === 'cannon') {
    tone(70, 0.16, 'sawtooth', 0.06);
    tone(40, 0.18, 'square', 0.04, 0.02);
    return;
  }
  if (kind === 'mage') {
    tone(440, 0.08, 'triangle', 0.04);
    tone(660, 0.1, 'sine', 0.03, 0.05);
    return;
  }
  tone(160, 0.08, 'square', 0.05);
  tone(90, 0.1, 'triangle', 0.03, 0.04);
}

export function playCollapse(): void {
  tone(180, 0.16, 'sawtooth', 0.06);
  tone(90, 0.22, 'triangle', 0.05, 0.08);
}

export function playKing(): void {
  tone(220, 0.18, 'sawtooth', 0.07);
  tone(110, 0.28, 'triangle', 0.06, 0.12);
  tone(55, 0.4, 'sine', 0.05, 0.24);
}

export function playWall(): void {
  tone(130, 0.08, 'square', 0.045);
  tone(80, 0.1, 'triangle', 0.03, 0.03);
}

export function playSpell(spell: string): void {
  if (spell === 'heal') {
    tone(392, 0.12, 'sine', 0.05);
    tone(523, 0.16, 'sine', 0.04, 0.08);
    return;
  }
  if (spell === 'blast') {
    tone(90, 0.18, 'sawtooth', 0.06);
    tone(180, 0.08, 'square', 0.03, 0.05);
    return;
  }
  tone(523, 0.12, 'triangle', 0.05);
  tone(659, 0.16, 'sine', 0.04, 0.08);
}

export function playWave(): void {
  tone(262, 0.12, 'triangle', 0.07);
  tone(330, 0.12, 'triangle', 0.07, 0.11);
  tone(392, 0.2, 'triangle', 0.08, 0.22);
  tone(523, 0.28, 'sine', 0.06, 0.34);
}

export function playVictory(): void {
  tone(392, 0.16, 'sine', 0.09);
  tone(523, 0.2, 'sine', 0.08, 0.14);
  tone(659, 0.28, 'sine', 0.07, 0.28);
}

export function playTap(): void {
  tone(520, 0.05, 'square', 0.03);
}

/** A quiet fifth, off unless Settings asks for it. */
export function syncMusic(enabled: boolean): void {
  if (!enabled || !armed) {
    music?.stop();
    music = null;
    return;
  }
  if (music) return;
  const ctx = audio();
  if (!ctx) return;
  const volume = store.getState().prefs.volume;
  const amp = ctx.createGain();
  amp.gain.value = 0.018 * volume;
  amp.connect(ctx.destination);
  const voices = [110, 165].map((frequency) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(amp);
    osc.start();
    return osc;
  });
  music = {
    stop: () => {
      for (const osc of voices) {
        try { osc.stop(); } catch { /* already stopped */ }
      }
      amp.disconnect();
    },
  };
}
