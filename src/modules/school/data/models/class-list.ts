/**
 * The class shopping list ("Sinif siyahısı") — the supplies one class needs, shared by a teacher.
 *
 * `lineTotal`, `total`, `itemCount` and `savings` are all **server numbers**: the mock sends them
 * and the parser only reads them. Nothing in `view/` multiplies a price by a quantity.
 */
import { asList, asObj, int, money, pickTranslation, str } from '@/core/network';

export interface ClassListItem {
  id: string;
  /** Localized product name, e.g. "Dəftər 48 vərəq". */
  name: string;
  qty: number;
  /** Localized seller name, e.g. "Kitab Dünyası". */
  cheapestSeller: string;
  unitPrice: number;
  /** `unitPrice * qty`, computed by the mock (hard rule 7). */
  lineTotal: number;
  /** Category slug → `<ProductImage>`'s fallback glyph. */
  category: string;
}

export interface ClassList {
  id: string;
  /** Localized class name, e.g. "3-cü sinif A". */
  title: string;
  /** Localized school name, e.g. "Məktəb №132". */
  school: string;
  /** Localized teacher name; `''` for a list the user created. */
  sharedBy: string;
  items: ClassListItem[];
  /** Sum of the line totals — from the mock. */
  total: number;
  /** Sum of the quantities — from the mock ("14 məhsul"). */
  itemCount: number;
  /** What buying from the cheapest seller saves — from the mock ("Qənaət 4,35 ₼"). */
  savings: number;
  /** `https://ozio10.az/s/<id>` — the share link the mock issues. */
  shareLink: string;
}

export function parseClassListItem(raw: unknown, locale = 'az'): ClassListItem {
  const row = asObj(raw);
  return {
    id: str(row.id),
    name: pickTranslation(row.name_translations, locale),
    qty: int(row.qty, 1),
    cheapestSeller: pickTranslation(row.cheapest_seller_translations, locale),
    unitPrice: money(row.unit_price),
    lineTotal: money(row.line_total),
    category: str(row.category),
  };
}

export function parseClassList(raw: unknown, locale = 'az'): ClassList {
  const row = asObj(raw);
  return {
    id: str(row.id),
    title: pickTranslation(row.title_translations, locale),
    school: pickTranslation(row.school_translations, locale),
    sharedBy: pickTranslation(row.shared_by_translations, locale),
    items: asList(row.items).map((i) => parseClassListItem(i, locale)),
    total: money(row.total),
    itemCount: int(row.item_count),
    savings: money(row.savings),
    shareLink: str(row.share_link),
  };
}

/** What `POST class-lists/{id}/add-to-cart` answers with. Nothing is really added to a cart. */
export interface AddListToCartResult {
  itemCount: number;
  total: number;
  /** Always `true` here: the demo never writes to the real cart. */
  simulated: boolean;
}

export function parseAddListToCartResult(raw: unknown): AddListToCartResult {
  const row = asObj(raw);
  return {
    itemCount: int(row.item_count),
    total: money(row.total),
    simulated: row.simulated !== false,
  };
}
