'use client';

/**
 * `/courier/apply/status` — "Müraciət statusu" (`Gu349` pending, `R00xC` approved).
 *
 * The hero swaps on status: pending = dark `block` with the timer glyph, active = `success-soft`
 * with the check and the "Kuryer panelinə keç" CTA, rejected = `brand-soft` with the reason and
 * "Yenidən müraciət et" (not drawn; same layout as pending, per the screen spec).
 *
 * `useCourierMe` polls every second while the status is `pending`, so the mock's **~4 s
 * auto-approval lands on screen without a page reload** — that is the documented demo hook. The
 * live region on the hero announces the change.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Check, Circle, CircleAlert, Timer } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button } from '@/shared/ui';

import { CourierCard, KeyValue } from '../components/courier-bits';
import type { CourierStatus } from '../data/models/courier';
import { useCourierMe } from '../hooks/use-courier';

import { CourierStatusSkeleton } from './CourierStatusSkeleton';

/** Which timeline steps are done for a given status. */
const DONE_UPTO: Record<CourierStatus, number> = {
  none: 0,
  pending: 1,
  active: 4,
  rejected: 2,
};

export function CourierApplyStatusView() {
  const t = useTranslations('courier');
  const { date } = useFormat();

  const me = useCourierMe();
  const status = me.data?.status ?? 'none';
  const application = me.data?.application ?? null;

  if (me.isPending) {
    return (
      <>
        <DemoBanner module="courier" body={t('demo')} />
        <PageHeader title={t('status.title')} />
        <CourierStatusSkeleton label={t('status.loading')} />
      </>
    );
  }

  if (me.isError) {
    return (
      <>
        <DemoBanner module="courier" body={t('demo')} />
        <PageHeader title={t('status.title')} />
        <ErrorState
          failure={me.error}
          title={t('panel.errorTitle')}
          message={t('panel.errorBody')}
          retryLabel={t('panel.retry')}
          onRetry={() => void me.refetch()}
        />
      </>
    );
  }

  const submittedAt = application?.submittedAt ?? null;
  const submittedLabel = submittedAt
    ? `${date(submittedAt, 'dayMonth')}, ${date(submittedAt, 'time')}`
    : t('status.todo');

  const steps = [
    { key: 'status.step1', at: submittedLabel },
    { key: 'status.step2', at: status === 'pending' ? t('status.waiting') : submittedLabel },
    { key: 'status.step3', at: status === 'active' ? submittedLabel : t('status.todo') },
    { key: 'status.step4', at: status === 'active' ? submittedLabel : t('status.todo') },
  ] as const;

  const done = DONE_UPTO[status];

  return (
    <>
      <DemoBanner module="courier" body={t('demo')} />

      <PageHeader
        title={t('status.title')}
        subtitle={
          application?.reference
            ? t('status.subtitle', { number: application.reference })
            : undefined
        }
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.courier'), href: paths.courier },
              { label: t('status.crumb') },
            ]}
          />
        }
      />

      {status === 'none' ? (
        <EmptyState
          icon={CircleAlert}
          tone="brand"
          panel
          title={t('status.noneTitle')}
          body={t('status.noneBody')}
          action={
            <Button as="a" href={paths.courierApply} variant="brand" size="2xl">
              {t('status.apply')}
            </Button>
          }
        />
      ) : (
        <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <StatusHero status={status} />

            <CourierCard>
              <h2 className="m-0 text-h4 font-bold text-ink">{t('status.steps')}</h2>
              <ol aria-label={t('status.steps')} className="m-0 flex list-none flex-col p-0">
                {steps.map((step, index) => {
                  const isDone = index < done;
                  const isCurrent = index === done;
                  const Icon = isDone ? Check : isCurrent ? Timer : Circle;
                  const last = index === steps.length - 1;
                  return (
                    <li
                      key={step.key}
                      aria-current={isCurrent ? 'step' : undefined}
                      className="flex w-full flex-row items-stretch gap-4"
                    >
                      <span className="flex shrink-0 flex-col items-center">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid size-10 place-items-center rounded-pill',
                            isDone
                              ? 'bg-success-soft text-success'
                              : isCurrent
                                ? 'bg-brand text-white'
                                : 'bg-surface2 text-ink3',
                          )}
                        >
                          <Icon size={18} />
                        </span>
                        {!last ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              'w-0.5 flex-1 rounded-pill',
                              isDone ? 'bg-success' : 'bg-line',
                            )}
                          />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          'flex min-w-0 flex-1 flex-row items-center justify-between gap-4',
                          last ? 'pb-0' : 'pb-5',
                        )}
                      >
                        <span
                          className={cn('text-label text-ink', (isDone || isCurrent) && 'font-bold')}
                        >
                          {t(step.key)}
                        </span>
                        <span className="shrink-0 text-caption tabular-nums text-ink3">
                          {step.at}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </CourierCard>
          </div>

          <CourierCard as="aside" className="shrink-0 lg:w-[400px]">
            <h2 className="m-0 text-h4 font-bold text-ink">{t('status.summary')}</h2>
            <dl className="m-0 flex w-full flex-col gap-3">
              <KeyValue label={t('status.name')} value={application?.fullName ?? '—'} />
              <KeyValue label={t('status.phone')} value={application?.phone ?? '—'} />
              <KeyValue label={t('status.city')} value={application?.city ?? '—'} />
              <KeyValue
                label={t('status.vehicle')}
                value={application ? t(`vehicle.${application.vehicle}`) : '—'}
              />
              <KeyValue
                label={t('status.plate')}
                value={application?.plateNumber || t('status.todo')}
              />
              <KeyValue
                label={t('status.thermalBag')}
                value={application?.hasThermalBag ? t('status.yes') : t('status.no')}
              />
              <KeyValue label={t('status.submittedAt')} value={submittedLabel} />
            </dl>
          </CourierCard>
        </div>
      )}
    </>
  );
}

