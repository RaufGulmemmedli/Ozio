/**
 * `GET /notification/api/v1/notifications` (verified) — `{data: {data: [...], total}}`,
 * paging `limit` (default 10) + `offset`.
 *
 * `createdAt` carries **no time-zone suffix** ("2026-11-11T16:40:00") and is UTC, which is exactly
 * what `dateIso()` assumes for a zone-less timestamp — so it must not be converted by hand.
 * `image` is nullable and `image.object_key` is a full CDN url.
 */
import { asObj, bool, dateIso, int, nullableStr, str } from '@/core/network';

export type NotificationKind = 'order' | 'bonus' | 'coupon' | 'lottery' | 'push';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  /** Live rows all carry `type: "push"`; the finer kinds are derived from the text. */
  kind: NotificationKind;
  isRead: boolean;
  /** ISO-8601 instant (UTC), or null when the row carried no date. */
  createdAt: string | null;
  imageUrl: string | null;
}

const pick = (o: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

/** Live `type` is always "push", so the icon is chosen from keywords in the title/body. */
function kindOf(type: string, text: string): NotificationKind {
  const t = `${type} ${text}`.toLowerCase();
  if (/sifariş|order|kuryer|çatdır/.test(t)) return 'order';
  if (/bonus|keşbek|keshbek|cashback/.test(t)) return 'bonus';
  if (/kupon|coupon|promo/.test(t)) return 'coupon';
  if (/lotereya|lottery|bilet|tiraj/.test(t)) return 'lottery';
  return 'push';
}

export function parseNotification(raw: unknown): NotificationItem {
  const o = asObj(raw);
  const image = o.image;
  const title = str(pick(o, ['title', 'notification_title']));
  const message = str(pick(o, ['content', 'notification_message', 'body', 'message'])).trim();
  const type = str(o.type);

  return {
    id: int(pick(o, ['notification_id', 'id'])),
    title,
    message,
    kind: kindOf(type, `${title} ${message}`),
    isRead: bool(pick(o, ['isRead', 'is_read'])),
    createdAt: dateIso(pick(o, ['createdAt', 'created_at'])),
    imageUrl:
      typeof image === 'string'
        ? nullableStr(image)
        : nullableStr(pick(asObj(image), ['object_key', 'url', 'image_url'])),
  };
}

export const isRenderableNotification = (n: NotificationItem): boolean =>
  n.id > 0 && (n.title !== '' || n.message !== '');

/**
 * `GET …/notifications/unread-count` — `data` is a **bare integer**, not an object. A wrapped
 * `{count|unread|unread_count|total}` is tolerated because the gateway might change.
 */
export function parseUnreadCount(envelopeData: unknown): number {
  if (typeof envelopeData === 'number') return Math.max(0, Math.trunc(envelopeData));
  if (typeof envelopeData === 'string') return Math.max(0, int(envelopeData));
  const o = asObj(envelopeData);
  for (const key of ['count', 'unread', 'unread_count', 'total']) {
    if (o[key] !== undefined && o[key] !== null) return Math.max(0, int(o[key]));
  }
  return 0;
}
