'use client';

/**
 * `<CouponTicket>` — the coupon card from `app-kuponlar.html`.
 *
 * Measured (frame `CYPOA`, 546x168 at two per 1112-wide row, gap 20):
 *   card   `surface`, radius 24, 1px `line`, overflow hidden
 *   Main   flex-1, padding 24, space-between: Tag row on top, Info at the bottom
 *          title 18/700 `ink`, meta 13/400 `ink3` with a 14px timer glyph
 *   Perf   20 wide, 9 dashes, two 28px notches (see ./perforation)
 *   Stub   150 wide, `brand` + white value 36/800 and caption 13/600,
 *          or `brand-soft` + `brand` text for the softer variant
 *
 * States (the export draws only the two stub tones; the rest come from the
 * states catalogue): `active` · `expiring` (yellow tag) · `used` / `expired`
 * (opacity .5, stub greyed to `surface2`).
 *
 * The design's category tags ("Təzə çörək", "Ad günü") and the "· Ozio Market" half of
 * the meta line have **no field in `coupons/global`**, so they are not rendered —
 * see the module README notes in `index.ts`.
 */
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Timer } from '@/shared/lucide';

import {
  couponState,
  daysLeft,
  type Coupon,
  type CouponState,
} from '../data/models/coupon';
import { useCouponValue } from './coupon-value';
import { PerforationHorizontal, PerforationVertical } from './perforation';

export interface CouponTicketProps {
  coupon: Coupon;
  /** Defaults to `/coupons/{id}`. Pass `null` to render a non-interactive card. */
  href?: string | null;
  /** Overrides the derived state (used by previews). */
  state?: CouponState;
  className?: string;
}

/** `brand` for a fresh coupon, the softer `brand-soft` otherwise, grey once spent. */
const STUB_TONE: Record<CouponState, string> = {
  active: 'bg-brand text-white',
  expiring: 'bg-brand-soft text-brand',
  used: 'bg-surface2 text-ink3',
  expired: 'bg-surface2 text-ink3',
};

export function CouponTicket({ coupon, href, state, className }: CouponTicketProps) {
  const t = useTranslations('coupons');
  const { date } = useFormat();
  const couponValue = useCouponValue();

  const resolved = state ?? couponState(coupon);
  const { value, label } = couponValue(coupon);
  const spent = resolved === 'used' || resolved === 'expired';

  const left = useMemo(() => daysLeft(coupon), [coupon]);

  /** Only data-backed tags: the API has no campaign / category labels. */
  const tag = (() => {
    if (resolved === 'used') return t('tag.used');
    if (resolved === 'expired') return t('tag.expired');
    if (left !== null && left <= 0) return t('tag.today');
    if (left !== null && left === 1) return t('tag.tomorrow');
    if (left !== null && left <= 3) return t('tag.daysLeft', { count: left });
    if (coupon.isPopular) return t('tag.popular');
    return null;
  })();

  const expiry = coupon.endsAt
    ? t('meta.until', { date: date(coupon.endsAt.at, 'dayMonth') })
    : t('meta.noEnd');

  const channel = t(`channel.${coupon.channel}`);
  const accessibleName = `${coupon.title}, ${value} ${label}, ${expiry}`;

  const body = (
    <>
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-6">
        <div className="flex min-h-7 flex-row items-center gap-2">
          {tag ? (
            <span
              className={cn(
                'inline-flex h-7 shrink-0 items-center rounded-pill px-3 text-caption font-bold',
                spent ? 'bg-surface2 text-ink2' : 'bg-yellow text-on-yellow',
              )}
            >
              {tag}
            </span>
          ) : null}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-1.5">
          <h3 className="line-clamp-2 text-[18px] leading-tight font-bold text-ink">
            {coupon.title}
          </h3>
          <p className="flex min-w-0 flex-row items-center gap-1.5 text-caption text-ink3">
            <Timer size={14} aria-hidden="true" className="shrink-0" />
            <span className="truncate">
              {expiry}
              <span aria-hidden="true"> · </span>
              {channel}
            </span>
          </p>
        </div>
      </div>

      {/* Perforation: vertical from 480 up, horizontal on the stacked mobile card */}
      <PerforationVertical className="hidden sm:flex" />
      <PerforationHorizontal className="flex sm:hidden" />

      {/* Stub */}
      <div
        className={cn(
          'flex shrink-0 flex-col items-center justify-center gap-0.5 px-4 py-5 sm:w-[150px] sm:px-0 sm:py-0',
          STUB_TONE[resolved],
        )}
      >
        <span className="text-h2 leading-none font-extrabold sm:text-[36px]">{value}</span>
        <span className="text-caption font-semibold">{label}</span>
      </div>
    </>
  );

  const shellClass = cn(
    'flex w-full flex-col overflow-hidden rounded-card border border-line bg-surface sm:h-[168px] sm:flex-row sm:items-stretch',
    spent && 'opacity-50',
    className,
  );

  if (href === null) {
    return <div className={shellClass}>{body}</div>;
  }

  return (
    <Link
      href={href ?? paths.coupon(coupon.id)}
      aria-label={accessibleName}
      aria-disabled={spent || undefined}
      className={cn(
        shellClass,
        'transition-[transform,border-color] duration-[var(--oz-dur-base)] ease-out',
        'hover:-translate-y-0.5 hover:border-ink3 active:scale-[.995]',
      )}
    >
      {body}
    </Link>
  );
}
