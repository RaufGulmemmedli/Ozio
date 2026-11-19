'use client';

/**
 * `/parcel/[id]` — "Bağlama · İzləmə" (`oFqsc`).
 *
 * Header = number + status tag + "Ləğv et" (only while searching/assigned, behind a confirm
 * dialog). Left: the map placeholder (with its mandatory keyboard-reachable text alternative) and
 * the status timeline. Right: the courier card, the handover codes and the price summary.
 *
 * The detail is re-read every ~10 s while the shipment is in flight (`useParcelDetail`), so the
 * mock's status chain becomes visible without a reload.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Package, Phone } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { MapPlaceholder } from '@/shared/media';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import {
  Avatar,
  Breadcrumbs,
  Button,
  IconButton,
  confirmDialog,
  toast,
} from '@/shared/ui';
import { paths } from '@/core/routes';

import { ParcelStatusTag } from '../components/parcel-status-tag';
import { ParcelTimeline } from '../components/parcel-timeline';
import { parcelCanCancel } from '../data/models/parcel';
import { useCancelParcel, useParcelDetail } from '../hooks/use-parcels';

import { ParcelTrackSkeleton } from './ParcelTrackSkeleton';

export function ParcelTrackView({ id }: { id: string }) {
  const t = useTranslations('parcel');
  const { money, date, number } = useFormat();

  const detail = useParcelDetail(id);
  const cancel = useCancelParcel();
  const parcel = detail.data;

  const askCancel = async () => {
    const ok = await confirmDialog({
      title: t('track.cancelTitle'),
      body: t('track.cancelBody'),
      confirmLabel: t('track.cancelConfirm'),
      cancelLabel: t('track.cancelDismiss'),
      destructive: true,
    });
    if (!ok || !parcel) return;
    cancel.mutate(parcel.id, {
      onError: (failure) => toast.error({ title: t('error.title'), body: failure.message }),
    });
  };

  return (
    <>
      <DemoBanner module="parcel" body={t('demo')} />

      <PageHeader
        title={parcel?.number ?? id}
        subtitle={
          parcel
            ? `${parcel.draft.pickup.address} → ${parcel.draft.dropoff.address}`
            : undefined
        }
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.parcel'), href: paths.parcel },
              { label: parcel?.number ?? id },
            ]}
          />
        }
        actions={
          parcel ? (
            <div className="flex flex-row items-center gap-3">
              <ParcelStatusTag status={parcel.status} />
              {parcelCanCancel(parcel) ? (
                <Button
                  variant="soft"
                  size="2xl"
                  loading={cancel.isPending}
                  onClick={() => void askCancel()}
                >
                  {t('track.cancel')}
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      {detail.isPending ? (
        <ParcelTrackSkeleton label={t('track.loading')} />
      ) : detail.isError ? (
        detail.error.kind === 'notFound' ? (
          <EmptyState
            icon={Package}
            tone="brand"
            panel
            title={t('track.notFoundTitle')}
            body={t('track.notFoundBody')}
            action={
              <Button as="a" href={paths.parcel} variant="brand" size="2xl">
                {t('track.backToList')}
              </Button>
            }
          />
        ) : (
          <ErrorState
            failure={detail.error}
            title={t('error.title')}
            message={t('error.body')}
            retryLabel={t('error.retry')}
            onRetry={() => void detail.refetch()}
          />
        )
      ) : parcel ? (
        <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {/* The export draws this as a gray strip; `surface2` is that fill. */}
            {parcel.status === 'cancelled' ? (
              <p
                role="status"
                className="m-0 w-full rounded-card bg-surface2 px-4 py-3 text-label font-medium text-ink2"
              >
                {t('track.cancelledNote')}
              </p>
            ) : null}

            <MapPlaceholder
              label={t('track.map')}
              height={320}
              pointListLabel={t('track.mapPoints')}
              showPointList
              points={[
                {
                  id: 'pickup',
                  label: parcel.draft.pickup.address,
                  detail: parcel.draft.pickup.contactName,
                  kind: 'store',
                  x: 28,
                  y: 36,
                },
                {
                  id: 'dropoff',
                  label: parcel.draft.dropoff.address,
                  detail: parcel.draft.dropoff.contactName,
                  kind: 'home',
                  x: 72,
                  y: 68,
                },
              ]}
            />

            <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
              <h2 className="m-0 text-h4 font-bold text-ink">{t('track.timeline')}</h2>
              <ParcelTimeline parcel={parcel} />
            </section>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[400px]">
            {parcel.courier ? (
              <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
                <h2 className="m-0 text-caption font-bold uppercase tracking-[0.04em] text-ink3">
                  {t('track.courier')}
                </h2>
                <div className="flex w-full flex-row items-center gap-3.5">
                  <Avatar name={parcel.courier.name} size={48} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-body-sm font-bold text-ink">{parcel.courier.name}</span>
                    <span className="text-caption text-ink2">
                      {t('track.courierMeta', {
                        vehicle: t(`vehicle.${parcel.courier.vehicle}`),
                        rating: number(parcel.courier.rating, { minimumFractionDigits: 1 }),
                      })}
                    </span>
                  </div>
                  {parcel.courier.phone ? (
                    <IconButton
                      as="a"
                      href={`tel:${parcel.courier.phone.replace(/\s/g, '')}`}
                      aria-label={t('track.call')}
                      tone="surface2"
                    >
                      <Phone size={20} aria-hidden="true" />
                    </IconButton>
                  ) : null}
                </div>
              </section>
            ) : parcel.status === 'searching' ? (
              <section className="flex w-full flex-col gap-2 rounded-xl bg-yellow p-6">
                <h2 className="m-0 text-h4 font-extrabold text-on-yellow">
                  {t('track.searching')}
                </h2>
                <p className="m-0 text-caption text-on-yellow/80">{t('track.searchingBody')}</p>
              </section>
            ) : null}

            {parcel.status !== 'delivered' && parcel.status !== 'cancelled' ? (
              <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
                <h2 className="m-0 text-h4 font-bold text-ink">{t('track.codes')}</h2>
                <dl className="m-0 flex w-full flex-row gap-4">
                  <CodeBlock label={t('track.pickupCode')} code={parcel.pickupCode} />
                  <CodeBlock label={t('track.deliveryCode')} code={parcel.deliveryCode} />
                </dl>
                <p className="m-0 text-micro text-ink3">{t('track.codesNote')}</p>
              </section>
            ) : parcel.deliveredAt ? (
              <section className="flex w-full flex-col gap-2 rounded-xl bg-success-soft p-6">
                <p className="m-0 text-body-sm font-bold text-success">
                  {t('track.deliveredAt', { time: date(parcel.deliveredAt, 'time') })}
                </p>
              </section>
            ) : null}

            <section className="flex w-full flex-col gap-3.5 rounded-xl bg-surface p-6">
              <h2 className="m-0 text-h4 font-bold text-ink">{t('track.priceTitle')}</h2>
              <dl className="m-0 flex w-full flex-col gap-3">
                <PriceRow label={t('track.base')} value={money(parcel.quote.baseFee)} />
                <PriceRow
                  label={t('track.distanceWeight')}
                  value={money(parcel.quote.distanceFee + parcel.quote.weightFee)}
                />
                {parcel.quote.fragileFee > 0 ? (
                  <PriceRow label={t('track.fragile')} value={money(parcel.quote.fragileFee)} />
                ) : null}
              </dl>
              <div className="h-px w-full bg-line" />
              <div className="flex w-full flex-row items-center justify-between">
                <span className="text-body font-bold text-ink">{t('track.total')}</span>
                <span className="text-h4 font-extrabold tabular-nums text-ink">
                  {parcel.status === 'cancelled'
                    ? t('status.noPrice')
                    : money(parcel.quote.price)}
                </span>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <dt className="text-caption text-ink2">{label}</dt>
      <dd className="m-0 text-h2 font-extrabold tracking-[0.08em] tabular-nums text-brand">
        {code}
      </dd>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4">
      <dt className="text-label text-ink2">{label}</dt>
      <dd className="m-0 text-label font-bold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
