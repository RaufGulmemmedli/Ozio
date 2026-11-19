'use client';

/**
 * `/offers` — L3 "Kampaniyalar" (`app-places.md` §4, `app-places/app-kampaniyalar.html`).
 *
 * Regions: Header (`yYZms`) + month switch · Filter chips (`PQpmv`) · Highlights (`dmRxD`) ·
 * Qlobal kuponlar (`HxqR2`) · Partnyor təklifləri (`KjMnh`, fed by the discount catalogue).
 *
 * Endpoints: `GET v1/highlights`, `GET v1/coupons/global`, `GET v1/ozio-plus/campaigns` (the
 * campaign end date the hero counts down to) and `GET v1/ozio-plus/products`. The product endpoint
 * **ignores** `page`, `search`, `sort` and every variant of them, so the month tabs, the filter
 * chips and the ordering all run on the pages already loaded.
 *
 * Guest-reachable: a 401 on any section shows the sign-in prompt, not an error.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Percent, Sparkles, Ticket } from '@/shared/lucide';
import { EmptyState } from '@/shared/states';
import { Button, Chip, SegmentedControl } from '@/shared/ui';

import {
  CampaignHero,
  CouponCard,
  HighlightTile,
  ProductGrid,
  SectionBlock,
  SectionHead,
  LinkButton,
} from '../components';
import { isUsableCoupon, soonestCampaign } from '../data/models';
import { homeRepository } from '../data/home.repository';
import { useCampaigns, useGlobalCoupons, useHighlights, usePlusProducts } from '../hooks';
import { couponValueLabel } from './GuestHomeView';
import {
  CouponRowSkeleton,
  HighlightsRowSkeleton,
  OfferGridSkeleton,
} from './OffersSkeleton';

type OffersFilter = 'all' | 'cashback' | 'coupons' | 'partner' | 'endingSoon';

const FILTERS: readonly OffersFilter[] = ['all', 'cashback', 'coupons', 'partner', 'endingSoon'];

export function OffersView() {
  const t = useTranslations('home');
  const { money, number, date } = useFormat();
  const now = useMemo(() => new Date(), []);

  const [month, setMonth] = useState(() => String(now.getMonth()));
  const [filter, setFilter] = useState<OffersFilter>('all');

  const campaigns = useCampaigns();
  const highlights = useHighlights();
  const coupons = useGlobalCoupons();
  const offers = usePlusProducts();

  const monthIndex = Number(month);
  const inMonth = homeRepository.campaignsInMonth(campaigns.data ?? [], now.getFullYear(), monthIndex);
  const hero = soonestCampaign(filter === 'endingSoon' ? inMonth : inMonth.length > 0 ? inMonth : (campaigns.data ?? []));
  const sideTiles = (highlights.data ?? []).slice(0, 2);
  const usableCoupons = (coupons.data?.items ?? []).filter(isUsableCoupon);

  const showHighlights = filter === 'all' || filter === 'cashback' || filter === 'endingSoon';
  const showCoupons = filter === 'all' || filter === 'coupons';
  const showOffers = filter === 'all' || filter === 'partner';

  const monthOptions = useMemo(
    () =>
      [-1, 0, 1].map((delta) => {
        const d = new Date(now.getFullYear(), now.getMonth() + delta, 1);
        return { value: String(d.getMonth()), label: date(d, 'long').replace(/\s*\d{4}\s*$/, '').trim() };
      }),
    [date, now],
  );

  const activeCount = inMonth.length + usableCoupons.length;

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Header + month switch */}
      <div className="flex w-full flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-ink lg:text-h1-app lg:font-extrabold lg:tracking-[-1px]">
            {t('offers.title')}
          </h1>
          <p className="text-label text-ink2 lg:text-body">
            {t('offers.subtitle', {
              month: date(now, 'long').replace(/^\d+\s*/, ''),
              offers: number(inMonth.length),
              coupons: number(usableCoupons.length),
            })}
          </p>
        </div>
        <SegmentedControl
          value={month}
          onValueChange={setMonth}
          options={monthOptions}
          label={t('offers.monthLabel')}
          className="shrink-0"
        />
      </div>

      {/* Filter chips — client-side, no server param exists */}
      <div className="flex w-full flex-row gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((value) => (
          <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>
            {t(`offers.filter.${value}`)}
          </Chip>
        ))}
      </div>

      {/* Highlights: the campaign hero + the highlight tiles */}
      {showHighlights ? (
        <section aria-labelledby="offers-highlights" className="flex w-full flex-col gap-4">
          <h2 id="offers-highlights" className="sr-only">
            {t('offers.highlightsTitle')}
          </h2>
          <SectionBlock
            pending={campaigns.isPending || highlights.isPending}
            skeleton={<HighlightsRowSkeleton />}
            error={campaigns.isError ? campaigns.error : null}
            onRetry={campaigns.refetch}
            retryLabel={t('retry')}
            empty={!hero && sideTiles.length === 0}
            emptyIcon={Percent}
            emptyTitle={t('offers.emptyTitle')}
            emptyBody={t('offers.emptyBody')}
            emptyAction={
              <LinkButton href={paths.market} variant="primary" size="lg">
                {t('offers.emptyCta')}
              </LinkButton>
            }
            loginPrompt={<OffersGuestPrompt title={t('offers.guestTitle')} body={t('offers.guestBody')} cta={t('guest.signIn')} />}
          >
            <div className="flex w-full flex-col gap-5 lg:h-[340px] lg:flex-row">
              {hero ? (
                <CampaignHero
                  campaign={hero}
                  kicker={t('offers.heroKicker')}
                  daysLeftLabel={
                    hero.daysLeft === null ? null : t('offers.daysLeft', { days: hero.daysLeft })
                  }
                  title={hero.name || t('offers.heroFallbackTitle')}
                  body={
                    hero.endDate
                      ? t('offers.heroBody', { date: date(hero.endDate, 'long') })
                      : t('offers.heroBodyNoDate')
                  }
                  ctaLabel={t('offers.heroCta')}
                />
              ) : null}
              {sideTiles.length > 0 ? (
                <div className="flex w-full flex-col gap-5 lg:w-[340px] lg:shrink-0">
                  {sideTiles.map((highlight, index) => (
                    <HighlightTile
                      key={highlight.id}
                      highlight={highlight}
                      index={index}
                      fallbackBody={t('offers.highlightFallbackBody')}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </SectionBlock>
        </section>
      ) : null}

      {/* Qlobal kuponlar */}
      {showCoupons ? (
        <section aria-labelledby="offers-coupons" className="flex w-full flex-col gap-4">
          <SectionHead
            titleId="offers-coupons"
            title={t('coupons.title')}
            actionLabel={t('coupons.seeAll')}
            actionHref={paths.coupons}
          />
          <SectionBlock
            pending={coupons.isPending}
            skeleton={<CouponRowSkeleton />}
            error={coupons.isError ? coupons.error : null}
            onRetry={coupons.refetch}
            retryLabel={t('retry')}
            empty={usableCoupons.length === 0}
            emptyIcon={Ticket}
            emptyTitle={t('coupons.emptyTitle')}
            emptyBody={t('coupons.emptyBody')}
            loginPrompt={<OffersGuestPrompt title={t('coupons.guestTitle')} body={t('coupons.guestBody')} cta={t('guest.signIn')} />}
          >
            <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-3">
              {usableCoupons.slice(0, 6).map((coupon, index) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  index={index}
                  valueLabel={couponValueLabel(coupon, t)}
                  conditionLabel={
                    coupon.minOrder !== null
                      ? t('coupons.minOrder', { amount: money(coupon.minOrder) })
                      : (coupon.description ?? coupon.title)
                  }
                  expiryLabel={
                    coupon.endDate
                      ? t('coupons.expiry', { date: date(coupon.endDate, 'dayMonth') })
                      : null
                  }
                  copyLabel={t('coupons.code')}
                />
              ))}
            </div>
          </SectionBlock>
        </section>
      ) : null}

      {/* Partnyor təklifləri — the ozio-plus discount catalogue */}
      {showOffers ? (
        <section aria-labelledby="offers-products" className="flex w-full flex-col gap-4">
          <SectionHead
            titleId="offers-products"
            title={t('offers.partnerTitle')}
            actionLabel={t('offers.partnerSeeAll')}
            actionHref={paths.discounts}
          />
          <SectionBlock
            pending={offers.isPending}
            skeleton={<OfferGridSkeleton />}
            error={offers.isError ? offers.error : null}
            onRetry={offers.refetch}
            retryLabel={t('retry')}
            empty={offers.isEmpty}
            emptyIcon={Sparkles}
            emptyTitle={t('offers.partnerEmptyTitle')}
            emptyBody={t('offers.partnerEmptyBody')}
            loginPrompt={<OffersGuestPrompt title={t('offers.guestTitle')} body={t('offers.guestBody')} cta={t('guest.signIn')} />}
          >
            <div className="flex w-full flex-col items-center gap-6">
              <ProductGrid products={offers.items} cols={3} />
              {offers.hasMore ? (
                <Button
                  variant="soft"
                  size="lg"
                  loading={offers.isFetchingNextPage}
                  onClick={offers.loadMore}
                >
                  {t('offers.loadMore')}
                </Button>
              ) : null}
            </div>
          </SectionBlock>
        </section>
      ) : null}

      <p className="sr-only">{t('offers.countNote', { count: activeCount })}</p>
    </div>
  );
}

function OffersGuestPrompt({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <EmptyState
      compact
      panel
      icon={Percent}
      title={title}
      body={body}
      titleAs="p"
      action={
        <LinkButton href={`${paths.login}?next=${encodeURIComponent(paths.offers)}`}
          variant="primary"
          size="lg"
        >
          {cta}
        </LinkButton>
      }
    />
  );
}
