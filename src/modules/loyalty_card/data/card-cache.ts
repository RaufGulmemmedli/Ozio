'use client';

/**
 * Offline persistence for the loyalty card (KT2).
 *
 * `@tanstack/query-sync-storage-persister` is **not installed**, so this is the
 * small persister the brief asks for, scoped to exactly one query:
 *
 *  - it subscribes to the TanStack query cache and writes `cardKeys.card()`'s
 *    successful data — and nothing else — to `localStorage`;
 *  - the key is **per user** (`ozio.card.v1.<profileId>`), so two accounts on
 *    one browser never see each other's card;
 *  - every `ozio.card.v1.*` key is removed on sign-out, through the
 *    `addSignOutListener` hook in `@/core/session` (registered once by
 *    `installCardCacheSignOut()`, which `useCard()` calls on mount);
 *  - every read and write is wrapped in try/catch: private mode, blocked site
 *    data and a full quota must degrade to "no cache", never to an error.
 *
 * Only the card is persisted. Bonus transactions are **not** — they are money
 * movements whose staleness would be misleading offline, and the barcode is
 * what the cashier needs.
 */
import type { QueryClient } from '@tanstack/react-query';

import { addSignOutListener } from '@/core/session';

import { cardKeys } from '../loyalty_card.query-keys';
import { parseOzioCard, type OzioCardModel } from './models/card';

const PREFIX = 'ozio.card.v1.';
const CACHE_VERSION = 1;

/** `ozio.card.v1.<profileId>` — `anon` only when the profile carried no id. */
export const cardCacheKey = (userId: number | string | null | undefined): string =>
  `${PREFIX}${userId === null || userId === undefined || userId === '' ? 'anon' : String(userId)}`;

interface CardSnapshot {
  v: number;
  /** Epoch ms the card was stored, so the offline screen can say how stale it is. */
  at: number;
  card: OzioCardModel;
}

export interface CachedCard {
  card: OzioCardModel;
  /** ISO instant of the last successful sync. */
  savedAt: string;
}

const storage = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    // Blocked site data / sandboxed iframe.
    return null;
  }
};

export function readCardCache(userId: number | string | null | undefined): CachedCard | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(cardCacheKey(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const snapshot = parsed as Partial<CardSnapshot> | null;
    if (!snapshot || snapshot.v !== CACHE_VERSION) return null;
    // Re-run the tolerant parser: a snapshot written by an older build may be
    // missing fields the model has since gained.
    const card = parseOzioCard({
      id: snapshot.card?.profileId ?? undefined,
      name: snapshot.card?.holderName ?? '',
      bonus_cards: [
        {
          card_number: snapshot.card?.cardNumber ?? '',
          bonus: snapshot.card?.balance ?? 0,
          total: snapshot.card?.lifetimeEarned ?? 0,
          block_type: snapshot.card?.blockType ?? '',
          status: snapshot.card?.status ?? '',
          type: snapshot.card?.type ?? '',
        },
      ],
    });
    if (!card.hasCard) return null;
    const at = typeof snapshot.at === 'number' ? snapshot.at : Date.now();
    return { card, savedAt: new Date(at).toISOString() };
  } catch {
    return null;
  }
}

export function writeCardCache(
  userId: number | string | null | undefined,
  card: OzioCardModel,
): void {
  const store = storage();
  if (!store || !card.hasCard) return;
  try {
    const snapshot: CardSnapshot = { v: CACHE_VERSION, at: Date.now(), card };
    store.setItem(cardCacheKey(userId), JSON.stringify(snapshot));
    invalidateSnapshot();
  } catch {
    // Quota exceeded / private mode: the screen simply has no offline copy.
  }
}

/** Removes every per-user card snapshot. Called on sign-out. */
export function clearCardCache(): void {
  const store = storage();
  if (!store) return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(PREFIX)) doomed.push(key);
    }
    for (const key of doomed) store.removeItem(key);
  } catch {
    // Nothing to clear if storage is unreachable.
  }
  invalidateSnapshot();
}

/* ------------------------------------------------------------- React snapshot
 * `useSyncExternalStore` needs a *stable* reference between reads, so the
 * parsed snapshot is memoised per user and only re-read when something wrote to
 * the cache. The server snapshot is always `null`, which is what keeps the
 * server render and the hydrating render identical — the cached card appears on
 * the first commit after hydration, without a `setState` in an effect.
 */

const snapshotListeners = new Set<() => void>();

let snapshotKey: string | null = null;
let snapshotValue: CachedCard | null = null;
let snapshotFresh = false;

function invalidateSnapshot(): void {
  snapshotFresh = false;
  for (const fn of snapshotListeners) {
    try {
      fn();
    } catch {
      // a broken listener must not break a cache write
    }
  }
}

export function subscribeCardCache(onChange: () => void): () => void {
  snapshotListeners.add(onChange);
  return () => {
    snapshotListeners.delete(onChange);
  };
}

/** Memoised `readCardCache` — the same object until the cache changes. */
export function getCardCacheSnapshot(
  userId: number | string | null | undefined,
): CachedCard | null {
  const key = cardCacheKey(userId);
  if (!snapshotFresh || snapshotKey !== key) {
    snapshotValue = readCardCache(userId);
    snapshotKey = key;
    snapshotFresh = true;
  }
  return snapshotValue;
}

/** Nothing is cached on the server. */
export const getCardCacheServerSnapshot = (): CachedCard | null => null;

let signOutInstalled = false;

/**
 * Registers the sign-out listener that drops every cached card. Idempotent and
 * a no-op on the server, so it is safe to call from any component's effect.
 */
export function installCardCacheSignOut(): void {
  if (signOutInstalled || typeof window === 'undefined') return;
  signOutInstalled = true;
  addSignOutListener(clearCardCache);
}

const CARD_KEY_HASH = JSON.stringify(cardKeys.card());

/**
 * Subscribes to the query cache and mirrors **only** `cardKeys.card()` into
 * `localStorage`. Returns the unsubscribe function.
 */
export function startCardCachePersister(
  client: QueryClient,
  userId: number | string | null | undefined,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const cache = client.getQueryCache();

  const persist = (): void => {
    const query = cache.find<OzioCardModel>({ queryKey: cardKeys.card(), exact: true });
    const data = query?.state.data;
    if (query?.state.status === 'success' && data) writeCardCache(userId, data);
  };

  // Write whatever is already in the cache (a warm navigation into /card).
  persist();

  return cache.subscribe((event) => {
    if (JSON.stringify(event.query.queryKey) !== CARD_KEY_HASH) return;
    if (event.type !== 'updated' && event.type !== 'added') return;
    persist();
  });
}
