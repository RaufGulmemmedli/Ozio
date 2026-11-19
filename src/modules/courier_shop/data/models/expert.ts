/**
 * "Kuryer-Ekspert" — a certified courier installs / mounts / assembles what was just delivered.
 *
 * Service fees and durations are catalogue data; the booking summary only displays the selected
 * service's own `price`, so nothing is added up in a component.
 */
import { asList, asObj, bool, int, money, str } from '@/core/network';

import { parseLocalized, type LocalizedText } from './localized';

export const EXPERT_PRODUCT_KINDS = ['bike', 'tv', 'hood'] as const;
export type ExpertProductKind = (typeof EXPERT_PRODUCT_KINDS)[number];

export const EXPERT_SERVICE_KINDS = ['install', 'wall', 'assemble'] as const;
export type ExpertServiceKind = (typeof EXPERT_SERVICE_KINDS)[number];

export const isExpertProductKind = (v: unknown): v is ExpertProductKind =>
  typeof v === 'string' && (EXPERT_PRODUCT_KINDS as readonly string[]).includes(v);

const isServiceKind = (v: string): v is ExpertServiceKind =>
  (EXPERT_SERVICE_KINDS as readonly string[]).includes(v);

export interface ExpertProduct {
  kind: ExpertProductKind;
  name: LocalizedText;
}

export interface ExpertService {
  kind: ExpertServiceKind;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  minutes: number;
}

/** `Bu gün 18:00` / `Sabah 10:00` — the day is a key so the label can be localized. */
export interface ExpertSlot {
  id: string;
  day: 'today' | 'tomorrow';
  /** Baku wall-clock `HH:mm`, read literally. */
  time: string;
}

export interface ExpertCatalog {
  product: ExpertProductKind;
  products: ExpertProduct[];
  services: ExpertService[];
  slots: ExpertSlot[];
}

export interface ExpertBooking {
  /** `EX-4821` — a mock reference. */
  ref: string;
  product: ExpertProduct;
  service: ExpertService;
  slot: ExpertSlot;
  expertName: string;
  certified: boolean;
  simulated: boolean;
}

export function parseExpertProduct(raw: unknown): ExpertProduct {
  const row = asObj(raw);
  const kind = str(row.kind);
  return {
    kind: isExpertProductKind(kind) ? kind : 'bike',
    name: parseLocalized(row.name),
  };
}

export function parseExpertService(raw: unknown): ExpertService {
  const row = asObj(raw);
  const kind = str(row.kind);
  return {
    kind: isServiceKind(kind) ? kind : 'install',
    name: parseLocalized(row.name),
    description: parseLocalized(row.description),
    price: money(row.price),
    minutes: int(row.minutes),
  };
}

export function parseExpertSlot(raw: unknown): ExpertSlot {
  const row = asObj(raw);
  const day = str(row.day) === 'tomorrow' ? 'tomorrow' : 'today';
  return { id: str(row.id), day, time: str(row.time) };
}

export function parseExpertCatalog(raw: unknown): ExpertCatalog {
  const row = asObj(raw);
  const product = str(row.product);
  return {
    product: isExpertProductKind(product) ? product : 'bike',
    products: asList(row.products).map(parseExpertProduct),
    services: asList(row.services).map(parseExpertService),
    slots: asList(row.slots).map(parseExpertSlot),
  };
}

export const EMPTY_EXPERT_CATALOG: ExpertCatalog = {
  product: 'bike',
  products: [],
  services: [],
  slots: [],
};

export function parseExpertBooking(raw: unknown): ExpertBooking | null {
  if (raw === null || raw === undefined) return null;
  const row = asObj(raw);
  const ref = str(row.ref);
  if (!ref) return null;
  return {
    ref,
    product: parseExpertProduct(row.product),
    service: parseExpertService(row.service),
    slot: parseExpertSlot(row.slot),
    expertName: str(row.expert_name ?? row.expertName),
    certified: bool(row.certified, true),
    simulated: row.simulated === undefined ? true : row.simulated === true,
  };
}
