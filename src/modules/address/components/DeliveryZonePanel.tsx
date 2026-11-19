'use client';

/**
 * "Çatdırılma zonası" — `app-catdirilma-zonasi.html`, frame `rhKzd`, reached at
 * `/addresses?view=zones` (a URL state of the list route; ROUTES.md keeps the zone screen out of
 * the route registry).
 *
 * Layout from the export: header + city chips, then the split — the zone map (r36, zone blobs at
 * 13–20 % alpha with a 3px stroke, label pills, legend card, zoom controls) 1fr | the 400-wide
 * info column (address check, the zone's conditions, the city's zone list).
 *
 * **Data reality.** There is no zone endpoint anywhere in the API, and `zones` is `null` on every
 * live address row. Fees, minimums and ETAs are server data and are never hardcoded
 * (BUILD-CONTRACT rule 7) — so when `zones` is empty this panel renders the documented
 * "not available" state and only the map's illustration and the city chips remain. When a row does
 * carry zones, every figure shown comes from it.
 *
 * The keyboard-accessible text list of the zones is **mandatory** and is always rendered, not
 * hidden behind the illustration.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Chip, Input } from '@/shared/ui';
import { MapPlaceholder, type MapLegendItem, type MapPoint, type MapZone } from '@/shared/media';
import { EmptyState, InlineNotice } from '@/shared/states';
import { CircleCheck, MapPinOff, Search } from '@/shared/lucide';

import type { Address, AddressZone, ZoneTone } from '../data/models/address';
import type { City } from '../data/models/address';

/** The blob geometry of the three zones, measured from the canvas (x/y/w/h in % of the box). */
const ZONE_GEOMETRY: readonly { x: number; y: number; width: number; height: number; radius: number }[] = [
  { x: 17, y: 17, width: 54, height: 40, radius: 120 },
  { x: -6, y: 32, width: 63, height: 45, radius: 110 },
  { x: 43, y: 3, width: 57, height: 39, radius: 100 },
];

function toMapZones(zones: readonly AddressZone[], labelFor: (z: AddressZone) => string): MapZone[] {
  return zones.slice(0, 3).map((zone, index) => ({
    id: zone.id,
    label: labelFor(zone),
    tone: zone.tone,
    ...ZONE_GEOMETRY[index % ZONE_GEOMETRY.length],
  }));
}

const BAR_TONE: Record<ZoneTone, string> = {
  brand: 'bg-brand',
  sky: 'bg-sky',
  violet: 'bg-violet',
};

export interface DeliveryZonePanelProps {
  cities: readonly City[];
  cityId: number | null;
  onCityChange: (cityId: number) => void;
  /** The address whose `zones` drive the panel — normally the selected delivery address. */
  address: Address | null;
  citiesLoading?: boolean;
  className?: string;
}

