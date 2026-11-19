'use client';

/**
 * `usePromoCodes()` — `GET v1/promo-code` (**verified, but empty on live**: `{promoCodes: [], count}`,
 * so the row shape has never been observed and the parser is fully tolerant).
 *
 * Applying a code does **not** go through `POST v1/promo-code/apply` (unverified body, no cart
 * context, removal undocumented). The sheet stores the code in the cart selection and
 * `orders/checkout` — which is verified and accepts `promo_code` — decides whether it is valid; its
 * `applied_promo` / `purchasing_disabled_reasons` are the answer the UI shows.
 */
import { useQuery } from '@tanstack/react-query';

import { unwrap, type Failure } from '@/core/network';
import { CACHE } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { cartKeys } from '../cart.query-keys';
import { cartRepository } from '../data/cart.repository';
import type { PromoCodeList } from '../data/models/promo';

export function usePromoCodes() {
  const authenticated = useIsAuthenticated();

  return useQuery<PromoCodeList, Failure>({
    queryKey: cartKeys.promoCodes(),
    queryFn: ({ signal }) => unwrap(cartRepository.promoCodes(signal)),
    enabled: authenticated,
    ...CACHE.static,
  });
}
