'use client';

/**
 * `<OsmTiles>` — a real map background, drawn from OpenStreetMap raster tiles.
 *
 * No SDK, no account, no key, no bill: OSM's standard tile layer is openly available, so this is
 * a grid of `<img>` tiles positioned by the standard slippy-map formula. That is the whole map —
 * about forty lines instead of a 150 kB mapping library, which matters because this sits behind a
 * component used on ten screens.
 *
 * What it is NOT: it does not pan or wheel-zoom on its own. The surrounding `<MapPlaceholder>`
 * owns the interaction it needs (its zoom buttons change `zoom`, the address picker turns a click
 * into a point), and everything drawn on top — zone blobs, pins, legend — stays exactly where it
 * was. If this app ever needs dragging and rotation, this is the one file Leaflet or MapLibre
 * would replace.
 *
 * Attribution is required by the OSM tile usage policy and is rendered, not optional.
 */

import { useMemo } from 'react';

import { cn } from '@/core/lib/cn';

/** OSM serves 256 px tiles. */
const TILE = 256;

/** How far past the visible box to draw, so a half tile never shows as a gap. */
const OVERDRAW = 1;

export interface OsmTilesProps {
  lat: number;
  lng: number;
  /** Slippy-map zoom: 11 ≈ a city, 15 ≈ a few streets, 18 ≈ a building. */
  zoom?: number;
  /** Box size in CSS px — needed to work out how many tiles to lay down. */
  width: number;
  height: number;
  className?: string;
}

/** Web-Mercator: world pixel coordinates at this zoom. */
function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

export function OsmTiles({ lat, lng, zoom = 13, width, height, className }: OsmTilesProps) {
  const tiles = useMemo(() => {
    if (width <= 0 || height <= 0) return [];

    const z = Math.min(19, Math.max(1, Math.round(zoom)));
    const count = 2 ** z;
    const centre = project(lat, lng, z);

    // Where the top-left corner of the box falls in world pixels.
    const originX = centre.x - width / 2;
    const originY = centre.y - height / 2;

    const firstCol = Math.floor(originX / TILE) - OVERDRAW;
    const firstRow = Math.floor(originY / TILE) - OVERDRAW;
    const cols = Math.ceil(width / TILE) + OVERDRAW * 2 + 1;
    const rows = Math.ceil(height / TILE) + OVERDRAW * 2 + 1;

    const out: { key: string; src: string; left: number; top: number }[] = [];
    for (let row = firstRow; row < firstRow + rows; row += 1) {
      // Above the north pole / below the south pole there is no tile to ask for.
      if (row < 0 || row >= count) continue;
      for (let col = firstCol; col < firstCol + cols; col += 1) {
        // Longitude wraps, so a column either side of the date line is a real tile.
        const wrapped = ((col % count) + count) % count;
        out.push({
          key: `${z}/${col}/${row}`,
          src: `https://tile.openstreetmap.org/${z}/${wrapped}/${row}.png`,
          left: col * TILE - originX,
          top: row * TILE - originY,
        });
      }
    }
    return out;
  }, [lat, lng, zoom, width, height]);

  return (
    <div aria-hidden="true" className={cn('absolute inset-0 overflow-hidden', className)}>
      {tiles.map((tile) => (
        // A tile server is not an image to optimize: `next/image` would route every one of the
        // dozens of 256px PNGs through the optimizer, for no gain and at a per-request cost.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          width={TILE}
          height={TILE}
          loading="lazy"
          decoding="async"
          className="absolute max-w-none select-none"
          style={{ left: tile.left, top: tile.top }}
        />
      ))}

      {/* Required by the OSM tile usage policy. */}
      <span className="absolute bottom-1 end-1 rounded-sm bg-white/80 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-ink2">
        © OpenStreetMap
      </span>
    </div>
  );
}
