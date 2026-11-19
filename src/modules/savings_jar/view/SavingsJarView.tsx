'use client';

/**
 * `Web · Qənaət sandığı` (`savings-jar.html`) with every state the package exports: loading
 * (`savings-jar-loading.html`), empty (`savings-jar-empty.html`), error (`savings-jar-error.html`),
 * the month-ended banner (`savings-jar-claim-ready.html`), the confirm modal
 * (`savings-jar-claim-modal.html`) and the success modal (`savings-jar-claim-success.html`).
 *
 * `?preview=claim` asks the mock API for the month-ended jar, so the last three are reachable from
 * the URL; `?preview=loading|empty|error` cover the rest.
 *
 * Balance, projected bonus, cap and every contribution are server values.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { CircleCheck, SlidersHorizontal, Wallet } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';

import { ClaimBanner, ClaimConfirmModal, ClaimSuccessModal } from '../components/claim-flow';
import { JarPage } from '../components/jar-page';
import { LinkButton } from '../components/link-button';
import { JarStateCard } from '../components/jar-state-card';
import {
  jarCapFull,
  jarCapProgress,
  jarClaimable,
  jarIsEmpty,
  type JarContribution,
  type JarMember,
} from '../data/models/savings-jar';
import { useClaimJar, useSavingsJar } from '../hooks/use-savings-jar';
import { SavingsJarSkeleton } from './SavingsJarSkeleton';

const initial = (name: string) => (name.trim().charAt(0) || '?').toLocaleUpperCase('az-AZ');

function MemberRow({ member }: { member: JarMember }) {
  const t = useTranslations('savings_jar');
  const format = useFormat();

  return (
    <li className="flex min-h-[68px] flex-row items-center gap-[14px] border-t border-line py-2.5 first:border-t-0">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-violet-soft text-body font-extrabold text-violet"
      >
        {initial(member.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body font-bold text-ink">{member.name}</p>
        <p className="text-micro text-ink3">{t('members.thisMonth')}</p>
      </div>
      <span className="shrink-0 text-body font-extrabold text-ink">
        {format.money(member.contributed)}
      </span>
    </li>
  );
}

function ContributionRow({ row }: { row: JarContribution }) {
  const t = useTranslations('savings_jar');
  const format = useFormat();

  return (
    <li className="flex min-h-[68px] flex-row items-center gap-[14px] border-t border-line py-2.5 first:border-t-0">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-success-soft text-success"
      >
        <CircleCheck size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body-sm font-bold text-ink">
          {t('history.order', { order: row.orderNo })}
        </p>
        <p className="truncate text-caption text-ink3">
          {t('history.meta', {
            member: row.memberName,
            date: row.at ? format.date(row.at, 'dayMonth') : '',
          })}
        </p>
      </div>
      <span className="shrink-0 text-body font-extrabold text-success">
        +{format.money(row.amount)}
      </span>
    </li>
  );
}

export function SavingsJarView() {
  const t = useTranslations('savings_jar');
  const format = useFormat();
  const failureMessage = useFailureMessage();

  const query = useSavingsJar();
  const claim = useClaimJar();
  const jar = query.data;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState<number | null>(null);

  const monthLabel = t(`month.${new Date().getMonth() + 1}`);

  const settingsAction = (
    <LinkButton
      href={paths.savingsJarSettings}
      size={48}
      leadingIcon={<SlidersHorizontal size={18} aria-hidden="true" />}
    >
      {t('settingsAction')}
    </LinkButton>
  );

  const page = (subtitle: string, children: React.ReactNode) => (
    <JarPage
      crumbs={[{ label: t('crumb.root'), href: paths.card }, { label: t('crumb.jar') }]}
      crumbsLabel={t('crumb.root')}
      title={t('title')}
      subtitle={subtitle}
      action={settingsAction}
    >
      {children}
    </JarPage>
  );

  if (query.isPending) {
    return page(t('subtitle'), <SavingsJarSkeleton label={t('loading')} />);
  }

  if (query.isError || !jar) {
    return page(
      t('subtitleError'),
      <JarStateCard>
        <ErrorState
          failure={query.error}
          title={t('error.title')}
          message={query.error ? failureMessage(query.error) : t('error.body')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </JarStateCard>,
    );
  }

  if (jarIsEmpty(jar)) {
    return page(
      t('subtitle'),
      <JarStateCard>
        <EmptyState
          icon={Wallet}
          tone="brand"
          title={t('empty.title')}
          body={t('empty.body')}
          action={
            <LinkButton href={paths.savingsJarSettings}>{t('empty.cta')}</LinkButton>
          }
        />
      </JarStateCard>,
    );
  }

  const progress = jarCapProgress(jar);
  const capFull = jarCapFull(jar);
  const claimable = jarClaimable(jar);
  const percent = progress === null ? null : Math.round(progress * 100);

  return (
    <>
      {page(
        t('subtitle'),
        <div className="flex w-full flex-col gap-8">
          {claimable ? (
            <ClaimBanner
              balance={jar.balance}
              bonus={jar.projectedBonus}
              busy={claim.isPending}
              onClaim={() => setConfirmOpen(true)}
            />
          ) : null}

          {/* Top Row */}
          <div className="flex w-full flex-col gap-6 lg:flex-row">
            <section className="flex min-h-[220px] flex-1 flex-col justify-between gap-6 rounded-bento bg-brand p-6 md:p-8 lg:min-h-[260px]">
              <div className="flex flex-col gap-1.5">
                <p className="flex flex-row items-center gap-2 text-body-sm font-bold text-white">
                  <Wallet size={20} aria-hidden="true" className="shrink-0" />
                  {t('balance.label', { month: monthLabel })}
                </p>
                <p className="text-[44px] font-extrabold leading-none tracking-[-0.04em] text-white md:text-[64px]">
                  {format.money(jar.balance)}
                </p>
              </div>

              {progress !== null ? (
                <div className="flex flex-col gap-2">
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={jar.settings.monthlyCap}
                    aria-valuenow={jar.balance}
                    aria-label={t('balance.aria', { percent: `${percent}%` })}
                    className="h-3 w-full overflow-hidden rounded-pill bg-white/30"
                  >
                    <div
                      className="h-full rounded-pill bg-white"
                      style={{ width: `${percent ?? 0}%` }}
                    />
                  </div>
                  <div className="flex flex-row items-center justify-between gap-3">
                    <span className="text-label text-white">
                      {capFull ? t('cap.full') : t('cap.progress', { percent: `${percent}%` })}
                    </span>
                    <span className="text-label font-bold text-white">
                      {t('cap.value', { amount: format.money(jar.settings.monthlyCap) })}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-label text-white">{t('cap.none')}</p>
              )}
            </section>

            <section className="flex min-h-[220px] w-full flex-col justify-between gap-6 rounded-bento bg-yellow p-6 md:p-8 lg:min-h-[260px] lg:w-[400px] lg:shrink-0">
              <p className="text-body-sm font-extrabold text-on-yellow">{t('bonus.label')}</p>
              <div className="flex flex-col gap-1">
                <p className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-on-yellow md:text-[48px]">
                  +{format.money(jar.projectedBonus)}
                </p>
                <p className="text-label text-on-yellow">{t('bonus.hint')}</p>
              </div>
              <span className="w-fit rounded-pill bg-block px-4 py-2 text-label font-bold text-on-block">
                {jar.daysLeft > 0
                  ? t('bonus.daysLeft', { days: jar.daysLeft })
                  : t('bonus.monthEnded')}
              </span>
            </section>
          </div>

          {/* Bottom Row */}
          <div className="flex w-full flex-col gap-6 lg:flex-row">
            <section className="flex w-full flex-col gap-1.5 rounded-xl bg-surface p-6 lg:w-[400px] lg:shrink-0">
              <h2 className="pb-2 text-h4 font-extrabold text-ink">{t('members.title')}</h2>
              <ul className="flex w-full flex-col">
                {jar.members.map((member) => (
                  <MemberRow key={member.name} member={member} />
                ))}
              </ul>
            </section>

            <section className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl bg-surface p-6">
              <h2 className="pb-2 text-h4 font-extrabold text-ink">{t('history.title')}</h2>
              <ul className="flex w-full flex-col">
                {jar.contributions.map((row) => (
                  <ContributionRow key={`${row.orderNo}-${row.at ?? ''}`} row={row} />
                ))}
              </ul>
            </section>
          </div>
        </div>,
      )}

      <ClaimConfirmModal
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) claim.reset();
        }}
        bonus={jar.projectedBonus}
        busy={claim.isPending}
        error={claim.isError && claim.error ? failureMessage(claim.error) : null}
        onConfirm={() =>
          claim.mutate(undefined, {
            onSuccess: (result) => {
              setConfirmOpen(false);
              setClaimedBonus(result.bonus);
            },
          })
        }
      />

      <ClaimSuccessModal
        open={claimedBonus !== null}
        onOpenChange={(open) => {
          if (!open) setClaimedBonus(null);
        }}
        bonus={claimedBonus ?? 0}
      />
    </>
  );
}
