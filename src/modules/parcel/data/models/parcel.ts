/**
 * Parcel domain models + tolerant parsers.
 *
 * The shapes mirror `src/core/api/contracts/mock-contracts.ts` (which mirrors the Flutter
 * `parcel_models.dart`), so swapping the MSW handler for a real backend is a URL change in
 * `parcel.remote.ts` and nothing else.
 *
 * **No parser throws.** A missing or malformed field falls back to a safe default; the repository
 * turns a structurally impossible row into a `Failure` instead.
 */
import { asList, asObj, bool, dateIso, money, num, str } from '@/core/network';

export type ParcelSizePresetId = 'envelope' | 'small' | 'medium' | 'large';
export type ParcelPayer = 'sender' | 'recipient';
export type ParcelPaymentMethod = 'cash' | 'card' | 'ozioBalance';
export type ParcelStatus = 'searching' | 'assigned' | 'pickedUp' | 'delivered' | 'cancelled';
export type ParcelVehicle = 'foot' | 'bicycle' | 'scooter' | 'car';

export interface ParcelPoint {
  address: string;
  details: string;
  contactName: string;
  contactPhone: string;
  lat?: number;
  lng?: number;
}

export interface ParcelSpec {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  fragile: boolean;
  contents: string;
}

export interface ParcelSizePreset {
  id: ParcelSizePresetId;
  /** The S / M / L / XL label the design prints on the tile. */
  code: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  maxWeightKg: number;
}

export interface ParcelSavedCard {
  id: string;
  /** Already-masked, e.g. `•••• 4417`. Never a full number. */
  mask: string;
}

export interface ParcelSavedAddress {
  id: string;
  title: string;
  address: string;
  details: string;
  contactName: string;
  contactPhone: string;
}

export interface ParcelRules {
  maxWeightKg: number;
  maxSideCm: number;
  fromPrice: number;
  fragileFee: number;
  presets: ParcelSizePreset[];
  paymentMethods: ParcelPaymentMethod[];
  savedAddresses: ParcelSavedAddress[];
  savedCards: ParcelSavedCard[];
  /** Ozio balance, server data — the payment tile prints it, nothing computes it. */
  balance: number;
}

export interface ParcelDraft {
  pickup: ParcelPoint;
  dropoff: ParcelPoint;
  spec: ParcelSpec;
  payer: ParcelPayer;
  paymentMethod: ParcelPaymentMethod;
  cardId?: string;
  courierNote: string;
}

export interface ParcelQuote {
  price: number;
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  fragileFee: number;
  distanceKm: number;
  etaMinutes: number;
}

export interface ParcelCourier {
  name: string;
  phone: string;
  vehicle: ParcelVehicle;
  rating: number;
}

