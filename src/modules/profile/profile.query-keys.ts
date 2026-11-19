/**
 * Query keys for the profile / settings / help / history package.
 *
 * `profileKeys.me()` intentionally equals `queryKeys.profileMe` (`['profile','me']`) from
 * `@/core/query` — home, card and the register gate all read `GET v1/profile/me`, so every module
 * must share one cache entry (the gateway answers 429 when two calls hit one path at once).
 */
import { moduleKeys, queryKeys } from '@/core/query';

/** The four L8 "Tarixçə və çeklər" tabs (each tab reads its owning module's hook). */
export type HistoryTab = 'orders' | 'bonus' | 'tickets' | 'coupons';

export const profileKeys = {
  ...moduleKeys('profile'),
  /** The shared `GET v1/profile/me` entry. */
  me: () => queryKeys.profileMe,
  /** `GET v1/privacy-policies`; the locale is appended by `scoped()` at the call site. */
  policies: () => ['profile', 'policies'] as const,
} as const;

/*
 * The P1 counters and the L8 history tabs have **no keys here on purpose**: every one of those
 * reads belongs to another module and is made through its hook, so it lives under that module's
 * own key (`orderKeys`, `cardKeys`, `lotteryKeys`, `couponKeys`, `addressKeys`). Adding a key
 * here would mean a second cache entry for the same path — and the gateway answers 429 when two
 * calls hit one path at once.
 */
