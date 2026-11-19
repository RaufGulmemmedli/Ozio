'use client';

/**
 * N7 · "Partnyorlar · Xəritə" — `/market/partners/map` (`app-partnyorlar-xerite.html`, `xrRRc`).
 *
 * The canvas shows "nearby branches of every partner" on one map. **The API cannot serve that**:
 * there is no cross-brand branch endpoint (branches only exist per brand, under
 * `modules/branch/{brandId}`), and 191 of 197 live branches carry no coordinate at all.
 *
 * So this screen keeps the drawn layout (category chips → list panel 420 | map, selected-branch
 * card over the map) and drives it with what exists: pick a category, pick one of its brands, and
 * the panel lists that brand's branches — with an honest "no location" note on every branch the
 * API gives no point for, and pins for the few that have one.
 */
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { useSelectedAddress } from '@/modules/address';
import { Button, Select } from '@/shared/ui';
import { MapPlaceholder, type MapPoint } from '@/shared/media';
import { EmptyState, ErrorState, InlineNotice } from '@/shared/states';
import { Bone, BoneCard, ChipRowSkeleton, Shimmer } from '@/shared/skeleton';
import { MapPinOff, Store } from '@/shared/lucide';

import { BranchRow } from '../components/BranchRow';
import { CategoryChipRow } from '../components/CategoryChipRow';
import { PartnerLogo } from '../components/PartnerLogo';
import { ViewToggle } from '../components/ViewToggle';
import { useBranches, usePartnerCategories, usePartnerModule } from '../hooks';
import type { Branch } from '../data/models/partner';
import { haversineMeters, samePoint } from '../lib/geo';

/** Lay the mappable branches out inside the illustrative box (a normalised spread, not a projection). */
function spread(branches: readonly Branch[]): MapPoint[] {
  const withPoint = branches.filter(
    (b): b is Branch & { point: { lat: number; lng: number } } => b.point !== null,
  );
  if (withPoint.length === 0) return [];
  const lats = withPoint.map((b) => b.point.lat);
  const lngs = withPoint.map((b) => b.point.lng);
  const pos = (v: number, min: number, max: number) =>
    max - min < 1e-6 ? 50 : 14 + ((v - min) / (max - min)) * 72;
  return withPoint.map((branch) => ({
    id: branch.id,
    label: branch.name,
    detail: branch.address ?? undefined,
    kind: 'store' as const,
    x: pos(branch.point.lng, Math.min(...lngs), Math.max(...lngs)),
    y: 100 - pos(branch.point.lat, Math.min(...lats), Math.max(...lats)),
  }));
}

