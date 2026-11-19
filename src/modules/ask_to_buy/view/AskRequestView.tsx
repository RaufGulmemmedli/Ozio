'use client';

/**
 * `/ask-to-buy/[id]` — one request, in whichever shape the role and the status call for.
 *
 * Two exports cover the same frame:
 *  - `ask-detail-parent-pending.html` (node `jp5Yz`) — the **parent** side while the request is
 *    pending: header "Aysel sənə sorğu göndərdi", the 3-step tracker stopped at "Baxılır", the
 *    item rows, the quoted note, and a side column with Ümumi + **Təsdiq et** / **İmtina et**;
 *  - `ask-detail-child-approved.html` (node `f95ufp`) — the **child** side after a decision: the
 *    same card with a completed tracker, a result banner (`success-soft` approved, `brand-soft`
 *    declined, `surface2` expired) and a soft "Sifarişə bax" (or "Yenidən göndər" when expired).
 *
 * The role comes from the mock db and is flipped by the header switch (`?preview=parent|child`
 * pins it), so both sides of this screen are always reachable.
 *
 * The two dialogs are the parent's actions. **Nothing is charged** — approving stamps a card
 * label on the mock row and mints a demo order id.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/core/lib/cn';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { MessageSquare, SearchX } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button } from '@/shared/ui';

import { AskDeclineDialog } from '../components/ask-decline-dialog';
import { AskItemRow } from '../components/ask-item-row';
import { AskPayDialog } from '../components/ask-pay-dialog';
import { AskRoleSwitch } from '../components/ask-role-switch';
import { AskStatusChip } from '../components/ask-status-chip';
import { AskTracker } from '../components/ask-tracker';
import { useAskTime } from '../components/ask-time';
import { LinkButton } from '../components/link-button';
import { canDecide, canResend, type AskRequest, type AskStatus } from '../data/models/ask-request';
import {
  useApproveAsk,
  useAskContext,
  useAskRequest,
  useAskRole,
  useDeclineAsk,
  useResendAsk,
} from '../hooks/use-ask-to-buy';
import { AskRequestSkeleton } from './AskRequestSkeleton';

/** Result banner fills, per `screens/mock-family-senior.md`. */
const BANNER: Readonly<Record<Exclude<AskStatus, 'pending'>, { box: string; title: string }>> = {
  approved: { box: 'bg-success-soft', title: 'text-success' },
  declined: { box: 'bg-brand-soft', title: 'text-brand' },
  expired: { box: 'bg-surface2', title: 'text-ink' },
};

export interface AskRequestViewProps {
  id: string;
}

