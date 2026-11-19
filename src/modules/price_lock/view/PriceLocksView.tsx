'use client';

/**
 * PL2 — `/price-locks` (`pl2-price-locks.html` node `gU5B5`, plus the history and state panels
 * from `pl2-pl3-history-states-freeze-dialog.html` node `XXpH0`).
 *
 * Header + brand `Qiyməti dondur` pill · Demo rejim strip · `Aktiv · N` / `Tarixçə · N` chips ·
 * two-column lock cards · the 1 ₼ deposit info strip.
 *
 * States: the drawn skeleton, `State · Aktiv kilid yoxdur`, `State · Kilidlər yüklənmədi`, the
 * history cards (`İstifadə edildi` / `Bitib`) and the PL3 freeze dialog in all four variants.
 *
 * Expiry: `useExpiryWatch` watches the active locks' `expiresAt` and refetches when the soonest
 * one passes. The source then reports that lock as `expired` (it settles and persists the
 * transition), so the card moves to the history tab because the **source** said so.
 *
 * `?preview=loading|empty|error|offline|expired` all work.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Info, Snowflake } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, InlineNotice, StateButton } from '@/shared/states';
import { Button, ChipGroup, toast } from '@/shared/ui';

import { FreezePriceDialog } from '../components/freeze-price-dialog';
import { LockCard } from '../components/lock-card';
import { PriceLockError, PriceLocksEmpty } from '../components/price-lock-states';
import { useExpiryWatch } from '../hooks/use-expiry-watch';
import { usePriceLocks, useUseLock } from '../hooks/use-price-lock';
import { PriceLocksHeaderActionSkeleton, PriceLocksSkeleton } from './PriceLocksSkeleton';

type Tab = 'active' | 'history';

export function PriceLocksView() {
  const t = useTranslations('price_lock');
  const { money } = useFormat();
  const [tab, setTab] = useState<Tab>('active');
  const [freezeOpen, setFreezeOpen] = useState(false);

  const query = usePriceLocks();
  const use = useUseLock();

  const data = query.data ?? null;
  const refetch = () => {
    void query.refetch();
  };

  const activeExpiries = useMemo(
    () => (data?.active ?? []).map((lock) => lock.expiresAt),
    [data?.active],
  );
  useExpiryWatch(activeExpiries, refetch);

  const rows = data ? (tab === 'active' ? data.active : data.history) : [];

  const onUse = (id: string) => {
    use.mutate(id, {
      onSuccess: () => toast.success({ title: t('card.mockOnly') }),
      onError: () => toast.error({ title: t('card.useFailed') }),
    });
  };

  return (
    <>
      <PageHeader
        title={t('locks.title')}
        subtitle={t('locks.subtitle', { days: data?.lockDays ?? 0 })}
        backHref={paths.profile}
        backLabel={t('breadcrumb')}
        actions={
          query.isPending ? (
            <PriceLocksHeaderActionSkeleton />
          ) : (
            <Button
              variant="brand"
              size="lg"
              leadingIcon={<Snowflake size={20} aria-hidden="true" />}
              onClick={() => setFreezeOpen(true)}
            >
              {t('locks.freeze')}
            </Button>
          )
        }
      />

      <DemoBanner module={t('demo.module')} body={t('demo.body')} />

      {query.isPending ? (
        <PriceLocksSkeleton label={t('loading')} />
      ) : query.isError || !data ? (
        <PriceLockError failure={query.error} onRetry={refetch} retrying={query.isRefetching} />
      ) : (
        <div className="flex flex-col gap-5">
          <ChipGroup
            label={t('locks.tabsLabel')}
            value={tab}
            onValueChange={(value) => setTab(value as Tab)}
            options={[
              { value: 'active', label: t('locks.tabActive'), count: data.active.length },
              { value: 'history', label: t('locks.tabHistory'), count: data.history.length },
            ]}
          />

          {rows.length === 0 ? (
            <PriceLocksEmpty
              tab={tab}
              action={
                <StateButton size={46} onClick={() => setFreezeOpen(true)}>
                  {t('locks.freeze')}
                </StateButton>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {rows.map((lock) => (
                <LockCard
                  key={lock.id}
                  lock={lock}
                  onUse={tab === 'active' ? onUse : undefined}
                  using={use.isPending && use.variables === lock.id}
                />
              ))}
            </div>
          )}

          <InlineNotice tone="note" multiline icon={Info}>
            {t('locks.depositNote', { deposit: money(data.deposit) })}
          </InlineNotice>
        </div>
      )}

      <FreezePriceDialog
        open={freezeOpen}
        onOpenChange={setFreezeOpen}
        lockDays={data?.lockDays ?? 0}
        deposit={data?.deposit ?? 0}
        hideLocksLink
      />
    </>
  );
}
