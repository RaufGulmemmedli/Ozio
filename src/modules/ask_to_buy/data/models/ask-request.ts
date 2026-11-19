/**
 * Domain models for "Al deyim" (ask_to_buy) — a child asks a family member to pay for a basket.
 *
 * Shapes follow `src/core/api/contracts/mock-contracts.ts` §11 and `api/mock-modules.md` §11.
 * Every parser is tolerant and **never throws**: a malformed row degrades to safe defaults so the
 * screen renders rather than crashing (BUILD-CONTRACT rule 6).
 *
 * All money arrives from the mock API already computed — nothing in this module multiplies or
 * sums (BUILD-CONTRACT rule 7). The one display-only exception the contract allows (line × qty)
 * is also server-provided here, as `lineTotal`.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

/** `pending|approved|declined|expired` — a request expires 24 h after it was sent. */
export type AskStatus = 'pending' | 'approved' | 'declined' | 'expired';

const STATUSES: readonly AskStatus[] = ['pending', 'approved', 'declined', 'expired'];

/**
 * Which side of the demo the signed-in person is standing on.
 *
 * There is **no family API**: the role is mock state (`/api/mock/ask_to_buy/role`) and can be
 * flipped from the UI or forced with `?preview=parent|child`.
 */
export type AskRole = 'parent' | 'child';

/** `incoming` = the parent's "Gələn" tab, `outgoing` = the child's "Göndərdiyim" tab. */
export type AskDirection = 'incoming' | 'outgoing';

export type ParentRelation = 'father' | 'mother';

export interface AskItem {
  id: string;
  name: string;
  /** Unit label for weight goods, e.g. "kq" — empty for piece goods. */
  unit: string;
  qty: number;
  /** Per-unit price, server-formatted source value. */
  unitPrice: number;
  /** `qty × unitPrice`, computed by the API. */
  lineTotal: number;
}

export interface AskParent {
  id: string;
  name: string;
  relation: ParentRelation;
  /** Relation label resolved by the API in the requested language ("Ata" / "Ana"). */
  relationLabel: string;
}

export interface AskCard {
  id: string;
  brand: string;
  last4: string;
  /** `"Visa •••• 4242"` — built by the API so the bullet glyphs live in one place. */
  label: string;
}

export interface AskRequest {
  id: string;
  /** Human reference shown in the breadcrumb and title, e.g. `A-1042`. */
  reference: string;
  direction: AskDirection;
  /** Who asked. `"Mən"` when the signed-in person is the child. */
  childName: string;
  /** Who was asked. `"Mən"` when the signed-in person is the parent. */
  parentName: string;
  parentRelationLabel: string;
  items: AskItem[];
  /** Total number of units across the basket — the "N məhsul" counter. */
  itemCount: number;
  note: string;
  createdAt: string;
  status: AskStatus;
  /** `"Visa •••• 4242"` once a parent approved and paid (mock state only). */
  paidWith: string | null;
  itemsTotal: number;
  deliveryFee: number;
  /** `true` → the summary row reads "Pulsuz" instead of an amount. */
  deliveryFree: boolean;
  total: number;
  /** The demo order the approval produced, for the "Sifarişə bax" button. */
  orderId: string | null;
}

/** What `GET /context` answers: the demo's current side plus the static pickers. */
export interface AskContext {
  role: AskRole;
  /** The family members a child may ask (empty when the demo is acting as the parent). */
  parents: AskParent[];
  /** The cards a parent may pay with. */
  cards: AskCard[];
  /** The basket the child would send — in the real app this comes from `v2/carts`. */
  draftItems: AskItem[];
  draftItemCount: number;
  draftTotal: number;
  /** How many pending requests wait on the parent — the "Gələn" tab badge. */
  pendingIncoming: number;
}

export const askStatus = (raw: unknown): AskStatus => {
  const value = str(raw).toLowerCase();
  return (STATUSES as readonly string[]).includes(value) ? (value as AskStatus) : 'pending';
};

