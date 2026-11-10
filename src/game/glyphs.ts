import { svg, type SVGTemplateResult } from 'lit';

import type { PieceKind, Side } from './types.js';

const WHITE = '#f7f1e4';
const BLACK = '#2a241c';

/** Shared chess-piece drawing. Nested markup stays in the SVG namespace. */
export function pieceSvg(kind: PieceKind, side: Side): SVGTemplateResult {
  const fill = side === 'white' ? WHITE : BLACK;
  const stroke = side === 'white' ? '#1b2430' : '#f3e6cf';
  return svg`
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <g fill=${fill} stroke=${stroke} stroke-width="3" stroke-linejoin="round">
        ${body(kind)}
      </g>
    </svg>
  `;
}

function body(kind: PieceKind): SVGTemplateResult {
  if (kind === 'pawn') {
    return svg`
      <circle cx="50" cy="30" r="12"></circle>
      <path d="M38 46h24l8 28H30z"></path>
      <rect x="28" y="76" width="44" height="10" rx="2"></rect>
    `;
  }
  if (kind === 'rook') {
    return svg`
      <path d="M28 24h10v8h6V24h12v8h6V24h10v18H28z"></path>
      <path d="M32 42h36l6 32H26z"></path>
      <rect x="24" y="76" width="52" height="10" rx="2"></rect>
    `;
  }
  if (kind === 'knight') {
    return svg`
      <path d="M30 78 L34 46 L28 40 L40 22 L48 18 L46 30 L62 26 L70 38 L64 48 L72 78 Z"></path>
      <rect x="26" y="76" width="50" height="10" rx="2"></rect>
    `;
  }
  if (kind === 'bishop') {
    return svg`
      <circle cx="50" cy="16" r="5"></circle>
      <path d="M50 22 C38 30 34 42 36 52 C30 58 32 70 40 78 H60 C68 70 70 58 64 52 C66 42 62 30 50 22Z"></path>
      <rect x="30" y="78" width="40" height="8" rx="2"></rect>
    `;
  }
  if (kind === 'queen') {
    return svg`
      <circle cx="28" cy="24" r="5"></circle>
      <circle cx="50" cy="16" r="5"></circle>
      <circle cx="72" cy="24" r="5"></circle>
      <path d="M24 30 L34 48 L40 36 L50 52 L60 36 L66 48 L76 30 L70 78 H30 Z"></path>
      <rect x="26" y="78" width="48" height="8" rx="2"></rect>
    `;
  }
  return svg`
    <rect x="44" y="8" width="12" height="10"></rect>
    <rect x="38" y="14" width="24" height="8"></rect>
    <path d="M32 32h36l6 44H26z"></path>
    <rect x="24" y="78" width="52" height="10" rx="2"></rect>
  `;
}
