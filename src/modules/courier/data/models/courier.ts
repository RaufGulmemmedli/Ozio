/**
 * Courier domain models + tolerant parsers.
 *
 * Mirrors `src/core/api/contracts/mock-contracts.ts` §2 (and the Flutter `courier_models.dart`).
 * The application travels in **snake_case**, exactly as the PROPOSED REST body would, so the
 * payload does not change when a backend appears.
 *
 * **No parser throws.**
 */
import { asList, asObj, bool, dateIso, money, num, str } from '@/core/network';

export type CourierStatus = 'none' | 'pending' | 'active' | 'rejected';
export type CourierVehicle = 'foot' | 'bicycle' | 'scooter' | 'car';
export type CourierOrderStatus =
  | 'available'
  | 'accepted'
  | 'atStore'
  | 'pickedUp'
  | 'delivered'
  | 'cancelled';
export type CourierPayment = 'card' | 'cash';

/** The wire shape: snake_case, `bank_account` (legacy alias `payout_account`). */
export interface CourierApplicationWire {
  full_name: string;
  phone: string;
  birth_date?: string | null;
  city: string;
  city_id?: number | null;
  vehicle: CourierVehicle;
  id_number: string;
  plate_number: string;
  has_thermal_bag: boolean;
  voen: string;
  bank_account: string;
  submitted_at?: string | null;
}

/** The camelCase view the screens use. */
export interface CourierApplication {
  fullName: string;
  phone: string;
  birthDate: string;
  city: string;
  cityId: number | null;
  vehicle: CourierVehicle;
  /** FIN, 7 characters, upper-case. Never persisted by the mock. */
  idNumber: string;
  plateNumber: string;
  hasThermalBag: boolean;
  /** VÖEN, 10 digits, optional. Never persisted. */
  voen: string;
  /** IBAN `AZ` + 26, 4-group formatted. Never persisted. */
  bankAccount: string;
  submittedAt: string | null;
  /** The demo reference the status screen prints, e.g. `KR-1042`. */
  reference: string;
}

export interface CourierOrderItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface CourierOrder {
  id: string;
  number: string;
  status: CourierOrderStatus;
  storeName: string;
  storeAddress: string;
  customerName: string;
  customerAddress: string;
  customerAddressDetails: string;
  customerPhone: string;
  customerNote: string;
  items: CourierOrderItem[];
  itemsTotal: number;
  fee: number;
  tip: number;
  /** Distance bonus, server data — the breakdown card prints it, nothing derives it. */
  distanceBonus: number;
  payment: CourierPayment;
  cashToCollect: number;
  distanceToStoreKm: number;
  distanceKm: number;
  etaMinutes: number;
  createdAt: string;
  acceptedAt?: string;
  deliveredAt?: string;
}

export interface CourierDayEarning {
  /** Weekday key inside the `courier` namespace: `day.mon` … `day.sun`. */
  day: string;
  amount: number;
  deliveries: number;
}

export interface CourierEarnings {
  today: number;
  week: number;
  month: number;
  balance: number;
  deliveriesToday: number;
  deliveriesTotal: number;
  rating: number;
  /** 0..1. */
  acceptanceRate: number;
  nextPayout: string | null;
  /** Seven buckets, oldest first. */
  days: CourierDayEarning[];
}

export interface CourierShift {
  online: boolean;
  /** Minutes the shift has been open, server data. */
  openMinutes: number;
}

/** What `/courier` needs in one read. */
export interface CourierMe {
  status: CourierStatus;
  application: CourierApplication | null;
  shift: CourierShift;
  earnings: CourierEarnings;
  activeOrder: CourierOrder | null;
}

/* ------------------------------------------------------------------ derived */

export const courierOrderEarning = (order: CourierOrder): number =>
  Math.round((order.fee + order.tip) * 100) / 100;

export const courierItemCount = (order: CourierOrder): number =>
  order.items.reduce((sum, item) => sum + item.quantity, 0);

export const courierOrderIsActive = (order: CourierOrder): boolean =>
  order.status === 'accepted' || order.status === 'atStore' || order.status === 'pickedUp';

/** 0-based index into the four delivery steps. */
export const courierStep = (status: CourierOrderStatus): number => {
  switch (status) {
    case 'accepted':
      return 0;
    case 'atStore':
      return 1;
    case 'pickedUp':
      return 2;
    case 'delivered':
      return 3;
    default:
      return 0;
  }
};

/** Which status the "next step" button moves to. `null` once the order is finished. */
export const courierNextStatus = (status: CourierOrderStatus): CourierOrderStatus | null => {
  switch (status) {
    case 'accepted':
      return 'atStore';
    case 'atStore':
      return 'pickedUp';
    case 'pickedUp':
      return 'delivered';
    default:
      return null;
  }
};

export const WEEKDAY_KEYS = [
  'day.mon',
  'day.tue',
  'day.wed',
  'day.thu',
  'day.fri',
  'day.sat',
  'day.sun',
] as const;

/* ------------------------------------------------------------------ parsers */

const STATUSES: readonly CourierStatus[] = ['none', 'pending', 'active', 'rejected'];
const VEHICLES: readonly CourierVehicle[] = ['foot', 'bicycle', 'scooter', 'car'];
const ORDER_STATUSES: readonly CourierOrderStatus[] = [
  'available',
  'accepted',
  'atStore',
  'pickedUp',
  'delivered',
  'cancelled',
];

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => {
  const s = str(v);
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
};

export const parseCourierStatus = (json: unknown): CourierStatus => {
  const o = asObj(json);
  return oneOf(o.status ?? json, STATUSES, 'none');
};

