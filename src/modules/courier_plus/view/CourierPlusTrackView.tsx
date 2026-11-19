'use client';

/**
 * `/courier-plus/track/[id]` — `Yolüstü kuryer · Çatdırılma` (`TWInN`) and its result state
 * `Çatdırılma · Tamamlandı` (`Lig3w`, step 4 of the drawn stepper = `CpDelivery.step === 3`).
 *
 * Left column: the map block (with its mandatory text alternative — route line, both points and
 * the detour) or, once delivered, the `success-soft` earned hero. Then the four-stage `<ol>`.
 * Right column: the dark pay card and the one contextual primary button; every step forward is a
 * server call, and the last one is what credits the balance.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { Check, MapPin, Store } from '@/shared/lucide';
import { MapPlaceholder } from '@/shared/media';
import { ErrorState } from '@/shared/states';
import { Button } from '@/shared/ui';

import { CpDeliverySteps } from '../components/CpDeliverySteps';
import { CpLinkButton } from '../components/CpLinkButton';
import { CpPayCard } from '../components/CpPayCard';
import { CpScreen } from '../components/CpScreen';
import { CpStateCard } from '../components/CpStateCard';
import { CP_LAST_STEP } from '../data/models/courier-plus';
import { useAdvanceCourierPlusDelivery, useCourierPlusDelivery } from '../hooks/use-courier-plus';

import { CourierPlusTrackSkeleton } from './CourierPlusTrackSkeleton';

export interface CourierPlusTrackViewProps {
  offerId: string;
}

export function CourierPlusTrackView({ offerId }: CourierPlusTrackViewProps) {
  const t = useTranslations('courier_plus');
  const f = useFormat();
  const failureMessage = useFailureMessage();

  const delivery = useCourierPlusDelivery(offerId);
  const advance = useAdvanceCourierPlusDelivery(offerId);

  const label = `#${offerId}`;
  const offer = delivery.data?.offer;

  const header = (
    <CpScreen
      crumbs={[
        { label: t('crumb.module'), href: paths.courierPlus },
        { label: t('track.title', { id: label }) },
      ]}
      title={t('track.title', { id: label })}
      subtitle={
        offer ? t('track.subtitle', { pickup: offer.pickup, dropoff: offer.dropoff }) : undefined
      }
    />
  );

  if (delivery.isPending) {
    return (
      <>
        {header}
        <CourierPlusTrackSkeleton />
      </>
    );
  }

  if (delivery.isError) {
    const notFound = delivery.error.kind === 'notFound';
    return (
      <>
        {header}
        <CpStateCard>
          <ErrorState
            failure={delivery.error}
            title={notFound ? t('track.notFound.title') : t('track.error.title')}
            message={notFound ? t('track.notFound.body') : failureMessage(delivery.error)}
            retryLabel={t('retry')}
            onRetry={notFound ? undefined : () => void delivery.refetch()}
            secondaryAction={
              <CpLinkButton href={paths.courierPlusMatches} variant="soft" size="lg">
                {t('track.done.seeMatches')}
              </CpLinkButton>
            }
          />
        </CpStateCard>
      </>
    );
  }

  const data = delivery.data;
  const done = data.step >= CP_LAST_STEP;
  const nextLabel = t(`track.next.${Math.min(data.step, CP_LAST_STEP - 1)}`);

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {done ? (
            /* Earned Hero (`Lig3w`) */
            <section
              aria-labelledby="cp-earned"
              className="flex w-full flex-col items-center gap-3 rounded-bento bg-success-soft p-7 md:p-10"
            >
              <span
                aria-hidden="true"
                className="flex size-18 shrink-0 items-center justify-center rounded-pill bg-success text-white"
              >
                <Check size={32} />
              </span>
              <h2 id="cp-earned" className="m-0 text-body font-bold text-ink2">
                {t('track.done.title')}
              </h2>
              <p className="m-0 text-[40px] font-extrabold leading-none text-ink md:text-[56px]">
                {`+${f.money(data.offer.pay)}`}
              </p>
              <p className="m-0 text-body-sm font-normal text-ink2">{t('track.done.body')}</p>
              <CpLinkButton href={paths.courierPlusMatches} variant="primary" size="lg">
                {t('track.done.seeMatches')}
              </CpLinkButton>
            </section>
          ) : (
            <MapPlaceholder
              label={t('track.map')}
              height={320}
              pointListLabel={t('track.mapPoints')}
              showPointList
              points={[
                {
                  id: 'pickup',
                  kind: 'store',
                  label: data.offer.pickup,
                  detail: t('matches.pickup'),
                  icon: Store,
                  x: 26,
                  y: 34,
                },
                {
                  id: 'dropoff',
                  kind: 'home',
                  label: data.offer.dropoff,
                  detail: t('matches.dropoff'),
                  icon: MapPin,
                  x: 70,
                  y: 66,
                },
                {
                  id: 'detour',
                  kind: 'courier',
                  label: t('track.mapDetour', { minutes: data.offer.detourMinutes }),
                  detail: t('matches.distance', {
                    value: f.number(data.offer.distanceKm, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }),
                  }),
                  x: 48,
                  y: 50,
                }
              ]}
            >
              <span className="absolute left-6 top-6 rounded-pill bg-surface px-3.5 py-2 text-caption font-bold text-ink">
                {t('track.map')}
              </span>
            </MapPlaceholder>
          )}

          <CpDeliverySteps delivery={data} />
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-[400px] lg:shrink-0">
          <CpPayCard offer={data.offer} />

          {done ? (
            <CpLinkButton href={paths.courierPlusEarnings} variant="soft" size="lg" fullWidth>
              {t('track.done.seeEarnings')}
            </CpLinkButton>
          ) : (
            <Button
              variant="brand"
              size="2xl"
              fullWidth
              loading={advance.isPending}
              leadingIcon={<Check size={20} aria-hidden="true" />}
              onClick={() => advance.mutate()}
            >
              {nextLabel}
            </Button>
          )}

          {advance.error ? (
            <p role="alert" className="m-0 text-label font-semibold text-brand">
              {failureMessage(advance.error)}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
