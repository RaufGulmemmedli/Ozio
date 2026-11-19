/**
 * The rewards repository — the only thing the hooks import.
 *
 * N5 (the digital receipt) is **not** here: it reads the real `GET v2/orders/{id}`, which the
 * orders module already owns (`useOrder`), so this module maps that detail into a `Receipt`
 * instead of issuing a second request. See `hooks/use-receipt.ts`.
 *
 * Shape-identical to what a real-API module would expose (`RewardsRepository` in
 * `mock-contracts.ts`), so replacing MSW with a backend touches `rewards.remote.ts` and nothing
 * else. Every method returns `Result<DomainModel>`; the parsers never throw, and a 2xx that carries
 * no usable payload becomes a `parse` failure rather than an empty screen pretending to be data.
 */
import { mapResult, type Result } from '@/core/network';

import { rewardsRemote, type NewAlertBody, type NewMemberBody } from './rewards.remote';
import { parseFamilyCard, type FamilyCard, type FamilyCardSettings } from './models/family';
import { parseMissionsBoard, type MissionsBoard } from './models/mission';
import {
  parsePriceAlertsBoard,
  parseFeedNotification,
  type FeedNotification,
  type PriceAlertsBoard,
} from './models/price-alert';
import { parseSmartList, type SmartList } from './models/smart-list';
import {
  parseWheelSpin,
  parseWheelState,
  type WheelSpinResult,
  type WheelState,
} from './models/wheel';

type Envelope<T> = { data: T | null };

/** `Result<ApiEnvelope<unknown>>` → `Result<T>` through a tolerant parser. */
const parsed = <T>(
  result: Result<Envelope<unknown>>,
  parse: (data: unknown) => T,
): Result<T> => mapResult(result, (envelope) => parse(envelope.data));

export const rewardsRepository = {
  /* ------------------------------------------------------------------ N1 wheel */
  wheel: async (locale: string, signal?: AbortSignal, state?: string): Promise<Result<WheelState>> =>
    parsed(await rewardsRemote.wheel(signal, state), (data) => parseWheelState(data, locale)),

  /**
   * Posts a spin and returns the slice **the server picked**. `state` is only used to resolve the
   * index to a segment, never to choose one.
   */
  spin: async (state: WheelState, locale: string): Promise<Result<WheelSpinResult>> =>
    parsed(await rewardsRemote.spin(), (data) => parseWheelSpin(data, state, locale)),

  /* --------------------------------------------------------------- N2 missions */
  missions: async (
    locale: string,
    signal?: AbortSignal,
    state?: string,
  ): Promise<Result<MissionsBoard>> =>
    parsed(await rewardsRemote.missions(signal, state), (data) => parseMissionsBoard(data, locale)),

  claimMission: async (id: string, locale: string): Promise<Result<MissionsBoard>> =>
    parsed(await rewardsRemote.claimMission(id), (data) => parseMissionsBoard(data, locale)),

  /* ------------------------------------------------------------ N3 family card */
  family: async (
    locale: string,
    signal?: AbortSignal,
    state?: string,
  ): Promise<Result<FamilyCard>> =>
    parsed(await rewardsRemote.family(signal, state), (data) => parseFamilyCard(data, locale)),

  saveFamilySettings: async (
    settings: FamilyCardSettings,
    locale: string,
  ): Promise<Result<FamilyCard>> =>
    parsed(
      await rewardsRemote.saveFamilySettings({
        spend_alerts: settings.spendAlerts,
        child_limit: settings.childLimit,
        shared_bonus: settings.sharedBonus,
      }),
      (data) => parseFamilyCard(data, locale),
    ),

  addFamilyMember: async (body: NewMemberBody, locale: string): Promise<Result<FamilyCard>> =>
    parsed(await rewardsRemote.addFamilyMember(body), (data) => parseFamilyCard(data, locale)),

  setMemberLimit: async (
    id: string,
    limit: number | null,
    locale: string,
  ): Promise<Result<FamilyCard>> =>
    parsed(await rewardsRemote.setMemberLimit(id, limit), (data) => parseFamilyCard(data, locale)),

  removeFamilyMember: async (id: string, locale: string): Promise<Result<FamilyCard>> =>
    parsed(await rewardsRemote.removeFamilyMember(id), (data) => parseFamilyCard(data, locale)),

  /* ------------------------------------------------------------- N4 smart list */
  smartList: async (
    locale: string,
    signal?: AbortSignal,
    state?: string,
  ): Promise<Result<SmartList>> =>
    parsed(await rewardsRemote.smartList(signal, state), (data) => parseSmartList(data, locale)),

  addSmartListItem: async (title: string, locale: string): Promise<Result<SmartList>> =>
    parsed(await rewardsRemote.addSmartListItem(title), (data) => parseSmartList(data, locale)),

  updateSmartListItem: async (
    id: string,
    body: { checked?: boolean; quantity?: number },
    locale: string,
  ): Promise<Result<SmartList>> =>
    parsed(await rewardsRemote.updateSmartListItem(id, body), (data) =>
      parseSmartList(data, locale),
    ),

  removeSmartListItem: async (id: string, locale: string): Promise<Result<SmartList>> =>
    parsed(await rewardsRemote.removeSmartListItem(id), (data) => parseSmartList(data, locale)),

  /* ----------------------------------------------------------- N6 price alerts */
  priceAlerts: async (
    locale: string,
    signal?: AbortSignal,
    state?: string,
  ): Promise<Result<PriceAlertsBoard>> =>
    parsed(await rewardsRemote.priceAlerts(signal, state), (data) =>
      parsePriceAlertsBoard(data, locale),
    ),

  addPriceAlert: async (body: NewAlertBody, locale: string): Promise<Result<PriceAlertsBoard>> =>
    parsed(await rewardsRemote.addPriceAlert(body), (data) => parsePriceAlertsBoard(data, locale)),

  togglePriceAlert: async (
    id: string,
    active: boolean,
    locale: string,
  ): Promise<Result<PriceAlertsBoard>> =>
    parsed(await rewardsRemote.togglePriceAlert(id, active), (data) =>
      parsePriceAlertsBoard(data, locale),
    ),

  setAlertTarget: async (
    id: string,
    target: number,
    locale: string,
  ): Promise<Result<PriceAlertsBoard>> =>
    parsed(await rewardsRemote.setAlertTarget(id, target), (data) =>
      parsePriceAlertsBoard(data, locale),
    ),

  removePriceAlert: async (id: string, locale: string): Promise<Result<PriceAlertsBoard>> =>
    parsed(await rewardsRemote.removePriceAlert(id), (data) => parsePriceAlertsBoard(data, locale)),

  feed: async (locale: string, signal?: AbortSignal): Promise<Result<FeedNotification[]>> => {
    const result = await rewardsRemote.feed(signal);
    return mapResult(result, (envelope) =>
      (Array.isArray(envelope.data) ? envelope.data : []).map((row) =>
        parseFeedNotification(row, locale),
      ),
    );
  },

} as const;

export type RewardsRepository = typeof rewardsRepository;