export function PartnersMapView() {
  const t = useTranslations('partners');
  const failureMessage = useFailureMessage();
  const { number } = useFormat();
  const selectedAddress = useSelectedAddress();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  /**
   * The selected pin, scoped to the brand it belongs to. Keeping the brand id in the state is what
   * makes a brand switch drop the selection **without** an effect that re-renders twice.
   */
  const [selection, setSelection] = useState<{ brandId: string; branchId: string } | null>(null);

  const categories = usePartnerCategories();
  const category = useMemo(
    () => categories.data?.find((c) => c.id === categoryId) ?? categories.data?.[0] ?? null,
    [categories.data, categoryId],
  );
  const brands = usePartnerModule(category);
  const brand = useMemo(
    () => brands.data?.find((b) => b.id === brandId) ?? brands.data?.[0] ?? null,
    [brands.data, brandId],
  );
  const branchesQuery = useBranches(brand?.id ?? null);
  const branchesData = branchesQuery.data;
  const branches = useMemo(() => branchesData ?? [], [branchesData]);

  const selectedBranchId = selection && selection.brandId === brand?.id ? selection.branchId : null;
  const selectBranch = useCallback(
    (branchId: string) => {
      if (!brand) return;
      setSelection({ brandId: brand.id, branchId });
    },
    [brand],
  );

  const pins = useMemo(() => {
    const base = spread(branches);
    if (!selectedAddress.point) return base;
    return [
      ...base,
      {
        id: 'home',
        label: selectedAddress.isFallback ? t('map.cityPoint') : t('map.yourAddress'),
        detail: selectedAddress.address?.line ?? undefined,
        kind: 'home' as const,
        x: 50,
        y: 50,
      },
    ];
  }, [branches, selectedAddress.point, selectedAddress.isFallback, selectedAddress.address?.line, t]);

  const sorted = useMemo(() => {
    const reference = selectedAddress.point;
    const withDistance = branches.map((branch) => ({
      branch,
      meters: reference && branch.point ? haversineMeters(reference, branch.point) : null,
    }));
    return withDistance.sort((a, b) => {
      if (a.meters === null && b.meters === null) return a.branch.name.localeCompare(b.branch.name, 'az');
      if (a.meters === null) return 1;
      if (b.meters === null) return -1;
      return a.meters - b.meters;
    });
  }, [branches, selectedAddress.point]);

  const mappableCount = useMemo(() => {
    const withPoint = branches.filter((b) => b.point !== null);
    return withPoint.filter(
      (branch, index) =>
        withPoint.findIndex((o) => o.point && branch.point && samePoint(o.point, branch.point)) === index,
    ).length;
  }, [branches]);

  const selectedBranch =
    sorted.find((row) => row.branch.id === selectedBranchId) ?? sorted[0] ?? null;

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.03em] text-ink lg:text-h1-app">
            {t('title')}
          </h1>
          <p className="m-0 text-body text-ink2">{t('map.subtitle')}</p>
        </div>
        <ViewToggle
          active="map"
          gridHref={paths.marketPartners}
          mapHref={paths.marketPartnersMap}
          gridLabel={t('toggle.grid')}
          mapLabel={t('toggle.map')}
          label={t('toggle.label')}
        />
      </header>

      {categories.isPending ? (
        <ChipRowSkeleton count={8} />
      ) : categories.data && categories.data.length > 0 ? (
        <CategoryChipRow
          categories={categories.data}
          value={category?.id ?? null}
          onChange={(id) => {
            setCategoryId(id);
            setBrandId(null);
            setSelection(null);
          }}
          allLabel={t('chips.all')}
          label={t('chips.label')}
        />
      ) : null}

      {categories.isError ? (
        <ErrorState
          failure={categories.error}
          title={t('error.title')}
          message={failureMessage(categories.error)}
          onRetry={() => categories.refetch()}
          retryLabel={t('error.retry')}
        />
      ) : null}

      {/* The API has no "all partners nearby" call — the map is always one brand at a time. */}
      <InlineNotice tone="info" icon={MapPinOff} body={t('map.scopeNote')} multiline />

      {brands.data && brands.data.length > 0 ? (
        <Select
          aria-label={t('map.brandLabel')}
          value={brand?.id ?? ''}
          onValueChange={(value) => setBrandId(value)}
          options={brands.data.map((row) => ({ value: row.id, label: row.name }))}
          className="w-full md:max-w-[420px]"
        />
      ) : null}

      <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-stretch">
        <div className="flex w-full flex-col gap-3 lg:w-[420px]">
          <div className="flex w-full flex-row items-center justify-between gap-3 px-1">
            <h2 className="m-0 text-body-l font-bold text-ink">
              {t('map.listHeader', { count: number(branches.length) })}
            </h2>
            <span className="text-caption font-semibold text-ink2">
              {selectedAddress.point ? t('map.sortDistance') : t('map.sortName')}
            </span>
          </div>

          {branchesQuery.isPending ? (
            <Shimmer label={t('loading')} className="flex w-full flex-col gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <BoneCard key={i} r="card" pad={14} gap={14} row>
                  <Bone w={60} h={60} r={16} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Bone w="55%" h={16} r="sm" />
                    <Bone w="80%" h={13} r="xs" />
                    <Bone w="35%" h={12} r="xs" />
                  </div>
                  <Bone w={56} h={28} r="pill" />
                </BoneCard>
              ))}
            </Shimmer>
          ) : branchesQuery.isError ? (
            <ErrorState
              compact
              failure={branchesQuery.error}
              title={t('error.title')}
              message={failureMessage(branchesQuery.error)}
              onRetry={() => branchesQuery.refetch()}
              retryLabel={t('error.retry')}
            />
          ) : sorted.length === 0 ? (
            <EmptyState
              compact
              panel
              icon={Store}
              title={t('map.emptyTitle')}
              body={t('map.emptyBody')}
            />
          ) : (
            <ul className="m-0 flex w-full list-none flex-col gap-3 overflow-y-auto p-0 lg:max-h-[700px]">
              {sorted.map(({ branch, meters }) => (
                <li key={branch.id}>
                  <BranchRow
                    branch={branch}
                    brandName={brand?.name ?? ''}
                    variant="card"
                    distanceMeters={meters}
                    selected={selectedBranch?.branch.id === branch.id}
                    onSelect={selectBranch}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <MapPlaceholder
            label={t('map.mapLabel')}
            points={pins}
            pointListLabel={t('map.mapListLabel')}
            showPointList={false}
            onPointSelect={selectBranch}
            height={640}
          >
            {selectedBranch ? (
              <div className="absolute inset-x-5 bottom-5 flex flex-row items-center gap-4 rounded-xl bg-surface p-[18px]">
                <PartnerLogo
                  name={selectedBranch.branch.name || brand?.name || ''}
                  src={selectedBranch.branch.imageUrl}
                  size={64}
                  radius={18}
                  fontSize={24}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="m-0 truncate text-body font-bold text-ink">
                    {selectedBranch.branch.name || brand?.name}
                  </p>
                  <p className="m-0 truncate text-caption text-ink2">
                    {selectedBranch.branch.address ?? t('branch.noAddress')}
                  </p>
                </div>
                {brand ? (
                  <Button as="a" href={paths.marketPartner(brand.id)} variant="brand" size="md">
                    {t('map.detailCta')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </MapPlaceholder>

          {mappableCount === 0 && branches.length > 0 ? (
            <InlineNotice
              tone="warning"
              icon={MapPinOff}
              title={t('detail.branches.noMapTitle')}
              body={t('detail.branches.noMapBody')}
              multiline
            />
          ) : null}

          {/* Mandatory keyboard-accessible text alternative for the map's points. */}
          <details className="w-full rounded-card bg-surface p-5">
            <summary className="cursor-pointer text-label font-bold text-ink">
              {t('map.mapListLabel')}
            </summary>
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {pins.length === 0 ? (
                <li className="text-body-sm text-ink2">{t('map.noPoints')}</li>
              ) : (
                pins.map((pin) => (
                  <li key={`alt-${pin.id}`} className="text-body-sm text-ink">
                    {pin.label}
                    {pin.detail ? <span className="text-ink2"> — {pin.detail}</span> : null}
                  </li>
                ))
              )}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
