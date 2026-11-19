'use client';

/**
 * The only way a product / store / partner photo is rendered.
 *
 * Rules from design-system/assets.md §Imagery and architecture/07 §Performance:
 *  - `object-fit: cover`, no border, no overlay; radius per container
 *    (16 inside a 24-radius card, 36 for the gallery)
 *  - fixed `aspect-ratio` so there is no CLS; `sizes` per layout
 *  - lazy below the fold, `priority` only for an LCP hero
 *  - `src` null/404 → `surface2` tile + 48–64 px category Lucide icon in `ink3`
 *  - alt = the product name; decorative → `alt=""`
 *  - NEVER an Unsplash URL (the canvas placeholders do not ship)
 */

import NextImage from 'next/image';
import { createElement, useState } from 'react';

import { cn } from '@/core/lib/cn';
import {
  Baby,
  Beef,
  Coffee,
  Croissant,
  CupSoda,
  HeartPulse,
  Milk,
  Shirt,
  ShoppingBasket,
  Snowflake,
  SprayCan,
  type LucideIcon,
} from '@/shared/lucide';

/** Category slug → glyph (assets.md: catalog categories, fallback shopping-basket). */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  milk: Milk,
  dairy: Milk,
  beef: Beef,
  meat: Beef,
  croissant: Croissant,
  bakery: Croissant,
  bread: Croissant,
  'cup-soda': CupSoda,
  drinks: CupSoda,
  beverages: CupSoda,
  snowflake: Snowflake,
  frozen: Snowflake,
  'spray-can': SprayCan,
  cleaning: SprayCan,
  household: SprayCan,
  baby: Baby,
  shirt: Shirt,
  clothing: Shirt,
  'heart-pulse': HeartPulse,
  health: HeartPulse,
  pharmacy: HeartPulse,
  coffee: Coffee,
};

export function categoryIcon(category?: string | null): LucideIcon {
  if (!category) return ShoppingBasket;
  const slug = category.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return CATEGORY_ICONS[slug] ?? ShoppingBasket;
}

/** Measured radii (design-system/layout.md §6): product image inside a card = 16, gallery = 36. */
const RADII = {
  inner: 'rounded-[16px]',
  card: 'rounded-card',
  xl: 'rounded-xl',
  gallery: 'rounded-bento',
  lg: 'rounded-lg',
  pill: 'rounded-pill',
  none: '',
} as const;

export type ProductImageRadius = keyof typeof RADII;

export interface ProductImageProps {
  /** API CDN url. `null`/`undefined`/a failed load all render the fallback tile. */
  src?: string | null;
  /** Product name. Pass `''` for a decorative image. */
  alt: string;
  /** Category slug — picks the fallback glyph. */
  category?: string | null;
  /** CSS aspect-ratio, e.g. `'236/200'` (product tile), `'1/1'`, `'540/420'`. */
  ratio?: string;
  radius?: ProductImageRadius;
  /** `sizes` for the layout this image sits in. */
  sizes?: string;
  /** Only for an LCP hero. */
  priority?: boolean;
  /** Fallback glyph size in px (48–64 per assets.md). */
  fallbackIconSize?: number;
  /**
   * `cover` (the default, and what assets.md specifies for product photography) fills the box and
   * crops. `contain` fits the whole image inside it instead — for artwork that must not be cut,
   * such as a store's wordmark logo, where cropping eats the brand name.
   */
  fit?: 'cover' | 'contain';
  className?: string;
}

export function ProductImage({
  src,
  alt,
  category,
  ratio = '236/200',
  radius = 'inner',
  sizes = '(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 263px',
  priority = false,
  fallbackIconSize = 56,
  fit = 'cover',
  className,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;
  const FallbackIcon = categoryIcon(category);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-surface2',
        RADII[radius],
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      {showFallback ? (
        <span className="absolute inset-0 grid place-items-center">
          {/* `createElement` keeps the glyph a value, not a component declared in render */}
          {createElement(FallbackIcon, {
            width: fallbackIconSize,
            height: fallbackIconSize,
            strokeWidth: 1.5,
            className: 'text-ink3',
            'aria-hidden': 'true',
          })}
          {alt ? <span className="sr-only">{alt}</span> : null}
        </span>
      ) : (
        // TODO(core): the API image CDN host must be allow-listed in next.config `images.remotePatterns`.
        <NextImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          onError={() => setFailed(true)}
          className={fit === 'contain' ? 'object-contain' : 'object-cover'}
        />
      )}
    </div>
  );
}
