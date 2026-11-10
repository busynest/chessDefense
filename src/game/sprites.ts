import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { Side, SoldierKind } from './types.js';

/** Walk, strike, and fall. Drawn facing right. The board mirrors them. */
export type Pose = 'walk' | 'attack' | 'death';

export const WALK_FRAMES = 4;
export const ATTACK_FRAMES = 3;
export const DEATH_FRAMES = 2;
const COLS = WALK_FRAMES + ATTACK_FRAMES + DEATH_FRAMES;

const KINDS: SoldierKind[] = ['peasant', 'knight', 'archer', 'cannon', 'mage', 'guard'];

interface Ink {
  cloth: string;
  metal: string;
  trim: string;
  dark: string;
  skin: string;
  wood: string;
}

function ink(side: Side, bright: boolean): Ink {
  if (bright && side === 'white') {
    return { cloth: '#d7eeff', metal: '#f4fbff', trim: '#1d6fbf', dark: '#10283d', skin: '#f6d2b0', wood: '#8a5a32' };
  }
  if (bright && side === 'black') {
    return { cloth: '#2a1812', metal: '#1a100c', trim: '#ff9a3c', dark: '#0c0806', skin: '#c4896a', wood: '#6b3a22' };
  }
  if (side === 'white') {
    return { cloth: '#e6eef6', metal: '#f3f6fa', trim: '#2c6ea5', dark: '#1d3348', skin: '#f0d0b0', wood: '#8d623c' };
  }
  return { cloth: '#2a221c', metal: '#3a322c', trim: '#c45a3a', dark: '#100c0a', skin: '#a87858', wood: '#5c3a24' };
}

export interface Atlas {
  canvas: HTMLCanvasElement;
  cell: number;
  dpr: number;
  bright: boolean;
  /** Milliseconds to rasterize this atlas. */
  ms: number;
}

let cached: Atlas | null = null;
let cachedKey = '';

/** Rasterize every frame once per device pixel ratio and palette. */
export function spriteAtlas(dpr: number, bright: boolean): Atlas {
  const ratio = Math.max(1, Math.min(3, Math.round(dpr * 2) / 2));
  const key = `${ratio}|${bright ? 1 : 0}`;
  if (cached && cachedKey === key) return cached;
  const started = performance.now();
  const cell = Math.round(48 * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = COLS * cell;
  canvas.height = KINDS.length * 2 * cell;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cached = { canvas, cell, dpr: ratio, bright, ms: 0 };
    cachedKey = key;
    return cached;
  }
  KINDS.forEach((kind, kindIndex) => {
    (['white', 'black'] as const).forEach((side, sideIndex) => {
      const row = kindIndex * 2 + sideIndex;
      const colors = ink(side, bright);
      for (let frame = 0; frame < WALK_FRAMES; frame += 1) stamp(ctx, cell, frame, row, kind, side, colors, 'walk', frame);
      for (let frame = 0; frame < ATTACK_FRAMES; frame += 1) stamp(ctx, cell, WALK_FRAMES + frame, row, kind, side, colors, 'attack', frame);
      for (let frame = 0; frame < DEATH_FRAMES; frame += 1) stamp(ctx, cell, WALK_FRAMES + ATTACK_FRAMES + frame, row, kind, side, colors, 'death', frame);
    });
  });
  cached = { canvas, cell, dpr: ratio, bright, ms: performance.now() - started };
  cachedKey = key;
  return cached;
}

function stamp(
  ctx: CanvasRenderingContext2D,
  cell: number,
  col: number,
  row: number,
  kind: SoldierKind,
  side: Side,
  colors: Ink,
  pose: Pose,
  frame: number,
): void {
  ctx.save();
  ctx.translate(col * cell, row * cell);
  ctx.scale(cell / 48, cell / 56);
  ctx.translate(0, pose === 'death' ? 4 + frame * 6 : 0);
  ctx.rotate(pose === 'death' ? (frame === 0 ? 0.4 : 1.1) : 0);
      paint(ctx, kind, side, colors, pose, frame);
  ctx.restore();
}

function paint(ctx: CanvasRenderingContext2D, kind: SoldierKind, side: Side, colors: Ink, pose: Pose, frame: number): void {
  const step = pose === 'walk' ? [-4, -1, 4, 1][frame] ?? 0 : 0;
  const strike = pose === 'attack' ? frame : -1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(24, 50, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kind === 'peasant') peasant(ctx, colors, step, strike);
  else if (kind === 'knight') knight(ctx, colors, step, strike);
  else if (kind === 'archer') archer(ctx, colors, step, strike);
  else if (kind === 'cannon') cannon(ctx, colors, step, strike);
  else if (kind === 'mage') mage(ctx, colors, step, strike);
  else guard(ctx, colors, step, strike);
  mark(ctx, side, colors);
}

