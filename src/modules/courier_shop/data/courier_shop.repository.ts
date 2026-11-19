/**
 * The only thing the hooks import. Envelope → tolerant domain model, `Result` in / `Result` out,
 * never a throw (`unwrap()` in the hook is the single throw).
 *
 * Deliberately identical in shape to a real-API module's repository: a future backend means
 * changing the transport in `courier_shop.remote.ts` and deleting `courier_shop.mock.ts`.
 */
import { mapResult, type Result } from '@/core/network';

import {
  parseBagItems,
  parseBagQuote,
  parseBagReceipt,
  parseExpertBooking,
  parseExpertCatalog,
  parseFitProduct,
  parseFitResult,
  parseFitSession,
  type BagDraftLine,
  type BagItem,
  type BagQuote,
  type BagReceipt,
  type ExpertBooking,
  type ExpertCatalog,
  type ExpertProductKind,
  type ExpertServiceKind,
  type FitProduct,
  type FitResult,
  type FitSession,
} from './models';
import { courierShopRemote } from './courier_shop.remote';

export interface RepoOptions {
  signal?: AbortSignal;
}

/** Drops empty / zero lines before they reach the wire. */
const payload = (lines: readonly BagDraftLine[]) =>
  lines
    .filter((line) => line.id !== '' && line.quantity > 0)
    .map((line) => ({ id: line.id, quantity: Math.trunc(line.quantity) }));

export const courierShopRepository = {
  /* --------------------------------------------------------------- bag */

  bagItems: (opts: RepoOptions = {}): Promise<Result<BagItem[]>> =>
    courierShopRemote.bagItems(opts).then((r) => mapResult(r, (env) => parseBagItems(env.data))),

  /** Server-computed totals. The view renders them; it never adds anything up. */
  bagQuote: (lines: readonly BagDraftLine[], opts: RepoOptions = {}): Promise<Result<BagQuote>> =>
    courierShopRemote
      .bagQuote(payload(lines), opts)
      .then((r) => mapResult(r, (env) => parseBagQuote(env.data))),

  bagConfirm: (
    lines: readonly BagDraftLine[],
    opts: RepoOptions = {},
  ): Promise<Result<BagReceipt>> =>
    courierShopRemote
      .bagConfirm(payload(lines), opts)
      .then((r) => mapResult(r, (env) => parseBagReceipt(env.data))),

  /* --------------------------------------------------------------- fit */

  fitProduct: (opts: RepoOptions = {}): Promise<Result<FitProduct>> =>
    courierShopRemote.fitProduct(opts).then((r) => mapResult(r, (env) => parseFitProduct(env.data))),

  /** `null` means the courier is not at the door. */
  currentFit: (opts: RepoOptions = {}): Promise<Result<FitSession | null>> =>
    courierShopRemote.fitSession(opts).then((r) => mapResult(r, (env) => parseFitSession(env.data))),

  startFit: (sizes: readonly string[], opts: RepoOptions = {}): Promise<Result<FitSession | null>> =>
    courierShopRemote
      .startFit(sizes, opts)
      .then((r) => mapResult(r, (env) => parseFitSession(env.data))),

  confirmFit: (
    kept: readonly string[],
    opts: RepoOptions = {},
  ): Promise<Result<FitResult | null>> =>
    courierShopRemote
      .confirmFit(kept, opts)
      .then((r) => mapResult(r, (env) => parseFitResult(env.data))),

  latestFitResult: (opts: RepoOptions = {}): Promise<Result<FitResult | null>> =>
    courierShopRemote.fitResult(opts).then((r) => mapResult(r, (env) => parseFitResult(env.data))),

  /* --------------------------------------------------------------- expert */

  expertCatalog: (
    product: ExpertProductKind,
    opts: RepoOptions = {},
  ): Promise<Result<ExpertCatalog>> =>
    courierShopRemote
      .expertCatalog(product, opts)
      .then((r) => mapResult(r, (env) => parseExpertCatalog(env.data))),

  book: (
    product: ExpertProductKind,
    service: ExpertServiceKind,
    slot: string,
    opts: RepoOptions = {},
  ): Promise<Result<ExpertBooking | null>> =>
    courierShopRemote
      .book({ product, service, slot }, opts)
      .then((r) => mapResult(r, (env) => parseExpertBooking(env.data))),

  latestBooking: (opts: RepoOptions = {}): Promise<Result<ExpertBooking | null>> =>
    courierShopRemote
      .latestBooking(opts)
      .then((r) => mapResult(r, (env) => parseExpertBooking(env.data))),

  /* --------------------------------------------------------------- debug */

  /** Arms one failure so the drawn error state is reachable without `?preview=error`. */
  failNextCall: (opts: RepoOptions = {}): Promise<Result<unknown>> =>
    courierShopRemote.failNextCall(opts).then((r) => mapResult(r, (env) => env.data)),

  resetDemo: (opts: RepoOptions = {}): Promise<Result<unknown>> =>
    courierShopRemote.resetDemo(opts).then((r) => mapResult(r, (env) => env.data)),
} as const;

export type CourierShopRepository = typeof courierShopRepository;
