/**
 * The illustrative map block (components.md §8 "Map block", zone map `cDVFS` /
 * `xrRRc`, measured in `html/app-places/app-catdirilma-zonasi.html`).
 *
 * `rounded-bento` (36) container on `sky-soft`, CSS-drawn roads (`surface`,
 * r13), a park (`success-soft`) and water (`sky` at 35 %), zone overlays at
 * 13–20 % alpha with a 3 px stroke, zone label pills, pins (store = 56 circle
 * `ink` + 5 px white ring, home = 44 circle `brand` + 4 px white ring), a
 * legend card and vertical zoom controls (56x104).
 *
 * Production swaps the illustration for a real map SDK with these overlay
 * styles; the container radius clips either way. The **keyboard-accessible text
 * alternative list of the points is mandatory** (components.md §8,
 * architecture/07 §Accessibility) — it is rendered here, not optional.
 *
 * Partners / addresses / tracking all reuse this via `points`/`zones`/`legend`.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { MapPin as MapPinIcon, Minus, Plus, Store, type LucideIcon } from '@/shared/lucide';

import { OsmTiles } from './osm-tiles';

export type MapTone = 'brand' | 'sky' | 'violet' | 'success' | 'ink';

export interface MapZone {
  id: string;
  /** Zone name shown in the label pill, e.g. "Mərkəzi zona". */
  label: string;
  tone: MapTone;
  /** Blob geometry in % of the map box. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Corner radius in px (the canvas uses 100–120). */
  radius?: number;
  /** Label pill position in % (defaults to the blob centre). */
  labelX?: number;
  labelY?: number;
}

export interface MapPoint {
  id: string;
  /** Announced name — "Ozio Market, Nərimanov". */
  label: string;
  /** Second line in the text alternative (eta, address, …). */
  detail?: string;
  kind?: 'store' | 'home' | 'courier';
  /** Position in % of the map box. */
  x: number;
  y: number;
  icon?: LucideIcon;
}

export interface MapLegendItem {
  id: string;
  label: string;
  tone: MapTone;
}

export interface MapPlaceholderProps {
  /** Accessible name of the map region (translated by the caller). */
  label: string;
  points?: MapPoint[];
  zones?: MapZone[];
  legend?: MapLegendItem[];
  /** Heading for the text-alternative list (translated by the caller). */
  pointListLabel?: string;
  /** `true` renders the alternative list visibly under the map. */
  showPointList?: boolean;
  /** Pins become buttons when this is given. */
  onPointSelect?: (id: string) => void;
  /** Vertical zoom control; omitted → no control is drawn. */
  zoom?: {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    inLabel: string;
    outLabel: string;
  };
  /**
   * Draw a REAL map underneath instead of the CSS roads.
   *
   * Everything on top — zone blobs, pins, legend, the text alternative — is positioned in % of
   * the box and does not care what is behind it, so passing a centre is the whole change needed
   * to turn any of these screens from an illustration into an actual map. Tiles come from
   * OpenStreetMap: free, no key, no account (see `<OsmTiles>`).
   */
  center?: { lat: number; lng: number } | null;
  /** Slippy-map zoom for `center`. 12 ≈ the whole city, 15 ≈ a few streets. */
  mapZoom?: number;
  /** Map box height. Default 760 (the desktop zone map), min 320. */
  height?: number | string;
  /** Extra overlays (address-check chip, courier card, …). */
  children?: ReactNode;
  className?: string;
}

const ZONE_FILL: Record<MapTone, string> = {
  brand: 'bg-brand/20 border-brand',
  sky: 'bg-sky/15 border-sky',
  violet: 'bg-violet/15 border-violet',
  success: 'bg-success/15 border-success',
  ink: 'bg-ink/15 border-ink',
};

const DOT_FILL: Record<MapTone, string> = {
  brand: 'bg-brand',
  sky: 'bg-sky',
  violet: 'bg-violet',
  success: 'bg-success',
  ink: 'bg-ink',
};

/** Decorative roads, straight from the canvas (left/top/size in px, clipped). */
const ROADS = [
  { top: 150, left: -50, width: 1000, height: 20, rotate: 9 },
  { top: 420, left: -50, width: 1000, height: 28, rotate: -6 },
  { top: 620, left: -50, width: 1000, height: 16, rotate: 3 },
  { top: -50, left: 140, width: 18, height: 1000, rotate: 0 },
  { top: -50, left: 400, width: 26, height: 1000, rotate: -7 },
  { top: -50, left: 560, width: 16, height: 1000, rotate: 5 },
] as const;

