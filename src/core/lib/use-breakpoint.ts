'use client';

/**
 * The shell's three widths: mobile < 768 ≤ tablet < 1200 ≤ desktop.
 *
 * SSR-safe: the server and the hydrating render both see `ssrFallback` (default `'desktop'`), so
 * the markup matches; the real breakpoint arrives in the commit right after hydration.
 *
 * Prefer Tailwind's own responsive classes for layout. Use this only when the *behaviour* differs —
 * a sheet on mobile vs a popover on desktop, a different number of carousel slides, bottom pill vs
 * sidebar.
 */
import { useSyncExternalStore } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const BREAKPOINTS = { tablet: 768, desktop: 1200 } as const;

const QUERY_TABLET = `(min-width: ${BREAKPOINTS.tablet}px)`;
const QUERY_DESKTOP = `(min-width: ${BREAKPOINTS.desktop}px)`;

const canMatch = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function read(): Breakpoint {
  if (!canMatch()) return 'desktop';
  if (window.matchMedia(QUERY_DESKTOP).matches) return 'desktop';
  if (window.matchMedia(QUERY_TABLET).matches) return 'tablet';
  return 'mobile';
}

function subscribe(onChange: () => void): () => void {
  if (!canMatch()) return () => undefined;
  const lists = [window.matchMedia(QUERY_TABLET), window.matchMedia(QUERY_DESKTOP)];
  for (const list of lists) list.addEventListener('change', onChange);
  return () => {
    for (const list of lists) list.removeEventListener('change', onChange);
  };
}

export function useBreakpoint(ssrFallback: Breakpoint = 'desktop'): Breakpoint {
  return useSyncExternalStore(subscribe, read, () => ssrFallback);
}

/** `useIsMobile()` — true below 768 px. */
export const useIsMobile = (): boolean => useBreakpoint() === 'mobile';

/** True below 1200 px (mobile or tablet): the width at which the sidebar becomes an icon rail. */
export const useIsCompact = (): boolean => useBreakpoint() !== 'desktop';

/** Arbitrary media query, same SSR rules. */
export function useMediaQuery(query: string, ssrFallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!canMatch()) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => (canMatch() ? window.matchMedia(query).matches : ssrFallback),
    () => ssrFallback,
  );
}
