'use client';

/**
 * `useCartDrawer()` — the mini-cart drawer's open state.
 *
 * The drawer is **not a route** (ROUTES.md "Not routes (states)"), so the app shell's cart icon
 * (agent M2) opens it from anywhere:
 *
 * ```tsx
 * import { useCartDrawer, useCartCount } from '@/modules/cart';
 *
 * const open = useCartDrawer((s) => s.open);
 * const count = useCartCount();
 * <IconButton aria-label={t('nav.cart')} onClick={open} />
 * ```
 *
 * Zustand (not React context) so the store can also be driven from outside React —
 * `useCartDrawer.getState().open()` after an add-to-cart, for example.
 */
import { create } from 'zustand';

export interface CartDrawerState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export const useCartDrawer = create<CartDrawerState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
}));
