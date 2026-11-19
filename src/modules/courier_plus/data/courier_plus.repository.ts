/**
 * The only thing the hooks import: envelope → tolerant domain model, `Result` in / `Result` out,
 * never a throw (`unwrap()` in the hook is the single throw).
 *
 * The surface is exactly what a real-API module's repository would look like — see
 * `CourierPlusRepository` in `src/core/api/contracts/mock-contracts.ts`. The one mock-specific
 * behaviour that is *documented API behaviour*, not a shortcut: `GET hub` answers 404 while the
 * user is not a hub, and `hubProfile()` folds that into `null` so the gate state is not an error.
 */
import { isFail, mapResult, ok, parsePage, type Page, type Result } from '@/core/network';

import {
  parseDelivery,
  parseEarnings,
  parseHubDashboard,
  parseHubProfile,
  parseNearbyHub,
  parseOffer,
  parseOverview,
  parseRoute,
  type CpDelivery,
  type CpEarnings,
  type CpHubDashboard,
  type CpHubProfile,
  type CpNearbyHub,
  type CpOverview,
  type CpParcelOffer,
  type CpRoute,
} from './models/courier-plus';
import { courierPlusRemote } from './courier_plus.remote';

export interface RepoOptions {
  locale?: string;
  signal?: AbortSignal;
}

export interface SaveRouteInput {
  from: string;
  to: string;
  departMinutes: number;
  transport: CpRoute['transport'];
}

export interface RegisterHubInput {
  address: string;
  openMinutes: number;
  closeMinutes: number;
  capacity: number;
}

export const courierPlusRepository = {
  /** Balance, month summary, whether the route is live, whether the user is a hub. */
  overview: (opts: RepoOptions = {}): Promise<Result<CpOverview>> =>
    courierPlusRemote.overview(opts.signal).then((r) => mapResult(r, (env) => parseOverview(env.data))),

  route: (opts: RepoOptions = {}): Promise<Result<CpRoute>> =>
    courierPlusRemote.route(opts.signal).then((r) => mapResult(r, (env) => parseRoute(env.data))),

  saveRoute: (input: SaveRouteInput, opts: RepoOptions = {}): Promise<Result<CpRoute>> =>
    courierPlusRemote
      .saveRoute(
        {
          from: input.from.trim(),
          to: input.to.trim(),
          depart_minutes: input.departMinutes,
          transport: input.transport,
        },
        opts.signal,
      )
      .then((r) => mapResult(r, (env) => parseRoute(env.data))),

  /**
   * The parcels the server matched against the declared route. `pay` and `detourMinutes` are
   * server-computed — nothing here derives them.
   */
  matches: (opts: RepoOptions = {}): Promise<Result<Page<CpParcelOffer>>> =>
    courierPlusRemote.matches({}, opts.signal).then((r) =>
      mapResult(r, (env) =>
        parsePage<CpParcelOffer>(env.data, (raw) => parseOffer(raw, { locale: opts.locale })),
      ),
    ),

  /** Takes an offer. `notFound` means someone else got there first. */
  accept: (offerId: string, opts: RepoOptions = {}): Promise<Result<CpDelivery>> =>
    courierPlusRemote
      .accept(offerId, opts.signal)
      .then((r) => mapResult(r, (env) => parseDelivery(env.data, { locale: opts.locale }))),

  delivery: (offerId: string, opts: RepoOptions = {}): Promise<Result<CpDelivery>> =>
    courierPlusRemote
      .delivery(offerId, opts.signal)
      .then((r) => mapResult(r, (env) => parseDelivery(env.data, { locale: opts.locale }))),

  /** One step forward; the last step is what credits the balance (server-side). */
  advance: (offerId: string, opts: RepoOptions = {}): Promise<Result<CpDelivery>> =>
    courierPlusRemote
      .advance(offerId, opts.signal)
      .then((r) => mapResult(r, (env) => parseDelivery(env.data, { locale: opts.locale }))),

  earnings: (opts: RepoOptions = {}): Promise<Result<CpEarnings>> =>
    courierPlusRemote
      .earnings(opts.signal)
      .then((r) => mapResult(r, (env) => parseEarnings(env.data, { locale: opts.locale }))),

  /**
   * The hub profile, or `null` when the user has not registered one. A 404 is the documented
   * "no hub yet" answer, so it is folded into `null` instead of surfacing as an error state.
   */
  hubProfile: (opts: RepoOptions = {}): Promise<Result<CpHubProfile | null>> =>
    courierPlusRemote.hub(opts.signal).then((r) => {
      if (isFail(r)) {
        return r.failure.kind === 'notFound' ? ok<CpHubProfile | null>(null) : r;
      }
      return ok<CpHubProfile | null>(parseHubProfile(r.value.data));
    }),

  registerHub: (input: RegisterHubInput, opts: RepoOptions = {}): Promise<Result<CpHubProfile>> =>
    courierPlusRemote
      .registerHub(
        {
          address: input.address.trim(),
          open_minutes: input.openMinutes,
          close_minutes: input.closeMinutes,
          capacity: input.capacity,
        },
        opts.signal,
      )
      .then((r) => mapResult(r, (env) => parseHubProfile(env.data))),

  /** The panel. `notFound` here means "not a hub yet" — the view shows the gate, not an error. */
  hubDashboard: (opts: RepoOptions = {}): Promise<Result<CpHubDashboard>> =>
    courierPlusRemote
      .hubDashboard(opts.signal)
      .then((r) => mapResult(r, (env) => parseHubDashboard(env.data))),

  /** Checks a hand-over code. The code is never logged; `notFound` = wrong code. */
  handOver: (code: string, opts: RepoOptions = {}): Promise<Result<void>> =>
    courierPlusRemote.handOver(code.trim(), opts.signal).then((r) => mapResult(r, () => undefined)),

  nearbyHubs: (opts: RepoOptions = {}): Promise<Result<CpNearbyHub[]>> =>
    courierPlusRemote.nearbyHubs(opts.signal).then((r) =>
      mapResult(
        r,
        (env) =>
          parsePage<CpNearbyHub>(env.data, (raw) => parseNearbyHub(raw, { locale: opts.locale }), {
            key: 'hubs',
          }).items,
      ),
    ),
};

export type CourierPlusRepository = typeof courierPlusRepository;
