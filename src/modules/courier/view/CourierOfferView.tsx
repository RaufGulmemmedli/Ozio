'use client';

/**
 * `/courier/orders/[id]` — "Kuryer · Təklif detalı" (`q5s0D`).
 *
 * Left: the route map (with its mandatory text alternative), the Places card, the Items card and
 * the customer note. Right (400): the dark earning hero, the breakdown card and the two actions —
 * "Qəbul et" (→ `/courier/delivery/[id]`, refused with "Əvvəlcə cari çatdırmanı bitir" while
 * another order is live) and "Rədd et", which always opens the decline modal (`C4Tz9d`) first.
 *
 * "Offer already taken / not found" is the drawn State Card, not an error banner.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFormat } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { MapPin, Package, Store } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { MapPlaceholder } from '@/shared/media';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Badge, Breadcrumbs, Button, toast } from '@/shared/ui';

import {
  CourierCard,
  ItemsList,
  KeyValue,
  MetaChip,
} from '../components/courier-bits';
import {
  CourierDeclineModal,
  type DeclineReason,
} from '../components/courier-decline-modal';
import { courierItemCount, courierOrderEarning } from '../data/models/courier';
import {
  useAcceptCourierOrder,
  useCourierMe,
  useCourierOrder,
  useDeclineCourierOrder,
} from '../hooks/use-courier';

import { CourierOfferSkeleton } from './CourierOfferSkeleton';

export function CourierOfferView({ id }: { id: string }) {
  const t = useTranslations('courier');
  const router = useRouter();
  const { money, number } = useFormat();

  const order = useCourierOrder(id);
  const me = useCourierMe();
  const accept = useAcceptCourierOrder();
  const decline = useDeclineCourierOrder();
  const [declineOpen, setDeclineOpen] = useState(false);

  const data = order.data;
  const hasActive = Boolean(me.data?.activeOrder);

  const onAccept = () => {
    if (hasActive) {
      toast.error({ title: t('offer.activeBlocked') });
      return;
    }
    accept.mutate(id, {
      onSuccess: (accepted) => router.push(paths.courierDelivery(accepted.id)),
      onError: (failure) =>
        toast.error({
          title:
            failure.statusCode === 409 ? t('offer.activeBlocked') : t('offer.takenTitle'),
          body: failure.message,
        }),
    });
  };

  const onDecline = (reason: DeclineReason) => {
    decline.mutate(
      { id, reason },
      {
        onSuccess: () => {
          setDeclineOpen(false);
          toast.info({ title: t('decline.done') });
          router.push(paths.courier);
        },
        onError: (failure) => toast.error({ title: t('offer.takenTitle'), body: failure.message }),
      },
    );
  };

  const header = (
    <>
      <DemoBanner module="courier" body={t('demo')} />
      <PageHeader
        title={data ? t('offer.title', { number: data.number }) : t('offer.title', { number: id })}
        subtitle={
          data
            ? t('offer.route', { store: data.storeName, customer: data.customerAddress })
            : undefined
        }
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.courier'), href: paths.courier },
              { label: data ? t('offer.crumb', { number: data.number }) : id },
            ]}
          />
        }
        actions={
          data?.status === 'available' ? <Badge tone="brand">{t('offer.tag')}</Badge> : undefined
        }
      />
    </>
  );

  if (order.isPending) {
    return (
      <>
        {header}
        <CourierOfferSkeleton label={t('offer.loading')} />
      </>
    );
  }

  if (order.isError) {
    return (
      <>
        {header}
        {order.error.kind === 'notFound' ? (
          <EmptyState
            icon={Package}
            tone="brand"
            panel
            title={t('offer.takenTitle')}
            body={t('offer.takenBody')}
            action={
              <Button as="a" href={paths.courier} variant="brand" size="2xl">
                {t('offer.backToPanel')}
              </Button>
            }
          />
        ) : (
          <ErrorState
            failure={order.error}
            title={t('panel.errorTitle')}
            message={t('panel.errorBody')}
            retryLabel={t('panel.retry')}
            onRetry={() => void order.refetch()}
          />
        )}
      </>
    );
  }

  if (!data) return header;

  /* An offer somebody else already took shows the same drawn State Card. */
  if (data.status !== 'available') {
    return (
      <>
        {header}
        <EmptyState
          icon={Package}
          tone="brand"
          panel
          title={t('offer.takenTitle')}
          body={t('offer.takenBody')}
          action={
            <Button as="a" href={paths.courier} variant="brand" size="2xl">
              {t('offer.backToPanel')}
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}

      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <MapPlaceholder
            label={t('offer.map')}
            height={300}
            pointListLabel={t('offer.mapPoints')}
            showPointList
            points={[
              {
                id: 'store',
                label: data.storeName,
                detail: data.storeAddress,
                kind: 'store',
                x: 30,
                y: 34,
              },
              {
                id: 'customer',
                label: data.customerName,
                detail: data.customerAddress,
                kind: 'home',
                x: 70,
                y: 66,
              },
            ]}
          />

          <CourierCard>
            <PlaceRow
              eyebrow={t('offer.store')}
              icon={Store}
              title={data.storeName}
              body={data.storeAddress}
              chip={t('offer.km', {
                km: number(data.distanceToStoreKm, { maximumFractionDigits: 1 }),
              })}
            />
            <div className="h-px w-full bg-line" />
            <PlaceRow
              eyebrow={t('offer.customer')}
              icon={MapPin}
              title={data.customerName}
              body={
                data.customerAddressDetails
                  ? `${data.customerAddress} · ${data.customerAddressDetails}`
                  : data.customerAddress
              }
              chip={t('offer.km', { km: number(data.distanceKm, { maximumFractionDigits: 1 }) })}
            />
          </CourierCard>

          <CourierCard>
            <h2 className="m-0 text-h4 font-bold text-ink">
              {t('offer.items', { count: courierItemCount(data) })}
            </h2>
            <ItemsList items={data.items} />
          </CourierCard>

          {data.customerNote ? (
            <CourierCard>
              <h2 className="m-0 text-caption font-bold uppercase tracking-[0.04em] text-ink3">
                {t('offer.note')}
              </h2>
              <p className="m-0 text-body-sm text-ink">{data.customerNote}</p>
            </CourierCard>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[400px]">
          <section className="flex w-full flex-col gap-4 rounded-bento bg-block p-8">
            <h2 className="m-0 text-caption font-bold uppercase tracking-[0.04em] text-on-block/70">
              {t('offer.earning')}
            </h2>
            <p className="m-0 text-h1-app font-extrabold tabular-nums text-on-block">
              {money(courierOrderEarning(data))}
            </p>
            <div className="flex flex-row flex-wrap gap-2">
              <span className="inline-flex h-[30px] items-center rounded-pill bg-on-block/10 px-3 text-caption font-semibold tabular-nums text-on-block">
                {t('offer.km', {
                  km: number(data.distanceToStoreKm + data.distanceKm, {
                    maximumFractionDigits: 1,
                  }),
                })}
              </span>
              <span className="inline-flex h-[30px] items-center rounded-pill bg-on-block/10 px-3 text-caption font-semibold tabular-nums text-on-block">
                {t('offer.eta', { minutes: data.etaMinutes })}
              </span>
              <span className="inline-flex h-[30px] items-center rounded-pill bg-on-block/10 px-3 text-caption font-semibold text-on-block">
                {data.payment === 'cash'
                  ? t('panel.paymentCash', { amount: money(data.cashToCollect) })
                  : t('panel.paymentCard')}
              </span>
            </div>
          </section>

          <CourierCard>
            <h2 className="m-0 text-h4 font-bold text-ink">{t('offer.breakdown')}</h2>
            <dl className="m-0 flex w-full flex-col gap-3">
              <KeyValue label={t('offer.fee')} value={money(data.fee - data.distanceBonus)} />
              <KeyValue label={t('offer.distanceBonus')} value={money(data.distanceBonus)} />
              <KeyValue label={t('offer.tip')} value={money(data.tip)} />
            </dl>
            <div className="h-px w-full bg-line" />
            <div className="flex w-full flex-row items-center justify-between">
              <span className="text-body font-bold text-ink">{t('offer.total')}</span>
              <span className="text-h4 font-extrabold tabular-nums text-ink">
                {money(courierOrderEarning(data))}
              </span>
            </div>
          </CourierCard>

          <div className="flex w-full flex-col gap-3">
            <Button
              variant="brand"
              size="3xl"
              fullWidth
              loading={accept.isPending}
              onClick={onAccept}
            >
              {t('offer.accept')}
            </Button>
            <Button
              variant="soft"
              size="2xl"
              fullWidth
              disabled={decline.isPending}
              onClick={() => setDeclineOpen(true)}
            >
              {t('offer.decline')}
            </Button>
          </div>
        </div>
      </div>

      <CourierDeclineModal
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        submitting={decline.isPending}
        onConfirm={onDecline}
      />
    </>
  );
}

function PlaceRow({
  eyebrow,
  icon: Icon,
  title,
  body,
  chip,
}: {
  eyebrow: string;
  icon: typeof Store;
  title: string;
  body: string;
  chip: string;
}) {
  return (
    <div className="flex w-full flex-row items-center gap-4">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-md bg-surface2 text-ink2"
      >
        <Icon size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-nano font-bold uppercase tracking-[0.06em] text-ink3">{eyebrow}</span>
        <span className="text-body-sm font-bold text-ink">{title}</span>
        <span className="truncate text-caption text-ink2">{body}</span>
      </div>
      <MetaChip>{chip}</MetaChip>
    </div>
  );
}