export function MapPlaceholder({
  label,
  points = [],
  zones = [],
  legend = [],
  pointListLabel,
  showPointList = false,
  onPointSelect,
  zoom,
  center = null,
  mapZoom = 13,
  height = 760,
  children,
  className,
}: MapPlaceholderProps) {
  const listId = `map-points-${points.length}-${zones.length}`;

  // The tile grid needs pixel dimensions. `height` is a number on every caller that passes a
  // centre; a CSS string falls back to the illustration rather than guessing a size.
  const boxHeight = typeof height === 'number' ? height : null;
  const showTiles = center !== null && boxHeight !== null;

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <div
        role="group"
        aria-label={label}
        aria-describedby={listId}
        className="relative w-full min-h-[320px] overflow-hidden rounded-bento bg-sky-soft"
        style={{ height }}
      >
        {showTiles ? (
          <OsmTiles
            lat={center.lat}
            lng={center.lng}
            zoom={mapZoom}
            /* 1600 covers the widest box this is used in; the grid is clipped by the container,
               and a tile outside the viewport is never requested thanks to `loading="lazy"`. */
            width={1600}
            height={boxHeight}
          />
        ) : null}

        {/* roads — the illustration, drawn only when there is no real map behind */}
        {showTiles
          ? null
          : ROADS.map((road, index) => (
          <div
            key={`road-${index}`}
            aria-hidden="true"
            className="absolute rounded-[13px] bg-surface"
            style={{
              top: road.top,
              left: road.left,
              width: road.width,
              height: road.height,
              transformOrigin: 'top left',
              transform: road.rotate ? `rotate(${road.rotate}deg)` : undefined,
            }}
          />
        ))}

        {/* park + water — illustration only, for the same reason as the roads */}
        {showTiles ? null : (
          <>
            <div
              aria-hidden="true"
              className="absolute rounded-[40px] bg-success-soft"
              style={{ left: 180, top: 480, width: 180, height: 120 }}
            />
            <div
              aria-hidden="true"
              className="absolute rounded-[60px] bg-sky opacity-35"
              style={{ left: 430, top: 640, width: 300, height: 160 }}
            />
          </>
        )}

        {/* zone overlays */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            aria-hidden="true"
            className={cn('absolute border-[3px]', ZONE_FILL[zone.tone])}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
              borderRadius: zone.radius ?? 100,
            }}
          />
        ))}

        {/* zone label pills */}
        {zones.map((zone) => (
          <div
            key={`${zone.id}-label`}
            aria-hidden="true"
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-pill bg-surface px-[14px] py-2"
            style={{
              left: `${zone.labelX ?? zone.x + zone.width / 2}%`,
              top: `${zone.labelY ?? zone.y + zone.height / 2}%`,
            }}
          >
            <span className={cn('size-[10px] rounded-pill', DOT_FILL[zone.tone])} />
            <span className="text-caption font-bold text-ink">{zone.label}</span>
          </div>
        ))}

        {/* pins — real buttons so they are keyboard reachable */}
        {points.map((pin) => {
          const home = pin.kind === 'home';
          const Icon = pin.icon ?? (home ? MapPinIcon : Store);
          return (
            <button
              key={pin.id}
              type="button"
              onClick={onPointSelect ? () => onPointSelect(pin.id) : undefined}
              aria-label={pin.detail ? `${pin.label} — ${pin.detail}` : pin.label}
              className={cn(
                'absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill',
                'transition-transform duration-[var(--oz-dur-fast)] active:scale-[.97]',
                home ? 'size-11 bg-brand' : 'size-14 bg-ink',
              )}
              style={{
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                // the canvas draws the ring inside the circle (5 px store / 4 px home)
                boxShadow: `inset 0 0 0 ${home ? 4 : 5}px var(--oz-white)`,
              }}
            >
              <Icon
                size={home ? 20 : 22}
                className={home ? 'text-white' : 'text-bg'}
                aria-hidden="true"
              />
            </button>
          );
        })}

        {/* legend card */}
        {legend.length > 0 ? (
          <div className="absolute left-6 top-6 flex items-center gap-4 rounded-lg bg-surface px-4 py-3">
            {legend.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <span className={cn('size-[10px] rounded-pill', DOT_FILL[item.tone])} />
                <span className="text-caption font-semibold text-ink2">{item.label}</span>
              </span>
            ))}
          </div>
        ) : null}

        {/* vertical zoom control 56x104 */}
        {zoom ? (
          <div className="absolute bottom-6 right-6 flex h-[104px] w-14 flex-col overflow-hidden rounded-lg bg-surface">
            <button
              type="button"
              onClick={zoom.onZoomIn}
              aria-label={zoom.inLabel}
              className="grid h-[52px] w-full place-items-center text-ink hover:bg-surface2"
            >
              <Plus size={20} aria-hidden="true" />
            </button>
            <span className="mx-auto h-px w-8 bg-line" aria-hidden="true" />
            <button
              type="button"
              onClick={zoom.onZoomOut}
              aria-label={zoom.outLabel}
              className="grid h-[52px] w-full place-items-center text-ink hover:bg-surface2"
            >
              <Minus size={20} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {children}
      </div>

      {/* text alternative — mandatory, keyboard reachable */}
      <div id={listId} className={showPointList ? undefined : 'sr-only'}>
        {pointListLabel ? (
          <p className="m-0 mb-2 text-label font-bold text-ink2">{pointListLabel}</p>
        ) : null}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {zones.map((zone) => (
            <li key={`alt-${zone.id}`} className="text-body-sm text-ink2">
              {zone.label}
            </li>
          ))}
          {points.map((pin) => (
            <li key={`alt-${pin.id}`} className="text-body-sm text-ink">
              {pin.label}
              {pin.detail ? <span className="text-ink2"> — {pin.detail}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
