'use client';

/**
 * `/courier-plus/hub` — `Yolüstü kuryer · Anbar paneli` (`bjCMr`), its loading state (`kWPz7`)
 * and the hand-over code modal (`ooPsK`).
 *
 * Before registration the screen shows the **gate** — a state with a CTA to `hub/register`, not an
 * error: the mock answers `notFound` ("Məntəqə qeydiyyatdan keçməyib") and that is the documented
 * "you are not a hub yet" answer.
 *
 * "Təhvil verildi" opens the code modal; the code is checked by the server and the row only
 * disappears once it accepted it.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { House, Package } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Badge, Button, toast } from '@/shared/ui';

import { CpHubCodeModal } from '../components/CpHubCodeModal';
import { CpLinkButton } from '../components/CpLinkButton';
import { CpCardTitle, CpStatTile } from '../components/CpPrimitives';
import { CpScreen } from '../components/CpScreen';
import { CpStateCard } from '../components/CpStateCard';
import {
  isHubOpenAt,
  minutesToClock,
  type CpHubParcel,
} from '../data/models/courier-plus';
import {
  useCourierPlusHandOver,
  useCourierPlusHubDashboard,
  useCourierPlusOverview,
} from '../hooks/use-courier-plus';

import { CourierPlusHubSkeleton } from './CourierPlusHubSkeleton';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * 60;

export function CourierPlusHubView() {
  const t = useTranslations('courier_plus');
  const f = useFormat();
  const failureMessage = useFailureMessage();

  const dashboard = useCourierPlusHubDashboard();
  const overview = useCourierPlusOverview();
  const handOver = useCourierPlusHandOver();
  const [active, setActive] = useState<CpHubParcel | null>(null);

  const profile = dashboard.data?.profile;
  const open = profile
    ? isHubOpenAt(profile, new Date().getHours() * MINUTES_PER_HOUR + new Date().getMinutes())
    : false;

  const header = (
    <CpScreen
      crumbs={[
        { label: t('crumb.module'), href: paths.courierPlus },
        { label: t('crumb.hubPanel') },
      ]}
      title={t('hub.title')}
      subtitle={
        profile
          ? t('hub.subtitle', {
              address: profile.address,
              open: minutesToClock(profile.openMinutes),
              close: minutesToClock(profile.closeMinutes),
            })
          : undefined
      }
      actions={
        profile ? (
          <Badge tone={open ? 'success' : 'neutral'}>{open ? t('hub.open') : t('hub.closed')}</Badge>
        ) : null
      }
    />
  );

  /** "Gözləyir: 2 saat" / "Gözləyir: 1 gün" — the fixture carries the minutes, not the words. */
  const waitingLabel = (minutes: number): string =>
    minutes >= MINUTES_PER_DAY
      ? t('hub.waitingDays', { count: Math.round(minutes / MINUTES_PER_DAY) })
      : t('hub.waitingHours', { count: Math.max(1, Math.round(minutes / MINUTES_PER_HOUR)) });

  if (dashboard.isPending) {
    return (
      <>
        {header}
        <CourierPlusHubSkeleton />
      </>
    );
  }

  /* -------------------------------------------------- the gate (not a hub yet) */
  if (dashboard.isError && dashboard.error.kind === 'notFound') {
    return (
      <>
        {header}
        <CpStateCard>
          <EmptyState
            tone="brand"
            icon={House}
            title={t('hub.gate.title')}
            body={t('hub.gate.body', {
              commission: f.money(overview.data?.hubCommission ?? 0),
            })}
            action={
              <CpLinkButton href={paths.courierPlusHubRegister} variant="brand" size="lg">
                {t('hub.gate.action')}
              </CpLinkButton>
            }
          />
        </CpStateCard>
      </>
    );
  }

  if (dashboard.isError) {
    return (
      <>
        {header}
        <CpStateCard>
          <ErrorState
            failure={dashboard.error}
            title={t('hub.error.title')}
            message={failureMessage(dashboard.error)}
            retryLabel={t('retry')}
            onRetry={() => void dashboard.refetch()}
            retrying={dashboard.isRefetching}
          />
        </CpStateCard>
      </>
    );
  }

  const data = dashboard.data;

  return (
    <>
      {header}

      {/* Stats Row */}
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <CpStatTile dark label={t('hub.commissionToday')} value={f.money(data.commissionToday)} />
        <CpStatTile label={t('hub.commissionMonth')} value={f.money(data.commissionMonth)} />
        <CpStatTile label={t('hub.handedToday')} value={f.number(data.handedToday)} />
        <CpStatTile
          label={t('hub.waitingCount')}
          value={t('hub.capacityValue', {
            waiting: data.waiting.length,
            capacity: data.profile.capacity,
          })}
        />
      </div>

      {/* Waiting Parcels */}
      <section aria-labelledby="cp-waiting" className="w-full rounded-xl bg-surface px-6 pb-2 pt-6">
        <CpCardTitle id="cp-waiting" className="mb-4 text-h4">
          {t('hub.waitingTitle')}
        </CpCardTitle>

        {data.waiting.length === 0 ? (
          <div className="pb-8">
            <EmptyState
              compact
              tone="brand"
              icon={Package}
              title={t('hub.empty.title')}
              body={t('hub.empty.body')}
              titleAs="p"
            />
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {data.waiting.map((parcel, index) => (
              <li
                key={parcel.id}
                className={
                  index === 0
                    ? 'flex w-full flex-col gap-4 py-4 sm:flex-row sm:items-center'
                    : 'flex w-full flex-col gap-4 border-0 border-t border-solid border-line py-4 sm:flex-row sm:items-center'
                }
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-soft text-ink"
                >
                  <Package size={20} />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body-sm font-bold text-ink">
                    {parcel.recipient}
                  </span>
                  <span className="text-caption font-normal text-ink2">
                    {waitingLabel(parcel.waitingMinutes)}
                  </span>
                </span>

                <span className="shrink-0 text-label font-bold text-success">
                  {`+${f.money(parcel.commission)}`}
                </span>

                <Button
                  variant="primary"
                  size="md"
                  className="shrink-0"
                  onClick={() => {
                    handOver.reset();
                    setActive(parcel);
                  }}
                >
                  {t('hub.handOver')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CpHubCodeModal
        parcel={active}
        pending={handOver.isPending}
        onClose={() => {
          setActive(null);
          handOver.reset();
        }}
        onSubmit={async (code) => {
          const accepted = await handOver.submit(code);
          if (accepted) toast.success({ title: t('hub.code.success') });
          return accepted;
        }}
      />
    </>
  );
}
