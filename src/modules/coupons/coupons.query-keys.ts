/**
 * Query keys for the coupons module. First element is always the module name so
 * sign-out can drop everything user-bound in one invalidation (04-data-layer.md).
 */
import { moduleKeys } from '@/core/query';

export const couponKeys = {
  ...moduleKeys('coupons'),
  /** The merged list (`coupons/global` + `promo-code`) that `/coupons` renders. */
  merged: () => ['coupons', 'merged'] as const,
  /** `GET v1/coupons/global` on its own — the home / offers counters use this. */
  global: () => ['coupons', 'global'] as const,
  /** `GET v1/promo-code` on its own. */
  promo: () => ['coupons', 'promo'] as const,
} as const;
