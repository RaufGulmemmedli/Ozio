'use client';

/**
 * `/courier-plus/earnings` — `Yolüstü kuryer · Qazanc` (`Z1KKa`).
 *
 * Dark balance hero with the three white tiles (today / month / deliveries), then the history
 * list: a `success-soft` check tile, the route title, when it happened and `+amount`.
 *
 * Every amount is a **mock fixture** rendered through `useFormat().money`; nothing is ever paid
 * out, which the demo banner and the inline note both say.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { Check, Wallet } from '@/shared/lucide';
import { EmptyState, ErrorState, InlineNotice } from '@/shared/states';

import { CpLinkButton } from '../components/CpLinkButton';
import { CpBalanceHero, CpHeroStat } from '../components/CpPrimitives';
import { CpScreen } from '../components/CpScreen';
import { CpStateCard } from '../components/CpStateCard';
import { useCourierPlusEarnings } from '../hooks/use-courier-plus';

import { CourierPlusEarningsSkeleton } from './CourierPlusEarningsSkeleton';

/** Two days is where "dünən" stops being useful and a date reads better. */
const RELATIVE_WINDOW_DAYS = 2;

export function CourierPlusEarningsView() {
  const t = useTranslations('courier_plus');
  const f = useFormat();
  const failureMessage = useFailureMessage();

  const earnings = useCourierPlusEarnings();

  const header = (
    <CpScreen
      crumbs={[
        { label: t('crumb.module'), href: paths.courierPlus },
        { label: t('crumb.earnings') },
      ]}
      title={t('earnings.title')}
      subtitle={t('earnings.subtitle')}
    />
  );

  if (earnings.isPending) {
    return (
      <>
        {header}
        <CourierPlusEarningsSkeleton />
      </>
    );
  }

  if (earnings.isError) {
    return (
      <>
        {header}
        <CpStateCard>
          <ErrorState
            failure={earnings.error}
            title={t('earnings.error.title')}
            message={failureMessage(earnings.error)}
            retryLabel={t('retry')}
            onRetry={() => void earnings.refetch()}
            retrying={earnings.isRefetching}
          />
        </CpStateCard>
      </>
    );
  }

  const data = earnings.data;

  /**
   * The server sends the timestamp **and** how many whole days ago it was, so the wording is a
   * pure function of the row — this render never reads the clock.
   */
  const whenLabel = (entry: { at: string; daysAgo: number }): string => {
    const time = Date.parse(entry.at);
    if (Number.isNaN(time)) return '';
    return entry.daysAgo <= RELATIVE_WINDOW_DAYS ? f.relative(time) : f.date(time, 'dayMonth');
  };

  return (
    <>
      {header}

      <CpBalanceHero labelId="cp-earnings-balance" label={t('earnings.balance')} amount={data.balance}>
        <div className="flex w-full flex-col gap-3">
          <CpHeroStat label={t('earnings.today')} value={f.money(data.today)} />
          <CpHeroStat label={t('earnings.month')} value={f.money(data.month)} />
          <CpHeroStat label={t('earnings.deliveries')} value={f.number(data.deliveries)} />
        </div>
      </CpBalanceHero>

      <InlineNotice tone="note" className="w-full" body={t('earnings.note')} />

      {data.history.length === 0 ? (
        <CpStateCard>
          <EmptyState
            tone="brand"
            icon={Wallet}
            title={t('earnings.empty.title')}
            body={t('earnings.empty.body')}
            action={
              <CpLinkButton href={paths.courierPlusMatches} variant="brand" size="lg">
                {t('home.seeMatches')}
              </CpLinkButton>
            }
          />
        </CpStateCard>
      ) : (
        <section aria-labelledby="cp-history" className="w-full rounded-xl bg-surface px-6 py-2">
          <h2 id="cp-history" className="sr-only">
            {t('earnings.history')}
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {data.history.map((entry, index) => (
              <li
                key={entry.id}
                className={
                  index === 0
                    ? 'flex w-full flex-row items-center gap-4 py-4'
                    : 'flex w-full flex-row items-center gap-4 border-0 border-t border-solid border-line py-4'
                }
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-md bg-success-soft text-success"
                >
                  <Check size={20} />
                </span>
                <span className="min-w-0 flex-1 truncate text-body-sm font-bold text-ink">
                  {entry.title}
                </span>
                <span className="shrink-0 text-caption font-normal text-ink3">
                  {whenLabel(entry)}
                </span>
                <span className="w-20 shrink-0 text-right text-body font-extrabold text-success">
                  {`+${f.money(entry.amount)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
