/**
 * Partner remote source — paths only, one function per operation, no parsing.
 *
 * Every path is resolved through `callEndpoint()` so the version prefix and the live status come
 * from `core/api/contracts/endpoints.ts` and are never retyped here.
 *
 * | endpoint | path | live |
 * | --- | --- | --- |
 * | `PartnersPartners` | `GET v1/ozio-partners` | verified — returns **categories** |
 * | `PartnersModule` | `GET v1/ozio-partners/modules/{categoryId}` | verified |
 * | `PartnersBranches` | `GET v1/ozio-partners/modules/branch/{brandId}` | verified (coords unusable) |
 * | `PartnersPlusCampaigns` | `GET v1/ozio-plus/campaigns` | verified |
 * | `PartnersPlusCategories` | `GET v1/ozio-plus/categories` | verified |
 */
import { callEndpoint, type RemoteResult } from '@/core/network';
import type {
  PartnersBranchesData,
  PartnersModuleData,
  PartnersPartnersData,
  PartnersPlusCampaignsData,
  PartnersPlusCategoriesData,
} from '@/core/api/contracts/types';

export const partnersRemote = {
  /** Partner CATEGORIES (8 on live), not partners. */
  categories: (signal?: AbortSignal): RemoteResult<PartnersPartnersData> =>
    callEndpoint<PartnersPartnersData>('PartnersPartners', { signal }),

  /** The brands of one category. `categoryId` comes from `categories()`. */
  module: (categoryId: string | number, signal?: AbortSignal): RemoteResult<PartnersModuleData> =>
    callEndpoint<PartnersModuleData>('PartnersModule', { params: { id: categoryId }, signal }),

  /** The branches of one brand. */
  branches: (brandId: string | number, signal?: AbortSignal): RemoteResult<PartnersBranchesData> =>
    callEndpoint<PartnersBranchesData>('PartnersBranches', { params: { id: brandId }, signal }),

  /** Ozio Plus campaigns — one per store chain, carries the end date. */
  campaigns: (signal?: AbortSignal): RemoteResult<PartnersPlusCampaignsData> =>
    callEndpoint<PartnersPlusCampaignsData>('PartnersPlusCampaigns', { signal }),

  /** Ozio Plus "categories" = the store chains that own the campaigns. */
  plusChains: (signal?: AbortSignal): RemoteResult<PartnersPlusCategoriesData> =>
    callEndpoint<PartnersPlusCategoriesData>('PartnersPlusCategories', { signal }),
} as const;
