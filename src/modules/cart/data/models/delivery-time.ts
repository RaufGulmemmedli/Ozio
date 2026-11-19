/**
 * Delivery time (`?sheet=time`, screen OD4, export `app-orders/app-delivery-time.html`).
 *
 * ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 * │ **THERE IS NO BACKEND FOR THIS SCREEN.**                                                  │
 * │ No endpoint exposes delivery slots, their capacity or a cut-off, and `POST v2/orders` is   │
 * │ unverified, so nothing documents how a chosen slot would be sent. The whole model below is │
 * │ client-side and derived from what the design draws; it must be replaced the moment the API │
 * │ gains a slots operation. `orders/checkout` is **not** given a slot — passing an undocumented│
 * │ field to a verified call is how a 422 happens.                                             │
 * └──────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * What the export draws (node `aDXSy` … `CQ1UP`):
 * - a two-day switch, "Bu gün · 18 Noy" / "Sabah · 19 Noy";
 * - an ASAP card ("Ən tez vaxtda") that is the default and is always available;
 * - hourly slots from 14:00 to 23:00, three per row, the earlier ones greyed out;
 * - the hint "Dolu vaxtlar boz rənglə göstərilir. Seçim 22:00-dək mümkündür."
 */

/** Day the slot belongs to. The design offers exactly these two. */
export type DeliveryDay = 'today' | 'tomorrow';

export type DeliveryTimeChoice =
  | { kind: 'asap' }
  | { kind: 'slot'; day: DeliveryDay; startHour: number };

export interface DeliverySlot {
  day: DeliveryDay;
  /** 24-h start, e.g. `16` → "16:00 – 17:00". */
  startHour: number;
  endHour: number;
  /** False when the hour has already started today (the design's greyed slots). */
  available: boolean;
}

/** First slot the design draws. */
export const SLOT_FIRST_HOUR = 14;
/** Last slot *start* — the hint says selection is possible up to 22:00. */
export const SLOT_LAST_HOUR = 22;

export const ASAP: DeliveryTimeChoice = { kind: 'asap' };

/**
 * The slot grid for one day. `now` is the current wall-clock time (Baku is the app's time zone,
 * `TIME_ZONE` in `@/core/i18n`); a today slot whose hour has started is drawn unavailable.
 */
export function deliverySlots(day: DeliveryDay, now: Date): DeliverySlot[] {
  const slots: DeliverySlot[] = [];
  for (let startHour = SLOT_FIRST_HOUR; startHour <= SLOT_LAST_HOUR; startHour += 1) {
    slots.push({
      day,
      startHour,
      endHour: startHour + 1,
      available: day === 'tomorrow' || startHour > now.getHours(),
    });
  }
  return slots;
}

export const slotLabel = (slot: Pick<DeliverySlot, 'startHour' | 'endHour'>): string =>
  `${String(slot.startHour).padStart(2, '0')}:00 – ${String(slot.endHour).padStart(2, '0')}:00`;

export const isSameChoice = (a: DeliveryTimeChoice, b: DeliveryTimeChoice): boolean =>
  a.kind === 'asap' && b.kind === 'asap'
    ? true
    : a.kind === 'slot' && b.kind === 'slot' && a.day === b.day && a.startHour === b.startHour;

/** The date shown on a day switch tab. */
export const dayDate = (day: DeliveryDay, now: Date): Date => {
  const date = new Date(now);
  if (day === 'tomorrow') date.setDate(date.getDate() + 1);
  return date;
};
