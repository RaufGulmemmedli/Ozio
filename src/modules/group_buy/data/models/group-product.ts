/**
 * The catalog `/group-buy/create` picks from, plus the tier preview the source computes for a
 * chosen target.
 *
 * `tierFactors` never reaches a component: the preview prices are asked for from the source
 * (`GET products` sends the whole 3/5/10 ladder per product) so no screen multiplies a price.
 */
import { asList, asObj, int, money, pickTranslation, str } from '@/core/network';

export interface GroupProductTier {
  people: number;
  price: number;
  percentOff: number;
}

export interface GroupProduct {
  id: string;
  title: string;
  pack: string;
  iconKey: string;
  retailPrice: number;
  /** The full 3 / 5 / 10 ladder. `/group-buy/create` slices it at the chosen target. */
  tiers: GroupProductTier[];
}

function parseProductTier(raw: unknown): GroupProductTier {
  const t = asObj(raw);
  return { people: int(t.people, 0), price: money(t.price), percentOff: int(t.percent_off, 0) };
}

export function parseGroupProduct(raw: unknown, locale = 'az'): GroupProduct {
  const p = asObj(raw);
  return {
    id: str(p.id),
    title: pickTranslation(p.translations, locale, 'title') || str(p.title),
    pack: pickTranslation(p.translations, locale, 'pack') || str(p.pack),
    iconKey: str(p.icon_key),
    retailPrice: money(p.retail_price),
    tiers: asList(p.tiers).map(parseProductTier),
  };
}

/** The targets the source offers (`GET products` echoes them, so the chips are not hardcoded). */
export interface GroupBuyCatalog {
  products: GroupProduct[];
  /** `[3, 5, 10]`. */
  targets: number[];
  /** `[6, 12, 24, 48]` hours. */
  deadlines: number[];
  /** The read-only delivery address the form shows at step 5. */
  address: string;
  /** Always 0 for a group order — one shared drop. */
  deliveryFee: number;
}

export function parseGroupBuyCatalog(raw: unknown, locale = 'az'): GroupBuyCatalog {
  const c = asObj(raw);
  return {
    products: asList(c.items).map((row) => parseGroupProduct(row, locale)),
    targets: asList(c.targets).map((v) => int(v, 0)).filter((v) => v > 0),
    deadlines: asList(c.deadlines).map((v) => int(v, 0)).filter((v) => v > 0),
    address: str(c.address),
    deliveryFee: money(c.delivery_fee),
  };
}

export const EMPTY_CATALOG: GroupBuyCatalog = {
  products: [],
  targets: [],
  deadlines: [],
  address: '',
  deliveryFee: 0,
};