export interface Parcel {
  id: string;
  number: string;
  status: ParcelStatus;
  draft: ParcelDraft;
  quote: ParcelQuote;
  courier?: ParcelCourier;
  pickupCode: string;
  deliveryCode: string;
  createdAt: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export type ParcelFilter = 'all' | 'active' | 'delivered' | 'cancelled';

/* ------------------------------------------------------------------ derived */

export const parcelIsActive = (p: Parcel): boolean =>
  p.status === 'searching' || p.status === 'assigned' || p.status === 'pickedUp';

export const parcelCanCancel = (p: Parcel): boolean =>
  p.status === 'searching' || p.status === 'assigned';

/** 0-based index into the four tracking steps (`aria-current="step"` sits on this one). */
export const parcelStep = (status: ParcelStatus): number => {
  switch (status) {
    case 'searching':
      return 0;
    case 'assigned':
      return 1;
    case 'pickedUp':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
      return 0;
  }
};

export const parcelLongestSide = (spec: ParcelSpec): number =>
  Math.max(spec.lengthCm, spec.widthCm, spec.heightCm);

export const matchesParcelFilter = (p: Parcel, filter: ParcelFilter): boolean => {
  switch (filter) {
    case 'all':
      return true;
    case 'active':
      return parcelIsActive(p);
    case 'delivered':
      return p.status === 'delivered';
    case 'cancelled':
      return p.status === 'cancelled';
  }
};

/** Which preset a spec sits in, for the confirm modal's "M · 3,2 kq" line. */
export const presetForSpec = (
  spec: ParcelSpec,
  presets: readonly ParcelSizePreset[],
): ParcelSizePreset | undefined => {
  const side = parcelLongestSide(spec);
  return presets.find(
    (p) => side <= Math.max(p.lengthCm, p.widthCm, p.heightCm) && spec.weightKg <= p.maxWeightKg,
  );
};

/* ------------------------------------------------------------------ parsers */

const STATUSES: readonly ParcelStatus[] = [
  'searching',
  'assigned',
  'pickedUp',
  'delivered',
  'cancelled',
];
const METHODS: readonly ParcelPaymentMethod[] = ['cash', 'card', 'ozioBalance'];
const VEHICLES: readonly ParcelVehicle[] = ['foot', 'bicycle', 'scooter', 'car'];
const PRESET_IDS: readonly ParcelSizePresetId[] = ['envelope', 'small', 'medium', 'large'];

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => {
  const s = str(v);
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
};

export function parseParcelPoint(json: unknown): ParcelPoint {
  const o = asObj(json);
  const lat = o.lat === undefined || o.lat === null ? undefined : num(o.lat);
  const lng = o.lng === undefined || o.lng === null ? undefined : num(o.lng);
  return {
    address: str(o.address),
    details: str(o.details),
    contactName: str(o.contactName),
    contactPhone: str(o.contactPhone),
    ...(lat === undefined ? {} : { lat }),
    ...(lng === undefined ? {} : { lng }),
  };
}

export function parseParcelSpec(json: unknown): ParcelSpec {
  const o = asObj(json);
  return {
    lengthCm: num(o.lengthCm),
    widthCm: num(o.widthCm),
    heightCm: num(o.heightCm),
    weightKg: num(o.weightKg),
    fragile: bool(o.fragile),
    contents: str(o.contents),
  };
}

export function parseParcelPreset(json: unknown): ParcelSizePreset {
  const o = asObj(json);
  const id = oneOf(o.id, PRESET_IDS, 'small');
  return {
    id,
    code: str(o.code, PRESET_CODE[id]),
    lengthCm: num(o.lengthCm),
    widthCm: num(o.widthCm),
    heightCm: num(o.heightCm),
    maxWeightKg: num(o.maxWeightKg),
  };
}

/** The design labels the four presets S / M / L / XL, the contract ids them by name. */
export const PRESET_CODE: Record<ParcelSizePresetId, string> = {
  envelope: 'S',
  small: 'M',
  medium: 'L',
  large: 'XL',
};

export function parseParcelSavedAddress(json: unknown): ParcelSavedAddress {
  const o = asObj(json);
  return {
    id: str(o.id),
    title: str(o.title),
    address: str(o.address),
    details: str(o.details),
    contactName: str(o.contactName),
    contactPhone: str(o.contactPhone),
  };
}

export function parseParcelRules(json: unknown): ParcelRules {
  const o = asObj(json);
  return {
    maxWeightKg: num(o.maxWeightKg, 30),
    maxSideCm: num(o.maxSideCm, 120),
    fromPrice: money(o.fromPrice),
    fragileFee: money(o.fragileFee),
    presets: asList(o.presets).map(parseParcelPreset),
    paymentMethods: asList(o.paymentMethods).map((m) => oneOf(m, METHODS, 'cash')),
    savedAddresses: asList(o.savedAddresses).map(parseParcelSavedAddress),
    savedCards: asList(o.savedCards).map((c) => {
      const card = asObj(c);
      return { id: str(card.id), mask: str(card.mask) };
    }),
    balance: money(o.balance),
  };
}

export function parseParcelQuote(json: unknown): ParcelQuote {
  const o = asObj(json);
  return {
    price: money(o.price),
    baseFee: money(o.baseFee),
    distanceFee: money(o.distanceFee),
    weightFee: money(o.weightFee),
    fragileFee: money(o.fragileFee),
    distanceKm: num(o.distanceKm),
    etaMinutes: num(o.etaMinutes),
  };
}

export function parseParcelDraft(json: unknown): ParcelDraft {
  const o = asObj(json);
  const cardId = str(o.cardId);
  return {
    pickup: parseParcelPoint(o.pickup),
    dropoff: parseParcelPoint(o.dropoff),
    spec: parseParcelSpec(o.spec),
    payer: oneOf(o.payer, ['sender', 'recipient'] as const, 'sender'),
    paymentMethod: oneOf(o.paymentMethod, METHODS, 'cash'),
    ...(cardId ? { cardId } : {}),
    courierNote: str(o.courierNote),
  };
}

export function parseParcelCourier(json: unknown): ParcelCourier | undefined {
  const o = asObj(json);
  const name = str(o.name);
  if (!name) return undefined;
  return {
    name,
    phone: str(o.phone),
    vehicle: oneOf(o.vehicle, VEHICLES, 'scooter'),
    rating: num(o.rating),
  };
}

export function parseParcel(json: unknown): Parcel {
  const o = asObj(json);
  const courier = parseParcelCourier(o.courier);
  const assignedAt = dateIso(o.assignedAt);
  const pickedUpAt = dateIso(o.pickedUpAt);
  const deliveredAt = dateIso(o.deliveredAt);
  return {
    id: str(o.id),
    number: str(o.number),
    status: oneOf(o.status, STATUSES, 'searching'),
    draft: parseParcelDraft(o.draft),
    quote: parseParcelQuote(o.quote),
    ...(courier ? { courier } : {}),
    pickupCode: str(o.pickupCode),
    deliveryCode: str(o.deliveryCode),
    createdAt: dateIso(o.createdAt) ?? new Date(0).toISOString(),
    ...(assignedAt ? { assignedAt } : {}),
    ...(pickedUpAt ? { pickedUpAt } : {}),
    ...(deliveredAt ? { deliveredAt } : {}),
  };
}

/** An empty draft, so the form has a stable starting shape. */
export const emptyParcelPoint = (): ParcelPoint => ({
  address: '',
  details: '',
  contactName: '',
  contactPhone: '',
});

export const emptyParcelDraft = (): ParcelDraft => ({
  pickup: emptyParcelPoint(),
  dropoff: emptyParcelPoint(),
  spec: { lengthCm: 40, widthCm: 30, heightCm: 20, weightKg: 3.2, fragile: false, contents: '' },
  payer: 'sender',
  paymentMethod: 'cash',
  courierNote: '',
});
