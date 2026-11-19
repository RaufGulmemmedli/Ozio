'use client';

/**
 * "Bonus yanır" (KT7) — `html/app-loyalty/app-bonus-yanir.html`.
 *
 * `app-loyalty.md` §9 puts this at `/card/expiring`, but no such key exists in
 * `paths.ts` / `guards.ts` (both are append-only registries another agent
 * owns), and this module's brief lists five routes that do not include it. So
 * the screen ships as the `#expiring` section of `/card/levels` — the tier
 * screen it belongs to, already flagged and already carrying the demo banner.
 *
 * Measured: the expiry banner `yellow`, `rounded-bento` (36), padding 32/40,
 * gap 28, an 88 `block` flame disc, title 32/800, sub 16/400, a `cta` pill CTA
 * (56); the batches card `surface`, `rounded-bento`, padding 32, gap 24, each
 * batch amount 24/800, date 14/400 `ink2`, a days-left pill (32 high) tinted
 * `brand` / `surface2`, and an 8-high track whose fill is `brand` (<=3 days),
 * `sky` (<=16) or `success`; the "how to spend" rows 48 discs + 16/700 titles;
 * the policy note `surface2`, `rounded-xl`, padding 24.
 *
 * **MSW-backed**: there is no expiry endpoint. The 30-day validity rule and the
 * batches come from the fixture, never from a client-side money calculation.
 */
import { useTranslations } from 'next-intl';

import { Link, useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import {
  ArrowRight,
  ChevronRight,
  Flame,
  Info,
  ShoppingCart,
  Store,
  Ticket,
  type LucideIcon,
} from '@/shared/lucide';

import type { ExpiringBatch, ExpiringBonus } from '../data/models/tier';

const TRACK_FILL: Record<ExpiringBatch['tone'], string> = {
  danger: 'bg-brand',
  warning: 'bg-sky',
  neutral: 'bg-success',
};

const PILL: Record<ExpiringBatch['tone'], string> = {
  danger: 'bg-brand text-white',
  warning: 'bg-surface2 text-ink2',
  neutral: 'bg-surface2 text-ink2',
};

export interface ExpiringBonusSectionProps {
  expiring: ExpiringBonus;
  className?: string;
}

export function ExpiringBonusSection({ expiring, className }: ExpiringBonusSectionProps) {
  const t = useTranslations('loyalty_card');
  const { money, date } = useFormat();

  const soonest = expiring.soonest;

  const options: ReadonlyArray<{
    key: 'market' | 'lottery' | 'partners';
    icon: LucideIcon;
    tint: string;
    href: string;
    body: string;
  }> = [
    {
      key: 'market',
      icon: ShoppingCart,
      tint: 'bg-brand-soft text-brand',
      href: paths.market,
      body: t('expiring.option.market.body'),
    },
    {
      key: 'lottery',
      icon: Ticket,
      tint: 'bg-violet-soft text-violet',
      href: paths.lottery,
      body: t('expiring.option.lottery.body', { amount: money(expiring.lotteryTicketPrice) }),
    },
    {
      key: 'partners',
      icon: Store,
      tint: 'bg-sky-soft text-sky',
      href: paths.marketPartners,
      body: t('expiring.option.partners.body'),
    },
  ];

  return (
    <section
      id="expiring"
      aria-labelledby="expiring-heading"
      className={cn('flex w-full flex-col gap-8', className)}
    >
      <div className="flex w-full flex-col gap-1.5">
        <h2 id="expiring-heading" className="m-0 text-h2 font-extrabold text-ink">
          {t('expiring.title')}
        </h2>
        <p className="m-0 text-body text-ink2">{t('expiring.subtitle')}</p>
      </div>

      {soonest ? (
        <div className="flex w-full flex-col items-start gap-7 rounded-bento bg-yellow p-8 md:flex-row md:items-center md:px-10">
          <span
            aria-hidden="true"
            className="flex size-[88px] shrink-0 items-center justify-center rounded-pill bg-block text-on-block"
          >
            <Flame size={44} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="m-0 text-h2 font-extrabold leading-[1.2] text-on-yellow">
              {t('expiring.bannerTitle', {
                amount: money(soonest.amount),
                days: soonest.daysLeft,
              })}
            </p>
            <p className="m-0 text-body text-on-yellow">
              {t('expiring.bannerBody', {
                date: soonest.expiresAt ? date(soonest.expiresAt, 'long') : '',
              })}
            </p>
          </div>
          <Link
            href={paths.market}
            className="flex h-14 shrink-0 items-center gap-2 rounded-pill bg-cta px-8 text-body font-bold text-on-cta transition-colors hover:bg-brand-dark"
          >
            {t('expiring.spendNow')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-1.5 rounded-bento border border-line bg-surface p-8">
          <p className="m-0 text-h4 font-bold text-ink">{t('expiring.none.title')}</p>
          <p className="m-0 text-body-sm text-ink2">{t('expiring.none.body')}</p>
        </div>
      )}

      <div className="flex w-full flex-col gap-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {expiring.batches.length > 0 ? (
            <div className="flex w-full flex-col gap-6 rounded-bento border border-line bg-surface p-8">
              <h3 className="m-0 text-[22px] font-bold text-ink">{t('expiring.batchesTitle')}</h3>
              <ul className="m-0 flex list-none flex-col gap-6 ps-0">
                {expiring.batches.map((batch) => {
                  const remaining = Math.max(
                    0,
                    Math.min(100, Math.round((batch.daysLeft / batch.windowDays) * 100)),
                  );
                  return (
                    <li key={batch.id} className="flex w-full flex-col gap-2.5">
                      <div className="flex w-full flex-row items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="oz-num text-h3 font-extrabold text-ink">
                            {money(batch.amount)}
                          </span>
                          <span className="text-label text-ink2">
                            {batch.expiresAt
                              ? t('expiring.endsOn', { date: date(batch.expiresAt, 'long') })
                              : ''}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'flex h-8 shrink-0 items-center rounded-pill px-[14px] text-caption font-bold',
                            PILL[batch.tone],
                          )}
                        >
                          {t('expiring.daysLeft', { days: batch.daysLeft })}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={t('expiring.batchProgress', { amount: money(batch.amount) })}
                        aria-valuenow={remaining}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuetext={t('expiring.daysLeft', { days: batch.daysLeft })}
                        className="h-2 w-full overflow-hidden rounded-pill bg-surface2"
                      >
                        <div
                          className={cn('h-full rounded-pill', TRACK_FILL[batch.tone])}
                          style={{ width: `${remaining}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-1 rounded-bento border border-line bg-surface px-8 py-7">
            <h3 className="m-0 pb-2 text-[22px] font-bold text-ink">{t('expiring.howTitle')}</h3>
            <ul className="m-0 flex list-none flex-col ps-0">
              {options.map(({ key, icon: Icon, tint, href, body }) => (
                <li key={key} className="w-full">
                  <Link
                    href={href}
                    className="flex w-full flex-row items-center gap-4 rounded-sm border-t border-line py-4 transition-colors first:border-t-0 hover:bg-surface2/60"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-[16px]',
                        tint,
                      )}
                    >
                      <Icon size={22} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-body font-bold text-ink">
                        {t(`expiring.option.${key}.title`)}
                      </span>
                      <span className="text-label text-ink2">{body}</span>
                    </span>
                    <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-5 xl:w-[400px]">
          <div className="flex w-full flex-row gap-3 rounded-xl bg-surface2 p-6">
            <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-ink2" />
            <p className="m-0 flex-1 text-label text-ink2">
              {t('expiring.policy', { days: expiring.validityDays })}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
