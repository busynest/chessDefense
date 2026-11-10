import { svg, type SVGTemplateResult } from 'lit';

import type { Side, SoldierKind } from './types.js';

/** Small original sprites. Each one echoes its tower. */
export function soldierSvg(kind: SoldierKind, side: Side): SVGTemplateResult {
  const cloth = side === 'white' ? '#d5e4f2' : '#e7b3a8';
  const metal = side === 'white' ? '#e8eef4' : '#e2c078';
  const dark = side === 'white' ? '#1d3348' : '#2a120e';
  if (kind === 'knight') {
    return svg`<svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="28" rx="8" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <path d="M8 26 L10 16 L6 14 L14 8 L18 14 L24 12 L22 26 Z" fill="${metal}" stroke="${dark}" stroke-width="1"></path>
    </svg>`;
  }
  if (kind === 'archer') {
    return svg`<svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="28" rx="7" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <circle cx="16" cy="12" r="4" fill="${cloth}" stroke="${dark}"></circle>
      <path d="M12 16 h8 l2 10 h-12z" fill="${cloth}" stroke="${dark}"></path>
      <path d="M22 8 q6 8 0 16" fill="none" stroke="${metal}" stroke-width="1.4"></path>
    </svg>`;
  }
  if (kind === 'cannon') {
    return svg`<svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="28" rx="9" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <rect x="6" y="18" width="16" height="8" rx="2" fill="${dark}"></rect>
      <rect x="18" y="16" width="10" height="6" rx="1" fill="${metal}"></rect>
      <circle cx="8" cy="26" r="3" fill="${dark}"></circle>
      <circle cx="20" cy="26" r="3" fill="${dark}"></circle>
    </svg>`;
  }
  if (kind === 'mage') {
    return svg`<svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="28" rx="7" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <path d="M16 4 L22 16 H10 Z" fill="${metal}" stroke="${dark}"></path>
      <path d="M10 16 h12 l2 10 h-16z" fill="${cloth}" stroke="${dark}"></path>
      <circle cx="16" cy="20" r="2" fill="${metal}"></circle>
    </svg>`;
  }
  if (kind === 'guard') {
    return svg`<svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="28" rx="8" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
      <path d="M8 14 h16 v12 h-16z" fill="${metal}" stroke="${dark}"></path>
      <path d="M10 14 L16 6 L22 14" fill="${cloth}" stroke="${dark}"></path>
      <rect x="14" y="16" width="4" height="8" fill="${dark}"></rect>
    </svg>`;
  }
  return svg`<svg viewBox="0 0 32 32" aria-hidden="true">
    <ellipse cx="16" cy="28" rx="6" ry="2" fill="rgba(0,0,0,.4)"></ellipse>
    <circle cx="16" cy="12" r="4" fill="${cloth}" stroke="${dark}"></circle>
    <path d="M11 16 h10 l1 10 h-12z" fill="${cloth}" stroke="${dark}"></path>
  </svg>`;
}