export function parseCourierApplication(json: unknown): CourierApplication | null {
  const o = asObj(json);
  const fullName = str(o.full_name, str(o.fullName));
  if (!fullName) return null;
  return {
    fullName,
    phone: str(o.phone),
    birthDate: str(o.birth_date, str(o.birthDate)),
    city: str(o.city),
    cityId: o.city_id === undefined || o.city_id === null ? null : num(o.city_id),
    vehicle: oneOf(o.vehicle, VEHICLES, 'scooter'),
    idNumber: str(o.id_number, str(o.idNumber)),
    plateNumber: str(o.plate_number, str(o.plateNumber)),
    hasThermalBag: bool(o.has_thermal_bag ?? o.hasThermalBag),
    voen: str(o.voen),
    bankAccount: str(o.bank_account, str(o.payout_account)),
    submittedAt: dateIso(o.submitted_at ?? o.submittedAt),
    reference: str(o.reference),
  };
}

/** The wire body for `POST couriers/applications`. */
export const toCourierApplicationWire = (a: CourierApplication): CourierApplicationWire => ({
  full_name: a.fullName,
  phone: a.phone,
  birth_date: a.birthDate || null,
  city: a.city,
  city_id: a.cityId,
  vehicle: a.vehicle,
  id_number: a.idNumber,
  plate_number: a.plateNumber,
  has_thermal_bag: a.hasThermalBag,
  voen: a.voen,
  bank_account: a.bankAccount,
  submitted_at: a.submittedAt,
});

export function parseCourierItem(json: unknown): CourierOrderItem {
  const o = asObj(json);
  return { name: str(o.name), quantity: num(o.quantity, 1), unit: str(o.unit) };
}

export function parseCourierOrder(json: unknown): CourierOrder {
  const o = asObj(json);
  const acceptedAt = dateIso(o.acceptedAt);
  const deliveredAt = dateIso(o.deliveredAt);
  return {
    id: str(o.id),
    number: str(o.number),
    status: oneOf(o.status, ORDER_STATUSES, 'available'),
    storeName: str(o.storeName),
    storeAddress: str(o.storeAddress),
    customerName: str(o.customerName),
    customerAddress: str(o.customerAddress),
    customerAddressDetails: str(o.customerAddressDetails),
    customerPhone: str(o.customerPhone),
    customerNote: str(o.customerNote),
    items: asList(o.items).map(parseCourierItem),
    itemsTotal: money(o.itemsTotal),
    fee: money(o.fee),
    tip: money(o.tip),
    distanceBonus: money(o.distanceBonus),
    payment: oneOf(o.payment, ['card', 'cash'] as const, 'card'),
    cashToCollect: money(o.cashToCollect),
    distanceToStoreKm: num(o.distanceToStoreKm),
    distanceKm: num(o.distanceKm),
    etaMinutes: num(o.etaMinutes),
    createdAt: dateIso(o.createdAt) ?? new Date(0).toISOString(),
    ...(acceptedAt ? { acceptedAt } : {}),
    ...(deliveredAt ? { deliveredAt } : {}),
  };
}

export function parseCourierEarnings(json: unknown): CourierEarnings {
  const o = asObj(json);
  return {
    today: money(o.today),
    week: money(o.week),
    month: money(o.month),
    balance: money(o.balance),
    deliveriesToday: num(o.deliveriesToday),
    deliveriesTotal: num(o.deliveriesTotal),
    rating: num(o.rating),
    acceptanceRate: num(o.acceptanceRate),
    nextPayout: dateIso(o.nextPayout),
    days: asList(o.days).map((d) => {
      const day = asObj(d);
      return {
        day: str(day.day),
        amount: money(day.amount),
        deliveries: num(day.deliveries),
      };
    }),
  };
}

export function parseCourierShift(json: unknown): CourierShift {
  const o = asObj(json);
  return { online: bool(o.online), openMinutes: num(o.openMinutes) };
}

export function parseCourierMe(json: unknown): CourierMe {
  const o = asObj(json);
  const active = parseCourierOrder(o.activeOrder);
  return {
    status: oneOf(o.status, STATUSES, 'none'),
    application: parseCourierApplication(o.application),
    shift: parseCourierShift(o.shift),
    earnings: parseCourierEarnings(o.earnings),
    activeOrder: active.id === '' ? null : active,
  };
}

/** A blank application, prefilled with the placeholder values the export draws. */
export const emptyCourierApplication = (): CourierApplication => ({
  fullName: '',
  phone: '',
  birthDate: '',
  city: 'Bakı',
  cityId: 1,
  vehicle: 'scooter',
  idNumber: '',
  plateNumber: '',
  hasThermalBag: false,
  voen: '',
  bankAccount: '',
  submittedAt: null,
  reference: '',
});

/* ------------------------------------------------------------------ formatters */

/** IBAN in 4-character groups: `AZ21 NABZ 0035 …`. Display only. */
export const formatIban = (raw: string): string =>
  raw
    .replace(/\s/g, '')
    .toUpperCase()
    .slice(0, 28)
    .replace(/(.{4})/g, '$1 ')
    .trim();

export const formatPlate = (raw: string): string => raw.toUpperCase().slice(0, 12);

export const formatFin = (raw: string): string =>
  raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);

export const formatVoen = (raw: string): string => raw.replace(/\D/g, '').slice(0, 10);

/** `scooter` / `car` need a plate; foot and bicycle do not. */
export const vehicleNeedsPlate = (vehicle: CourierVehicle): boolean =>
  vehicle === 'scooter' || vehicle === 'car';