export function AskRequestView({ id }: AskRequestViewProps) {
  const t = useTranslations('ask_to_buy');
  const tc = useTranslations('common');
  const { money, number } = useFormat();
  const failureMessage = useFailureMessage();
  const askTime = useAskTime();

  const { role, forced, switching, setRole } = useAskRole();
  const context = useAskContext();
  const request = useAskRequest(id);

  const approve = useApproveAsk();
  const decline = useDeclineAsk();
  const resend = useResendAsk();

  const [payOpen, setPayOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  const reference = request.data?.reference ?? id;

  const header = (
    <>
      <PageHeader
        title={t('detail.title', { reference })}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.profile'), href: paths.profile },
              { label: t('breadcrumb.module'), href: paths.askToBuy },
              { label: t('detail.title', { reference }) },
            ]}
          />
        }
        actions={
          <AskRoleSwitch role={role} forced={forced} switching={switching} onChange={setRole} />
        }
      />
      <DemoBanner module={t('title')} body={t('demo.body')} />
    </>
  );

  if (request.isPending) {
    return (
      <>
        {header}
        <AskRequestSkeleton />
      </>
    );
  }

  if (request.isError) {
    const notFound = request.error.kind === 'notFound';
    return (
      <>
        {header}
        {notFound ? (
          <EmptyState
            icon={SearchX}
            title={t('detail.missing.title')}
            body={t('detail.missing.body')}
            action={
              <LinkButton href={paths.askToBuy} variant="primary" size="xl">
                {t('detail.missing.action')}
              </LinkButton>
            }
            className="min-h-[460px] justify-center rounded-xl bg-surface p-7"
          />
        ) : (
          <ErrorState
            failure={request.error}
            title={t('detail.error.title')}
            message={failureMessage(request.error)}
            retryLabel={tc('retry')}
            retrying={request.isRefetching}
            onRetry={() => request.refetch()}
            className="min-h-[460px] justify-center rounded-xl bg-surface p-7"
          />
        )}
      </>
    );
  }

  const data: AskRequest = request.data;
  const decidable = canDecide(data, role);
  const resendable = canResend(data, role);
  const counterpart = data.direction === 'incoming' ? data.childName : data.parentName;
  const initial = counterpart.trim().charAt(0).toLocaleUpperCase('az');
  const banner = data.status === 'pending' ? null : BANNER[data.status];

  return (
    <>
      {header}

      <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
        <section
          aria-labelledby="ask-request-card"
          className="flex w-full min-w-0 flex-1 flex-col items-start gap-6 rounded-xl bg-surface p-7"
        >
          <div className="flex w-full flex-row flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-row items-center gap-[14px]">
              <span
                aria-hidden="true"
                className="flex size-13 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-[21px] font-bold text-brand"
              >
                {initial}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 id="ask-request-card" className="text-[18px] font-bold text-ink">
                  {data.direction === 'incoming'
                    ? t('detail.fromChild', { name: counterpart })
                    : t('detail.toParent', {
                        name: counterpart,
                        relation: data.parentRelationLabel,
                      })}
                </h2>
                <p className="text-label text-ink2">
                  {askTime(data.createdAt)}
                  {data.status === 'pending' ? ` · ${t('detail.awaiting')}` : ''}
                </p>
              </div>
            </div>
            <AskStatusChip status={data.status} />
          </div>

          <AskTracker status={data.status} />

          <div className="h-px w-full bg-line" />

          <h3 className="text-[18px] font-bold text-ink">{t('detail.items')}</h3>
          <ul className="flex w-full flex-col gap-4">
            {data.items.map((item) => (
              <AskItemRow key={item.id} item={item} />
            ))}
          </ul>

          {data.note ? (
            <figure className="flex w-full flex-row items-center gap-3 rounded-md bg-bg p-[18px]">
              <MessageSquare aria-hidden="true" size={20} className="shrink-0 text-ink3" />
              <blockquote className="min-w-0 text-body-sm text-ink2">
                {t('detail.note', { note: data.note })}
              </blockquote>
            </figure>
          ) : null}
        </section>

        <div className="flex w-full shrink-0 flex-col items-start gap-5 lg:w-[400px]">
          {banner ? (
            <div
              role="status"
              className={cn('flex w-full flex-col items-start gap-[10px] rounded-xl p-7', banner.box)}
            >
              <p className={cn('text-h3 font-extrabold', banner.title)}>
                {t(`status.${data.status}`)}
              </p>
              <p className="text-body-sm text-ink">
                {data.status === 'approved'
                  ? t('detail.banner.approved', {
                      name: data.parentName,
                      card: data.paidWith ?? '',
                    })
                  : t(`detail.banner.${data.status}`)}
              </p>
            </div>
          ) : null}

          <section
            aria-labelledby="ask-summary"
            className="flex w-full flex-col items-start gap-[14px] rounded-xl bg-surface p-7"
          >
            <h2 id="ask-summary" className="text-[18px] font-bold text-ink">
              {t('summary.title')}
            </h2>

            <dl className="flex w-full flex-col gap-[14px]">
              <div className="flex w-full flex-row items-start justify-between gap-4">
                <dt className="text-body-sm text-ink2">
                  {t('summary.items', { count: number(data.itemCount) })}
                </dt>
                <dd className="text-body-sm font-semibold text-ink">{money(data.itemsTotal)}</dd>
              </div>
              <div className="flex w-full flex-row items-start justify-between gap-4">
                <dt className="text-body-sm text-ink2">{t('summary.delivery')}</dt>
                <dd className="text-body-sm font-semibold text-ink">
                  {data.deliveryFree ? t('summary.free') : money(data.deliveryFee)}
                </dd>
              </div>
            </dl>

            <div className="h-px w-full bg-line" />

            <div className="flex w-full flex-row items-center justify-between gap-4">
              <span className="text-body font-semibold text-ink">{t('summary.total')}</span>
              <span className="text-h3 font-extrabold text-ink">{money(data.total)}</span>
            </div>

            {decidable ? (
              <>
                <Button
                  variant="brand"
                  size="xl"
                  fullWidth
                  onClick={() => setPayOpen(true)}
                  disabled={approve.isPending || decline.isPending}
                >
                  {t('detail.approve')}
                </Button>
                <Button
                  variant="soft"
                  size="xl"
                  fullWidth
                  onClick={() => setDeclineOpen(true)}
                  disabled={approve.isPending || decline.isPending}
                >
                  {t('detail.decline')}
                </Button>
              </>
            ) : resendable ? (
              <Button
                variant="brand"
                size="xl"
                fullWidth
                loading={resend.isPending}
                onClick={() => resend.mutate(data.id)}
              >
                {t('detail.resend')}
              </Button>
            ) : data.status === 'approved' && data.orderId ? (
              <LinkButton href={paths.order(data.orderId)} variant="soft" size="xl" fullWidth>
                {t('detail.openOrder')}
              </LinkButton>
            ) : (
              <LinkButton href={paths.askToBuy} variant="soft" size="xl" fullWidth>
                {t('detail.backToInbox')}
              </LinkButton>
            )}

            {data.status === 'pending' && !decidable ? (
              <p className="text-caption text-ink3">{t('detail.waitingHint')}</p>
            ) : null}
          </section>
        </div>
      </div>

      <AskPayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        cards={context.data?.cards ?? []}
        childName={data.childName}
        itemCount={data.itemCount}
        total={data.total}
        submitting={approve.isPending}
        failure={approve.error}
        onConfirm={(cardId) =>
          approve.mutate({ id: data.id, cardId }, { onSuccess: () => setPayOpen(false) })
        }
      />

      <AskDeclineDialog
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        childName={data.childName}
        submitting={decline.isPending}
        failure={decline.error}
        onConfirm={() => decline.mutate({ id: data.id }, { onSuccess: () => setDeclineOpen(false) })}
      />
    </>
  );
}
