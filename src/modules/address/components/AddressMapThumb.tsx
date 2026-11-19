import { cn } from '@/core/lib/cn';
import { MapPin } from '@/shared/lucide';
import { OsmTiles } from '@/shared/media';

export interface AddressMapThumbProps {
  /** Announced name — the address line. Pass `''` for a purely decorative thumb. */
  label: string;
  /** `false` draws the same box without a pin (the address has no coordinates). */
  hasPoint?: boolean;
  /**
   * The address's real coordinates. Given one, the thumb shows that actual place from
   * OpenStreetMap instead of the drawn roads — every saved address then looks like where it is.
   * Addresses the API has no coordinates for keep the illustration.
   */
  point?: { lat: number; lng: number } | null;
  /** Height in px. 110 on the address card (measured), 424 on the empty-state illustration. */
  height?: number;
  className?: string;
}

/**
 * The small illustrative map square on an address card (`Map Thumb`, `app-unvanlarim.html`):
 * `sky-soft`, radius 20, 110 high, CSS-drawn roads (`surface`, r8), a `success-soft` park and a
 * 40px `ink` pin with a 4px white ring.
 *
 * It is **decorative** — `aria-hidden`, because the address line next to it is the real content.
 * `<MapPlaceholder>` is the keyboard-accessible block used where a map is the content itself; this
 * one is 110px tall and carries no points, so it stays out of the accessibility tree.
 */
/** The tiles are centred on the address, so the pin belongs in the middle of the box. */
const PIN_CENTRED = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } as const;

export function AddressMapThumb({
  label,
  hasPoint = true,
  point = null,
  height = 110,
  className,
}: AddressMapThumbProps) {
  // A real place beats a drawing, but only where the API actually gave coordinates.
  const real = point !== null;

  return (
    <div
      aria-hidden="true"
      data-address={label || undefined}
      className={cn('relative w-full overflow-hidden rounded-lg bg-sky-soft', className)}
      style={{ height }}
    >
      {real ? (
        <OsmTiles lat={point.lat} lng={point.lng} zoom={15} width={420} height={height} />
      ) : null}

      <span
        className={cn('absolute rounded-[8px] bg-surface', real && 'hidden')}
        style={{
          left: -20,
          top: height * 0.35,
          width: 700,
          height: 12,
          transformOrigin: 'top left',
          transform: 'rotate(6deg)',
        }}
      />
      <span
        className={cn('absolute rounded-[8px] bg-surface', real && 'hidden')}
        style={{
          left: 140,
          top: -20,
          width: 12,
          height: height + 90,
          transformOrigin: 'top left',
          transform: 'rotate(-8deg)',
        }}
      />
      <span
        className={cn('absolute rounded-[8px] bg-surface', real && 'hidden')}
        style={{ left: 300, top: -20, width: 16, height: height + 90 }}
      />
      <span
        className={cn('absolute rounded-lg bg-success-soft', real && 'hidden')}
        style={{ left: 170, top: height * 0.55, width: 100, height: 44 }}
      />
      {hasPoint ? (
        <span
          className="absolute grid size-10 place-items-center rounded-pill bg-ink"
          style={{ ...(real ? PIN_CENTRED : { left: 96, top: height * 0.23 }), boxShadow: 'inset 0 0 0 4px var(--oz-white)' }}
        >
          <MapPin size={18} className="text-bg" />
        </span>
      ) : null}
    </div>
  );
}
