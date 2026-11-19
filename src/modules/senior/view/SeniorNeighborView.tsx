'use client';

/**
 * `/senior/neighbor` — "Qonşu nəvə", both tabs.
 *
 * `senior-neighbor-ask.html` (node `dfrLl`, tab 0 "Kömək istə"): the person's own requests with
 * their status pills, beside the 360-wide info card.
 * `senior-neighbor-help.html` (node `LDDYw`, tab 1 "Köməyə get"): nearby requests with
 * `requester · distance · note`, the yellow bonus tag and the **Köməyə get** button; the info card
 * then also carries the `success-soft` "Qazandığın bonus" block.
 *
 * States: `senior-neighbor-skeleton.html` (loading, tabs real), `senior-neighbor-empty.html`
 * (empty) and the shared error card with "Sorğular yüklənmədi" (the spec says this tab reuses the
 * pension error frame rather than getting one of its own).
 *
 * `/senior/neighbor/new` is the same screen with the dialog already open.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { HeartPulse } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button } from '@/shared/ui';

import { HelpRow } from '../components/help-row';
import { NewHelpDialog } from '../components/new-help-dialog';
import { PillTabs, type PillTabOption } from '../components/pill-tabs';
import { SeniorScreen } from '../components/senior-screen';
import type { HelpRequest } from '../data/models/help-request';
import { useCreateHelpRequest, useHelpBoard, useSetHelpStatus } from '../hooks/use-senior';
import { SeniorNeighborSkeleton } from './SeniorNeighborSkeleton';

type Side = 'mine' | 'nearby';

export interface SeniorNeighborViewProps {
  /** `true` on `/senior/neighbor/new` — the "Yeni sorğu" dialog opens straight away. */
  creating?: boolean;
}

export function SeniorNeighborView({ creating = false }: SeniorNeighborViewProps) {
  const t = useTranslations('senior');
  const tc = useTranslations('common');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const [side, setSide] = useState<Side>('mine');
  const [dialogOpen, setDialogOpen] = useState(creating);
  const [busyId, setBusyId] = useState<string | null>(null);

  const board = useHelpBoard();
  const create = useCreateHelpRequest();
  const setStatus = useSetHelpStatus();

  const rows: HelpRequest[] = (side === 'mine' ? board.data?.mine : board.data?.nearby) ?? [];

  const tabs: readonly PillTabOption<Side>[] = [
    { value: 'mine', label: t('help.tab.mine') },
    { value: 'nearby', label: t('help.tab.nearby') },
  ];

  const newRequest = (
    <Button variant="primary" size="xl" onClick={() => setDialogOpen(true)}>
      {t('help.new.action')}
    </Button>
  );

  const move = (request: HelpRequest, status: 'accepted' | 'completed') => {
    setBusyId(request.id);
    setStatus.mutate({ id: request.id, status }, { onSettled: () => setBusyId(null) });
  };

  const infoCard = (
    <aside
      aria-labelledby="senior-help-info"
      className="flex w-full shrink-0 flex-col items-start gap-4 rounded-xl bg-surface p-7 lg:w-[360px]"
    >
      {side === 'nearby' && (board.data?.earnedBonus ?? 0) > 0 ? (
        <div className="flex w-full flex-col items-start gap-1.5 rounded-lg bg-success-soft p-5">
          <span className="text-label font-semibold text-ink2">{t('help.earned.label')}</span>
          <span className="text-h1-app font-extrabold text-success">
            {t('help.earned.value', { amount: money(board.data?.earnedBonus ?? 0) })}
          </span>
          {board.data?.earnedFrom ? (
            <span className="text-label text-ink2">
              {t('help.earned.body', { name: board.data.earnedFrom })}
            </span>
          ) : null}
        </div>
      ) : null}

      <h2 id="senior-help-info" className="text-h4 font-bold text-ink">
        {t('help.info.title')}
      </h2>
      <p className="text-label text-ink2">{t('help.info.body')}</p>
    </aside>
  );

  return (
    <SeniorScreen>
      <PageHeader
        title={t('help.title')}
        subtitle={t('help.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.profile'), href: paths.profile },
              { label: t('breadcrumb.module'), href: paths.seniorMode },
              { label: t('help.title') },
            ]}
          />
        }
        actions={newRequest}
      />

      <DemoBanner module={t('help.title')} body={t('demo.body')} />

      <PillTabs label={t('help.tab.label')} value={side} onValueChange={setSide} options={tabs} />

      <div aria-live="polite" className="sr-only">
        {board.isSuccess ? t('help.tab.announce', { count: rows.length, tab: t(`help.tab.${side}`) }) : ''}
      </div>

      {board.isPending ? (
        <SeniorNeighborSkeleton />
      ) : (
        <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
          <div className="flex w-full min-w-0 flex-1 flex-col">
            {board.isError ? (
              <ErrorState
                failure={board.error}
                title={t('help.error.title')}
                message={failureMessage(board.error)}
                retryLabel={tc('retry')}
                retrying={board.isRefetching}
                onRetry={() => board.refetch()}
                className="min-h-[460px] justify-center rounded-xl bg-surface p-7"
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={HeartPulse}
                title={t(`help.empty.${side}.title`)}
                body={t(`help.empty.${side}.body`)}
                action={side === 'mine' ? newRequest : undefined}
                className="min-h-[460px] justify-center rounded-xl bg-surface p-7"
              />
            ) : (
              <ul className="flex w-full flex-col rounded-xl bg-surface px-5 py-2 md:px-7">
                {rows.map((request) => (
                  <HelpRow
                    key={request.id}
                    request={request}
                    side={side}
                    busy={busyId === request.id && setStatus.isPending}
                    onAccept={(r) => move(r, 'accepted')}
                    onComplete={(r) => move(r, 'completed')}
                  />
                ))}
              </ul>
            )}
          </div>

          {infoCard}
        </div>
      )}

      <NewHelpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        submitting={create.isPending}
        failure={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              setDialogOpen(false);
              setSide('mine');
            },
          })
        }
      />
    </SeniorScreen>
  );
}
