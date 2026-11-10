import { store } from '../store.js';

/** Original tones synthesized in the browser. No recordings. */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
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

function tone(frequency: number, duration: number, type: OscillatorType, gain: number): void {
  const ctx = audio();
  if (!ctx) return;
  const volume = store.getState().prefs.volume;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  amp.gain.value = gain * volume;
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
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
    window.setTimeout(() => tone(140, 0.08, 'square', 0.03), 40);
    return;
  }
  if (kind === 'arrow') {
    tone(880, 0.06, 'sine', 0.04);
    return;
  }
  if (kind === 'magic') {
    tone(520, 0.08, 'triangle', 0.04);
    window.setTimeout(() => tone(780, 0.1, 'sine', 0.03), 50);
    return;
  }
  tone(360, 0.05, 'square', 0.035);
}

export function playCollapse(): void {
  tone(180, 0.16, 'sawtooth', 0.06);
  window.setTimeout(() => tone(90, 0.22, 'triangle', 0.05), 80);
}

export function playWave(): void {
  tone(262, 0.12, 'triangle', 0.07);
  window.setTimeout(() => tone(330, 0.12, 'triangle', 0.07), 110);
  window.setTimeout(() => tone(392, 0.2, 'triangle', 0.08), 220);
  window.setTimeout(() => tone(523, 0.28, 'sine', 0.06), 340);
}

export function playVictory(): void {
  tone(392, 0.16, 'sine', 0.09);
  window.setTimeout(() => tone(523, 0.2, 'sine', 0.08), 140);
  window.setTimeout(() => tone(659, 0.28, 'sine', 0.07), 280);
}

export function playTap(): void {
  tone(520, 0.05, 'square', 0.03);
}
