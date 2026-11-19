'use client';

/**
 * The shareable gift wishlists (the design's "kampaniyalar").
 *
 * The list is an `offset`/`limit` infinite query, the shape every real list endpoint uses, so
 * `<InfiniteList>` works unchanged once a backend exists.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { unwrap, type Failure, type Page } from '@/core/network';
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
import { viralRepository, type CreateWishlistBody } from '../data/viral.repository';
import type { GiftProduct, Wishlist } from '../data/models/wishlist';
// Fixtures only — no `msw` import, so this does not drag the handlers into the bundle.
import { GIFT_PRODUCT_SEED, SHARE_LINK_BASE, WISHLIST_SEED } from '../data/viral.fixtures';

const PAGE_SIZE = 10;
const EMPTY_PRODUCTS: Page<GiftProduct> = { items: [], total: 0, offset: 0, limit: 0 };

/** `?preview=ended` on a wishlist screen means "the gift is fully funded". */
const asCompleted = (wishlist: Wishlist): Wishlist => ({
  ...wishlist,
  raised: wishlist.target,
  progressPercent: 100,
  completed: true,
});

export function useWishlists(): UseOffsetInfiniteResult<Wishlist> {
  const locale = useLocaleKey();
  const preview = usePreview();

  const fetchPage = useCallback(
    ({ offset, limit, signal }: { offset: number; limit: number; signal: AbortSignal }) =>
      unwrap(viralRepository.wishlists({ offset, limit, locale }, signal)),
    [locale],
  );

  const result = useOffsetInfinite<Wishlist>({
    key: scoped(viralKeys.wishlists(), locale),
    limit: PAGE_SIZE,
    fetchPage,
    staleTime: CACHE.profile.staleTime,
    gcTime: CACHE.profile.gcTime,
  });

  // `useOffsetInfinite` takes no custom seed, so the "all funded" preview is projected here.
  const items = useMemo(
    () => (preview === 'ended' ? result.items.map(asCompleted) : result.items),
    [preview, result.items],
  );

  return items === result.items ? result : { ...result, items };
}

/**
 * A fully funded wishlist built from the fixtures, so `?preview=ended` renders the
 * "Hədiyyə tam yığıldı" panel with realistic numbers instead of placeholders.
 */
function completedSeed(id: string, locale: string): Wishlist {
  const config = WISHLIST_SEED.find((w) => w.id === id) ?? WISHLIST_SEED[0]!;
  const product = GIFT_PRODUCT_SEED.find((p) => p.id === config.productId) ?? GIFT_PRODUCT_SEED[0]!;
  const text = (rows: readonly { locale: string; name: string }[]) =>
    rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? '';

  return asCompleted({
    id: config.id,
    product: { id: product.id, name: text(product.name), price: product.price, icon: product.icon },
    occasion: config.occasion,
    targetDate: null,
    daysLeft: config.inDays,
    message: text(config.message),
    contributions: config.contributions.map(([name, amount], index) => ({
      id: `${config.id}-x${index + 1}`,
      name,
      amount,
      at: null,
    })),
    contributorCount: config.contributions.length,
    raised: product.price,
    target: product.price,
    progressPercent: 100,
    completed: true,
    shareLink: `${SHARE_LINK_BASE}/${config.id}`,
  });
}

/** One wishlist. A 404 arrives as a `Failure` with `kind: 'notFound'`. */
export function useWishlist(id: string): UseQueryResult<Wishlist, Failure> {
  const locale = useLocaleKey();
  const preview = usePreview();
  const trimmed = id.trim();

  // Seeded only for `?preview=ended`, so every other preview value still goes to the mock.
  const seed = useMemo(
    () => (preview === 'ended' ? { data: completedSeed(trimmed, locale) } : undefined),
    [preview, trimmed, locale],
  );

  return useScreenQuery<Wishlist>(
    {
      queryKey: scoped(viralKeys.wishlist(trimmed), locale),
      queryFn: ({ signal }) => unwrap(viralRepository.wishlist(trimmed, locale, signal)),
      enabled: trimmed.length > 0,
      ...CACHE.profile,
    },
    seed,
  );
}

/** The five gift products V3 picks from. */
export function useGiftProducts(): UseQueryResult<Page<GiftProduct>, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_PRODUCTS }), []);

  return useScreenQuery<Page<GiftProduct>>(
    {
      queryKey: scoped(viralKeys.products(), locale),
      queryFn: ({ signal }) =>
        unwrap(viralRepository.products({ offset: 0, limit: 20, locale }, signal)),
      ...CACHE.static,
    },
    seed,
  );
}

export function useCreateWishlist(): UseMutationResult<Wishlist, Failure, CreateWishlistBody> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<Wishlist, Failure, CreateWishlistBody>({
    mutationFn: (body) => unwrap(viralRepository.createWishlist(body, locale)),
    onSuccess: (wishlist) => {
      client.setQueryData(scoped(viralKeys.wishlist(wishlist.id), locale), wishlist);
      void client.invalidateQueries({ queryKey: viralKeys.wishlists() });
    },
  });
}

export function useDeleteWishlist(): UseMutationResult<string, Failure, string> {
  const client = useQueryClient();

  return useMutation<string, Failure, string>({
    mutationFn: (id) => unwrap(viralRepository.deleteWishlist(id)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: viralKeys.wishlists() });
    },
  });
}

/**
 * Adding a share. **Nothing is charged** — the mock stores a `simulated` row and answers with the
 * whole wishlist, which goes straight into the cache so the ring and the contributor list are
 * server state rather than an optimistic guess.
 */
export function useContribute(
  id: string,
): UseMutationResult<Wishlist, Failure, number> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<Wishlist, Failure, number>({
    mutationFn: (amount) => unwrap(viralRepository.contribute(id, amount, locale)),
    onSuccess: (wishlist) => {
      client.setQueryData(scoped(viralKeys.wishlist(wishlist.id), locale), wishlist);
      void client.invalidateQueries({ queryKey: viralKeys.wishlists() });
    },
  });
}
