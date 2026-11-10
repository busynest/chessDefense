import type { Ledger, Side } from './types.js';
import { addHarm } from './ledger.js';

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

export function reportHarm(harm: Harm, ledger?: Ledger): void {
  harmSink?.(harm);
  if (ledger) addHarm(ledger, harm);
}

export interface Mend {
  side: Side;
  kind: string;
}

let repairSink: ((mend: Mend) => void) | null = null;

export function listenRepair(sink: ((mend: Mend) => void) | null): void {
  repairSink = sink;
}

export function reportRepair(mend: Mend): void {
  repairSink?.(mend);
}

let overchargeSink: ((mend: Mend) => void) | null = null;

export function listenOvercharge(sink: ((mend: Mend) => void) | null): void {
  overchargeSink = sink;
}

export function reportOvercharge(mend: Mend): void {
  overchargeSink?.(mend);
}
