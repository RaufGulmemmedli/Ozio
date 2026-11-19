'use client';

/**
 * "Kuryerin çantası" — the bag list, the shopper's draft selection and the server-side quote.
 *
 * The draft lives in the component tree (it is a selection, not server state); every money value
 * on screen comes from `bagQuote`, so no total is ever added up in a view.
 */
import { keepPreviousData, useMutation, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';

import { courierShopKeys } from '../courier_shop.query-keys';
import { courierShopRepository } from '../data/courier_shop.repository';
import {
  EMPTY_BAG_QUOTE,
  type BagDraftLine,
  type BagItem,
  type BagQuote,
  type BagReceipt,
} from '../data/models';

/** How long the selection must sit still before a new quote is asked for. */
const QUOTE_DEBOUNCE_MS = 250;

/**
 * `value`, held back until it stops changing for `ms`.
 *
 * Local to this module on purpose: `@/core/lib/debounce` is a function debouncer, not a hook, and
 * `shared/` is not ours to extend. `// TODO(core):` a `useDebounced` hook would belong there.
 */
function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSettled(value);
    }, ms);
    return () => {
      window.clearTimeout(id);
    };
  }, [value, ms]);

  return settled;
}

/** `GET bag/items` — supports `?preview=loading|empty|error`. */
export function useBagItems(): UseQueryResult<BagItem[], Failure> {
  return useScreenQuery<BagItem[]>(
    {
      queryKey: courierShopKeys.bagItems(),
      queryFn: ({ signal }) => unwrap(courierShopRepository.bagItems({ signal })),
      // The courier's bag changes while they are on the way: short-lived, like a cart.
      ...CACHE.cart,
    },
    { empty: [] },
  );
}

export interface BagDraft {
  lines: BagDraftLine[];
  quantityOf: (id: string) => number;
  add: (item: BagItem) => void;
  setQuantity: (item: BagItem, quantity: number) => void;
  clear: () => void;
  isEmpty: boolean;
}

/** The local selection, capped per item by the stock the server reported. */
export function useBagDraft(): BagDraft {
  const [byId, setById] = useState<Record<string, number>>({});

  const quantityOf = useCallback((id: string) => byId[id] ?? 0, [byId]);

  const setQuantity = useCallback((item: BagItem, quantity: number) => {
    const capped = Math.max(0, Math.min(item.stock, Math.trunc(quantity)));
    setById((prev) => {
      if (capped === 0) {
        if (prev[item.id] === undefined) return prev;
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      if (prev[item.id] === capped) return prev;
      return { ...prev, [item.id]: capped };
    });
  }, []);

  const add = useCallback(
    (item: BagItem) => {
      setQuantity(item, (byId[item.id] ?? 0) + 1);
    },
    [byId, setQuantity],
  );

  const clear = useCallback(() => {
    setById({});
  }, []);

  const lines = useMemo<BagDraftLine[]>(
    () =>
      Object.entries(byId)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => ({ id, quantity })),
    [byId],
  );

  return { lines, quantityOf, add, setQuantity, clear, isEmpty: lines.length === 0 };
}

/**
 * `POST bag/quote` — lines, delivery, saving and total for the current draft.
 *
 * An empty draft asks nothing and resolves to the zeroed quote, so the disabled CTA state costs no
 * request. The previous quote is kept while a new one is in flight, so the panel never flickers.
 */
export function useBagQuote(lines: readonly BagDraftLine[]): UseQueryResult<BagQuote, Failure> {
  const sorted = useMemo(
    () => [...lines].sort((a, b) => a.id.localeCompare(b.id)),
    [lines],
  );
  // Writes to one path are serialised by `api()`, so a burst of stepper clicks would queue a
  // POST per tick. Settling for a moment first keeps it to one request per intent.
  const key = useDebounced(sorted, QUOTE_DEBOUNCE_MS);

  return useScreenQuery<BagQuote>({
    queryKey: courierShopKeys.bagQuote(key),
    queryFn: ({ signal }) =>
      key.length === 0
        ? Promise.resolve(EMPTY_BAG_QUOTE)
        : unwrap(courierShopRepository.bagQuote(key, { signal })),
    placeholderData: keepPreviousData,
    ...CACHE.cart,
  });
}

/** `POST bag/confirm` — the demo purchase. Nothing is charged; a receipt comes back. */
export function useBagConfirm(): UseMutationResult<BagReceipt, Failure, readonly BagDraftLine[]> {
  return useMutation<BagReceipt, Failure, readonly BagDraftLine[]>({
    mutationKey: ['courier_shop', 'bag', 'confirm'],
    mutationFn: async (lines) => {
      const res = await courierShopRepository.bagConfirm(lines);
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
  });
}
