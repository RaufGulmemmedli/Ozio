/**
 * Raw calls for `courier_plus`. One place, one list of paths.
 *
 * Every call goes through `remote.mock('courier_plus')`, i.e. `/api/mock/courier_plus/<path>` —
 * **never** the real host: there is no courier-plus service upstream (the gateway answers plain
 * text `Backend service does not exist`).
 *
 * The paths mirror the PROPOSED REST in api/mock-modules.md §3
 * (`/customer/api/v1/courier-plus/...`), so moving to a real backend is one edit here:
 * `remote.mock('courier_plus')` → `remote.v1` with the `courier-plus/` prefix, then delete
 * `courier_plus.mock.ts`.
 */
import { remote, type RemoteResult } from '@/core/network';

const cp = remote.mock('courier_plus');

export interface SaveRoutePayload {
  from: string;
  to: string;
  depart_minutes: number;
  transport: string;
}

export interface RegisterHubPayload {
  address: string;
  open_minutes: number;
  close_minutes: number;
  capacity: number;
}

export const courierPlusRemote = {
  /** `GET courier-plus/overview`. */
  overview: (signal?: AbortSignal): RemoteResult<unknown> =>
    cp.get('overview', undefined, { signal }),

  /** `GET courier-plus/route`. */
  route: (signal?: AbortSignal): RemoteResult<unknown> => cp.get('route', undefined, { signal }),

  /** `PUT courier-plus/route` — saving always switches courier mode on. */
  saveRoute: (body: SaveRoutePayload, signal?: AbortSignal): RemoteResult<unknown> =>
    cp.put('route', body, { signal }),

  /** `GET courier-plus/matches?offset&limit` — the server does the matching. */
  matches: (
    params: { offset?: number; limit?: number } = {},
    signal?: AbortSignal,
  ): RemoteResult<unknown> =>
    cp.get('matches', { offset: params.offset ?? 0, limit: params.limit ?? 20 }, { signal }),

  /** `POST courier-plus/offers/{id}/accept` — 404 when it is already taken. */
  accept: (offerId: string, signal?: AbortSignal): RemoteResult<unknown> =>
    cp.post(`offers/${encodeURIComponent(offerId)}/accept`, undefined, { signal }),

  /** `GET courier-plus/deliveries/{id}`. */
  delivery: (offerId: string, signal?: AbortSignal): RemoteResult<unknown> =>
    cp.get(`deliveries/${encodeURIComponent(offerId)}`, undefined, { signal }),

  /** `POST courier-plus/deliveries/{id}/advance` — one step forward. */
  advance: (offerId: string, signal?: AbortSignal): RemoteResult<unknown> =>
    cp.post(`deliveries/${encodeURIComponent(offerId)}/advance`, undefined, { signal }),

  /** `GET courier-plus/earnings`. */
  earnings: (signal?: AbortSignal): RemoteResult<unknown> =>
    cp.get('earnings', undefined, { signal }),

  /** `GET courier-plus/hub` — 404 while the user is not a hub. */
  hub: (signal?: AbortSignal): RemoteResult<unknown> => cp.get('hub', undefined, { signal }),

  /** `PUT courier-plus/hub`. */
  registerHub: (body: RegisterHubPayload, signal?: AbortSignal): RemoteResult<unknown> =>
    cp.put('hub', body, { signal }),

  /** `GET courier-plus/hub/dashboard` — 404 while the user is not a hub. */
  hubDashboard: (signal?: AbortSignal): RemoteResult<unknown> =>
    cp.get('hub/dashboard', undefined, { signal }),

  /** `POST courier-plus/hub/handover` — the code is checked server-side and never echoed back. */
  handOver: (code: string, signal?: AbortSignal): RemoteResult<unknown> =>
    cp.post('hub/handover', { code }, { signal }),

  /** `GET courier-plus/hubs/nearby`. */
  nearbyHubs: (signal?: AbortSignal): RemoteResult<unknown> =>
    cp.get('hubs/nearby', undefined, { signal }),
};
