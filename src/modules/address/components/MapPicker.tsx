'use client';

/**
 * The pin-drop map (`Map Picker`, `app-yeni-unvan.html` / `app-unvan-zona-xaricinde.html`):
 * `<MapPlaceholder>` at r36 with the search pill (56 high, 440 wide) and the locate button on top,
 * the centred 64px pin with its 5px white ring, the pin tooltip ("Çatdırılma mümkündür" /
 * "Zonadan kənardır") and the zoom controls.
 *
 * **The map is real; the geocoder is not.** The box now draws OpenStreetMap tiles behind the
 * overlays (free, no key, no account — see `<OsmTiles>`), so the visitor is looking at actual
 * streets. The pin is still moved by clicking the box, and the address text under the search pill
 * still comes from the stubbed, MSW-backed `reverseGeocode` — which is why the screens using this
 * keep `<DemoBanner module="address"/>`.
 *
 * Dragging and wheel-zoom would mean swapping `<OsmTiles>` for a mapping library; nothing above
 * this component changes either way.
 */
import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { LocateFixed, MapPin, MapPinOff, Search } from '@/shared/lucide';
import { MapPlaceholder } from '@/shared/media';

import type { LatLng } from '../data/models/address';

/** How far the box's edges reach around the centre point, in degrees (~5 km at Baku's latitude). */
const SPAN = { lat: 0.045, lng: 0.06 } as const;

export interface MapPickerProps {
  /** The current pin. */
  point: LatLng | null;
  /** The centre the box is drawn around — the city point, so a click maps to a plausible place. */
  center: LatLng;
  onPointChange: (point: LatLng) => void;
  /** The reverse-geocoded line under the search pill; `null` while it is loading or unknown. */
  caption: string | null;
  captionLoading?: boolean;
  /** `null` = unknown (no zone data), `true` = deliverable, `false` = out of zone. */
  inZone: boolean | null;
  onSearchClick?: () => void;
  onLocateClick?: () => void;
  height?: number;
  className?: string;
}

export function MapPicker({
  point,
  center,
  onPointChange,
  caption,
  captionLoading = false,
  inZone,
  onSearchClick,
  onLocateClick,
  height = 640,
  className,
}: MapPickerProps) {
  const t = useTranslations('address');
  const boxRef = useRef<HTMLDivElement>(null);

  const movePin = useCallback(
    (clientX: number, clientY: number) => {
      const box = boxRef.current?.getBoundingClientRect();
      if (!box || box.width === 0 || box.height === 0) return;
      const fx = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
      const fy = Math.min(1, Math.max(0, (clientY - box.top) / box.height));
      onPointChange({
        lat: Number((center.lat + (0.5 - fy) * SPAN.lat).toFixed(6)),
        lng: Number((center.lng + (fx - 0.5) * SPAN.lng).toFixed(6)),
      });
    },
    [center.lat, center.lng, onPointChange],
  );

  const nudge = useCallback(
    (dLat: number, dLng: number) => {
      const base = point ?? center;
      onPointChange({
        lat: Number((base.lat + dLat).toFixed(6)),
        lng: Number((base.lng + dLng).toFixed(6)),
      });
    },
    [point, center, onPointChange],
  );

  const pinX = point ? 50 + ((point.lng - center.lng) / SPAN.lng) * 100 : 50;
  const pinY = point ? 50 - ((point.lat - center.lat) / SPAN.lat) * 100 : 50;

  return (
    <div ref={boxRef} className={cn('relative w-full', className)}>
      <MapPlaceholder
        label={t('picker.mapLabel')}
        height={height}
        // Real streets behind the pin — OpenStreetMap tiles, free and keyless. `SPAN` covers
        // ~5 km around the centre, which is roughly what zoom 13 shows, so a click still lands
        // where the pin is drawn.
        center={center}
        mapZoom={13}
        points={
          point
            ? [
                {
                  id: 'pin',
                  label: caption ?? t('picker.unknownAddress'),
                  detail: t('picker.pinDetail', {
                    lat: point.lat.toFixed(5),
                    lng: point.lng.toFixed(5),
                  }),
                  kind: 'home',
                  x: Math.min(96, Math.max(4, pinX)),
                  y: Math.min(96, Math.max(4, pinY)),
                },
              ]
            : []
        }
        pointListLabel={t('picker.pointListLabel')}
        zoom={{
          onZoomIn: () => nudge(0, 0),
          onZoomOut: () => nudge(0, 0),
          inLabel: t('picker.zoomIn'),
          outLabel: t('picker.zoomOut'),
        }}
      >
        {/* The click surface. A real SDK canvas replaces this layer. */}
        <button
          type="button"
          aria-label={t('picker.dropPin')}
          onClick={(event) => movePin(event.clientX, event.clientY)}
          onKeyDown={(event) => {
            const step = 0.002;
            if (event.key === 'ArrowUp') nudge(step, 0);
            else if (event.key === 'ArrowDown') nudge(-step, 0);
            else if (event.key === 'ArrowLeft') nudge(0, -step);
            else if (event.key === 'ArrowRight') nudge(0, step);
            else return;
            event.preventDefault();
          }}
          className="absolute inset-0 cursor-crosshair bg-transparent"
        />

        {/* Search pill + locate */}
        <div className="pointer-events-none absolute inset-x-6 top-6 flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={onSearchClick}
            className="pointer-events-auto flex h-14 min-w-0 flex-1 flex-row items-center gap-3 rounded-pill bg-surface px-5 text-left md:max-w-[440px]"
          >
            <Search size={20} aria-hidden="true" className="shrink-0 text-ink3" />
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-body-sm font-semibold',
                caption ? 'text-ink' : 'text-ink3',
              )}
            >
              {captionLoading ? t('picker.locating') : (caption ?? t('picker.searchPlaceholder'))}
            </span>
          </button>
          <button
            type="button"
            onClick={onLocateClick}
            aria-label={t('picker.locate')}
            className="pointer-events-auto grid size-14 shrink-0 place-items-center rounded-pill bg-surface text-ink"
          >
            <LocateFixed size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Pin tooltip */}
        {point && inZone !== null ? (
          <span
            className="pointer-events-none absolute flex -translate-x-1/2 flex-row items-center gap-2 rounded-pill bg-surface px-4 py-2.5 text-caption font-bold text-ink"
            style={{
              left: `${Math.min(92, Math.max(8, pinX))}%`,
              top: `calc(${Math.min(92, Math.max(8, pinY))}% - 54px)`,
            }}
          >
            {inZone ? (
              <MapPin size={16} aria-hidden="true" className="text-success" />
            ) : (
              <MapPinOff size={16} aria-hidden="true" className="text-brand" />
            )}
            {inZone ? t('picker.inZone') : t('picker.outOfZone')}
          </span>
        ) : null}
      </MapPlaceholder>
    </div>
  );
}
