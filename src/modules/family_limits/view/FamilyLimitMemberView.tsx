'use client';

/**
 * `/family-limits/[id]` — one member (`limits-member.html`, node `VxjiD`).
 *
 * Layout from the export: Page Header (title = the member's name, subtitle `Rol · yaş`, a 52
 * `cta` "Limiti dəyiş" pill right) → demo notice → Columns (gap 32). The 480 left column holds the
 * big spend card (`brand-soft` with the `brand` "Limit dolub" pill when the limit is full, else a
 * `surface` card with an `ink` bar; amount 56/800, bar 14px, renewal note below) and the allowed
 * categories card. The right column is the "Son alışlar" list.
 *
 * "Limiti dəyiş" opens the editor **drawer** (`limits-editor-drawer.html`), which is why
 * `/family-limits/[id]/edit` is a fallback rather than a screen: `editing` starts `true` there.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/core/lib/cn';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { SearchX, Wallet } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button } from '@/shared/ui';

import { CategoryChips } from '../components/category-chips';
import { LimitEditorDrawer } from '../components/limit-editor-drawer';
import { LimitProgress } from '../components/limit-progress';
import { LinkButton } from '../components/link-button';
import { PurchaseRow } from '../components/purchase-row';
import { hasNoLimit } from '../data/models/limit-member';
import { useFamilyLimitMember } from '../hooks/use-family-limits';
import { FamilyLimitMemberSkeleton } from './FamilyLimitMemberSkeleton';

export interface FamilyLimitMemberViewProps {
  id: string;
  /** `true` on `/family-limits/[id]/edit` — the drawer opens straight away. */
  editing?: boolean;
}

export function FamilyLimitMemberView({ id, editing = false }: FamilyLimitMemberViewProps) {
  const t = useTranslations('family_limits');
  const tc = useTranslations('common');
  const { money, number } = useFormat();
  const failureMessage = useFailureMessage();

  const member = useFamilyLimitMember(id);
  const [open, setOpen] = useState(editing);

  const name = member.data?.name ?? '';
  const subtitle =
    member.data == null
      ? undefined
      : member.data.age === null
        ? member.data.role
        : t('card.roleAge', { role: member.data.role, age: number(member.data.age) });

  const header = (
    <>
      <PageHeader
        title={name || t('title')}
        subtitle={subtitle}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.profile'), href: paths.profile },
              { label: t('breadcrumb.familyCard'), href: paths.familyLimits },
              { label: t('title'), href: paths.familyLimits },
              { label: name || t('member.fallback') },
            ]}
          />
        }
        actions={
          member.data ? (
            <Button variant="primary" size="xl" onClick={() => setOpen(true)}>
              {t('member.edit')}
            </Button>
          ) : undefined
        }
      />
      <DemoBanner module={t('title')} body={t('demo.body')} />
    </>
  );

  if (member.isPending) {
    return (
      <>
        {header}
        <FamilyLimitMemberSkeleton />
      </>
    );
  }

  if (member.isError) {
    const notFound = member.error.kind === 'notFound';
    return (
      <>
        {header}
        {notFound ? (
          <EmptyState
            icon={SearchX}
            title={t('member.missing.title')}
            body={t('member.missing.body')}
            action={
              <LinkButton href={paths.familyLimits} variant="primary" size="xl">
                {t('member.missing.action')}
              </LinkButton>
            }
            className="min-h-[480px] justify-center rounded-xl bg-surface p-7"
          />
        ) : (
          <ErrorState
            failure={member.error}
            title={t('member.error.title')}
            message={failureMessage(member.error)}
            retryLabel={tc('retry')}
            retrying={member.isRefetching}
            onRetry={() => member.refetch()}
            className="min-h-[480px] justify-center rounded-xl bg-surface p-7"
          />
        )}
      </>
    );
  }

  const data = member.data;
  const noLimit = hasNoLimit(data);
  const periodLabel = t(`period.${data.period}`);

  return (
    <>
      {header}

      <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[480px]">
          <section
            aria-labelledby="limit-spend"
            className={cn(
              'flex w-full flex-col items-start gap-4 rounded-xl p-8',
              data.exhausted ? 'bg-brand-soft' : 'bg-surface',
            )}
          >
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <h2 id="limit-spend" className="text-body-sm font-semibold text-ink2">
                {t(`member.spentIn.${data.period}`)}
              </h2>
              {data.exhausted ? (
                <span className="inline-flex h-7 shrink-0 items-center rounded-pill bg-brand px-3 text-caption font-bold text-white">
                  {t('card.full')}
                </span>
              ) : null}
            </div>

            {noLimit ? (
              <>
                <p className="text-h1-app font-extrabold text-ink">{money(data.spent)}</p>
                <p className="text-body text-ink2">{t('card.noLimitBody')}</p>
              </>
            ) : (
              <>
                <p className="flex flex-row items-end gap-2">
                  <span className="text-[56px] font-extrabold leading-none tracking-[-2px] text-ink">
                    {money(data.spent)}
                  </span>
                  <span className="text-body text-ink2">
                    {t('card.of', { limit: number(data.limit), period: periodLabel })}
                  </span>
                </p>

                <LimitProgress
                  value={data.progress}
                  exhausted={data.exhausted}
                  height={14}
                  label={t('card.progressLabel', { name: data.name, period: periodLabel })}
                  valueText={t('card.progressValue', {
                    spent: money(data.spent),
                    limit: number(data.limit),
                  })}
                />

                <p aria-live="polite" className="text-label text-ink2">
                  {t('member.remainingLine', {
                    amount: money(data.remaining),
                    renewal: t(`member.renewal.${data.period}`),
                  })}
                </p>
              </>
            )}
          </section>

          <section
            aria-labelledby="limit-categories"
            className="flex w-full flex-col items-start gap-[18px] rounded-xl bg-surface p-7"
          >
            <h2 id="limit-categories" className="text-[18px] font-bold text-ink">
              {t('member.categories')}
            </h2>
            <CategoryChips value={data.categories} label={t('member.categories')} />
          </section>
        </div>

        <section
          aria-labelledby="limit-purchases"
          className="flex w-full min-w-0 flex-1 flex-col items-start rounded-xl bg-surface px-7 pb-2 pt-7"
        >
          <h2 id="limit-purchases" className="mb-3 text-h4 font-bold text-ink">
            {t('member.purchases')}
          </h2>

          {data.purchases.length === 0 ? (
            <EmptyState
              compact
              icon={Wallet}
              title={t('member.noPurchases.title')}
              body={t('member.noPurchases.body')}
              className="py-10"
            />
          ) : (
            <ul className="flex w-full flex-col">
              {data.purchases.map((purchase) => (
                <PurchaseRow key={purchase.id} purchase={purchase} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <LimitEditorDrawer open={open} onOpenChange={setOpen} member={data} />
    </>
  );
}
