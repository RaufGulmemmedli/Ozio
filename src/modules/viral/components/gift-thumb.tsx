'use client';

/**
 * The product thumbnail used by the wishlist cards, the create form's picks and the auction cards.
 *
 * TODO(store): when `@/modules/store` (agent M3) exports them, this should become
 * `import { ProductCard, ProductImage } from '@/modules/store'` so a gift renders exactly like a
 * catalogue product. Today the module exports nothing (`src/modules/store/index.ts` is empty), and
 * the demo's gifts have no catalogue row or CDN image at all, so the drawn fallback tile is what
 * ships: `<ProductImage>` from `@/shared/media` is the same component the store's card uses for
 * its fallback, and the glyph map below matches the icons the export draws.
 */
import { cn } from '@/core/lib/cn';
import { Bike, Coffee, Headphones, Smartphone, type LucideIcon } from '@/shared/lucide';

import { Bot, CookingPot, Tv, Watch } from './icons';

const ICONS: Record<string, LucideIcon> = {
  bike: Bike,
  smartphone: Smartphone,
  headphones: Headphones,
  bot: Bot,
  coffee: Coffee,
  tv: Tv,
  watch: Watch,
  pot: CookingPot,
};

export type GiftThumbTone = 'surface2' | 'white' | 'onBlock';

const TONE: Record<GiftThumbTone, string> = {
  surface2: 'bg-surface2 text-ink2',
  white: 'bg-surface text-ink',
  onBlock: 'bg-white/10 text-on-block',
};

export interface GiftThumbProps {
  /** The icon slug the mock sends (`bike`, `tv`, …). */
  icon: string;
  /** Tile side in px. */
  size?: number;
  /** Glyph size in px; defaults to 40 % of the tile. */
  iconSize?: number;
  tone?: GiftThumbTone;
  /** Radius class, e.g. `rounded-card`. */
  radiusClassName?: string;
  className?: string;
}

export function GiftThumb({
  icon,
  size = 80,
  iconSize,
  tone = 'surface2',
  radiusClassName = 'rounded-card',
  className,
}: GiftThumbProps) {
  const Icon = ICONS[icon] ?? Bike;

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        'flex shrink-0 items-center justify-center',
        radiusClassName,
        TONE[tone],
        className,
      )}
    >
      <Icon size={iconSize ?? Math.round(size * 0.4)} />
    </span>
  );
}
