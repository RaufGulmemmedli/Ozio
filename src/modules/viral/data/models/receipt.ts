/**
 * The scanned till receipt.
 *
 * `lineStoreTotal`, `lineOzioTotal`, `storeTotal`, `ozioTotal` and `saving` are **server numbers**:
 * the handler computes them, so the comparison card prints rather than calculates.
 *
 * `recognized: false` is a normal 200 answer, not a failure — it is the "çek tanınmadı" state, and
 * a transport problem still arrives as a `Failure`.
 */
import { asList, asObj, bool, int, money, pickTranslation, str } from '@/core/network';

export interface ReceiptItem {
  id: string;
  /** Localized, e.g. "Süd 1L". */
  name: string;
  qty: number;
  storePrice: number;
  ozioPrice: number;
  /** `storePrice * qty`, from the mock. */
  lineStoreTotal: number;
  /** `ozioPrice * qty`, from the mock. */
  lineOzioTotal: number;
}

export interface ScannedReceipt {
  /** `false` → the "çek tanınmadı" state; `items` is then empty. */
  recognized: boolean;
  /** Localized store name, e.g. "Bravo Supermarket". */
  storeName: string;
  /** Localized relative day, e.g. "Dünən". */
  dateLabel: string;
  items: ReceiptItem[];
  itemCount: number;
  storeTotal: number;
  ozioTotal: number;
  saving: number;
  /** The headline percentage, from the mock. */
  discountPercent: number;
}

export const EMPTY_RECEIPT: ScannedReceipt = {
  recognized: false,
  storeName: '',
  dateLabel: '',
  items: [],
  itemCount: 0,
  storeTotal: 0,
  ozioTotal: 0,
  saving: 0,
  discountPercent: 0,
};

export function parseReceiptItem(raw: unknown, locale = 'az'): ReceiptItem {
  const row = asObj(raw);
  return {
    id: str(row.id),
    name: pickTranslation(row.name_translations, locale),
    qty: int(row.qty, 1),
    storePrice: money(row.store_price),
    ozioPrice: money(row.ozio_price),
    lineStoreTotal: money(row.line_store_total),
    lineOzioTotal: money(row.line_ozio_total),
  };
}

export function parseScannedReceipt(raw: unknown, locale = 'az'): ScannedReceipt {
  const row = asObj(raw);
  return {
    recognized: bool(row.recognized),
    storeName: pickTranslation(row.store_name_translations, locale),
    dateLabel: pickTranslation(row.date_label_translations, locale),
    items: asList(row.items).map((i) => parseReceiptItem(i, locale)),
    itemCount: int(row.item_count),
    storeTotal: money(row.store_total),
    ozioTotal: money(row.ozio_total),
    saving: money(row.saving),
    discountPercent: int(row.discount_percent),
  };
}

/** What `POST receipts/add-to-cart` answers with. Nothing is really added. */
export interface ReceiptCartResult {
  itemCount: number;
  total: number;
  simulated: boolean;
}

export function parseReceiptCartResult(raw: unknown): ReceiptCartResult {
  const row = asObj(raw);
  return {
    itemCount: int(row.item_count),
    total: money(row.total),
    simulated: row.simulated !== false,
  };
}
