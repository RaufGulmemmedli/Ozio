/**
 * Remote source for the rewards module — paths only, no parsing.
 *
 * Two destinations, and the split is the whole point of this file:
 *
 *  1. **Mock** (N1–N4, N6): `remote.mock('rewards')` → `/api/mock/rewards/…`, intercepted by MSW
 *     (`./rewards.mock.ts`). It can never reach the real host, so a missing handler is a 404 from
 *     the same origin and never a stray call to `api.ozio10.az`. The PROPOSED REST shapes these
 *     mirror are in `mock-modules.md` §7, so swapping in a backend is: change `remote.mock(...)`
 *     to `remote.v1`, drop the `/rewards/` prefix duplication, delete the handler file.
 *  2. **Real** (N5 digital receipt): nothing here. `GET /customer/api/v2/orders/{id}` belongs to
 *     the orders module, so the receipt uses its `useOrder` hook and this file never touches the
 *     real host at all.
 */
import { remote, type RemoteResult } from '@/core/network';

import { REWARDS_MOCK_MODULE } from '../rewards.flags';

const mock = remote.mock(REWARDS_MOCK_MODULE);

export interface NewAlertBody {
  product_name: string;
  store_name: string;
  target_price: number;
}

export interface NewMemberBody {
  name: string;
  phone: string;
  monthly_limit: number | null;
}

/**
 * `?state=` on a mock read: the deterministic demo switch the screen docs ask for
 * (`?preview=limit` on the wheel asks the handler for the daily-limit payload instead of faking it
 * client-side). A real backend simply ignores an unknown query parameter.
 */
const stateQuery = (state?: string) => (state ? { state } : undefined);

export const rewardsRemote = {
  /* ------------------------------------------------------------ N1 wheel (mock) */
  wheel: (signal?: AbortSignal, state?: string): RemoteResult<unknown> =>
    mock.get('wheel', stateQuery(state), { signal }),
  /** The prize is drawn by the handler — the client never picks it. */
  spin: (): RemoteResult<unknown> => mock.post('wheel/spin'),

  /* --------------------------------------------------------- N2 missions (mock) */
  missions: (signal?: AbortSignal, state?: string): RemoteResult<unknown> =>
    mock.get('missions', stateQuery(state), { signal }),
  claimMission: (id: string): RemoteResult<unknown> =>
    mock.post(`missions/${encodeURIComponent(id)}/claim`),

  /* ------------------------------------------------------ N3 family card (mock) */
  family: (signal?: AbortSignal, state?: string): RemoteResult<unknown> =>
    mock.get('family', stateQuery(state), { signal }),
  saveFamilySettings: (body: Record<string, boolean>): RemoteResult<unknown> =>
    mock.put('family/settings', body),
  addFamilyMember: (body: NewMemberBody): RemoteResult<unknown> => mock.post('family/members', body),
  setMemberLimit: (id: string, limit: number | null): RemoteResult<unknown> =>
    mock.patch(`family/members/${encodeURIComponent(id)}`, { monthly_limit: limit }),
  removeFamilyMember: (id: string): RemoteResult<unknown> =>
    mock.del(`family/members/${encodeURIComponent(id)}`),

  /* ------------------------------------------------------- N4 smart list (mock) */
  smartList: (signal?: AbortSignal, state?: string): RemoteResult<unknown> =>
    mock.get('smart-list', stateQuery(state), { signal }),
  addSmartListItem: (title: string): RemoteResult<unknown> =>
    mock.post('smart-list/items', { title }),
  updateSmartListItem: (
    id: string,
    body: { checked?: boolean; quantity?: number },
  ): RemoteResult<unknown> => mock.patch(`smart-list/items/${encodeURIComponent(id)}`, body),
  removeSmartListItem: (id: string): RemoteResult<unknown> =>
    mock.del(`smart-list/items/${encodeURIComponent(id)}`),

  /* ----------------------------------------------------- N6 price alerts (mock) */
  priceAlerts: (signal?: AbortSignal, state?: string): RemoteResult<unknown> =>
    mock.get('price-alerts', stateQuery(state), { signal }),
  addPriceAlert: (body: NewAlertBody): RemoteResult<unknown> => mock.post('price-alerts', body),
  togglePriceAlert: (id: string, active: boolean): RemoteResult<unknown> =>
    mock.patch(`price-alerts/${encodeURIComponent(id)}`, { active }),
  setAlertTarget: (id: string, target: number): RemoteResult<unknown> =>
    mock.patch(`price-alerts/${encodeURIComponent(id)}`, { target_price: target }),
  removePriceAlert: (id: string): RemoteResult<unknown> =>
    mock.del(`price-alerts/${encodeURIComponent(id)}`),

  /** The notification feed behind the price-alerts preview card. */
  feed: (signal?: AbortSignal): RemoteResult<unknown> => mock.get('feed', undefined, { signal }),

} as const;
