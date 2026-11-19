'use client';

/**
 * `prefers-reduced-motion`. Every animation that moves more than a few pixels — page transitions,
 * the Lottie loader, carousel auto-advance, the skeleton shimmer sweep — checks this first.
 *
 * SSR-safe: `false` on the server and in the hydrating render, the real value immediately after.
 */
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const canMatch = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

const read = (): boolean => (canMatch() ? window.matchMedia(QUERY).matches : false);

function subscribe(onChange: () => void): () => void {
  if (!canMatch()) return () => undefined;
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

/** Non-hook read, for imperative animation code. */
export const prefersReducedMotion = read;
