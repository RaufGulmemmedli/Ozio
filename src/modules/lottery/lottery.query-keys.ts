/**
 * Query keys for the lottery module (and the 10-lar / Ozio Plus screens it owns).
 * First element is always the module name, so sign-out drops them in one invalidation.
 */
import { moduleKeys } from '@/core/query';

export const lotteryKeys = {
  ...moduleKeys('lottery'),
  /** `GET v1/lotteries/active`. */
  active: () => ['lottery', 'active'] as const,
  /** `GET v1/lotteries/active/details?lottery_id=` — the id is part of the key. */
  details: (lotteryId: number) => ['lottery', 'details', lotteryId] as const,
  /** `GET v1/lotteries/policy`. */
  policy: () => ['lottery', 'policy'] as const,
  /** `GET v1/lotteries/tickets?lottery_id=`. */
  tickets: (lotteryId: number) => ['lottery', 'tickets', lotteryId] as const,
  ticket: (lotteryId: number, ticketId: string) =>
    ['lottery', 'tickets', lotteryId, ticketId] as const,
} as const;

export const tenCartKeys = {
  ...moduleKeys('tenCarts'),
  /** `GET v1/ten-carts`. */
  list: () => ['tenCarts', 'list'] as const,
} as const;

export const plusKeys = {
  ...moduleKeys('ozioPlus'),
  /** `GET v1/ozio-plus/categories` — the store chains. */
  chains: () => ['ozioPlus', 'chains'] as const,
  /** `GET v1/ozio-plus/campaigns`. */
  campaigns: () => ['ozioPlus', 'campaigns'] as const,
  /** `GET v1/ozio-plus/products?category_id=`. */
  products: (categoryId: number | null) => ['ozioPlus', 'products', categoryId] as const,
} as const;
