'use client';

/**
 * `/courier-plus` — `Yolüstü kuryer · Əsas` (`uVeqa`).
 *
 * Dark balance hero + the yellow "Yolda olan kuryer" card (only while a hand-off is open), then
 * the three cards: Marşrutum, Qonşu anbar, Qazanc.
 *
 * `?preview=loading|empty|error` all work through `useScreenQuery`. The neighbour-hub picker
 * (`z57Lfl`) opens from the hub card, because that modal belongs to the consumer side of the
 * feature and the landing is where it is drawn over.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { Badge, toast } from '@/shared/ui';
import { ErrorState } from '@/shared/states';

import { CpLinkButton } from '../components/CpLinkButton';
import { CpNeighborHubModal } from '../components/CpNeighborHubModal';
import {
  CpBalanceHero,
  CpCard,
  CpCardHeader,
  CpCardTitle,
  CpInfoRow,
  CpInfoRows,
} from '../components/CpPrimitives';
import { CpScreen } from '../components/CpScreen';
import { minutesToClock } from '../data/models/courier-plus';
import {
  useCourierPlusNearbyHubs,
  useCourierPlusOverview,
  useCourierPlusRoute,
} from '../hooks/use-courier-plus';

import { CourierPlusHomeSkeleton } from './CourierPlusHomeSkeleton';

export function CourierPlusHomeView() {
  const t = useTranslations('courier_plus');
  const f = useFormat();
  const failureMessage = useFailureMessage();

  const overview = useCourierPlusOverview();
  const route = useCourierPlusRoute();
  const [pickerOpen, setPickerOpen] = useState(false);
  const nearby = useCourierPlusNearbyHubs(pickerOpen);

  const crumbs = [
    { label: t('crumb.root'), href: paths.profile },
    { label: t('crumb.module') },
  ];

  const header = (
    <CpScreen
      crumbs={crumbs}
      title={t('home.title')}
      subtitle={t('home.subtitle')}
      actions={
        <CpLinkButton href={paths.courierPlusEarnings} variant="white" size="lg">
          {t('home.earnings')}
        </CpLinkButton>
      }
    />
  );

  if (overview.isPending || route.isPending) {
    return (
      <>
        {header}
        <CourierPlusHomeSkeleton />
      </>
    );
  }

  if (overview.isError || route.isError) {
    const failure = overview.error ?? route.error;
    return (
      <>
        {header}
        <ErrorState
          failure={failure}
          title={t('home.error.title')}
          message={failure ? failureMessage(failure) : undefined}
          retryLabel={t('retry')}
          onRetry={() => {
            void overview.refetch();
            void route.refetch();
          }}
        />
      </>
    );
  }

  const data = overview.data;
  const declaredRoute = route.data;
  const routeDeclared = Boolean(declaredRoute.from.trim() && declaredRoute.to.trim());

  return (
    <>
      {header}

      {/* Hero Row */}
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <CpBalanceHero
          labelId="cp-balance"
          label={t('home.balance')}
          amount={data.balance}
          note={t('home.monthSummary', {
            deliveries: data.deliveries,
            amount: f.money(data.month),
          })}
          action={
            <CpLinkButton href={paths.courierPlusMatches} variant="brand" size="2xl">
              {t('home.seeMatches')}
            </CpLinkButton>
          }
        />

        {data.activeDeliveryId ? (
          <section
            aria-labelledby="cp-on-the-way"
            className="flex w-full flex-col items-start gap-3.5 rounded-bento bg-yellow p-8 lg:w-[420px] lg:shrink-0"
          >
            <h2
              id="cp-on-the-way"
              className="m-0 text-micro font-extrabold uppercase tracking-wide text-on-yellow/70"
            >
              {t('home.onTheWay')}
            </h2>
            <p className="m-0 text-[22px] font-extrabold leading-tight text-on-yellow">
              {declaredRoute.to || t('crumb.module')}
            </p>
            <p className="m-0 text-label font-medium text-on-yellow">
              {routeDeclared ? `${declaredRoute.from} → ${declaredRoute.to}` : t('home.noRoute')}
            </p>
            <CpLinkButton
              href={paths.courierPlusTrack(data.activeDeliveryId)}
              variant="primary"
              size="lg"
              fullWidth
            >
              {t('home.continue')}
            </CpLinkButton>
          </section>
        ) : null}
      </div>

      {/* Cards Row */}
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Marşrutum */}
        <CpCard aria-labelledby="cp-route-card">
          <CpCardHeader
            title={t('home.route')}
            titleId="cp-route-card"
            tag={
              <Badge tone={data.routeActive ? 'success' : 'neutral'}>
                {data.routeActive ? t('home.routeActive') : t('home.routeInactive')}
              </Badge>
            }
          />
          <CpInfoRows>
            <CpInfoRow label={t('home.from')} value={declaredRoute.from || '—'} />
            <CpInfoRow label={t('home.to')} value={declaredRoute.to || '—'} />
            <CpInfoRow
              label={t('home.departAt')}
              value={minutesToClock(declaredRoute.departMinutes)}
            />
            <CpInfoRow
              label={t('home.transport')}
              value={t(`transport.${declaredRoute.transport}`)}
            />
          </CpInfoRows>
          <CpLinkButton href={paths.courierPlusRoute} variant="soft" size="lg" fullWidth>
            {routeDeclared ? t('home.changeRoute') : t('home.setRoute')}
          </CpLinkButton>
        </CpCard>

        {/* Qonşu anbar */}
        <CpCard aria-labelledby="cp-hub-card">
          <CpCardHeader
            title={t('home.hub')}
            titleId="cp-hub-card"
            tag={
              <Badge tone={data.hubRegistered ? 'success' : 'neutral'}>
                {data.hubRegistered ? t('home.hubRegistered') : t('home.hubUnregistered')}
              </Badge>
            }
          />
          <p className="m-0 text-label font-normal leading-[21px] text-ink2">
            {t('home.hubBody', { commission: f.money(data.hubCommission) })}
          </p>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full flex-row items-center gap-3 rounded-md p-1 text-left hover:bg-surface2"
          >
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft text-[16px] font-extrabold text-ink"
            >
              {data.nearbyHubCount}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-body font-extrabold text-ink">{t('home.hubNearbyTitle')}</span>
              <span className="text-caption font-normal text-ink2">
                {t('home.hubNearbyBody', { count: data.nearbyHubCount })}
              </span>
            </span>
          </button>

          <CpLinkButton
            href={data.hubRegistered ? paths.courierPlusHub : paths.courierPlusHubRegister}
            variant="brand"
            size="lg"
            fullWidth
          >
            {data.hubRegistered ? t('home.hubPanel') : t('home.hubOpen')}
          </CpLinkButton>
        </CpCard>

        {/* Qazanc */}
        <CpCard aria-labelledby="cp-earnings-card">
          <CpCardTitle id="cp-earnings-card">{t('home.earnings')}</CpCardTitle>
          <CpInfoRows>
            <CpInfoRow label={t('home.today')} value={f.money(data.today)} />
            <CpInfoRow label={t('home.month')} value={f.money(data.month)} />
            <CpInfoRow label={t('home.deliveries')} value={f.number(data.deliveries)} />
          </CpInfoRows>
          <CpLinkButton href={paths.courierPlusEarnings} variant="soft" size="lg" fullWidth>
            {t('home.more')}
          </CpLinkButton>
        </CpCard>
      </div>

      <CpNeighborHubModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        hubs={nearby.data ?? []}
        loading={pickerOpen && nearby.isPending}
        failure={nearby.error}
        onRetry={() => void nearby.refetch()}
        onSelect={(hub) => {
          setPickerOpen(false);
          toast.success({ title: t('nearby.selected', { name: hub.name }) });
        }}
      />
    </>
  );
}
