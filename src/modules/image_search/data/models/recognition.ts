/**
 * The recognition result — `ImageRecognition{labels: RecognizedLabel{name, confidence 0..1}[]}`
 * from `api/mock-modules.md` §6 / `mock-contracts.ts`.
 *
 * Labels arrive most-confident first. An **empty list means "nothing recognised"**, which is a
 * successful response, not a failure — the screen renders the "Məhsulu tanıya bilmədik" state.
 *
 * `parseImageRecognition` never throws (BUILD-CONTRACT rule 6).
 */
import { asList, asObj, num, str } from '@/core/network';

export interface RecognizedLabel {
  /** The text the catalog is then searched with. */
  name: string;
  /** 0..1, already clamped. */
  confidence: number;
}

export interface ImageRecognition {
  labels: RecognizedLabel[];
}

/** `percent = round(clamp(conf, 0, 1) * 100)` (mock-contracts.ts `labelPercent`). */
export const labelPercent = (label: RecognizedLabel): number =>
  Math.round(Math.min(1, Math.max(0, label.confidence)) * 100);

function parseLabel(raw: unknown): RecognizedLabel | null {
  const o = asObj(raw);
  const name = str(o.name, '').trim();
  if (!name) return null;
  return { name, confidence: Math.min(1, Math.max(0, num(o.confidence))) };
}

export function parseImageRecognition(raw: unknown): ImageRecognition {
  const o = asObj(raw);
  const labels = asList(o.labels)
    .map(parseLabel)
    .filter((l): l is RecognizedLabel => l !== null)
    // The contract says "most confident first"; sorting defensively costs nothing.
    .sort((a, b) => b.confidence - a.confidence);
  return { labels };
}

/** The query a recognition drives: the top label, or `null` when nothing was recognised. */
export const topLabel = (recognition: ImageRecognition | null): RecognizedLabel | null =>
  recognition?.labels[0] ?? null;