function StatusHero({ status }: { status: CourierStatus }) {
  const t = useTranslations('courier');

  if (status === 'active') {
    return (
      <section
        aria-live="polite"
        className="flex w-full flex-col items-start gap-4 rounded-bento bg-success-soft p-8"
      >
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-pill bg-success text-white"
        >
          <Check size={26} />
        </span>
        <h2 className="m-0 text-h3 font-extrabold text-ink">{t('status.activeTitle')}</h2>
        <p className="m-0 max-w-[540px] text-body-sm text-ink2">{t('status.activeBody')}</p>
        <Button as="a" href={paths.courier} variant="primary" size="3xl">
          {t('status.goToPanel')}
        </Button>
      </section>
    );
  }

  if (status === 'rejected') {
    return (
      <section
        aria-live="polite"
        className="flex w-full flex-col items-start gap-4 rounded-bento bg-brand-soft p-8"
      >
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-pill bg-brand text-white"
        >
          <CircleAlert size={26} />
        </span>
        <h2 className="m-0 text-h3 font-extrabold text-ink">{t('status.rejectedTitle')}</h2>
        <p className="m-0 max-w-[540px] text-body-sm text-ink2">{t('status.rejectedBody')}</p>
        <Button as="a" href={paths.courierApply} variant="brand" size="3xl">
          {t('status.reapply')}
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-live="polite"
      className="flex w-full flex-col items-start gap-4 rounded-bento bg-block p-8"
    >
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-pill bg-on-block/15 text-on-block"
      >
        <Timer size={26} />
      </span>
      <h2 className="m-0 text-h3 font-extrabold text-on-block">{t('status.pendingTitle')}</h2>
      <p className="m-0 max-w-[540px] text-body-sm text-on-block/70">{t('status.pendingBody')}</p>
    </section>
  );
}
