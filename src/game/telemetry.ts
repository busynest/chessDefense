import type { Side } from './types.js';

/** One point of damage, for playtest accounting. A null sink changes nothing. */
export interface Harm {
  source: 'tower' | 'soldier' | 'blast';
  kind: string;
  side: Side;
  target: 'soldier' | 'tower' | 'block';
  targetKind: string;
  amount: number;
  lethal: boolean;
}

let harmSink: ((harm: Harm) => void) | null = null;

export function listenHarm(sink: ((harm: Harm) => void) | null): void {
  harmSink = sink;
}

export function reportHarm(harm: Harm): void {
  harmSink?.(harm);
}
