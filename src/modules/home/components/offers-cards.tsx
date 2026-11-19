'use client';

/**
 * /offers (L3 "Kampaniyalar", `app-places/app-kampaniyalar.html`) cards.
 *
 * - Hero Campaign (`block`, radius 36, padding 36, 340 high): yellow "Ayın əsas kampaniyası" pill,
 *   a translucent "N gün qalıb" pill, title 44/800/-1.5, body 15/400 at 75%, brand CTA 52.
 * - Side highlight tiles (`yellow` and `brand`, radius 32, padding 24): title 20/800 + body 14/400.
 * - Coupon card (132 high, radius 28, split): value panel 150 wide on a soft tint with the value
 *   34/800, details panel padding 20 — title 15/700, code pill 36 on `bg` with 13/700/+1px, and the
 *   "Son tarix" line 12/400 `ink2`.
 */
import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ArrowRight, Timer } from '@/shared/lucide';
import { LinkButton } from './link-button';

import type { Coupon, Highlight, PlusCampaign } from '../data/models';

/* ------------------------------------------------------------------- hero */

export interface CampaignHeroProps {
  campaign: PlusCampaign;
  kicker: string;
  /** Already localized, e.g. "12 gün qalıb". Null when the server sent no end date. */
  daysLeftLabel: string | null;
  title: string;
  body: string;
  ctaLabel: string;
  className?: string;
}

export function CampaignHero({
  campaign,
  kicker,
  daysLeftLabel,
  title,
  body,
  ctaLabel,
  className,
}: CampaignHeroProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex min-w-0 flex-1 flex-col justify-between gap-8 overflow-hidden rounded-bento bg-block p-7 text-on-block lg:h-[340px] lg:p-9',
        className,
      )}
    >
      <div className="flex w-full flex-row items-start justify-between gap-3">
        <span className="rounded-pill bg-yellow px-3.5 py-1.5 text-caption font-bold text-on-yellow">
          {kicker}
        </span>
        {daysLeftLabel ? (
          <span className="flex flex-row items-center gap-1.5 rounded-pill bg-white/15 px-3.5 py-1.5 text-caption font-bold">
            <Timer aria-hidden className="size-4" />
            {daysLeftLabel}
          </span>
        ) : null}
      </div>
      <div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-[480px] flex-col gap-3">
          <p className="text-h2 font-extrabold leading-tight tracking-[-1px] lg:text-[44px] lg:leading-[46px] lg:tracking-[-1.5px]">
            {title}
          </p>
          <p className="text-body-sm leading-[21px] text-on-block/75">{body}</p>
          {campaign.name ? (
            <p className="text-micro uppercase tracking-[1px] text-on-block/60">{campaign.name}</p>
          ) : null}
        </div>
        <LinkButton href={paths.market} variant="brand" size="xl" className="shrink-0">
          {ctaLabel}
        </LinkButton>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- highlights */

const HIGHLIGHT_TONES = ['bg-yellow text-on-yellow', 'bg-brand text-white'] as const;

export function HighlightTile({
  highlight,
  index,
  fallbackBody,
}: {
  highlight: Highlight;
  index: number;
  fallbackBody: string;
}) {
  return (
    <article
      className={cn(
        'flex min-h-[150px] w-full flex-col justify-between gap-4 rounded-modal p-6',
        HIGHLIGHT_TONES[index % HIGHLIGHT_TONES.length],
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-h4 font-extrabold">{highlight.title}</p>
        <p className="text-label opacity-90">{highlight.subtitle ?? fallbackBody}</p>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------- coupons */

const COUPON_TONES = ['bg-brand-soft', 'bg-sky-soft', 'bg-success-soft'] as const;

export interface CouponCardProps {
  coupon: Coupon;
  /** "10%" / "5 ₼" / "Pulsuz çatdırılma" — formatted by the view. */
  valueLabel: string;
  /** "40 ₼-dan yuxarı sifarişə" or the coupon description. */
  conditionLabel: string;
  /** "Son tarix: 30 Noy-dək". */
  expiryLabel: string | null;
  index: number;
  copyLabel: string;
}

export function CouponCard({
  coupon,
  valueLabel,
  conditionLabel,
  expiryLabel,
  index,
  copyLabel,
}: CouponCardProps) {
  return (
    <article className="flex w-full flex-row overflow-hidden rounded-xl bg-surface lg:h-[132px]">
      <div
        className={cn(
          'flex w-[120px] shrink-0 items-center justify-center p-5 text-center lg:w-[150px]',
          COUPON_TONES[index % COUPON_TONES.length],
        )}
      >
        <span className="text-h4 font-extrabold tracking-[-1px] text-ink lg:text-[34px]">
          {valueLabel}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 p-5">
        <p className="line-clamp-2 text-body-sm font-bold text-ink">{conditionLabel}</p>
        {coupon.code ? (
          <span
            aria-label={`${copyLabel}: ${coupon.code}`}
            className="flex h-9 w-fit items-center rounded-pill bg-bg px-3.5 text-caption font-bold tracking-[1px] text-ink"
          >
            {coupon.code}
          </span>
        ) : null}
        {expiryLabel ? <span className="text-micro text-ink2">{expiryLabel}</span> : null}
      </div>
    </article>
  );
}

/* --------------------------------------------------------- offer (product) */

export interface OfferLinkProps {
  label: string;
  href: string;
}

/** The "Təklifə bax" style text link with a trailing arrow. */
export function OfferLink({ label, href }: OfferLinkProps) {
  return (
    <Link
      href={href}
      className="flex w-fit flex-row items-center gap-1.5 text-label font-bold text-brand hover:text-brand-dark"
    >
      {label}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );
}
