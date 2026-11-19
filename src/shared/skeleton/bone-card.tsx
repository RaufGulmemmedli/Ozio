import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { boneRadius, type BoneRadius } from './bone';

export type BoneCardProps = {
  children?: ReactNode;
  className?: string;
  /** Radius token name or px. Default `'card'` (24). */
  r?: BoneRadius;
  /** 1px `line` border, like the loaded cards. Default `true`. */
  bordered?: boolean;
  /** Padding (px when a number). Default `14`. */
  pad?: number | string;
  /** Gap between children (px when a number). Default `14`. */
  gap?: number | string;
  /** Lay the children out in a row (`items-center`) instead of a column. */
  row?: boolean;
  w?: number | string;
  h?: number | string;
  style?: CSSProperties;
};

/**
 * A card-shaped skeleton container: `surface` fill, 1px `line`, card radius.
 *
 * The fill and the border are **not** shimmered — only the `Bone`s inside
 * sweep (skeletons.md §4, architecture/05 §2).
 */
export function BoneCard({
  children,
  className,
  r = 'card',
  bordered = true,
  pad = 14,
  gap = 14,
  row = false,
  w = '100%',
  h,
  style,
}: BoneCardProps) {
  const radius = boneRadius(r);
  return (
    <div
      className={cn(
        'flex bg-surface',
        row ? 'flex-row items-center' : 'flex-col items-start',
        bordered && 'border border-line',
        radius.cls,
        className,
      )}
      style={{ padding: pad, gap, width: w, height: h, ...radius.style, ...style }}
    >
      {children}
    </div>
  );
}

/**
 * Tinted blocks (brand card, banner, map, barcode, category tile, lottery
 * hero). The **fill stays outside the shimmer**: `.oz-bone-fill` only receives
 * the highlight sweep, the colour comes from the token class below. Bones
 * placed on top must use a contrasting `tone` (see `Bone`'s `tone` prop).
 */
export type BoneTintTone =
  | 'surface2'
  | 'surface'
  | 'brand'
  | 'brand-soft'
  | 'block'
  | 'yellow'
  | 'sky-soft'
  | 'violet-soft'
  | 'success-soft'
  | 'warn-soft';

const TINT_CLASS: Record<BoneTintTone, string> = {
  surface2: 'bg-surface2',
  surface: 'bg-surface',
  brand: 'bg-brand',
  'brand-soft': 'bg-brand-soft',
  block: 'bg-block',
  yellow: 'bg-yellow',
  'sky-soft': 'bg-sky-soft',
  'violet-soft': 'bg-violet-soft',
  'success-soft': 'bg-success-soft',
  'warn-soft': 'bg-warn-soft',
};

export type BoneTintProps = {
  children?: ReactNode;
  className?: string;
  /** Fill token. Default `'surface2'` — what the design paints for tint bones. */
  tone?: BoneTintTone;
  /** Radius token name or px. Default `'xl'` (28). */
  r?: BoneRadius;
  w?: number | string;
  h?: number | string;
  pad?: number | string;
  gap?: number | string;
  row?: boolean;
  style?: CSSProperties;
};

export function BoneTint({
  children,
  className,
  tone = 'surface2',
  r = 'xl',
  w = '100%',
  h,
  pad,
  gap,
  row = false,
  style,
}: BoneTintProps) {
  const radius = boneRadius(r);
  return (
    <div
      aria-hidden="true"
      className={cn(
        'oz-bone-fill flex',
        row ? 'flex-row items-center' : 'flex-col items-start',
        TINT_CLASS[tone],
        radius.cls,
        className,
      )}
      style={{ width: w, height: h, padding: pad, gap, ...radius.style, ...style }}
    >
      {children}
    </div>
  );
}
