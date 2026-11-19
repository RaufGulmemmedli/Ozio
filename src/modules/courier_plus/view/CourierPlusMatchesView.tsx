'use client';

/**
 * `/courier-plus/matches` — `Yolüstü kuryer · Uyğun bağlamalar` (`c9F0G2`) with its three drawn
 * states: `rap6H` loading, `Avqyz` empty, `A8uhf` error.
 *
 * The list is whatever the server matched: the screen never filters, scores or prices anything.
 * "Götür" accepts; a `notFound` means somebody else was faster, which shows as a toast and a
 * refreshed board (the mock's "Sifariş artıq götürülüb").
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n/failure-message';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { Navigation, Package } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Badge, toast } from '@/shared/ui';

import { CpLinkButton } from '../components/CpLinkButton';
import { CpMatchCard } from '../components/CpMatchCard';
import { CpRouteSummaryCard } from '../components/CpRouteSummaryCard';
import { CpScreen } from '../components/CpScreen';
import { CpStateCard } from '../components/CpStateCard';
import { isRouteDeclared, minutesToClock } from '../data/models/courier-plus';
import {
  useAcceptCourierPlusOffer,
  useCourierPlusMatches,
  useCourierPlusRoute,
} from '../hooks/use-courier-plus';

import { CourierPlusMatchesSkeleton, CpRouteSummaryBones } from './CourierPlusMatchesSkeleton';

export function CourierPlusMatchesView() {
  const t = useTranslations('courier_plus');
  const router = useRouter();
  const failureMessage = useFailureMessage();

  const route = useCourierPlusRoute();
  const matches = useCourierPlusMatches();
  const accept = useAcceptCourierPlusOffer();

  const declared = isRouteDeclared(route.data);
  const offers = matches.data?.items ?? [];

  const subtitle =
    route.data && declared
      ? t('matches.subtitle', {
          from: route.data.from,
          to: route.data.to,
          time: minutesToClock(route.data.departMinutes),
          transport: t(`transport.${route.data.transport}`),
        })
      : t('home.noRoute');

  const header = (
    <CpScreen
      crumbs={[
        { label: t('crumb.module'), href: paths.courierPlus },
        { label: t('crumb.matches') },
      ]}
      title={t('matches.title')}
      subtitle={subtitle}
      actions={
        matches.isSuccess ? (
          <Badge tone="neutral" className="bg-brand-soft text-ink">
            {t('matches.count', { count: matches.data.total })}
          </Badge>
        ) : null
      }
    />
  );

  const take = (offerId: string) => {
    accept.mutate(offerId, {
      onSuccess: (delivery) => {
        router.push(paths.courierPlusTrack(delivery.offer.id));
      },
      onError: (failure) => {
        toast.error({
          title: failure.kind === 'notFound' ? t('matches.taken') : failureMessage(failure),
        });
      },
    });
  };

  /* ---------------------------------------------------------------- loading */
  if (route.isPending || matches.isPending) {
    return (
      <>
        {header}
        <CourierPlusMatchesSkeleton />
      </>
    );
  }

  const summary =
    route.isSuccess ? (
      <CpRouteSummaryCard route={route.data} className="lg:w-[360px] lg:shrink-0" />
    ) : (
      <CpRouteSummaryBones />
    );

  /* ---------------------------------------------------------------- error */
  if (matches.isError) {
    return (
      <>
        {header}
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <CpStateCard>
              <ErrorState
                failure={matches.error}
                title={t('matches.error.title')}
                message={t('matches.error.body')}
                retryLabel={t('retry')}
                onRetry={() => void matches.refetch()}
                retrying={matches.isRefetching}
              />
            </CpStateCard>
          </div>
          {summary}
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------- no route yet (a gate) */
  if (!declared) {
    return (
      <>
        {header}
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <CpStateCard>
              <EmptyState
                tone="brand"
                icon={Navigation}
                title={t('matches.noRoute.title')}
                body={t('matches.noRoute.body')}
                action={
                  <CpLinkButton href={paths.courierPlusRoute} variant="brand" size="lg">
                    {t('home.setRoute')}
                  </CpLinkButton>
                }
              />
            </CpStateCard>
          </div>
          {summary}
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------- empty */
  if (offers.length === 0) {
    return (
      <>
        {header}
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <CpStateCard>
              <EmptyState
                tone="brand"
                icon={Package}
                title={t('matches.empty.title')}
                body={t('matches.empty.body')}
                action={
                  <CpLinkButton href={paths.courierPlusRoute} variant="brand" size="lg">
                    {t('matches.changeRoute')}
                  </CpLinkButton>
                }
              />
            </CpStateCard>
          </div>
          {summary}
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------- loaded */
  return (
    <>
      {header}
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-4 p-0">
          {offers.map((offer) => (
            <li key={offer.id}>
              <CpMatchCard
                offer={offer}
                onTake={take}
                taking={accept.isPending && accept.variables === offer.id}
                disabled={accept.isPending}
              />
            </li>
          ))}
        </ul>
        {summary}
      </div>
    </>
  );
}
