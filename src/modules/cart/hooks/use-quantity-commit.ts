'use client';

/**
 * Turns stepper taps into cart writes.
 *
 * Rapid taps are **debounced 250 ms** and only the final quantity is sent, as one delta
 * (04-data-layer.md §"Optimistic cart"): three `+` taps on a count product become a single
 * `add 3`, not three POSTs that would race into a 429.
 *
 * While the write is pending the displayed value is the local draft, so the control feels instant;
 * the optimistic patch inside `useCartAction` keeps the rest of the screen consistent, and the
 * refetch replaces both with the server's cart.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDebouncedCallback } from '@/core/lib/debounce';
import { requireAuth } from '@/core/session';

import { cartActionFor } from '../data/cart.repository';
import { useCartAction } from './use-cart-action';

/** The stepper's debounce, from 04-data-layer.md. */
export const QUANTITY_DEBOUNCE_MS = 250;

export interface QuantityCommitArgs {
  storeId: number;
  /** Store-product ROW id. */
  productId: number;
  /** The quantity the server last reported for this line (cart units). */
  serverQty: number;
  /** Suppress the server's `notification_message` toast (steppers do; a remove does not). */
  silent?: boolean;
}

/**
 * A quantity the user asked for, with the server value it was based on. Keeping both lets the
 * displayed value be **derived** rather than synced in an effect: the draft only stands while the
 * server still reports its base (the write is in flight) or has caught up with its target.
 * Anything else — another stepper for the same product, a refetch, a rollback — wins immediately.
 */
interface Draft {
  target: number;
  base: number;
}

export interface QuantityCommit {
  /** What the control shows: the local draft while a write is pending, else the server value. */
  value: number;
  /** Set the target quantity (cart units). Debounced; `requireAuth` runs first. */
  setQuantity: (target: number) => void;
  /** Send `remove` for the whole line now (no debounce) and report whether it succeeded. */
  removeLine: () => Promise<boolean>;
  /** Re-add a quantity — the undo of a remove. */
  restore: (quantity: number) => void;
  isPending: boolean;
}

export function useQuantityCommit({
  storeId,
  productId,
  serverQty,
  silent = true,
}: QuantityCommitArgs): QuantityCommit {
  const action = useCartAction();
  const [draft, setDraft] = useState<Draft | null>(null);

  // The debounced callback fires outside render, so it reads the latest server value from a ref.
  const serverRef = useRef(serverQty);
  useEffect(() => {
    serverRef.current = serverQty;
  }, [serverQty]);

  const value =
    draft !== null && (serverQty === draft.base || serverQty === draft.target)
      ? draft.target
      : serverQty;

  const commit = useDebouncedCallback((target: number) => {
    const body = cartActionFor({
      storeId,
      productId,
      current: serverRef.current,
      target,
    });
    if (!body) return;
    action.mutate(
      {
        storeId,
        productId,
        quantity: body.quantity,
        action: body.action,
        silent,
      },
      // The optimistic patch (and then the refetch) owns the number from here; only a failure has
      // to take the draft back, because the rollback restores the base value.
      { onError: () => setDraft(null) },
    );
  }, QUANTITY_DEBOUNCE_MS);

  const setQuantity = useCallback(
    (target: number) => {
      // The API cart is per account and a guest cart is not persisted → prompt before any change.
      requireAuth(() => {
        setDraft({ target, base: serverRef.current });
        commit(target);
      }, 'cart');
    },
    [commit],
  );

  const removeLine = useCallback(() => {
    const quantity = serverRef.current;
    if (quantity <= 0) return Promise.resolve(false);
    commit.cancel();
    setDraft({ target: 0, base: quantity });
    return action
      .mutateAsync({ storeId, productId, quantity, action: 'remove', silent: true })
      .then(() => true)
      .catch(() => {
        setDraft(null);
        return false;
      });
  }, [action, commit, productId, storeId]);

  const restore = useCallback(
    (quantity: number) => {
      if (quantity <= 0) return;
      setDraft(null);
      action.mutate({ storeId, productId, quantity, action: 'add', silent: true });
    },
    [action, productId, storeId],
  );

  return {
    value,
    setQuantity,
    removeLine,
    restore,
    isPending: action.isPending,
  };
}
