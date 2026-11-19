'use client';

/**
 * The live price-drop auctions.
 *
 * The whole point of this file is that **the client never advances the auction itself**:
 *
 * - `useAuction(id)` reads with `CACHE.tracking` (stale at once, dropped when the last observer
 *   unmounts), because the price it holds is only true for the instant it was fetched;
 * - `useAuctionClock(auction)` counts down to the `next_drop_at` / `ends_at` instants the mock
 *   sent and **refetches** when one passes. A drop therefore comes from the server, and so does
 *   the ended state;
 * - `useBid(id)` hands the amount to the mock and lets it decide. A 422 on `amount` is what the
 *   form displays; there is no client-side "is this bid high enough" check anywhere.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import {
  CACHE,
  scoped,
  useLocaleKey,
  useOffsetInfinite,
  usePreview,
  useScreenQuery,
  type UseOffsetInfiniteResult,
} from '@/core/query';

import { viralKeys } from '../viral.query-keys';
import { viralRepository } from '../data/viral.repository';
import type { Auction } from '../data/models/auction';
// Fixtures only — no `msw` import, so this does not drag the handlers into the bundle.
import { AUCTION_SEED, SECONDS_PER_DROP } from '../data/viral.fixtures';
import { useDeadline } from './use-deadline';

const PAGE_SIZE = 10;

export function useAuctions(): UseOffsetInfiniteResult<Auction> {
  const locale = useLocaleKey();
  const preview = usePreview();

  const fetchPage = useCallback(
    ({ offset, limit, signal }: { offset: number; limit: number; signal: AbortSignal }) =>
      unwrap(viralRepository.auctions({ offset, limit, locale }, signal)),
    [locale],
  );

  const result = useOffsetInfinite<Auction>({
    key: scoped(viralKeys.auctions(), locale),
    limit: PAGE_SIZE,
    fetchPage,
    // The card prices move, so the list is never served from a stale cache.
    staleTime: CACHE.tracking.staleTime,
    gcTime: CACHE.catalog.gcTime,
  });

  /**
   * `?preview=ended` on the list: `useOffsetInfinite` takes no custom seed, so the loaded rows are
   * projected into their finished shape here. `loading`, `empty` and `error` are handled inside
   * `useScreenInfiniteQuery` as usual.
   */
  const items = useMemo(() => {
    if (preview !== 'ended') return result.items;
    return result.items.map((auction) => ({
      ...auction,
      currentPrice: auction.floorPrice,
      stockLeft: 0,
      status: 'ended' as const,
      endsAt: null,
      nextDropAt: null,
    }));
  }, [preview, result.items]);

  return items === result.items ? result : { ...result, items };
}

/**
 * `?preview=ended` seeds a finished run, so the `Qaçırdın` state is screenshottable without
 * waiting for an auction to reach its floor. The numbers come from the fixtures, not from thin
 * air, so the preview looks like the real thing.
 */
function endedSeed(id: string): Auction {
  const config = AUCTION_SEED.find((a) => a.id === id) ?? AUCTION_SEED[0]!;
  const az = config.title.find((row) => row.locale === 'az')?.name ?? '';
  return {
    id: config.id,
    title: az,
    icon: config.icon,
    startPrice: config.startPrice,
    floorPrice: config.floorPrice,
    currentPrice: config.floorPrice,
    step: config.step,
    secondsPerDrop: SECONDS_PER_DROP,
    totalStock: config.totalStock,
    stockLeft: 0,
    status: 'ended',
    endsAt: null,
    nextDropAt: null,
    bids: [],
    myBid: null,
  };
}

export function useAuction(id: string): UseQueryResult<Auction, Failure> {
  const locale = useLocaleKey();
  const preview = usePreview();
  const trimmed = id.trim();

  // Seeded only for `?preview=ended`, so every other preview value (and a preview URL used just
  // to view the screen without a session) still goes to the mock.
  const seed = useMemo(
    () => (preview === 'ended' ? { data: endedSeed(trimmed) } : undefined),
    [preview, trimmed],
  );

  return useScreenQuery<Auction>(
    {
      queryKey: scoped(viralKeys.auction(trimmed), locale),
      queryFn: ({ signal }) => unwrap(viralRepository.auction(trimmed, locale, signal)),
      enabled: trimmed.length > 0,
      ...CACHE.tracking,
    },
    seed,
  );
}

export interface AuctionClock {
  /** Seconds to the next price drop, `null` once the run is over. */
  toNextDrop: number | null;
  /** Seconds until the run ends, `null` when it already has. */
  toEnd: number | null;
}

/**
 * Keeps the live screen in step with the server's clock.
 *
 * Both countdowns refetch when they reach zero — the drop one so the next price comes from the
 * server, the end one so the screen settles into `ended`/`bought`/`missed` on the server's word.
 */
export function useAuctionClock(auction: Auction | undefined): AuctionClock {
  const locale = useLocaleKey();
  const client = useQueryClient();
  const id = auction?.id ?? '';

  const refetch = useCallback(() => {
    if (!id) return;
    void client.invalidateQueries({ queryKey: scoped(viralKeys.auction(id), locale) });
    // The list card for the same auction shows the same price, so it is stale too.
    void client.invalidateQueries({ queryKey: viralKeys.auctions() });
  }, [client, id, locale]);

  const live = auction?.status === 'live';

  const drop = useDeadline(live ? (auction?.nextDropAt ?? null) : null, {
    onElapsed: refetch,
  });
  const end = useDeadline(live ? (auction?.endsAt ?? null) : null, { onElapsed: refetch });

  return { toNextDrop: drop.secondsLeft, toEnd: end.secondsLeft };
}

/**
 * Places a bid.
 *
 * **Validation happens in the handler.** The mutation posts the amount the user confirmed and
 * surfaces whatever the mock answers; a bid below the live price arrives as a 422 whose field
 * error the bid form renders. On success the response is the whole auction, so it is written
 * straight into the cache.
 */
export function useBid(id: string): UseMutationResult<Auction, Failure, number> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<Auction, Failure, number>({
    mutationFn: (amount) => unwrap(viralRepository.bid(id, amount, locale)),
    onSuccess: (auction) => {
      client.setQueryData(scoped(viralKeys.auction(auction.id), locale), auction);
      void client.invalidateQueries({ queryKey: viralKeys.auctions() });
    },
  });
}

/** "Yenidən oyna" — demo-only; re-arms the run from the start price. */
export function useRestartAuction(id: string): UseMutationResult<Auction, Failure, void> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<Auction, Failure, void>({
    mutationFn: () => unwrap(viralRepository.restartAuction(id, locale)),
    onSuccess: (auction) => {
      client.setQueryData(scoped(viralKeys.auction(auction.id), locale), auction);
      void client.invalidateQueries({ queryKey: viralKeys.auctions() });
    },
  });
}
