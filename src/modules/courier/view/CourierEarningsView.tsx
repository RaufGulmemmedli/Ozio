'use client';

/**
 * `/courier/earnings` — "Kuryer · Qazanc" (`FNvL3`), skeleton `teaWA`.
 *
 * Balance hero, three period tiles, the "Son 7 gün" bar chart (last bar `brand`, the rest
 * `brand-soft`, value label above each) and the stats row. "Çıxarış sorğusu" is a mock toast —
 * **no payout exists**, which the demo banner states.
 *
 * Every figure comes from the mock's `CourierEarnings` through `useFormat().money`; nothing is
 * computed in this component.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button, toast } from '@/shared/ui';

import { CourierCard, SummaryTile } from '../components/courier-bits';
import type { CourierEarnings } from '../data/models/courier';
import { useCourierEarnings } from '../hooks/use-courier';

import { CourierEarningsSkeleton } from './CourierEarningsSkeleton';

export function CourierEarningsView() {
  const t = useTranslations('courier');
  const { money, number, date, percent } = useFormat();

  const earnings = useCourierEarnings();

  const header = (
    <>
      <DemoBanner module="courier" body={t('demo')} />
      <PageHeader
        title={t('earnings.title')}
        subtitle={t('earnings.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.courier'), href: paths.courier },
              { label: t('earnings.crumb') },
            ]}
          />
        }
        actions={
          <Button
            variant="soft"
            size="2xl"
            onClick={() => toast.info({ title: t('earnings.payoutToast') })}
          >
            {t('earnings.payoutRequest')}
          </Button>
        }
      />
    </>
  );

  if (earnings.isPending) {
    return (
      <>
        {header}
        <CourierEarningsSkeleton label={t('earnings.loading')} />
      </>
    );
  }

  if (earnings.isError || !earnings.data) {
    return (
      <>
        {header}
        <ErrorState
          failure={earnings.error}
          title={t('earnings.errorTitle')}
          message={t('panel.errorBody')}
          retryLabel={t('panel.retry')}
          onRetry={() => void earnings.refetch()}
        />
      </>
    );
  }

  const data = earnings.data;

  return (
    <>
      {header}

      {/* `Hero Row`: the dark balance hero (flex 1) beside the 420-wide period column, gap 24. */}
      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-3 rounded-bento bg-block p-8 md:p-10">
          <h2 className="m-0 text-caption font-bold uppercase tracking-[0.04em] text-on-block/70">
            {t('earnings.balance')}
          </h2>
          <p className="m-0 text-h1 font-extrabold tabular-nums text-on-block">
            {money(data.balance)}
          </p>
          {data.nextPayout ? (
            <p className="m-0 text-body-sm text-on-block/70">
              {t('earnings.nextPayout', { date: date(data.nextPayout, 'dayMonth') })}
            </p>
          ) : null}
        </section>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[420px]">
          <PeriodTile
            label={t('earnings.today')}
            amount={money(data.today)}
            meta={t('earnings.deliveryCount', { count: data.deliveriesToday })}
          />
          <PeriodTile
            label={t('earnings.week')}
            amount={money(data.week)}
            meta={t('earnings.deliveryCount', {
              count: data.days.reduce((sum, d) => sum + d.deliveries, 0),
            })}
          />
          <PeriodTile
            label={t('earnings.month')}
            amount={money(data.month)}
            meta={t('earnings.deliveryCount', { count: data.deliveriesTotal })}
          />
        </div>
      </div>

      <CourierCard>
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <h2 className="m-0 text-h4 font-bold text-ink">{t('earnings.last7')}</h2>
          <span className="text-label font-bold tabular-nums text-ink2">{money(data.week)}</span>
        </div>
        <WeekChart days={data.days} />
      </CourierCard>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryTile
          label={t('earnings.rating')}
          value={number(data.rating, { minimumFractionDigits: 1 })}
        />
        <SummaryTile
          label={t('earnings.acceptance')}
          value={percent(data.acceptanceRate, { maximumFractionDigits: 0 })}
        />
        <SummaryTile
          label={t('earnings.totalDeliveries')}
          value={number(data.deliveriesTotal)}
        />
      </div>
    </>
  );
}

function PeriodTile({
  label,
  amount,
  meta,
}: {
  label: string;
  amount: string;
  meta: string;
}) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4 rounded-xl bg-surface p-6">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label font-bold text-ink">{label}</span>
        <span className="text-caption text-ink3">{meta}</span>
      </span>
      <span className="shrink-0 text-h3 font-extrabold tabular-nums text-ink">{amount}</span>
    </div>
  );
}

/**
 * The 7-day bar chart. A `<dl>` so the numbers are readable without the bars: the bar heights are
 * decorative, the values are text.
 */
function WeekChart({ days }: { days: CourierEarnings['days'] }) {
  const t = useTranslations('courier');
  const { money } = useFormat();
  const peak = Math.max(...days.map((d) => d.amount), 1);

  return (
    <dl
      aria-label={t('earnings.chartLabel')}
      className="m-0 flex w-full flex-row items-end gap-2 md:gap-4"
    >
      {days.map((day, index) => {
        const last = index === days.length - 1;
        return (
          <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <dd className="m-0 text-micro font-bold tabular-nums text-ink2">
              {money(day.amount)}
            </dd>
            <div
              aria-hidden="true"
              className={last ? 'w-full rounded-md bg-brand' : 'w-full rounded-md bg-brand-soft'}
              style={{ height: `${Math.max(8, Math.round((day.amount / peak) * 140))}px` }}
            />
            <dt className="text-caption font-semibold text-ink3">{t(day.day)}</dt>
          </div>
        );
      })}
    </dl>
  );
}
