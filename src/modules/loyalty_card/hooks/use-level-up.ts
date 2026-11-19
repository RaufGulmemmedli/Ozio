'use client';

/**
 * "Səviyyə yüksəldi" (KT6) — the celebration overlay.
 *
 * There is **no server event** for a tier change (app-loyalty.md §8 calls this
 * out as a GAP), and the API sends no tier at all, so the trigger is purely
 * local: the fixture ladder's current tier is compared with the last tier this
 * browser acknowledged, stored under `ozio.lastTier`. A newly reached, *higher*
 * tier opens the dialog once; dismissing it writes the new tier.
 *
 * Because the ladder is a fixture, the dialog is demo content and the screen it
 * sits on carries `<DemoBanner/>`. `?celebrate=1` forces it open so the state
 * can be reviewed and screenshotted.
 *
 * Whether the dialog is open is **derived during render** from the stored tier
 * (read through `useSyncExternalStore`) and the one piece of real UI state —
 * whether the user dismissed it. The only effect writes to `localStorage`, an
 * external system, and never calls `setState`.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';

import type { LoyaltyTier, TierLadder } from '../data/models/tier';

/** The key app-loyalty.md §8 names. */
export const LAST_TIER_STORAGE_KEY = 'ozio.lastTier';

const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // a broken listener must not break the write
    }
  }
}

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};

/** A string, so the snapshot is a primitive and never churns identity. */
function readLastTier(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(LAST_TIER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLastTier(value: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAST_TIER_STORAGE_KEY, value);
  } catch {
    // Private mode: the celebration simply shows again next time.
  }
  notify();
}

/** `null` on the server, so SSR and the hydrating render agree. */
const serverSnapshot = (): string | null => null;

export interface UseLevelUpResult {
  open: boolean;
  /** The tier that was just reached, or `null`. */
  tier: LoyaltyTier | null;
  /** Dismiss and remember the tier, so it does not fire again. */
  acknowledge: () => void;
}

export function useLevelUp(ladder: TierLadder | null): UseLevelUpResult {
  const params = useSearchParams();
  const forced = params.get('celebrate') === '1';

  const lastTier = useSyncExternalStore(subscribe, readLastTier, serverSnapshot);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const currentId = ladder?.currentTierId ?? '';
  const tiers = useMemo(() => ladder?.tiers ?? [], [ladder]);

  // Two silent recordings, both pure `localStorage` writes — an external-system
  // update, which is what an effect is for (no `setState` here):
  //  - first visit on this browser: a new customer has not "levelled up" to the
  //    tier they started on;
  //  - a demotion or a sideways move: never a celebration, but the stored tier
  //    must still catch up or the next upgrade would be measured from a stale one.
  useEffect(() => {
    if (!currentId) return;
    const stored = readLastTier();
    if (stored === null) {
      writeLastTier(currentId);
      return;
    }
    if (stored === currentId) return;
    const previousIndex = tiers.findIndex((tier) => tier.id === stored);
    const currentIndex = tiers.findIndex((tier) => tier.id === currentId);
    if (previousIndex >= 0 && currentIndex >= 0 && currentIndex <= previousIndex) {
      writeLastTier(currentId);
    }
  }, [currentId, tiers]);

  const isUpgrade = useMemo(() => {
    if (!currentId || lastTier === null || lastTier === currentId) return false;
    const previousIndex = tiers.findIndex((tier) => tier.id === lastTier);
    const currentIndex = tiers.findIndex((tier) => tier.id === currentId);
    // Only a move *up* the ladder is a celebration; a demotion is silent.
    if (previousIndex < 0 || currentIndex < 0) return true;
    return currentIndex > previousIndex;
  }, [currentId, lastTier, tiers]);

  const open = Boolean(currentId) && dismissed !== currentId && (forced || isUpgrade);

  const acknowledge = useCallback(() => {
    if (!currentId) return;
    setDismissed(currentId);
    writeLastTier(currentId);
  }, [currentId]);

  return {
    open,
    // Returned whether or not the dialog is open, so the closing transition
    // still has copy to render.
    tier: tiers.find((tier) => tier.id === currentId) ?? null,
    acknowledge,
  };
}
