/**
 * Partner repository — the only thing the hooks import. Envelope → domain model, always a
 * `Result`, never a throw.
 */
import { asList, asObj, isFail, mapResult, ok, type Result } from '@/core/network';
import {
  parseBranches,
  parseCampaign,
  parsePartnerBrands,
  parsePartnerCategories,
  parsePlusChain,
  type Branch,
  type Campaign,
  type PartnerBrand,
  type PartnerCategory,
  type PlusChain,
} from './models/partner';
import { partnersRemote } from './partners.remote';

export interface BrandResolution {
  brand: PartnerBrand | null;
  /** The categories that were searched, so a caller can show the breadcrumb even on a miss. */
  categories: PartnerCategory[];
}

export const partnersRepository = {
  categories: async (locale: string, signal?: AbortSignal): Promise<Result<PartnerCategory[]>> => {
    const res = await partnersRemote.categories(signal);
    return mapResult(res, (env) => parsePartnerCategories(env.data, locale));
  },

  /** The brands of one category. `categoryName` only decorates the rows (breadcrumbs, chips). */
  brands: async (
    category: { id: string; name: string },
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<PartnerBrand[]>> => {
    const res = await partnersRemote.module(category.id, signal);
    return mapResult(res, (env) => parsePartnerBrands(env.data, category, locale));
  },

  branches: async (brandId: string, locale: string, signal?: AbortSignal): Promise<Result<Branch[]>> => {
    const res = await partnersRemote.branches(brandId, signal);
    return mapResult(res, (env) => parseBranches(env.data, locale));
  },

  /**
   * Resolve one brand by id.
   *
   * There is no "brand by id" endpoint: a brand only exists inside a category listing. When the
   * caller knows the category (the link carries `?category=`) that is a single request; otherwise
   * the categories are walked **sequentially** (never two in flight — the gateway answers 429 on
   * same-path concurrency) and the walk stops at the first match. Every step is a cached query
   * underneath, so the fan-out is paid once per session at most.
   */
  brand: async (
    brandId: string,
    categoryId: string | null,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<BrandResolution>> => {
    const categoriesRes = await partnersRepository.categories(locale, signal);
    if (isFail(categoriesRes)) return categoriesRes;
    const categories = categoriesRes.value;

    const ordered = categoryId
      ? [
          ...categories.filter((c) => c.id === categoryId),
          ...categories.filter((c) => c.id !== categoryId),
        ]
      : categories;

    for (const category of ordered) {
      const brandsRes = await partnersRepository.brands(category, locale, signal);
      if (isFail(brandsRes)) continue; // one broken category must not hide the rest
      const found = brandsRes.value.find((b) => b.id === brandId);
      if (found) return ok({ brand: found, categories });
    }
    return ok({ brand: null, categories });
  },

  /**
   * Campaigns, with the owning chain's name folded in from `ozio-plus/categories`.
   * The two calls are **sequential**: different paths, but one screen must not burst the gateway.
   */
  campaigns: async (locale: string, signal?: AbortSignal): Promise<Result<Campaign[]>> => {
    const res = await partnersRemote.campaigns(signal);
    if (isFail(res)) return res;
    const rows = asList(asObj(res.value.data).campaigns ?? res.value.data);
    const campaigns = rows.map(parseCampaign).filter((c) => c.id > 0 || c.periodLabel.length > 0);

    const chainsRes = await partnersRemote.plusChains(signal);
    if (isFail(chainsRes)) return ok(campaigns); // names are decoration, not the payload
    const chains = asList(asObj(chainsRes.value.data).categories).map((row) =>
      parsePlusChain(row, locale),
    );
    const byId = new Map(chains.map((chain) => [chain.id, chain.name]));
    return ok(campaigns.map((c) => ({ ...c, categoryName: byId.get(c.categoryId) ?? null })));
  },

  plusChains: async (locale: string, signal?: AbortSignal): Promise<Result<PlusChain[]>> => {
    const res = await partnersRemote.plusChains(signal);
    return mapResult(res, (env) =>
      asList(asObj(env.data).categories).map((row) => parsePlusChain(row, locale)),
    );
  },
} as const;