export function DeliveryZonePanel({
  cities,
  cityId,
  onCityChange,
  address,
  citiesLoading = false,
  className,
}: DeliveryZonePanelProps) {
  const t = useTranslations('address');
  const { money } = useFormat();
  const [check, setCheck] = useState('');

  const zones = useMemo(() => address?.zones ?? [], [address?.zones]);
  const activeCity = cities.find((city) => city.id === cityId) ?? cities[0] ?? null;

  const mapZones = useMemo(
    () =>
      toMapZones(zones, (zone: AddressZone) =>
        zone.etaText ? `${zone.name} · ${zone.etaText}` : zone.name,
      ),
    [zones],
  );

  const hasPoint = address?.point != null;
  const addressId = address?.id ?? 0;
  const addressLine = address?.line ?? '';
  const points = useMemo<MapPoint[]>(() => {
    if (!hasPoint) return [];
    return [
      {
        id: `address-${addressId}`,
        label: addressLine || t('zones.yourAddress'),
        detail: t('zones.yourAddress'),
        kind: 'home',
        x: 42,
        y: 54,
      },
    ];
  }, [hasPoint, addressId, addressLine, t]);

  const legend = useMemo<MapLegendItem[]>(
    () =>
      zones.length === 0
        ? []
        : [
            { id: 'in', label: t('zones.legendIn'), tone: 'brand' },
            { id: 'out', label: t('zones.legendOut'), tone: 'ink' },
          ],
    [zones.length, t],
  );

  const current = zones.find((zone) => zone.contains) ?? zones[0] ?? null;
  const checkedZone = useMemo(() => {
    const needle = check.trim().toLocaleLowerCase('az-AZ');
    if (needle.length < 2) return null;
    return (
      zones.find((zone) =>
        zone.districts.some((district) => district.toLocaleLowerCase('az-AZ').includes(needle)),
      ) ?? null
    );
  }, [check, zones]);

  return (
    <div className={cn('flex w-full flex-col gap-8', className)}>
      {/* City chips */}
      <div role="group" aria-label={t('zones.cityLabel')} className="flex w-full flex-row gap-[10px] overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        {citiesLoading ? (
          <span className="text-label text-ink3">{t('zones.citiesLoading')}</span>
        ) : cities.length === 0 ? (
          <span className="text-label text-ink3">{t('zones.citiesUnavailable')}</span>
        ) : (
          cities.map((city) => (
            <Chip
              key={city.id}
              selected={activeCity?.id === city.id}
              aria-pressed={activeCity?.id === city.id}
              onClick={() => onCityChange(city.id)}
            >
              {city.name}
            </Chip>
          ))
        )}
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1">
          <MapPlaceholder
            label={t('zones.mapLabel', { city: activeCity?.name ?? '' })}
            zones={mapZones}
            points={points}
            legend={legend}
            pointListLabel={t('zones.mapListLabel')}
            height={560}
            zoom={{
              onZoomIn: undefined,
              onZoomOut: undefined,
              inLabel: t('picker.zoomIn'),
              outLabel: t('picker.zoomOut'),
            }}
          />
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[400px]">
          {/* Address check */}
          <section className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
            <h2 className="m-0 text-h4 font-extrabold text-ink">{t('zones.check.title')}</h2>
            <Input
              variant="pill"
              value={check}
              onChange={(event) => setCheck(event.target.value)}
              placeholder={t('zones.check.placeholder')}
              leadingIcon={<Search size={18} aria-hidden="true" className="text-ink3" />}
              aria-label={t('zones.check.title')}
            />
            {zones.length === 0 ? (
              <p className="m-0 text-caption text-ink3">{t('zones.check.unavailable')}</p>
            ) : checkedZone ? (
              <p className="m-0 flex flex-row items-center gap-2.5 rounded-md bg-success-soft px-3.5 py-3 text-label font-bold text-ink">
                <CircleCheck size={18} aria-hidden="true" className="shrink-0 text-success" />
                {t('zones.check.inZone', { query: check.trim(), zone: checkedZone.name })}
              </p>
            ) : check.trim().length >= 2 ? (
              <p className="m-0 flex flex-row items-center gap-2.5 rounded-md bg-brand-soft px-3.5 py-3 text-label font-bold text-ink">
                <MapPinOff size={18} aria-hidden="true" className="shrink-0 text-brand" />
                {t('zones.check.outOfZone', { query: check.trim() })}
              </p>
            ) : null}
          </section>

          {/* The zone's conditions — only ever server values. */}
          {current ? (
            <section className="flex w-full flex-col gap-4 rounded-xl bg-block p-6">
              <p className="m-0 text-caption font-bold text-yellow">
                {t('zones.fees.title', { zone: current.name })}
              </p>
              {current.deliveryFee !== null ? (
                <div className="flex w-full flex-row items-center justify-between gap-3">
                  <span className="text-body-sm text-on-block/75">{t('zones.fees.delivery')}</span>
                  <span className="text-[22px] font-extrabold text-on-block">
                    {money(current.deliveryFee)}
                  </span>
                </div>
              ) : null}
              {current.minOrder !== null ? (
                <div className="flex w-full flex-row items-center justify-between gap-3 pt-3.5">
                  <span className="text-body-sm text-on-block/75">{t('zones.fees.minOrder')}</span>
                  <span className="text-body-l font-extrabold text-on-block">
                    {money(current.minOrder)}
                  </span>
                </div>
              ) : null}
              {current.freeDeliveryFrom !== null ? (
                <div className="flex w-full flex-row items-center justify-between gap-3 pt-3.5">
                  <span className="text-body-sm text-on-block/75">{t('zones.fees.free')}</span>
                  <span className="text-body-l font-extrabold text-on-block">
                    {t('zones.fees.freeFrom', { amount: money(current.freeDeliveryFrom) })}
                  </span>
                </div>
              ) : null}
              {current.deliveryFee === null &&
              current.minOrder === null &&
              current.freeDeliveryFrom === null ? (
                <p className="m-0 text-label text-on-block/75">{t('zones.fees.unavailable')}</p>
              ) : null}
            </section>
          ) : null}

          {/* Zone list — the mandatory text alternative, always rendered. */}
          <section className="flex w-full flex-col gap-1.5 rounded-xl bg-surface p-6">
            <h2 className="m-0 text-body-l font-extrabold text-ink">
              {t('zones.list.title', { city: activeCity?.name ?? '' })}
            </h2>
            {zones.length === 0 ? (
              <EmptyState
                compact
                icon={MapPinOff}
                titleAs="p"
                title={t('zones.list.emptyTitle')}
                body={t('zones.list.emptyBody')}
                className="py-6"
              />
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {zones.map((zone) => (
                  <li key={zone.id} className="flex w-full flex-row items-center gap-[14px] pt-3.5">
                    <span
                      aria-hidden="true"
                      className={cn('h-11 w-3 shrink-0 rounded-xs', BAR_TONE[zone.tone])}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-body-sm font-bold text-ink">{zone.name}</span>
                      {zone.districts.length > 0 ? (
                        <span className="text-micro text-ink2">{zone.districts.join(', ')}</span>
                      ) : null}
                    </span>
                    {zone.etaText ? (
                      <span className="shrink-0 text-caption font-bold text-ink">{zone.etaText}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {zones.length === 0 ? (
            <InlineNotice tone="info" icon={MapPinOff} body={t('zones.gapNote')} multiline />
          ) : null}

          {address === null ? (
            <p className="m-0 text-caption text-ink3">
              {t('zones.noAddressHint')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
