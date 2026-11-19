'use client';

/**
 * PR3 · "Filiallar" — `/market/partners/[id]/branches`.
 *
 * **This screen is a list, not a map.** Audited on 2026-11-12 across all 197 live branches of all
 * brands: 191 have `lat = lng = null`, 3 carry the junk pair `"1"`/`"1"`, and of the rest two
 * repeat a delivery point byte-for-byte. So the usable content of a branch row is its address
 * text, hours and phone — the map block is only drawn for the handful of branches that really do
 * carry a point, and every branch without one says so in its own row.
 */
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { useSelectedAddress } from '@/modules/address';
import { Breadcrumbs, Button } from '@/shared/ui';
import { MapPlaceholder, type MapPoint } from '@/shared/media';
import { EmptyState, ErrorState, InlineNotice } from '@/shared/states';
import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';
import { MapPinOff, Store } from '@/shared/lucide';

import { BranchRow } from '../components/BranchRow';
import { useBranches, usePartnerBrand } from '../hooks';
import { isOpenAt, type Branch } from '../data/models/partner';
import { haversineMeters, samePoint } from '../lib/geo';

/** Minutes since midnight in Baku — branch hours are Baku wall-clock, read literally. */
function bakuNowMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Baku',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  return (
    Number(parts.find((p) => p.type === 'hour')?.value ?? '0') * 60 +
    Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  );
}

/**
 * Lay the few mappable branches out inside the illustrative map box. The box is a schematic, so
 * the positions are a normalised spread of the real points, not a projection.
 */
function toPins(branches: readonly Branch[]): MapPoint[] {
  const points = branches.filter((b): b is Branch & { point: { lat: number; lng: number } } => b.point !== null);
  if (points.length === 0) return [];
  const lats = points.map((b) => b.point.lat);
  const lngs = points.map((b) => b.point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const span = (value: number, min: number, max: number): number =>
    max - min < 1e-6 ? 50 : 12 + ((value - min) / (max - min)) * 76;

  return points.map((branch) => ({
    id: branch.id,
    label: branch.name,
    detail: branch.address ?? undefined,
    kind: 'store' as const,
    x: span(branch.point.lng, minLng, maxLng),
    // screen y grows downward, latitude grows upward
    y: 100 - span(branch.point.lat, minLat, maxLat),
  }));
}

export interface PartnerBranchesViewProps {
  brandId: string;
  /** `?category=` from the link, so the brand resolves in one request. */
  categoryId?: string | null;
}

export function PartnerBranchesView({ brandId, categoryId = null }: PartnerBranchesViewProps) {
  const t = useTranslations('partners');
  const failureMessage = useFailureMessage();
  const { number } = useFormat();
  const selected = useSelectedAddress();

  const resolution = usePartnerBrand(brandId, categoryId);
  const branchesQuery = useBranches(brandId);
  const brand = resolution.data?.brand ?? null;
  const branchesData = branchesQuery.data;
  const branches = useMemo(() => branchesData ?? [], [branchesData]);
  const nowMinutes = useMemo(() => bakuNowMinutes(), []);

  const mappable = useMemo(() => {
    const withPoint = branches.filter((b) => b.point !== null);
    // Drop a point that is byte-identical to another branch's: on live those are placeholders
    // copied from a delivery store, not two branches at one spot.
    return withPoint.filter(
      (branch, index) =>
        withPoint.findIndex((other) => other.point && branch.point && samePoint(other.point, branch.point)) === index,
    );
  }, [branches]);

  const pins = useMemo(() => toPins(mappable), [mappable]);

  /**
   * Distances need a reference point: the selected delivery address (or the city fallback it
   * exposes). `distanceMeters` exists only on the **address list**, and a branch rarely has
   * coordinates, so a distance is shown for exactly those pairs where both sides have a real
   * point; everything else simply has no distance.
   */
  const reference = selected.point;

  const title = brand?.name ?? t('branches.title');

  return (
    <div className="flex w-full flex-col gap-8">
      <Breadcrumbs
        label={t('detail.breadcrumbLabel')}
        items={[
          { label: t('title'), href: paths.marketPartners },
          ...(brand ? [{ label: brand.name, href: paths.marketPartner(brand.id) }] : []),
          { label: t('branches.title') },
        ]}
      />

      <header className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.03em] text-ink lg:text-h1-app">
            {title}
          </h1>
          <p className="m-0 text-body text-ink2">
            {t('branches.subtitle', {
              count: number(brand?.branchCount || branches.length),
              mapped: number(mappable.length),
            })}
          </p>
        </div>
        {brand ? (
          <Button as="a" href={paths.marketPartnersMap} variant="soft" size="lg">
            {t('branches.openMap')}
          </Button>
        ) : null}
      </header>

      {branchesQuery.isPending ? (
        <Shimmer label={t('loading')} className="flex w-full flex-col gap-4">
          <Bone w="100%" h={260} r="xl" />
          {[0, 1, 2, 3, 4].map((i) => (
            <BoneCard key={i} r="card" pad={14} gap={14} row>
              <Bone w={44} h={44} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Bone w="45%" h={16} r="sm" />
                <Bone w="70%" h={13} r="xs" />
              </div>
              <Bone w={84} h={26} r="pill" />
            </BoneCard>
          ))}
        </Shimmer>
      ) : branchesQuery.isError ? (
        <ErrorState
          failure={branchesQuery.error}
          title={t('error.title')}
          message={failureMessage(branchesQuery.error)}
          onRetry={() => branchesQuery.refetch()}
          retryLabel={t('error.retry')}
        />
      ) : branches.length === 0 ? (
        <EmptyState
          icon={Store}
          tone="brand"
          panel
          title={t('detail.branches.emptyTitle')}
          body={t('detail.branches.emptyBody')}
          action={
            <Button as="a" href={paths.marketPartners} size="lg">
              {t('detail.backToList')}
            </Button>
          }
        />
      ) : (
        <>
          {pins.length > 0 ? (
            <MapPlaceholder
              label={t('branches.mapLabel', { partner: title })}
              points={pins}
              pointListLabel={t('branches.mapListLabel')}
              showPointList
              height={320}
            />
          ) : (
            <InlineNotice
              tone="warning"
              icon={MapPinOff}
              title={t('detail.branches.noMapTitle')}
              body={t('detail.branches.noMapBody')}
              multiline
            />
          )}

          <ul className="m-0 flex w-full list-none flex-col gap-3 p-0">
            {branches.map((branch) => (
              <BranchRow
                key={branch.id}
                branch={branch}
                brandName={title}
                variant="card"
                openNow={isOpenAt(branch, nowMinutes)}
                distanceMeters={
                  reference && branch.point ? haversineMeters(reference, branch.point) : null
                }
              />
            ))}
          </ul>

          {selected.isFallback ? (
            <p className="m-0 text-caption text-ink3">{t('branches.distanceHint')}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
