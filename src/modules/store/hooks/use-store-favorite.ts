'use client';

/**
 * Store favourite toggle — **unverified** end to end.
 *
 * `GET v1/stores/favorites` answers 404 on live (the path is shadowed by `/stores/{id}`), so a
 * favourite can never be read back, and the POST / DELETE bodies (`{store_id}`) are guesses. The
 * toggle is therefore optimistic and the copy never claims the change was saved: a 2xx that we
 * cannot verify is reported as "not synced yet", and a failure rolls the heart back.
 */
import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { Failure } from '@/core/network';
import { requireAuth } from '@/core/session';
import { toast } from '@/shared/ui';

import { storeRepository } from '../data/store.repository';

export interface UseStoreFavoriteResult {
  isFavorite: boolean;
  isPending: boolean;
  toggle: () => void;
}

export function useStoreFavorite(
  storeId: number,
  initial = false,
): UseStoreFavoriteResult {
  const t = useTranslations('store');
  const [isFavorite, setIsFavorite] = useState(initial);

  const mutation = useMutation<{ persisted: false }, Failure, boolean>({
    mutationFn: async (next) => {
      const result = await storeRepository.setFavorite(storeId, next);
      if (!result.ok) throw result.failure;
      return result.value;
    },
    onSuccess: () => {
      // The call returned 2xx, but there is no readable list to confirm it with.
      toast.info({ title: t('favorite.unverified'), body: t('favorite.unverifiedBody') });
    },
    onError: (_failure, next) => {
      setIsFavorite(!next);
      toast.error({ title: t('favorite.failed') });
    },
  });

  const toggle = useCallback(() => {
    requireAuth(() => {
      const next = !isFavorite;
      setIsFavorite(next);
      mutation.mutate(next);
    }, 'favorite');
  }, [isFavorite, mutation]);

  return { isFavorite, isPending: mutation.isPending, toggle };
}

export interface UseProductFavoritesResult {
  /** `fallback` is the row's own `is_favorite`, used until the heart is touched. */
  isFavorite: (rowId: number, fallback?: boolean) => boolean;
  toggle: (rowId: number) => void;
}

/**
 * Product-level favourites.
 *
 * There is **no endpoint**: `stores/favorites` is documented for stores only (and its GET is 404),
 * and the catalog row's `is_favorite` / `_count.user_favorite_store_product_variants` is the only
 * readable signal. The heart therefore toggles locally, says that it is not saved yet, and sends
 * nothing — a wrong guess at a write endpoint would be worse than no write at all.
 */
export function useProductFavorites(): UseProductFavoritesResult {
  const t = useTranslations('store');
  const [local, setLocal] = useState<Record<number, boolean>>({});

  const toggle = useCallback(
    (rowId: number) => {
      requireAuth(() => {
        setLocal((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
        toast.info({
          id: 'store-product-favorite',
          title: t('favorite.unverified'),
          body: t('favorite.productNoApi'),
        });
      }, 'favorite');
    },
    [t],
  );

  return {
    isFavorite: useCallback(
      (rowId: number, fallback = false) => local[rowId] ?? fallback,
      [local],
    ),
    toggle,
  };
}
