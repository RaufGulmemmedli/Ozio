/**
 * "Pensiya günü" — the essentials basket a pensioner orders just before payday.
 *
 * Shapes follow `mock-contracts.ts` §13b and `api/mock-modules.md` §13b. Parsers never throw.
 * Every amount — line totals, the basket total, the pension figure — comes from the API; nothing
 * is multiplied or summed in a component (BUILD-CONTRACT rule 7), and **nothing is ever ordered**:
 * `order()` only moves mock state.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

export interface BasketItem {
  id: string;
  name: string;
  qty: number;
  /** Unit label, resolved by the API ("ədəd", "kq"). */
  unit: string;
  unitPrice: number;
  /** `qty × unitPrice`, computed by the API. */
  lineTotal: number;
}

export interface PensionPlan {
  /** ISO date of the next payday. */
  payday: string;
  /** Whole days from today to the payday. */
  daysUntilPayday: number;
  /** The monthly pension figure shown in the banner. */
  pension: number;
  items: BasketItem[];
  total: number;
  autoRepeat: boolean;
  ordered: boolean;
  /** `P-2291` once ordered — demo only, no order exists anywhere. */
  orderNumber: string | null;
  /** The demo order the result banner's "Sifarişə bax" points at. */
  orderId: string | null;
}

export function parseBasketItem(raw: unknown): BasketItem {
  const o = asObj(raw);
  return {
    id: str(o.id),
    name: str(o.name),
    qty: num(o.qty, 1),
    unit: str(o.unit),
    unitPrice: money(o.unit_price ?? o.unitPrice),
    lineTotal: money(o.line_total ?? o.lineTotal),
  };
}

export function parsePensionPlan(raw: unknown): PensionPlan {
  const o = asObj(raw);
  const orderNumber = str(o.order_number ?? o.orderNumber);
  const orderId = str(o.order_id ?? o.orderId);
  return {
    payday: str(o.payday),
    daysUntilPayday: num(o.days_until_payday ?? o.daysUntilPayday),
    pension: money(o.pension),
    items: asList(o.items).map(parseBasketItem),
    total: money(o.total),
    autoRepeat: bool(o.auto_repeat ?? o.autoRepeat),
    ordered: bool(o.ordered),
    orderNumber: orderNumber.length > 0 ? orderNumber : null,
    orderId: orderId.length > 0 ? orderId : null,
  };
}