export const askRole = (raw: unknown): AskRole => (str(raw).toLowerCase() === 'parent' ? 'parent' : 'child');

export const askDirection = (raw: unknown): AskDirection =>
  str(raw).toLowerCase() === 'incoming' ? 'incoming' : 'outgoing';

const relation = (raw: unknown): ParentRelation => (str(raw).toLowerCase() === 'mother' ? 'mother' : 'father');

export function parseAskItem(raw: unknown): AskItem {
  const o = asObj(raw);
  return {
    id: str(o.id),
    name: str(o.name),
    unit: str(o.unit),
    qty: num(o.qty, 1),
    unitPrice: money(o.unit_price ?? o.unitPrice),
    lineTotal: money(o.line_total ?? o.lineTotal),
  };
}

export function parseAskParent(raw: unknown): AskParent {
  const o = asObj(raw);
  return {
    id: str(o.id),
    name: str(o.name),
    relation: relation(o.relation),
    relationLabel: str(o.relation_label ?? o.relationLabel),
  };
}

export function parseAskCard(raw: unknown): AskCard {
  const o = asObj(raw);
  return {
    id: str(o.id),
    brand: str(o.brand),
    last4: str(o.last4),
    label: str(o.label),
  };
}

export function parseAskRequest(raw: unknown): AskRequest {
  const o = asObj(raw);
  const paidWith = str(o.paid_with ?? o.paidWith);
  const orderId = str(o.order_id ?? o.orderId);
  return {
    id: str(o.id),
    reference: str(o.reference),
    direction: askDirection(o.direction),
    childName: str(o.child_name ?? o.childName),
    parentName: str(o.parent_name ?? o.parentName),
    parentRelationLabel: str(o.parent_relation_label ?? o.parentRelationLabel),
    items: asList(o.items).map(parseAskItem),
    itemCount: num(o.item_count ?? o.itemCount),
    note: str(o.note),
    createdAt: str(o.created_at ?? o.createdAt),
    status: askStatus(o.status),
    paidWith: paidWith.length > 0 ? paidWith : null,
    itemsTotal: money(o.items_total ?? o.itemsTotal),
    deliveryFee: money(o.delivery_fee ?? o.deliveryFee),
    deliveryFree: bool(o.delivery_free ?? o.deliveryFree, true),
    total: money(o.total),
    orderId: orderId.length > 0 ? orderId : null,
  };
}

export function parseAskContext(raw: unknown): AskContext {
  const o = asObj(raw);
  const draftItems = asList(o.draft_items ?? o.draftItems).map(parseAskItem);
  return {
    role: askRole(o.role),
    parents: asList(o.parents).map(parseAskParent),
    cards: asList(o.cards).map(parseAskCard),
    draftItems,
    draftItemCount: num(o.draft_item_count ?? o.draftItemCount),
    draftTotal: money(o.draft_total ?? o.draftTotal),
    pendingIncoming: num(o.pending_incoming ?? o.pendingIncoming),
  };
}

/** The tab a role lands on first: a parent reads "Gələn", a child reads "Göndərdiyim". */
export const defaultDirection = (role: AskRole): AskDirection =>
  role === 'parent' ? 'incoming' : 'outgoing';

/** Only a parent, on a still-pending incoming request, may approve or decline. */
export const canDecide = (request: AskRequest, role: AskRole): boolean =>
  role === 'parent' && request.direction === 'incoming' && request.status === 'pending';

/** A child may re-send a request that ran out of time. */
export const canResend = (request: AskRequest, role: AskRole): boolean =>
  role === 'child' && request.direction === 'outgoing' && request.status === 'expired';

/** The 3-step tracker: Göndərildi → Baxılır → Nəticə. Index of the last reached step. */
export const trackerStep = (status: AskStatus): 0 | 1 | 2 => (status === 'pending' ? 1 : 2);
