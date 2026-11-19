'use client';

/**
 * Favourite toggle for a product — **unverified** end to end:
 *  - `POST`/`DELETE v1/stores/favorites` exist in the APK, but the body is a guess (`store_id`) and
 *    **product-level** favourites are undocumented;
 *  - `GET v1/stores/favorites` is 404 on live, so the result can never be read back.
 *
 * Therefore: optimistic local state, a toast once the request comes back without a failure, and a
 * revert + error toast when it fails. Nothing here claims the favourite persisted.
 */
import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import { requireAuth } from '@/core/session';
import { Heart } from '@/shared/lucide';
import { toast } from '@/shared/ui';

import { productRepository } from '../data/product.repository';

export interface UseProductFavoriteArgs {
  storeId: number | null;
  variantId: number | null;
  initial?: boolean | null;
}

export interface ProductFavoriteState {
  favorite: boolean;
  pending: boolean;
  toggle: () => void;
}

export function useProductFavorite({
  storeId,
  variantId,
  initial,
}: UseProductFavoriteArgs): ProductFavoriteState {
  const t = useTranslations('product');
  const [favorite, setFavorite] = useState(initial === true);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(() => {
    if (storeId === null || variantId === null || pending) return;

    requireAuth(() => {
      const next = !favorite;
      setFavorite(next);
      setPending(true);

      void productRepository
        .setFavorite({ store_id: storeId, store_product_variant_id: variantId }, next)
        .then((result) => {
          if (result.ok) {
            toast.success({ title: next ? t('favorite.added') : t('favorite.removed'), icon: Heart });
          } else {
            setFavorite(!next);
            toast.error({ title: t('favorite.failed') });
          }
        })
        .finally(() => setPending(false));
    }, 'favorite');
  }, [favorite, pending, storeId, t, variantId]);

  return { favorite, pending, toggle };
}
