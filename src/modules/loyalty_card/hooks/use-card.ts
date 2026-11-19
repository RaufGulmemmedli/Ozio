'use client';

/**
 * `useCard()` — the card, the balance and the number, plus the offline story.
 *
 * Reads `GET v1/profile/me` (verified). When the browser is offline the query
 * is **not** fired (`enabled: online`) and the cached card from
 * `localStorage` is used instead, so `/card/offline` never shows a spinner and
 * `/card` degrades to the cached card with a banner.
 *
 * The cache itself lives in `../data/card-cache.ts`: one `localStorage` key per
 * user, written by a query-cache subscription, cleared on sign-out.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { useOnline } from '@/core/lib/use-online';
import type { Failure } from '@/core/network';
import { unwrap } from '@/core/network';
import { CACHE, useScreenQuery, usePreview } from '@/core/query';
import { useAuthStatus, useUser } from '@/core/session';

import {
  getCardCacheServerSnapshot,
  getCardCacheSnapshot,
  installCardCacheSignOut,
  startCardCachePersister,
  subscribeCardCache,
  type CachedCard,
} from '../data/card-cache';
import { loyaltyCardRepository } from '../data/loyalty_card.repository';
import { EMPTY_CARD, parseOzioCard, type OzioCardModel } from '../data/models/card';
import { cardKeys } from '../loyalty_card.query-keys';

/** `?preview=offline` / `?preview=…` needs a card to draw; this is that card. */
export const PREVIEW_CARD: OzioCardModel = parseOzioCard({
  id: 2026,
  name: 'Nurlan Əliyev',
  bonus_cards: [
    {
      card_number: '2026482177301145',
      bonus: 24.8,
      total: 128.4,
      block_type: 'not_blocked',
      status: 'active',
      type: 'digital',
    },
  ],
});

export interface UseCardResult {
  /** The card to render: live when online, the cached copy when not. */
  card: OzioCardModel | null;
  /** `true` when `card` came from `localStorage` rather than the network. */
  fromCache: boolean;
  /** ISO instant the cached copy was stored, when `fromCache`. */
  cachedAt: string | null;
  /** `navigator.onLine === false`, or `?preview=offline`. */
  offline: boolean;
  /** Render the skeleton. Never true while a cached card is available. */
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Failure | null;
  /** The visitor is a guest -> render `<GuestGate>`, not an error. */
  isGuest: boolean;
  refetch: () => void;
  query: UseQueryResult<OzioCardModel, Failure>;
}

/**
 * The per-user snapshot, through `useSyncExternalStore`: the server snapshot is
 * `null` so SSR and the hydrating render stay identical, and the cached card
 * appears on the first commit after hydration — no `setState` in an effect, and
 * a later write (the persister, or sign-out) re-reads it on its own.
 */
function useCachedCard(userId: number | null): CachedCard | null {
  const snapshot = useCallback(() => getCardCacheSnapshot(userId), [userId]);

  useEffect(() => {
    installCardCacheSignOut();
  }, []);

  return useSyncExternalStore(subscribeCardCache, snapshot, getCardCacheServerSnapshot);
}

export function useCard(): UseCardResult {
  const online = useOnline();
  const preview = usePreview();
  const status = useAuthStatus();
  const user = useUser();
  const userId = user?.id ?? null;

  const client = useQueryClient();
  const diskCache = useCachedCard(userId);

  useEffect(() => startCardCachePersister(client, userId), [client, userId]);

  const query = useScreenQuery<OzioCardModel>(
    {
      queryKey: cardKeys.card(),
      queryFn: ({ signal }) => unwrap(loyaltyCardRepository.card(signal)),
      enabled: status === 'authenticated' && online,
      ...CACHE.profile,
    },
    { empty: EMPTY_CARD, data: PREVIEW_CARD },
  );

  const previewOffline = preview === 'offline';
  const offline = !online || previewOffline;
  // In `?preview=offline` there is nothing in localStorage, so the fixture
  // stands in for the snapshot the real screen would have.
  const cached: CachedCard | null =
    diskCache ?? (previewOffline ? { card: PREVIEW_CARD, savedAt: new Date().toISOString() } : null);

  const live = query.data && query.data.hasCard ? query.data : null;
  const useCached = Boolean(cached) && (offline || (!live && query.isError));
  const card = useCached ? (cached?.card ?? null) : (query.data ?? null);

  return {
    card,
    fromCache: useCached,
    cachedAt: useCached ? (cached?.savedAt ?? null) : null,
    offline,
    isPending: !useCached && status !== 'guest' && query.isPending && (online || !cached),
    isFetching: query.isFetching,
    isError: !useCached && query.isError,
    error: query.error ?? null,
    isGuest: status === 'guest',
    refetch: () => {
      void query.refetch();
    },
    query,
  };
}
