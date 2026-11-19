/**
 * Smart shopping list (N4). `mock-modules.md` §7.
 *
 * `price`, `oldPrice` and the per-store totals come from the server; `total` and `saving` are the
 * one display exception BUILD-CONTRACT rule 7 allows (line × qty).
 */
import { asList, asObj, bool, int, money, nullableNum, str } from '@/core/network';

import { pickText, type Localized } from './localized';

/** Store dot colour. The fixture sends a hex string; an ARGB int (Flutter) is tolerated. */
export interface SmartListItem {
  id: string;
  title: string;
  quantity: number;
  checked: boolean;
  price: number | null;
  oldPrice: number | null;
  storeName: string;
  /** `#RRGGBB` for the dot, or `null` when the row matched no partner offer. */
  storeColor: string | null;
}

export interface SmartList {
  items: SmartListItem[];
  /** The person this list is shared with ("Leyla" in the fixture), '' when it is private. */
  sharedWith: string;
}

export interface SmartListStoreTotal {
  storeName: string;
  storeColor: string | null;
  count: number;
  total: number;
}

function parseColor(v: unknown): string | null {
  if (typeof v === 'string') {
    const s = v.trim();
    return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toUpperCase() : null;
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    // Flutter sends 0xAARRGGBB.
    const rgb = (v & 0xffffff).toString(16).padStart(6, '0');
    return `#${rgb.toUpperCase()}`;
  }
  return null;
}

export function parseSmartListItem(json: unknown, locale = 'az'): SmartListItem {
  const o = asObj(json);
  const quantity = int(o.quantity ?? o.qty ?? o.count, 1);
  return {
    id: str(o.id ?? o.item_id),
    title: pickText((o.title ?? o.name) as Localized, locale),
    quantity: quantity > 0 ? quantity : 1,
    checked: bool(o.checked ?? o.is_checked),
    price: nullableNum(o.price ?? o.new_price),
    oldPrice: nullableNum(o.oldPrice ?? o.old_price),
    storeName: pickText((o.storeName ?? o.store_name) as Localized, locale),
    storeColor: parseColor(o.storeColor ?? o.store_color),
  };
}

export function parseSmartList(json: unknown, locale = 'az'): SmartList {
  const o = asObj(json);
  const rows = asList(o.items);
  return {
    items: (rows.length > 0 ? rows : asList(json)).map((row) => parseSmartListItem(row, locale)),
    sharedWith: pickText((o.sharedWith ?? o.shared_with) as Localized, locale),
  };
}

export const itemDiscounted = (i: SmartListItem): boolean =>
  i.oldPrice !== null && i.price !== null && i.oldPrice > i.price;

/** Line total — the only arithmetic BUILD-CONTRACT rule 7 permits in the client. */
export const itemTotal = (i: SmartListItem): number => money((i.price ?? 0) * i.quantity);

export const itemSaving = (i: SmartListItem): number =>
  itemDiscounted(i) ? money(((i.oldPrice ?? 0) - (i.price ?? 0)) * i.quantity) : 0;

export const listTotal = (rows: readonly SmartListItem[]): number =>
  money(rows.reduce((sum, i) => sum + itemTotal(i), 0));

export const listSaving = (rows: readonly SmartListItem[]): number =>
  money(rows.reduce((sum, i) => sum + itemSaving(i), 0));

export const discountedItems = (rows: readonly SmartListItem[]): SmartListItem[] =>
  rows.filter(itemDiscounted);

export const otherItems = (rows: readonly SmartListItem[]): SmartListItem[] =>
  rows.filter((i) => !itemDiscounted(i));

/** Per-store breakdown, in first-appearance order, skipping rows with no store. */
export function storeTotals(rows: readonly SmartListItem[]): SmartListStoreTotal[] {
  const out: SmartListStoreTotal[] = [];
  for (const item of rows) {
    if (!item.storeName) continue;
    const row = out.find((s) => s.storeName === item.storeName);
    if (row) {
      row.count += 1;
      row.total = money(row.total + itemTotal(item));
    } else {
      out.push({
        storeName: item.storeName,
        storeColor: item.storeColor,
        count: 1,
        total: itemTotal(item),
      });
    }
  }
  return out;
}
