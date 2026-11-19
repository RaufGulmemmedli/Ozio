/**
 * The cashier screen's copy and nearby-market list — **MOCK**
 * (`GET /api/mock/topup/cashier?locale=`).
 *
 * `topup-cashier.html` draws four numbered steps and three nearby markets with a distance. There is
 * no "markets near me for a top-up" endpoint (`GET /stores` is dead on live; the replacement
 * `stores/search` needs lat+lng and returns shops, not till locations), so both come from the
 * fixture — which carries az/ru/en strings and is served by locale.
 */
import { asList, asObj, num, str } from '@/core/network';

export interface CashierStep {
  /** 1-based, as drawn in the pink disc. */
  index: number;
  text: string;
}

export interface NearbyMarket {
  id: string;
  /** "Bolmart · 28 May" — the name and the branch, as the fixture sends it. */
  name: string;
  /** Metres. Formatted by the view through `useFormat()`, never pre-rendered. */
  distanceMeters: number;
}

export interface CashierInfo {
  steps: CashierStep[];
  nearby: NearbyMarket[];
}

export const EMPTY_CASHIER_INFO: CashierInfo = { steps: [], nearby: [] };

export function parseCashierInfo(data: unknown): CashierInfo {
  const root = asObj(data);
  return {
    steps: asList(root.steps)
      .map((row, i) => {
        const o = asObj(row);
        return { index: num(o.index, i + 1), text: str(o.text) };
      })
      .filter((step) => step.text.length > 0),
    nearby: asList(root.nearby)
      .map((row, i) => {
        const o = asObj(row);
        return {
          id: str(o.id, `m${i}`),
          name: str(o.name),
          distanceMeters: num(o.distance_meters ?? o.distanceMeters),
        };
      })
      .filter((market) => market.name.length > 0),
  };
}
