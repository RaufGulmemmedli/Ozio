'use client';

/**
 * `/lottery/prizes` — "Bütün hədiyyələr" (LT8). **Guest-visible route.**
 *
 * Source: `details.lottery_prizes` from `GET v1/lotteries/active/details?lottery_id=`.
 * A prize row is `{name, quantity, lottery_prizes_uploads[]}` — no amount, no description,
 * no rank — so the cards show the image, the name and how many are drawn, and the page
 * counts the pool as the sum of the quantities. Nothing else about a prize is knowable.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { usePreview } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';
import { Trophy } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';
import { EmptyState, ErrorState, GuestGate } from '@/shared/states';

import { LinkButton } from '../components/link-button';
import { PrizeCard } from '../components/prize-card';
import { totalPrizeCount } from '../data/models/lottery';
import { useActiveLottery, useLotteryDetails } from '../hooks/use-lottery';

function PrizesSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" label={label}>
      {Array.from({ length: 6 }, (_, i) => (
        <BoneCard key={i} r="xl" pad={24} gap={16} w="100%">
          <Bone w="100%" h={160} r={16} />
          <Bone w="70%" h={19} r="sm" />
          <Bone w={90} h={13} r="xs" />
        </BoneCard>
      ))}
    </Shimmer>
  );
}

export function PrizesView() {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const authenticated = useIsAuthenticated();
  const previewing = usePreview() !== null;
  const failureMessage = useFailureMessage();

  const active = useActiveLottery();
  const lottery = active.data?.lottery ?? null;
  const details = useLotteryDetails(lottery?.id);
  const prizes = details.data?.prizes ?? [];

  const header = (
    <PageHeader
      title={t('prizes.title')}
      subtitle={
        prizes.length > 0
          ? t('prizes.subtitle', { count: totalPrizeCount(prizes) })
          : t('prizes.subtitleIdle')
      }
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
          title={t('prizes.guest.title')}
          body={t('prizes.guest.body')}
          actionLabel={tc('signIn')}
          next={paths.lotteryPrizes}
        />
      </>
    );
  }

  if (active.isPending || details.isPending) {
    return (
      <>
        {header}
        <PrizesSkeleton label={tc('loading')} />
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

  if (prizes.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Trophy}
          tone="brand"
          title={t('prizes.empty.title')}
          body={t('prizes.empty.body')}
          panel
          action={
            <LinkButton href={paths.lottery} variant="primary" size="lg">
              {t('title')}
            </LinkButton>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}
      <ul className="grid w-full list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {prizes.map((prize, index) => (
          <li key={`${prize.name}-${index}`} className="min-w-0">
            <PrizeCard prize={prize} featured={index === 0} />
          </li>
        ))}
      </ul>
    </>
  );
}
