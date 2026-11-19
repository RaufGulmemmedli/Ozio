'use client';

/**
 * `/ask-to-buy` — "Sorğular" (`ask-inbox.html`, node `u9Qc2J`).
 *
 * Layout from the export: Page Header (breadcrumb 14/500 `ink3`, title 36/800, subtitle 16/400,
 * a 52 `cta` pill right) → yellow demo notice → the tab rail (Gələn + pending badge /
 * Göndərdiyim) → Columns (gap 32): the request list card (radius 28, padding 8/28) and the
 * 340-wide "Necə işləyir?" card.
 *
 * **Both sides are reachable.** A parent lands on "Gələn", a child on "Göndərdiyim", and the role
 * switch in the header flips which side the demo is on (`?preview=parent|child` pins it). Either
 * role can still read the other tab, so no screen is unreachable.
 *
 * States: `ask-inbox-skeleton.html` (loading), `ask-inbox-sent-empty.html` (empty) and
 * `ask-inbox-error.html` (error) — all three keep the header, notice and tabs real and only
 * replace the left column.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { MessageSquare } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs } from '@/shared/ui';

import { AskRequestRow } from '../components/ask-request-row';
import { AskRoleSwitch } from '../components/ask-role-switch';
import { HowItWorksCard } from '../components/how-it-works-card';
import { LinkButton } from '../components/link-button';
import { PillTabs, type PillTabOption } from '../components/pill-tabs';
import { defaultDirection, type AskDirection, type AskRole } from '../data/models/ask-request';
import { useAskContext, useAskInbox, useAskRole } from '../hooks/use-ask-to-buy';
import { AskInboxSkeleton } from './AskInboxSkeleton';

export function AskInboxView() {
  const t = useTranslations('ask_to_buy');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();

  const { role, forced, switching, setRole } = useAskRole();
  const context = useAskContext();

  // The role picks the first tab; after that the person's own choice wins — but only for the role
  // it was made in, so flipping the switch moves the reader to that side's default tab. Storing the
  // role alongside the pick keeps this derived, with no effect writing state back.
  const [picked, setPicked] = useState<{ role: AskRole; tab: AskDirection } | null>(null);
  const direction: AskDirection =
    picked !== null && picked.role === role ? picked.tab : defaultDirection(role);
  const setTab = (tab: AskDirection) => setPicked({ role, tab });

  const inbox = useAskInbox(direction);
  const rows = inbox.data?.items ?? [];
  const pending = inbox.data?.pendingIncoming ?? context.data?.pendingIncoming ?? 0;

  const tabs: readonly PillTabOption<AskDirection>[] = [
    {
      value: 'incoming',
      label: t('tab.incoming'),
      count: pending,
      countLabel: t('tab.pendingCount', { count: pending }),
    },
    { value: 'outgoing', label: t('tab.outgoing') },
  ];

  const newRequest = (
    <LinkButton href={paths.askToBuySend} variant="primary" size="xl">
      {t('action.new')}
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[{ label: t('breadcrumb.profile'), href: paths.profile }, { label: t('breadcrumb.module') }]}
          />
        }
        actions={
          <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center">
            <AskRoleSwitch role={role} forced={forced} switching={switching} onChange={setRole} />
            {newRequest}
          </div>
        }
      />

      <DemoBanner module={t('title')} body={t('demo.body')} />

      <PillTabs
        label={t('tab.label')}
        value={direction}
        onValueChange={setTab}
        options={tabs}
      />

      <div aria-live="polite" className="sr-only">
        {inbox.isSuccess ? t('tab.announce', { count: rows.length, tab: t(`tab.${direction}`) }) : ''}
      </div>

      {inbox.isPending ? (
        <AskInboxSkeleton />
      ) : (
        <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
          <div className="flex w-full min-w-0 flex-1 flex-col">
            {inbox.isError ? (
              <ErrorState
                failure={inbox.error}
                title={t('error.title')}
                message={failureMessage(inbox.error)}
                retryLabel={tc('retry')}
                retrying={inbox.isRefetching}
                onRetry={() => inbox.refetch()}
                className="min-h-[480px] justify-center rounded-xl bg-surface p-7"
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={t(`empty.${direction}.title`)}
                body={t(`empty.${direction}.body`)}
                action={newRequest}
                className="min-h-[480px] justify-center rounded-xl bg-surface p-7"
              />
            ) : (
              <ul className="flex w-full flex-col rounded-xl bg-surface px-5 py-2 md:px-7">
                {rows.map((request) => (
                  <li key={request.id} className="w-full">
                    <AskRequestRow
                      request={request}
                      counterpartName={
                        direction === 'incoming' ? request.childName : request.parentName
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <HowItWorksCard />
        </div>
      )}
    </>
  );
}
