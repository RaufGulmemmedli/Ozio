'use client';

/**
 * `?preview=<state>` — the visual-QA switch described in 04-data-layer.md.
 *
 * It lets every screen state (skeleton / empty / error / offline / expired / guest / closed, plus
 * whatever a module documents for itself) be reproduced from the URL for screenshots and review,
 * without touching the API.
 *
 * Active **only** when `NEXT_PUBLIC_ENABLE_PREVIEW === '1'` (dev + preview deploys, never prod).
 */
import { useSearchParams } from 'next/navigation';

/** The states every screen understands. Modules may add their own values on top. */
export const PREVIEW_STATES = [
  'loading',
  'empty',
  'error',
  'offline',
  'expired',
  'guest',
  'closed',
] as const;

export type PreviewState = (typeof PREVIEW_STATES)[number];

/** A known state, a module-specific one, or nothing. */
export type Preview = PreviewState | (string & {}) | null;

/** Build-time switch. `false` in production, so `usePreview()` always returns `null` there. */
export const PREVIEW_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PREVIEW === '1';

/** The query-string parameter name, so middleware / link builders agree on it. */
export const PREVIEW_PARAM = 'preview';

export function isPreviewState(v: unknown): v is PreviewState {
  return typeof v === 'string' && (PREVIEW_STATES as readonly string[]).includes(v);
}

/**
 * Reads `?preview=` once per render. Returns `null` when previews are disabled or the parameter is
 * absent or empty.
 */
export function usePreview(): Preview {
  const params = useSearchParams();
  if (!PREVIEW_ENABLED) return null;
  const raw = params?.get(PREVIEW_PARAM) ?? null;
  if (raw === null) return null;
  const value = raw.trim().toLowerCase();
  return value.length > 0 ? value : null;
}

/** `usePreview() === state`, for screens that only care about one value. */
export function useIsPreview(state: string): boolean {
  return usePreview() === state;
}
