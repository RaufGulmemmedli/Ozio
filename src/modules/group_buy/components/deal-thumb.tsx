import { ProductImage } from '@/shared/media';

/**
 * The product tile on every group_buy surface.
 *
 * Group deals are bulk packs with no catalog photo in the demo, so this is `<ProductImage>` with
 * no `src`: its `surface2` tile + category glyph is exactly what the export draws.
 *
 * TODO(shared): `categoryIcon()` in `@/shared/media` has no `wheat`, `droplet` or `sparkles` slug
 * (the four `iconKey`s this module's fixtures use), so they are mapped onto the nearest slugs that
 * do exist rather than adding entries to shared code.
 */
const ICON_KEY_TO_CATEGORY: Record<string, string> = {
  wheat: 'bakery',
  droplet: 'milk',
  sparkles: 'cleaning',
  baby: 'baby',
};

export interface DealThumbProps {
  iconKey: string;
  /** Product title, for the screen-reader text inside the tile. Pass `''` when decorative. */
  alt: string;
  /** Tile edge in px — 180 (GB2 hero), 96 (GB1 card), 64 (GB4 dialog), 56 (GB3 pick). */
  size: number;
  radius?: 'inner' | 'card' | 'xl' | 'lg';
  /** The export paints the small tiles on `white` inside tinted cards. */
  tone?: 'surface2' | 'white';
  className?: string;
}

export function DealThumb({
  iconKey,
  alt,
  size,
  radius = 'card',
  tone = 'surface2',
  className,
}: DealThumbProps) {
  return (
    <div style={{ width: size, flex: `0 0 ${size}px` }} className={className}>
      <ProductImage
        src={null}
        alt={alt}
        category={ICON_KEY_TO_CATEGORY[iconKey] ?? iconKey}
        ratio="1/1"
        radius={radius}
        fallbackIconSize={Math.round(size * 0.42)}
        className={tone === 'white' ? 'bg-white' : undefined}
      />
    </div>
  );
}
