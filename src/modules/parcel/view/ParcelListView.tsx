'use client';

/**
 * `/parcel` — "Bağlama · Əsas" (`G9SN92`).
 *
 * Hero + yellow rules card, then the filter chips and the "Bağlamalarım" card.
 * States: loading (`Pe3XF`), empty (`jf3Uz`), error (`URWK5`) — each reachable with
 * `?preview=loading|empty|error`.
 *
 * Everything on this screen is mock data; `<DemoBanner>` says so at the top.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { paths } from '@/core/routes';
import { Package } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button, ChipGroup } from '@/shared/ui';

import { ParcelHeroRow } from '../components/parcel-hero';
import { ParcelRow } from '../components/parcel-row';
import type { ParcelFilter } from '../data/models/parcel';
import { useParcelRules, useParcels } from '../hooks/use-parcels';

import { ParcelListSkeleton } from './ParcelListSkeleton';

const FILTERS: readonly ParcelFilter[] = ['all', 'active', 'delivered', 'cancelled'];

export function ParcelListView() {
  const t = useTranslations('parcel');
  const [filter, setFilter] = useState<ParcelFilter>('all');

  const rules = useParcelRules();
  const list = useParcels(filter);

  return (
    <>
      <DemoBanner module="parcel" body={t('demo')} />

      <PageHeader
        title={t('list.title')}
        subtitle={t('list.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: t('crumb.home'), href: paths.home },
              { label: t('crumb.parcel') },
            ]}
          />
        }
        actions={
          <Button as="a" href={paths.parcelNew} variant="brand" size="2xl">
            {t('list.newParcel')}
          </Button>
        }
      />

      <ParcelHeroRow rules={rules.data} />

      <section aria-labelledby="parcel-mine" className="flex w-full flex-col gap-5">
        <h2 id="parcel-mine" className="m-0 text-h3 font-extrabold text-ink">
          {t('list.myParcels')}
        </h2>

        <ChipGroup
          label={t('filter.label')}
          value={filter}
          onValueChange={(v) => setFilter(v as ParcelFilter)}
          scroll
          options={FILTERS.map((id) => ({ value: id, label: t(`filter.${id}`) }))}
        />

        {list.isPending ? (
          <ParcelListSkeleton label={t('list.loading')} />
        ) : list.isError ? (
          <ErrorState
            failure={list.error}
            title={t('error.title')}
            message={t('error.body')}
            retryLabel={t('error.retry')}
            onRetry={() => void list.refetch()}
          />
        ) : list.visible.length === 0 ? (
          <EmptyState
            icon={Package}
            tone="brand"
            panel
            title={t('empty.title')}
            body={t('empty.body')}
            action={
              <Button as="a" href={paths.parcelNew} variant="brand" size="2xl">
                {t('hero.send')}
              </Button>
            }
          />
        ) : (
          <div className="w-full rounded-xl bg-surface px-6 py-2">
            {list.visible.map((parcel) => (
              <ParcelRow key={parcel.id} parcel={parcel} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
