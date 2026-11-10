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

export function playWave(): void {
  tone(196, 0.18, 'triangle', 0.08);
  window.setTimeout(() => tone(262, 0.22, 'triangle', 0.07), 90);
}

export function playVictory(): void {
  tone(392, 0.16, 'sine', 0.09);
  window.setTimeout(() => tone(523, 0.2, 'sine', 0.08), 140);
  window.setTimeout(() => tone(659, 0.28, 'sine', 0.07), 280);
}

export function playTap(): void {
  tone(520, 0.05, 'square', 0.03);
}
