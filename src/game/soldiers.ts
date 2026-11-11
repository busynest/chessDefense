import { svg, type SVGTemplateResult } from 'lit';

import type { Side, SoldierKind } from './types.js';

/** Shapes for the shared soldier layer. One SVG holds every unit. */
export function soldierInner(kind: SoldierKind, side: Side, bright = false): SVGTemplateResult {
  const cloth = bright
    ? (side === 'white' ? '#7ec8ff' : '#ff9a3c')
    : (side === 'white' ? '#d5e4f2' : '#e7b3a8');
  const metal = bright
    ? (side === 'white' ? '#f4fbff' : '#ffe08a')
    : (side === 'white' ? '#e8eef4' : '#e2c078');
  const dark = side === 'white' ? '#1d3348' : '#2a120e';
  const mark = side === 'white'
    ? svg`<circle cx="16" cy="30" r="3" fill="#7ec8ff"></circle>`
    : svg`<rect x="13" y="27" width="6" height="6" fill="#ff9a3c" transform="rotate(45 16 30)"></rect>`;
  if (kind === 'knight') {
    return svg`<ellipse cx="16" cy="28" rx="8" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <path d="M8 26 L10 16 L6 14 L14 8 L18 14 L24 12 L22 26 Z" fill="${metal}" stroke="${dark}" stroke-width="1"></path>${mark}`;
  }
  if (kind === 'archer') {
    return svg`<ellipse cx="16" cy="28" rx="7" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <circle cx="16" cy="12" r="4" fill="${cloth}" stroke="${dark}"></circle>
      <path d="M12 16 h8 l2 10 h-12z" fill="${cloth}" stroke="${dark}"></path>
      <path d="M22 8 q6 8 0 16" fill="none" stroke="${metal}" stroke-width="1.4"></path>${mark}`;
  }
  if (kind === 'cannon') {
    return svg`<ellipse cx="16" cy="28" rx="9" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <rect x="6" y="18" width="16" height="8" rx="2" fill="${dark}"></rect>
      <rect x="18" y="16" width="10" height="6" rx="1" fill="${metal}"></rect>
      <circle cx="8" cy="26" r="3" fill="${dark}"></circle>
      <circle cx="20" cy="26" r="3" fill="${dark}"></circle>${mark}`;
  }
  if (kind === 'mage') {
    return svg`<ellipse cx="16" cy="28" rx="7" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <path d="M16 4 L22 16 H10 Z" fill="${metal}" stroke="${dark}"></path>
      <path d="M10 16 h12 l2 10 h-16z" fill="${cloth}" stroke="${dark}"></path>
      <circle cx="16" cy="20" r="2" fill="${metal}"></circle>${mark}`;
  }
  if (kind === 'guard') {
    return svg`<ellipse cx="16" cy="28" rx="8" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <path d="M8 14 h16 v12 h-16z" fill="${metal}" stroke="${dark}"></path>
      <path d="M10 14 L16 6 L22 14" fill="${cloth}" stroke="${dark}"></path>
      <rect x="14" y="16" width="4" height="8" fill="${dark}"></rect>${mark}`;
  }
  return svg`<ellipse cx="16" cy="28" rx="6" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
    <circle cx="16" cy="12" r="4" fill="${cloth}" stroke="${dark}"></circle>
    <path d="M11 16 h10 l1 10 h-12z" fill="${cloth}" stroke="${dark}"></path>${mark}`;
}

/** Small original sprites. Each one echoes its tower. */
export function soldierSvg(kind: SoldierKind, side: Side, bright = false): SVGTemplateResult {
  return svg`<svg viewBox="0 0 32 32" aria-hidden="true">${soldierInner(kind, side, bright)}</svg>`;
}
