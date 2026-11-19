'use client';

/**
 * N2 — `Web · Missiyalar` (`missions.html`) with its loading (`missions-loading.html`), empty
 * (`missions-empty.html`) and error (`missions-error.html`) states.
 *
 * `canEarn` and `daysLeft` come from the API; the completed count is derived from the rows the API
 * sent, never from a client-side tally of rewards.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { ArrowRight, Sparkles } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { toast } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { MissionCard } from '../components/mission-card';
import { RewardsPage } from '../components/rewards-page';
import { StateCard } from '../components/state-card';
import { missionsDoneCount } from '../data/models/mission';
import { useClaimMission, useMissions } from '../hooks/use-missions';
import { MissionsSkeleton } from './MissionsSkeleton';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[140px] w-full flex-col justify-center gap-2 rounded-bento bg-surface p-7 lg:w-[260px] lg:shrink-0">
      <p className="text-label font-semibold text-ink3">{label}</p>
      <p className="text-[32px] font-extrabold leading-none text-ink">{value}</p>
    </div>
  );
}

export function MissionsView() {
  const t = useTranslations('rewards');
  const format = useFormat();
  const failureMessage = useFailureMessage();

  const query = useMissions();
  const claim = useClaimMission();
  const board = query.data;

  const crumbs = [{ label: t('crumb.root'), href: paths.card }, { label: t('missions.crumb') }];

  const page = (subtitle: string, children: React.ReactNode) => (
    <RewardsPage
      crumbs={crumbs}
      crumbsLabel={t('crumb.root')}
      title={t('missions.title')}
      subtitle={subtitle}
      demoModule={t('demo.module')}
    >
      {children}
    </RewardsPage>
  );

  if (query.isPending) {
    return page(t('missions.subtitle'), <MissionsSkeleton label={t('loading')} />);
  }

  if (query.isError || !board) {
    return page(
      t('subtitle.error'),
      <StateCard>
        <ErrorState
          failure={query.error}
          title={t('missions.error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </StateCard>,
    );
  }

  if (board.missions.length === 0) {
    return page(
      t('missions.subtitleEmpty'),
      <StateCard>
        <EmptyState
          icon={Sparkles}
          tone="brand"
          title={t('missions.empty.title')}
          body={t('missions.empty.body')}
          action={<LinkButton href={paths.rewardsWheel}>{t('missions.empty.cta')}</LinkButton>}
        />
      </StateCard>,
    );
  }

  const onClaim = (id: string) => {
    const mission = board.missions.find((m) => m.id === id);
    claim.mutate(id, {
      onSuccess: () => {
        if (mission) {
          toast.success({
            title: t('missions.claimedToast', { reward: mission.rewardLabel }),
          });
        }
      },
      onError: (failure) => {
        toast.error({ title: t('missions.claimFailed'), body: failureMessage(failure) });
      },
    });
  };

  return page(
    t('missions.subtitle'),
    <div className="flex w-full flex-col gap-8">
      {/* Summary Row */}
      <div className="flex w-full flex-col gap-5 lg:flex-row">
        <div className="flex h-[140px] flex-1 flex-col justify-center gap-2 rounded-bento bg-brand p-7">
          <p className="text-label font-semibold text-white">{t('missions.canEarn')}</p>
          <p className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white">
            +{format.money(board.canEarn)}
          </p>
        </div>
        <StatTile
          label={t('missions.completed')}
          value={t('missions.completedValue', {
            done: missionsDoneCount(board.missions),
            total: board.missions.length,
          })}
        />
        <StatTile
          label={t('missions.daysLeft')}
          value={t('missions.daysLeftValue', { days: board.daysLeft })}
        />
      </div>

      {/* Mission Grid + the dark wheel link tile in the last cell */}
      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
        {board.missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onClaim={onClaim}
            claiming={claim.isPending && claim.variables === mission.id}
          />
        ))}

        <section className="flex min-h-[200px] w-full flex-col justify-center gap-2.5 rounded-xl bg-block p-6">
          <h2 className="text-h4 font-extrabold text-on-block">{t('missions.wheelTile.title')}</h2>
          <p className="text-label text-on-block2">{t('missions.wheelTile.body')}</p>
          <LinkButton
            href={paths.rewardsWheel}
            tone="yellow"
            size={44}
            trailingIcon={<ArrowRight size={16} aria-hidden="true" />}
          >
            {t('missions.wheelTile.cta')}
          </LinkButton>
        </section>
      </div>
    </div>,
  );
}
