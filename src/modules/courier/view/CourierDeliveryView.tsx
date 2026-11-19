'use client';

/**
 * `/courier/delivery/[id]` — "Kuryer · Aktiv çatdırılma" (`u1iKvk`).
 *
 * Status tag + the 4-step stepper driven by `CourierOrderStatus`, the live map, the dark
 * "Növbəti addım" card with a **single contextual primary button** (accepted → "Mağazadayam",
 * atStore → "Məhsulu götürdüm", pickedUp → "Çatdırdım", which for a cash order confirms the
 * `cashToCollect` amount first), the items checklist, the customer card and the payment card.
 *
 * "Problem bildir" and the cash step both confirm before acting (destructive-action rule).
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { Check, Package, Phone, TriangleAlert } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { MapPlaceholder } from '@/shared/media';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  IconButton,
  Stepper,
  confirmDialog,
  toast,
} from '@/shared/ui';

import { CourierCard, ItemsList, KeyValue } from '../components/courier-bits';
import {
  courierItemCount,
  courierOrderEarning,
  courierStep,
  type CourierOrder,
  type CourierOrderStatus,
} from '../data/models/courier';
import { useAdvanceCourierOrder, useCourierOrder } from '../hooks/use-courier';

import { CourierOfferSkeleton } from './CourierOfferSkeleton';

const STATUS_TAG: Record<CourierOrderStatus, string> = {
  available: 'delivery.statusAccepted',
  accepted: 'delivery.statusAccepted',
  atStore: 'delivery.statusAtStore',
  pickedUp: 'delivery.statusPickedUp',
  delivered: 'delivery.statusDelivered',
  cancelled: 'delivery.statusDelivered',
};

export function CourierDeliveryView({ id }: { id: string }) {
  const t = useTranslations('courier');
  const router = useRouter();
  const { money } = useFormat();

  const order = useCourierOrder(id);
  const advance = useAdvanceCourierOrder();
  const data = order.data;

  const header = (
    <>
      <DemoBanner module="courier" body={t('demo')} />
      <PageHeader
        title={t('delivery.title')}
        subtitle={
          data
            ? t('delivery.subtitle', {
                number: data.number,
                store: data.storeName,
                customer: data.customerAddress,
              })
            : undefined
        }
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.courier'), href: paths.courier },
              { label: data ? t('delivery.crumb', { number: data.number }) : id },
            ]}
          />
        }
        actions={data ? <Badge tone="sky">{t(STATUS_TAG[data.status])}</Badge> : undefined}
      />
    </>
  );

  if (order.isPending) {
    return (
      <>
        {header}
        <CourierOfferSkeleton label={t('delivery.loading')} />
      </>
    );
  }

  if (order.isError) {
    return (
      <>
        {header}
        {order.error.kind === 'notFound' ? (
          <NoDelivery />
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

  if (!data || data.status === 'available' || data.status === 'cancelled') {
    return (
      <>
        {header}
        <NoDelivery />
      </>
    );
  }

  const step = courierStep(data.status);
  const finished = data.status === 'delivered';

  const next = async () => {
    // A cash order asks the courier to confirm the collected amount before it closes.
    if (data.status === 'pickedUp' && data.payment === 'cash' && data.cashToCollect > 0) {
      const ok = await confirmDialog({
        title: t('delivery.cashTitle'),
        body: t('delivery.cashBody', { amount: money(data.cashToCollect) }),
        confirmLabel: t('delivery.cashConfirm'),
        cancelLabel: t('delivery.cashCancel'),
      });
      if (!ok) return;
    }
    advance.mutate(data.id, {
      onError: (failure) =>
        toast.error({ title: t('panel.errorTitle'), body: failure.message }),
    });
  };

  const reportProblem = async () => {
    const ok = await confirmDialog({
      title: t('delivery.reportTitle'),
      body: t('delivery.reportBody'),
      confirmLabel: t('delivery.reportConfirm'),
      cancelLabel: t('delivery.cashCancel'),
    });
    if (ok) toast.info({ title: t('delivery.reportBody') });
  };

  return (
    <>
      {header}

      {/* `Stepper` card: white, radius 28, padding 24, steps spread across the full width. */}
      <div className="w-full rounded-xl bg-surface p-6">
        <Stepper
          label={t('delivery.stepsLabel')}
          current={step}
          steps={[
            { label: t('delivery.step1') },
            { label: t('delivery.step2') },
            { label: t('delivery.step3') },
            { label: t('delivery.step4') },
          ]}
          className="w-full justify-between"
        />
      </div>

      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <MapPlaceholder
            label={t('delivery.map')}
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

          <NextStepCard order={data} onNext={() => void next()} busy={advance.isPending} />

          <CourierCard>
            <h2 className="m-0 text-h4 font-bold text-ink">
              {t('offer.items', { count: courierItemCount(data) })}
            </h2>
            <ItemsList items={data.items} />
          </CourierCard>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[400px]">
          <CourierCard as="aside">
            <h2 className="m-0 text-caption font-bold uppercase tracking-[0.04em] text-ink3">
              {t('delivery.customer')}
            </h2>
            <div className="flex w-full flex-row items-center gap-3.5">
              <Avatar name={data.customerName} size={48} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-sm font-bold text-ink">{data.customerName}</span>
                <span className="text-caption text-ink2">
                  {data.customerAddressDetails || data.customerAddress}
                </span>
              </div>
              {data.customerPhone ? (
                <IconButton
                  as="a"
                  href={`tel:${data.customerPhone.replace(/\s/g, '')}`}
                  aria-label={t('delivery.call')}
                  tone="surface2"
                >
                  <Phone size={20} aria-hidden="true" />
                </IconButton>
              ) : null}
            </div>
            {data.customerNote ? (
              <p className="m-0 rounded-md bg-surface2 p-3.5 text-caption text-ink">
                {data.customerNote}
              </p>
            ) : null}
          </CourierCard>

          <CourierCard as="aside">
            <h2 className="m-0 text-h4 font-bold text-ink">{t('delivery.payment')}</h2>
            <dl className="m-0 flex w-full flex-col gap-3">
              <KeyValue
                label={t('delivery.method')}
                value={
                  data.payment === 'cash' ? t('delivery.methodCash') : t('delivery.methodCard')
                }
              />
              <KeyValue
                label={t('delivery.cashToCollect')}
                value={data.payment === 'cash' ? money(data.cashToCollect) : t('history.noTip')}
              />
              <KeyValue
                label={t('delivery.yourEarning')}
                value={money(courierOrderEarning(data))}
                strong
              />
            </dl>
          </CourierCard>

          <Button variant="soft" size="lg" fullWidth onClick={() => void reportProblem()}>
            <span className="flex items-center gap-2">
              <TriangleAlert size={18} aria-hidden="true" />
              {t('delivery.reportProblem')}
            </span>
          </Button>

          {finished ? (
            <Button
              variant="primary"
              size="3xl"
              fullWidth
              onClick={() => router.push(paths.courier)}
            >
              {t('delivery.doneAction')}
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}

function NoDelivery() {
  const t = useTranslations('courier');
  return (
    <EmptyState
      icon={Package}
      tone="muted"
      panel
      title={t('delivery.noneTitle')}
      body={t('delivery.noneBody')}
      action={
        <Button as="a" href={paths.courier} variant="brand" size="2xl">
          {t('offer.backToPanel')}
        </Button>
      }
    />
  );
}

/** The dark "Növbəti addım" card: one contextual action, nothing else. */
function NextStepCard({
  order,
  onNext,
  busy,
}: {
  order: CourierOrder;
  onNext: () => void;
  busy: boolean;
}) {
  const t = useTranslations('courier');

  const copy =
    order.status === 'accepted'
      ? {
          title: t('delivery.goToStore'),
          body: t('delivery.goToStoreBody', {
            store: order.storeName,
            address: order.storeAddress,
          }),
          action: t('delivery.atStoreAction'),
        }
      : order.status === 'atStore'
        ? {
            title: t('delivery.pickupTitle'),
            body: t('delivery.pickupBody', {
              store: order.storeName,
              address: order.storeAddress,
            }),
            action: t('delivery.pickedUpAction'),
          }
        : order.status === 'pickedUp'
          ? {
              title: t('delivery.deliverTitle'),
              body: t('delivery.deliverBody', {
                address: order.customerAddressDetails
                  ? `${order.customerAddress} · ${order.customerAddressDetails}`
                  : order.customerAddress,
              }),
              action: t('delivery.deliveredAction'),
            }
          : { title: t('delivery.doneTitle'), body: t('delivery.doneBody'), action: null };

  return (
    <section className="flex w-full flex-col gap-4 rounded-bento bg-block p-8">
      <h2 className="m-0 text-caption font-bold uppercase tracking-[0.04em] text-on-block/70">
        {t('delivery.nextStep')}
      </h2>
      <p className="m-0 flex flex-row items-center gap-2.5 text-h4 font-extrabold text-on-block">
        {copy.action === null ? <Check size={22} aria-hidden="true" /> : null}
        {copy.title}
      </p>
      <p className="m-0 max-w-[560px] text-body-sm text-on-block/70">{copy.body}</p>
      {copy.action !== null ? (
        <Button variant="brand" size="3xl" loading={busy} onClick={onNext} className="w-full md:w-fit">
          {copy.action}
        </Button>
      ) : null}
    </section>
  );
}
