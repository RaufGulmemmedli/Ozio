'use client';

/**
 * The module-specific `?preview=` values.
 *
 * `loading`, `empty`, `error` and `offline` are handled by `useScreenQuery` itself (no request is
 * sent). The extra values below are passed to the mock handler as `?state=`, so the screen renders
 * a real server answer rather than a client-side fake — which is what makes the wheel's
 * daily-limit state honest: it comes from the API, never from a counter in the browser.
 *
 *   /rewards/wheel?preview=limit   → `GET /api/mock/rewards/wheel?state=limit` → 2/2 spins used
 *   /rewards/wheel?preview=result  → spins once on mount and shows the result modal
 */
import { usePreview } from '@/core/query';

/** Values this module forwards to the handler. */
const SERVER_STATES: ReadonlySet<string> = new Set(['limit']);

export function useMockState(): string | undefined {
  const preview = usePreview();
  return preview !== null && SERVER_STATES.has(preview) ? preview : undefined;
}

/** `?preview=result` — the wheel opens its result modal as soon as the spin resolves. */
export function useAutoSpinPreview(): boolean {
  return usePreview() === 'result';
}