function mark(ctx: CanvasRenderingContext2D, side: Side, colors: Ink): void {
  ctx.fillStyle = colors.trim;
  ctx.globalAlpha = 0.8;
  if (side === 'white') {
    ctx.beginPath();
    ctx.arc(24, 52, 2.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.save();
    ctx.translate(24, 52);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-1.7, -1.7, 3.4, 3.4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function head(ctx: CanvasRenderingContext2D, colors: Ink, x: number, y: number, r: number): void {
  ctx.fillStyle = colors.skin;
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function peasant(ctx: CanvasRenderingContext2D, colors: Ink, step: number, strike: number): void {
  const lean = strike === 1 ? 4 : strike === 0 ? -2 : 0;
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 40);
  ctx.lineTo(16 + step, 48);
  ctx.moveTo(26, 40);
  ctx.lineTo(30 - step, 48);
  ctx.stroke();
  ctx.fillStyle = colors.cloth;
  ctx.beginPath();
  ctx.moveTo(16, 24);
  ctx.lineTo(32, 24);
  ctx.lineTo(34, 42);
  ctx.lineTo(14, 42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colors.trim;
  ctx.fillRect(18, 28, 12, 3);
  head(ctx, colors, 24, 18, 5);
  ctx.fillStyle = colors.wood;
  const fork = 30 + lean + (strike === 1 ? 6 : 0);
  ctx.fillRect(fork, 8, 2, 28);
  ctx.fillRect(fork - 4, 8, 10, 2);
  ctx.fillRect(fork - 3, 8, 1.4, 6);
  ctx.fillRect(fork + 1, 8, 1.4, 6);
  ctx.fillRect(fork + 4, 8, 1.4, 6);
}

function knight(ctx: CanvasRenderingContext2D, colors: Ink, step: number, strike: number): void {
  const hoof = strike === 1 ? 3 : step;
  ctx.fillStyle = colors.metal;
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(22, 34, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, 30);
  ctx.quadraticCurveTo(40, 22, 42, 16);
  ctx.quadraticCurveTo(36, 18, 32, 26);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(42, 15, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 2.2;
  [8, 16, 26, 34].forEach((x, index) => {
    const swing = index % 2 === 0 ? hoof : -hoof;
    ctx.beginPath();
    ctx.moveTo(x, 38);
    ctx.lineTo(x + swing, 48);
    ctx.stroke();
  });
  ctx.fillStyle = colors.trim;
  ctx.fillRect(18, 22, 8, 8);
  head(ctx, colors, 22, 16, 3.4);
  ctx.strokeStyle = colors.metal;
  ctx.lineWidth = 2.4;
  const thrust = strike < 0 ? 0 : [ -2, 10, 4 ][strike] ?? 0;
  ctx.beginPath();
  ctx.moveTo(24, 20);
  ctx.lineTo(40 + thrust, 12 - strike);
  ctx.stroke();
}

function archer(ctx: CanvasRenderingContext2D, colors: Ink, step: number, strike: number): void {
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 40);
  ctx.lineTo(16 + step, 48);
  ctx.moveTo(27, 40);
  ctx.lineTo(31 - step, 48);
  ctx.stroke();
  ctx.fillStyle = colors.cloth;
  ctx.beginPath();
  ctx.moveTo(16, 26);
  ctx.lineTo(32, 26);
  ctx.lineTo(30, 42);
  ctx.lineTo(18, 42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colors.trim;
  ctx.beginPath();
  ctx.moveTo(18, 12);
  ctx.lineTo(30, 12);
  ctx.lineTo(24, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  head(ctx, colors, 24, 20, 3.2);
  const pull = strike < 0 ? 0 : [2, 7, 1][strike] ?? 0;
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(34, 16);
  ctx.quadraticCurveTo(28 - pull, 26, 34, 36);
  ctx.stroke();
  ctx.strokeStyle = colors.trim;
  ctx.beginPath();
  ctx.moveTo(34, 16);
  ctx.lineTo(30 - pull, 26);
  ctx.lineTo(34, 36);
  ctx.stroke();
  if (strike >= 0) {
    ctx.strokeStyle = colors.metal;
    ctx.beginPath();
    ctx.moveTo(30 - pull, 26);
    ctx.lineTo(44, 26);
    ctx.stroke();
  }
}

function cannon(ctx: CanvasRenderingContext2D, colors: Ink, step: number, strike: number): void {
  const recoil = strike < 0 ? 0 : [0, -5, -2][strike] ?? 0;
  ctx.fillStyle = colors.dark;
  ctx.beginPath();
  ctx.arc(14 + step * 0.15, 44, 5, 0, Math.PI * 2);
  ctx.arc(32 + step * 0.15, 44, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.trim;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = colors.wood;
  ctx.fillRect(10, 34, 26, 6);
  ctx.fillStyle = colors.metal;
  ctx.save();
  ctx.translate(18 + recoil, 30);
  ctx.rotate(-0.2);
  ctx.fillRect(0, 0, 22, 6);
  ctx.fillStyle = colors.dark;
  ctx.fillRect(18, -1, 6, 8);
  ctx.restore();
  ctx.fillStyle = colors.cloth;
  ctx.fillRect(12, 22, 8, 12);
  head(ctx, colors, 16, 18, 3.5);
  if (strike === 1) {
    ctx.fillStyle = 'rgba(220,220,220,0.75)';
    ctx.beginPath();
    ctx.arc(44, 22, 5, 0, Math.PI * 2);
    ctx.arc(40, 16, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mage(ctx: CanvasRenderingContext2D, colors: Ink, step: number, strike: number): void {
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 42);
  ctx.lineTo(17 + step, 49);
  ctx.moveTo(28, 42);
  ctx.lineTo(31 - step, 49);
  ctx.stroke();
  ctx.fillStyle = colors.cloth;
  ctx.beginPath();
  ctx.moveTo(24, 14);
  ctx.lineTo(36, 44);
  ctx.lineTo(12, 44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colors.trim;
  ctx.fillRect(20, 28, 8, 3);
  head(ctx, colors, 24, 14, 4);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(34, 10, 2, 30);
  const glow = strike < 0 ? 3 : [3.5, 6, 4][strike] ?? 3;
  ctx.fillStyle = colors.trim;
  ctx.beginPath();
  ctx.arc(35, 10, glow, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.metal;
  ctx.beginPath();
  ctx.arc(35, 10, glow * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function guard(ctx: CanvasRenderingContext2D, colors: Ink, step: number, strike: number): void {
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 40);
  ctx.lineTo(14 + step, 49);
  ctx.moveTo(28, 40);
  ctx.lineTo(32 - step, 49);
  ctx.stroke();
  ctx.fillStyle = colors.metal;
  ctx.fillRect(14, 22, 16, 18);
  ctx.strokeRect(14, 22, 16, 18);
  ctx.fillStyle = colors.trim;
  ctx.fillRect(20, 26, 4, 10);
  ctx.beginPath();
  ctx.moveTo(16, 16);
  ctx.lineTo(20, 8);
  ctx.lineTo(24, 14);
  ctx.lineTo(28, 8);
  ctx.lineTo(32, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const chop = strike < 0 ? 0 : [-8, 10, 2][strike] ?? 0;
  ctx.fillStyle = colors.wood;
  ctx.save();
  ctx.translate(34, 20);
  ctx.rotate(strike === 1 ? 0.8 : -0.4);
  ctx.fillRect(0, -chop * 0.1, 2.2, 26);
  ctx.fillStyle = colors.metal;
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.lineTo(8, 2);
  ctx.lineTo(-2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function blitSprite(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  kind: SoldierKind,
  side: Side,
  pose: Pose,
  frame: number,
  x: number,
  y: number,
  width: number,
  height: number,
  flip: boolean,
): void {
  const kindIndex = KINDS.indexOf(kind);
  const row = (kindIndex < 0 ? 0 : kindIndex) * 2 + (side === 'black' ? 1 : 0);
  const col = pose === 'walk'
    ? frame % WALK_FRAMES
    : pose === 'attack'
      ? WALK_FRAMES + (frame % ATTACK_FRAMES)
      : WALK_FRAMES + ATTACK_FRAMES + (frame % DEATH_FRAMES);
  const cell = atlas.cell;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(atlas.canvas, col * cell, row * cell, cell, cell, -width / 2, -height * 0.82, width, height);
  ctx.restore();
}

/** One still from the atlas for the how-to table. */
@customElement('soldier-icon')
export class SoldierIcon extends LitElement {
  @property({ type: String }) kind: SoldierKind = 'peasant';
  @property({ type: String }) side: Side = 'white';

  static override get styles(): CSSResultGroup {
    return css`:host { display: inline-block; width: 36px; height: 42px; vertical-align: middle; } canvas { width: 36px; height: 42px; }`;
  }

  protected override render(): TemplateResult {
    return html`<canvas width="72" height="84" aria-hidden="true"></canvas>`;
  }

  protected override updated(): void {
    const canvas = this.renderRoot.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const atlas = spriteAtlas(2, false);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blitSprite(ctx, atlas, this.kind, this.side, 'walk', 1, 36, 70, 64, 74, false);
  }
}
