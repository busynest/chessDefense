import { svg, type SVGTemplateResult } from 'lit';

import type { PieceKind, Side } from './types.js';

/** Original tower art. White is pale stone and steel-blue. Black is obsidian and ember-gold. */
export function pieceSvg(kind: PieceKind, side: Side, ratio = 1): SVGTemplateResult {
  const id = `${side}-${kind}`;
  const stone = side === 'white' ? ['#f4efe4', '#c9bfae', '#8d8374'] : ['#4a4038', '#241e1a', '#0e0c0b'];
  const banner = side === 'white' ? '#2c6ea5' : '#a33b2c';
  const metal = side === 'white' ? '#d5dde8' : '#e0b15a';
  const cracked = ratio < 0.45;
  const smoking = ratio < 0.32;
  return svg`
    <svg viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <linearGradient id="stone-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${stone[0]}"></stop>
          <stop offset="0.55" stop-color="${stone[1]}"></stop>
          <stop offset="1" stop-color="${stone[2]}"></stop>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="112" rx="28" ry="5" fill="rgba(0,0,0,0.45)"></ellipse>
      <g fill="url(#stone-${id})" stroke="${metal}" stroke-width="1.4" stroke-linejoin="round">
        ${body(kind, banner, metal)}
      </g>
      ${cracked ? svg`
        <path d="M38 70 L46 58 L42 48 M58 78 L52 64 L60 50" fill="none" stroke="#1a120c" stroke-width="1.3" opacity="0.8"></path>
      ` : svg``}
      ${smoking ? svg`
        <g fill="rgba(180,180,180,0.45)">
          <ellipse cx="40" cy="36" rx="6" ry="3"></ellipse>
          <ellipse cx="58" cy="30" rx="5" ry="2.5"></ellipse>
        </g>
      ` : svg``}
    </svg>
  `;
}

function body(kind: PieceKind, banner: string, metal: string): SVGTemplateResult {
  const flag = svg`<path d="M62 28 h16 l-4 5 4 5 h-16z" fill="${banner}" stroke="none"></path>`;
  if (kind === 'pawn') {
    return svg`
      <rect x="34" y="78" width="32" height="28" rx="2"></rect>
      <rect x="40" y="58" width="20" height="22"></rect>
      <polygon points="50,34 62,58 38,58"></polygon>
      <rect x="46" y="28" width="8" height="10" fill="${metal}" stroke="none"></rect>
      ${flag}
    `;
  }
  if (kind === 'rook') {
    return svg`
      <rect x="28" y="72" width="44" height="34"></rect>
      <rect x="24" y="46" width="52" height="28"></rect>
      <rect x="24" y="36" width="12" height="14"></rect>
      <rect x="44" y="32" width="12" height="18"></rect>
      <rect x="64" y="36" width="12" height="14"></rect>
      <rect x="46" y="62" width="10" height="14" fill="#1a120c" stroke="none"></rect>
      ${flag}
    `;
  }
  if (kind === 'knight') {
    return svg`
      <rect x="30" y="74" width="40" height="30"></rect>
      <path d="M34 74 L36 52 L28 46 L42 28 L54 26 L50 42 L66 36 L72 52 L68 74 Z"></path>
      <rect x="40" y="86" width="12" height="12" fill="#1a120c" stroke="none"></rect>
      <circle cx="48" cy="36" r="2" fill="${metal}" stroke="none"></circle>
      ${flag}
    `;
  }
  if (kind === 'bishop') {
    return svg`
      <rect x="36" y="78" width="28" height="26"></rect>
      <polygon points="50,18 66,78 34,78"></polygon>
      <circle cx="50" cy="16" r="5" fill="${metal}"></circle>
      <rect x="47" y="58" width="6" height="16" fill="${banner}" stroke="none"></rect>
    `;
  }
  if (kind === 'queen') {
    return svg`
      <rect x="26" y="74" width="48" height="30"></rect>
      <polygon points="50,24 64,74 36,74"></polygon>
      <circle cx="32" cy="30" r="4" fill="${metal}"></circle>
      <circle cx="50" cy="18" r="5" fill="${metal}"></circle>
      <circle cx="68" cy="30" r="4" fill="${metal}"></circle>
      <rect x="46" y="48" width="8" height="18" fill="${banner}" stroke="none"></rect>
    `;
  }
  return svg`
    <rect x="24" y="70" width="52" height="34"></rect>
    <rect x="34" y="48" width="32" height="24"></rect>
    <rect x="44" y="30" width="12" height="20"></rect>
    <rect x="40" y="22" width="20" height="8" fill="${metal}"></rect>
    <rect x="46" y="12" width="8" height="12" fill="${metal}"></rect>
    <rect x="46" y="58" width="8" height="14" fill="#1a120c" stroke="none"></rect>
    <path d="M70 40 h14 l-3 4 3 4 h-14z" fill="${banner}" stroke="none"></path>
  `;
}
