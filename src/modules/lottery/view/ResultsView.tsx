'use client';

/**
 * `/lottery/results` — "Tiraj nəticələri" (LT5). **Guest-visible route.**
 *
 * There is **no draw-results endpoint and no winners endpoint anywhere in the API** — not
 * on `lotteries/active`, not on `active/details`, not on `tickets`. So this page shows the
 * two things that can be known (which draw it is, and when it was/will be drawn, from
 * `details.end_date`), lists the prize pool, and says plainly that the winner list is not
 * published here. It never fabricates names, ticket numbers or amounts.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { usePreview } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';
import { Calendar, Gift, Trophy } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';
import { EmptyState, ErrorState, GuestGate } from '@/shared/states';

import { LinkButton } from '../components/link-button';
import { PrizeRow } from '../components/prize-card';
import { isDrawDone } from '../data/models/lottery';
import { useActiveLottery, useLotteryDetails } from '../hooks/use-lottery';

function ResultsSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6" label={label}>
      <BoneCard r="bento" pad={32} gap={16} w="100%">
        <Bone w={180} h={28} r="pill" />
        <Bone w={300} h={32} r={12} />
        <Bone w={240} h={16} r="sm" />
      </BoneCard>
      <BoneCard r="bento" pad={32} gap={16} w="100%">
        <Bone w={200} h={24} r="sm" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex w-full flex-row items-center gap-[14px]">
            <Bone w={48} h={48} r="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Bone w={220} h={16} r="sm" />
              <Bone w={90} h={12} r="xs" />
            </div>
          </div>
        ))}
      </BoneCard>
    </Shimmer>
  );
}

export function ResultsView() {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const { date } = useFormat();
  const authenticated = useIsAuthenticated();
  const previewing = usePreview() !== null;
  const failureMessage = useFailureMessage();

  const active = useActiveLottery();
  const lottery = active.data?.lottery ?? null;
  const details = useLotteryDetails(lottery?.id);
  const draw = details.data ?? null;
  const done = isDrawDone(draw);

  const header = (
    <PageHeader
      title={t('results.title')}
      subtitle={t('results.subtitle')}
      backHref={paths.lottery}
      backLabel={t('title')}
    />
  );

  // `?preview=` must reach the data states even without a session (BUILD-CONTRACT rule 4).
  if (!authenticated && !previewing) {
    return (
      <>
        {header}
        <GuestGate
          icon={Trophy}
          title={t('results.guest.title')}
          body={t('results.guest.body')}
          actionLabel={tc('signIn')}
          next={paths.lotteryResults}
        />
      </>
    );
  }

  if (active.isPending || details.isPending) {
    return (
      <>
        {header}
        <ResultsSkeleton label={tc('loading')} />
      </>
    );
  }

  const failure = active.error ?? details.error;
  if (failure) {
    return (
      <>
        {header}
        <ErrorState
          failure={failure}
          title={tc('error.generic.title')}
          message={failureMessage(failure)}
          retryLabel={tc('retry')}
          onRetry={() => (active.isError ? active.refetch() : details.refetch())}
        />
      </>
    );
  }

  if (!lottery) {
    return (
      <>
        {header}
        <EmptyState
          icon={Trophy}
          title={t('empty.title')}
          body={t('empty.body')}
          panel
          action={
            <LinkButton href={paths.lotteryRules} variant="primary" size="lg">
              {t('nav.rules')}
            </LinkButton>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}

      <section className="flex w-full flex-col gap-4 rounded-bento bg-block p-8">
        <span className="inline-flex h-8 w-fit items-center rounded-pill bg-yellow px-4 text-caption font-bold text-on-yellow">
          {done ? t('results.done') : t('results.pending')}
        </span>
        <h2 className="text-h2 font-extrabold text-on-block">
          {draw?.name || lottery.name || t('draw.fallbackName')}
        </h2>
        {draw?.endsAt ? (
          <p className="flex flex-row items-center gap-[10px] text-body-sm text-on-block2">
            <Calendar size={16} aria-hidden="true" />
            <time dateTime={draw.endsAt.raw}>
              {t('draw.drawDate', {
                date: date(draw.endsAt.at, 'long'),
                time: date(draw.endsAt.at, 'time'),
              })}
            </time>
          </p>
        ) : (
          <p className="text-body-sm text-on-block2">{t('results.noDate')}</p>
        )}
      </section>

      {/* Winners: no endpoint sends them, so this is an honest empty state, not a list. */}
      <section className="flex w-full flex-col gap-4 rounded-bento border border-line bg-surface p-8">
        <h2 className="text-h3 font-bold text-ink">{t('winners.title')}</h2>
        <EmptyState
          icon={Gift}
          title={t('winners.empty.title')}
          body={t('winners.empty.body')}
          action={
            <LinkButton href={paths.lotteryTickets} variant="soft" size="lg">
              {t('tickets.title')}
            </LinkButton>
          }
        />
      </section>

      {draw && draw.prizes.length > 0 ? (
        <section className="flex w-full flex-col gap-4 rounded-bento border border-line bg-surface p-8">
          <h2 className="text-h3 font-bold text-ink">{t('results.prizePool')}</h2>
          <ul className="flex w-full list-none flex-col gap-4 p-0">
            {draw.prizes.map((prize, index) => (
              <PrizeRow key={`${prize.name}-${index}`} prize={prize} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
