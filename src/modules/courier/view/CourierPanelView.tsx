'use client';

/**
 * `/courier` — "Kuryer · Panel" (`YkxuZ`).
 *
 * Four summary tiles, then the active-delivery strip + the nearby-offer list beside the 360-wide
 * shift and links cards.
 *
 * Five distinct states, all drawn and all reachable:
 * - **gate** (`tR9sg`) — status `none`: not a courier yet, CTA to `/courier/apply`. A *state*, not
 *   an error.
 * - **pending notice** — status `pending`: a card linking to `/courier/apply/status`.
 * - **queue closed / empty** (`ShJUa`) — shift off ("Növbə bağlıdır" + "Növbəni aç"), or online
 *   with nothing nearby ("Yaxınlıqda sifariş yoxdur"). Also a state.
 * - **loading** (`o9Mo0`) and **error** (`S27cu`).
 *
 * Every number here is mock earnings data and `<DemoBanner>` says so: no payout exists.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { ChevronRight, History, LifeBuoy, Package, Store, TrendingUp } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Badge, Breadcrumbs, Button, Switch } from '@/shared/ui';

import { CourierCard, MetaChip, SummaryTile } from '../components/courier-bits';
import { courierOrderEarning, type CourierOrder } from '../data/models/courier';
import { useCourierMe, useCourierOffers, useCourierShiftToggle } from '../hooks/use-courier';

import { CourierPanelSkeleton } from './CourierPanelSkeleton';

export function CourierPanelView() {
  const t = useTranslations('courier');
  const { money, number, date, percent } = useFormat();

  const me = useCourierMe();
  const status = me.data?.status ?? 'none';
  const online = me.data?.shift.online ?? false;
  const offers = useCourierOffers(status === 'active' && online);
  const toggle = useCourierShiftToggle();

  const header = (
    <>
      <DemoBanner module="courier" body={t('demo')} />
      <PageHeader
        title={t('panel.title')}
        subtitle={t('panel.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.profile'), href: paths.profile },
              { label: t('crumb.courier') },
            ]}
          />
        }
        actions={
          <div className="flex flex-row items-center gap-3">
            <Badge tone={online ? 'success' : 'neutral'}>
              {online ? t('panel.onShift') : t('panel.offShift')}
            </Badge>
            <Button as="a" href={paths.courierEarnings} variant="soft" size="2xl">
              {t('panel.earnings')}
            </Button>
            <Button as="a" href={paths.courierHistory} variant="soft" size="2xl">
              {t('panel.history')}
            </Button>
          </div>
        }
      />
    </>
  );

  if (me.isPending) {
    return (
      <>
        {header}
        <CourierPanelSkeleton label={t('panel.loading')} />
      </>
    );
  }

  if (me.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={me.error}
          title={t('panel.errorTitle')}
          message={t('panel.errorBody')}
          retryLabel={t('panel.retry')}
          onRetry={() => void me.refetch()}
        />
      </>
    );
  }

  /* The "not a courier" gate — a real state, not an error (`tR9sg`). */
  if (status === 'none' || status === 'rejected') {
    return (
      <>
        {header}
        <EmptyState
          icon={Package}
          tone="brand"
          panel
          title={t('panel.gateTitle')}
          body={t('panel.gateBody')}
          action={
            <Button as="a" href={paths.courierApply} variant="brand" size="2xl">
              {t('panel.gateCta')}
            </Button>
          }
        />
      </>
    );
  }

  if (status === 'pending') {
    return (
      <>
        {header}
        <EmptyState
          icon={Package}
          tone="muted"
          panel
          title={t('panel.pendingTitle')}
          body={t('panel.pendingBody')}
          action={
            <Button as="a" href={paths.courierApplyStatus} variant="primary" size="2xl">
              {t('panel.pendingCta')}
            </Button>
          }
        />
      </>
    );
  }

  const earnings = me.data.earnings;
  const active = me.data.activeOrder;
  const openMinutes = me.data.shift.openMinutes;

  return (
    <>
      {header}

      <div className="grid w-full grid-cols-2 gap-5 lg:grid-cols-4">
        <SummaryTile dark label={t('panel.todayEarning')} value={money(earnings.today)} />
        <SummaryTile label={t('panel.deliveries')} value={number(earnings.deliveriesToday)} />
        <SummaryTile
          label={t('panel.rating')}
          value={number(earnings.rating, { minimumFractionDigits: 1 })}
        />
        <SummaryTile
          label={t('panel.acceptance')}
          value={percent(earnings.acceptanceRate, { maximumFractionDigits: 0 })}
        />
      </div>

      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {active ? (
            <Link
              href={paths.courierDelivery(active.id)}
              className="flex w-full flex-row items-center gap-4 rounded-xl bg-brand p-6 hover:brightness-[1.03]"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-caption font-bold text-white/80">
                  {t('panel.activeDelivery', { number: active.number })}
                </span>
                <span className="truncate text-body-sm font-bold text-white">
                  {active.storeName} → {active.customerAddress}
                </span>
              </span>
              <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-pill bg-white px-5 text-label font-bold text-brand">
                {t('panel.continue')}
                <ChevronRight size={18} aria-hidden="true" />
              </span>
            </Link>
          ) : null}

          <section aria-labelledby="courier-offers" className="flex w-full flex-col gap-5">
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <h2 id="courier-offers" className="m-0 text-h3 font-extrabold text-ink">
                {t('panel.nearby')}
              </h2>
              {offers.data && offers.data.length > 0 ? (
                <Badge tone="brand">{t('panel.offerCount', { count: offers.data.length })}</Badge>
              ) : null}
            </div>

            {!online ? (
              <EmptyState
                icon={Package}
                tone="muted"
                panel
                title={t('panel.offTitle')}
                body={t('panel.offBody')}
                action={
                  <Button
                    variant="brand"
                    size="2xl"
                    loading={toggle.isPending}
                    onClick={() => toggle.mutate(true)}
                  >
                    {t('panel.openShift')}
                  </Button>
                }
              />
            ) : offers.isPending ? (
              <CourierPanelSkeleton label={t('panel.loading')} />
            ) : offers.isError ? (
              <ErrorState
                failure={offers.error}
                title={t('panel.errorTitle')}
                message={t('panel.errorBody')}
                retryLabel={t('panel.retry')}
                onRetry={() => void offers.refetch()}
              />
            ) : (offers.data ?? []).length === 0 ? (
              <EmptyState
                icon={Package}
                tone="muted"
                panel
                title={t('panel.noOffersTitle')}
                body={t('panel.noOffersBody')}
              />
            ) : (
              (offers.data ?? []).map((offer) => <OfferCard key={offer.id} offer={offer} />)
            )}
          </section>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[360px]">
          <CourierCard as="aside">
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <h2 className="m-0 text-h4 font-bold text-ink">{t('panel.shift')}</h2>
              <Switch
                checked={online}
                disabled={toggle.isPending}
                onCheckedChange={(checked) => toggle.mutate(checked)}
                aria-label={t('panel.shiftToggle')}
              />
            </div>
            <p className="m-0 text-caption text-ink2">
              {online
                ? t('panel.shiftOpen', {
                    duration: t('panel.hours', {
                      hours: Math.floor(openMinutes / 60),
                      minutes: openMinutes % 60,
                    }),
                  })
                : t('panel.shiftClosed')}
            </p>
            <div className="h-px w-full bg-line" />
            <dl className="m-0 flex w-full flex-col gap-3">
              <div className="flex w-full flex-row items-center justify-between gap-4">
                <dt className="text-label text-ink2">{t('panel.nextPayout')}</dt>
                <dd className="m-0 text-label font-bold text-ink">
                  {earnings.nextPayout ? date(earnings.nextPayout, 'dayMonth') : '—'}
                </dd>
              </div>
              <div className="flex w-full flex-row items-center justify-between gap-4">
                <dt className="text-label text-ink2">{t('panel.balance')}</dt>
                <dd className="m-0 text-label font-bold tabular-nums text-ink">
                  {money(earnings.balance)}
                </dd>
              </div>
            </dl>
          </CourierCard>

          <CourierCard as="aside" className="gap-2">
            <LinkRow href={paths.courierEarnings} icon={TrendingUp} label={t('panel.earnings')} />
            <LinkRow href={paths.courierHistory} icon={History} label={t('panel.history')} />
            <LinkRow href={paths.help} icon={LifeBuoy} label={t('panel.help')} />
          </CourierCard>
        </div>
      </div>
    </>
  );
}

