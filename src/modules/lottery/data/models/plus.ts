/**
 * "Ozio Plus" — the discounts catalogue behind `/offers/discounts`.
 *
 *   `GET v1/ozio-plus/categories` (verified) — the **store chains**, each with its
 *      `active_campaigns[{id, name}]`. The campaign `name` IS the period ("2-16 noyabr").
 *      There is no max-discount field.
 *   `GET v1/ozio-plus/campaigns`  (verified) — the same campaigns plus `start_date` / `end_date`.
 *   `GET v1/ozio-plus/products`   (verified) — `{total, products[{id, name, material_code,
 *      image{object_key}, price_info{old_price, new_price, discount_percentage}}]}`.
 *
 * The server **ignores** `page, skip, search, keyword, q, name, product_name, sort,
 * order_by, sortBy, order, sub_category_id`, and ignores `campaign_id` when `category_id`
 * is set. `limit` is capped at 50. So there is no server search and no server sort: both
 * happen client-side over the pages already loaded, and the UI must not imply otherwise.
 *
 * TODO(partners): `@/modules/partners` also reads `ozio-plus/categories` and
 * `ozio-plus/campaigns` (`usePlusCampaigns`, `usePlusCategories`). It has no public
 * `index.ts` yet, and modules may only import each other's barrels, so these two readers
 * exist twice for now — collapse onto `@/modules/partners` once it exports them.
 */
import { asList, asObj, int, money, num, str } from '@/core/network';

import { wallMoment, type WallMoment } from './wall-moment';

/** A store chain — what `ozio-plus/categories` calls a "category". */
export interface PlusChain {
  id: number;
  name: string;
  imageUrl: string | null;
  /** `active_campaigns` — the campaign name is the period, e.g. "2-16 noyabr". */
  campaigns: { id: number; name: string }[];
}

export interface PlusCampaign {
  id: number;
  /** The chain this campaign belongs to. */
  categoryId: number | null;
  /** The period as the server words it ("2-16 noyabr") — not a title. */
  name: string;
  startsAt: WallMoment | null;
  endsAt: WallMoment | null;
}

export interface PlusProduct {
  id: number;
  name: string;
  /** Chain SKU. The only other identifier a row carries. */
  materialCode: string;
  imageUrl: string | null;
  /** Pre-campaign price, AZN. */
  oldPrice: number;
  /** Campaign price, AZN. */
  newPrice: number;
  /** Server-sent percentage; never recomputed here (money is server data). */
  discountPercent: number;
}

const objectKey = (raw: unknown): string | null => {
  const url = str(asObj(raw).object_key) || str(asObj(raw).url);
  return url ? url : null;
};

export function parsePlusChain(raw: unknown): PlusChain {
  const o = asObj(raw);
  return {
    id: int(o.id),
    name: str(o.name),
    imageUrl: objectKey(o.image),
    campaigns: asList(o.active_campaigns).map((row) => {
      const c = asObj(row);
      return { id: int(c.id), name: str(c.name) };
    }),
  };
}

export function parsePlusCampaign(raw: unknown): PlusCampaign {
  const o = asObj(raw);
  const categoryId = int(o.category_id);
  return {
    id: int(o.id),
    categoryId: categoryId > 0 ? categoryId : null,
    name: str(o.name),
    startsAt: wallMoment(o.start_date),
    endsAt: wallMoment(o.end_date),
  };
}

export function parsePlusProduct(raw: unknown): PlusProduct {
  const o = asObj(raw);
  const price = asObj(o.price_info);
  return {
    id: int(o.id),
    name: str(o.name),
    materialCode: str(o.material_code),
    imageUrl: objectKey(o.image),
    oldPrice: money(price.old_price),
    newPrice: money(price.new_price),
    discountPercent: Math.round(num(price.discount_percentage)),
  };
}

/** Client-side sorts — the three the toolbar offers, because the server sorts nothing. */
export type PlusSort = 'default' | 'discount' | 'priceAsc' | 'priceDesc';

export function sortPlusProducts(items: readonly PlusProduct[], sort: PlusSort): PlusProduct[] {
  const copy = [...items];
  switch (sort) {
    case 'discount':
      return copy.sort((a, b) => b.discountPercent - a.discountPercent);
    case 'priceAsc':
      return copy.sort((a, b) => a.newPrice - b.newPrice);
    case 'priceDesc':
      return copy.sort((a, b) => b.newPrice - a.newPrice);
    default:
      return copy;
  }
}

/** Client-side search over the loaded pages only (`search` / `keyword` are ignored upstream). */
export function filterPlusProducts(items: readonly PlusProduct[], query: string): PlusProduct[] {
  const needle = query.trim().toLocaleLowerCase('az');
  if (!needle) return [...items];
  return items.filter(
    (item) =>
      item.name.toLocaleLowerCase('az').includes(needle) ||
      item.materialCode.toLocaleLowerCase('az').includes(needle),
  );
}
