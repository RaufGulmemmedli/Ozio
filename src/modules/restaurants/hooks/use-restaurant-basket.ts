'use client';

/**
 * The restaurant basket — a LOCAL basket, deliberately separate from the real cart.
 *
 * `POST v2/carts/action` takes a live `store_products` row id and these dishes have none, so
 * sending them to the real cart answers 422 and would also pollute a cart the visitor is actually
 * going to pay for. The whole restaurants module is demo data (`<DemoBanner>` says so on every
 * screen), and so is this: quantities live in `localStorage` under one key, the header badge and
 * `/cart` never see them, and nothing is ever posted anywhere.
 *
 * When a restaurant endpoint exists this is the file that goes: the components already talk in
 * add / setQuantity / remove, which is the same vocabulary `useCartAction` uses.
 */

import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { MenuItem, Restaurant } from '../data/models/restaurant';

export interface BasketLine {
  restaurantId: number;
  restaurantName: string;
  itemId: number;
  name: string;
  price: number;
  quantity: number;
}

interface BasketState {
  lines: BasketLine[];
  add: (restaurant: Restaurant, item: MenuItem) => void;
  setQuantity: (itemId: number, quantity: number) => void;
  remove: (itemId: number) => void;
  clearRestaurant: (restaurantId: number) => void;
  clear: () => void;
}

/** One line per dish; a second "add" of the same dish bumps its quantity. */
export const useRestaurantBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      lines: [],

      add: (restaurant, item) =>
        set((state) => {
          const existing = state.lines.find((line) => line.itemId === item.id);
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.itemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                itemId: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
              },
            ],
          };
        }),

      setQuantity: (itemId, quantity) =>
        set((state) => ({
          // 0 removes the line, which is what the stepper's trash state means at `min: 0`.
          lines:
            quantity <= 0
              ? state.lines.filter((line) => line.itemId !== itemId)
              : state.lines.map((line) =>
                  line.itemId === itemId ? { ...line, quantity } : line,
                ),
        })),

      remove: (itemId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.itemId !== itemId) })),

      /** One kitchen's lines. A delivery order is per restaurant, so this is the usual "clear". */
      clearRestaurant: (restaurantId) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.restaurantId !== restaurantId),
        })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'ozio_restaurant_basket',
      // Only the lines are worth keeping; the actions are rebuilt on load.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export interface RestaurantBasket {
  lines: BasketLine[];
  /** Quantity of one dish, `0` when it is not in the basket. */
  quantityOf: (itemId: number) => number;
  itemCount: number;
  total: number;
  add: (restaurant: Restaurant, item: MenuItem) => void;
  setQuantity: (itemId: number, quantity: number) => void;
  clear: () => void;
}

/**
 * The basket for ONE restaurant. Lines from other restaurants stay in the store untouched — a
 * delivery order is per kitchen, so mixing them in one total would be wrong.
 */
export function useRestaurantBasket(restaurantId: number | null): RestaurantBasket {
  const all = useRestaurantBasketStore((state) => state.lines);
  const addLine = useRestaurantBasketStore((state) => state.add);
  const setQuantityLine = useRestaurantBasketStore((state) => state.setQuantity);
  const clearAll = useRestaurantBasketStore((state) => state.clear);
  const clearOne = useRestaurantBasketStore((state) => state.clearRestaurant);

  const lines = all.filter((line) => line.restaurantId === restaurantId);

  const quantityOf = useCallback(
    (itemId: number) => all.find((line) => line.itemId === itemId)?.quantity ?? 0,
    [all],
  );

  // The filtering lives in the store, not here: doing it with a loop of `setQuantity(…, 0)` calls
  // read `all` inside the callback, which the React compiler cannot keep memoized.
  const clear = useCallback(() => {
    if (restaurantId === null) clearAll();
    else clearOne(restaurantId);
  }, [clearAll, clearOne, restaurantId]);

  return {
    lines,
    quantityOf,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    add: addLine,
    setQuantity: setQuantityLine,
    clear,
  };
}
