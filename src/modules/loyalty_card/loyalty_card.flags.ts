/**
 * Which feature flag gates which part of this module.
 *
 * The card, the balance and the bonus transactions are **real API data** and are
 * never flagged. Everything tier-shaped (`/card/levels`, the level-progress
 * block on `/card`, the "Səviyyə yüksəldi" celebration and the "Bonus yanır"
 * expiry block) has **no endpoint at all** — `GET v1/profile/me` sends no tier,
 * level, cashback percentage or expiry data (api/profile.md, re-verified
 * 2026-11-12). Those parts run on MSW fixtures under
 * `/api/mock/loyalty_card/…` and are gated by `loyaltyTiers`.
 */
import { FeatureFlags } from '@/core/config';

/** The mock namespace this module registers its MSW handlers under. */
export const LOYALTY_MOCK_MODULE = 'loyalty_card';

/** `true` when the tier ladder / level progress / expiry UI may be rendered. */
export const tiersEnabled = (): boolean => FeatureFlags.loyaltyTiers;

/**
 * What `<DemoBanner module=…>` is told this screen is. The shared
 * `common.demo.body` copy does not interpolate it today, but the contract asks
 * every tier screen to name its module.
 */
export const LOYALTY_DEMO_MODULE = 'loyalty_card';