function LinkRow({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof TrendingUp;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full flex-row items-center gap-3 rounded-md px-1 py-2 hover:bg-surface2"
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-md bg-surface2 text-ink2"
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1 text-label font-semibold text-ink">{label}</span>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink3" />
    </Link>
  );
}

/** One "Yaxınlıqdakı sifarişlər" card (radius 28, padding 24, gap 20). */
function OfferCard({ offer }: { offer: CourierOrder }) {
  const t = useTranslations('courier');
  const { money, number } = useFormat();

  return (
    <article className="flex w-full flex-row items-center gap-5 rounded-xl bg-surface p-6 max-md:flex-wrap">
      <span
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-surface2 text-ink2"
      >
        <Store size={24} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <span className="text-body-sm font-bold text-ink">{offer.storeName}</span>
        <span className="truncate text-caption text-ink2">
          {offer.storeAddress} → {offer.customerAddress}
        </span>
        <span className="flex flex-row flex-wrap gap-2">
          <MetaChip>
            {t('offer.km', { km: number(offer.distanceToStoreKm, { maximumFractionDigits: 1 }) })}
          </MetaChip>
          <MetaChip>{t('offer.eta', { minutes: offer.etaMinutes })}</MetaChip>
          {offer.payment === 'cash' ? (
            <MetaChip tone="yellow">
              {t('panel.paymentCash', { amount: money(offer.cashToCollect) })}
            </MetaChip>
          ) : (
            <MetaChip tone="sky">{t('panel.paymentCard')}</MetaChip>
          )}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-h4 font-extrabold tabular-nums text-brand">
          {money(courierOrderEarning(offer))}
        </span>
        <span className="text-micro text-ink3">{t('panel.earningSuffix')}</span>
      </div>

      <Button as="a" href={paths.courierOrder(offer.id)} variant="primary" size="md">
        {t('panel.view')}
      </Button>
    </article>
  );
}
