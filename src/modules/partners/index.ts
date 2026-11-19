/**
 * Public surface of the partners module. Other modules import from here and nowhere else.
 *
 * Endpoints behind these hooks (all `live: verified`):
 *   `usePartnerCategories` → `GET v1/ozio-partners` (returns **categories**, not partners)
 *   `usePartnerModule`     → `GET v1/ozio-partners/modules/{categoryId}`
 *   `useBranches`          → `GET v1/ozio-partners/modules/branch/{brandId}`
 *                            (coordinates are null on 191 of 197 live rows — never assume a point)
 *   `useCampaigns`         → `GET v1/ozio-plus/campaigns` + `GET v1/ozio-plus/categories`
 */
export {
  usePartnerCategories,
  usePartnerModule,
  usePartnerBrand,
  useBranches,
  useCampaigns,
  usePlusChains,
} from './hooks';

export { PartnerCard, type PartnerCardProps } from './components/PartnerCard';
export { PartnerLogo, type PartnerLogoProps } from './components/PartnerLogo';
export { CampaignCard, type CampaignCardProps } from './components/CampaignCard';

export { partnerKeys } from './partners.query-keys';
export { partnersRoutes } from './partners.routes';

export type {
  Branch,
  Campaign,
  PartnerBrand,
  PartnerCategory,
  PartnerSocialLink,
  PlusChain,
} from './data/models/partner';
export { daysLeft, isOpenAt, maxCashback, minutesToClock, usablePoint } from './data/models/partner';
