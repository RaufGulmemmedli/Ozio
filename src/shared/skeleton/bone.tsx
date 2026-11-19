import type { CSSProperties } from 'react';

import { cn } from '@/core/lib/cn';

/**
 * The radius token names from `globals.css` (`--radius-*`).
 * A plain `number` is also accepted everywhere a radius is taken, for the
 * handful of design values that have no token (16, 18, 22, 26, 44, 60…).
 */
export type BoneRadiusToken =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'card'
  | 'xl'
  | 'modal'
  | 'bento'
  | '2xl'
  | 'pill'
  | 'full';

export type BoneRadius = BoneRadiusToken | number;

/** token name → Tailwind class. Kept as literals so the JIT can see them. */
export const BONE_RADIUS_CLASS: Record<BoneRadiusToken, string> = {
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  card: 'rounded-card',
  xl: 'rounded-xl',
  modal: 'rounded-modal',
  bento: 'rounded-bento',
  '2xl': 'rounded-2xl',
  pill: 'rounded-pill',
  // 999px — the design has no separate "full"; a pill radius is a circle on
  // any bone that is as wide as it is tall.
  full: 'rounded-pill',
};

/** Resolves `r` into a class (token) or an inline radius (number). */
export function boneRadius(r: BoneRadius | undefined): {
  cls?: string;
  style?: CSSProperties;
} {
  if (r === undefined) return {};
  if (typeof r === 'number') return { style: { borderRadius: r } };
  return { cls: BONE_RADIUS_CLASS[r] };
}

/**
 * Bone fill. The default (`bone`) is the `.oz-bone` fill from `globals.css`
 * (`surface2`). The other tones exist for bones that sit **on** a tinted block
 * (`BoneTint`), where a `surface2` bone would be invisible.
 */
export type BoneTone = 'bone' | 'surface' | 'surface2' | 'bg' | 'line' | 'white';

const BONE_TONE_CLASS: Record<BoneTone, string> = {
  bone: '',
  surface: 'bg-surface',
  surface2: 'bg-surface2',
  bg: 'bg-bg',
  line: 'bg-line',
  white: 'bg-white',
};

export type BoneProps = {
  /** Width. Numbers are px. Default `'100%'`. */
  w?: number | string;
  /** Height. Numbers are px. Default `16`. */
  h?: number | string;
  /** Radius token name, or a px number. Default `'sm'`. */
  r?: BoneRadius;
  /** Fill. Default `'bone'` (= `surface2` via `.oz-bone`). */
  tone?: BoneTone;
  className?: string;
  style?: CSSProperties;
};

/**
 * One skeleton block. `.oz-bone` carries the fill; the sweep comes from the
 * ancestor `.oz-skeleton` (see `<Shimmer>`), so a `Bone` outside a `Shimmer`
 * is simply a static muted block.
 *
 * Always `aria-hidden` — the loading announcement lives on the `Shimmer` root.
 */
export function Bone({ w = '100%', h = 16, r = 'sm', tone = 'bone', className, style }: BoneProps) {
  const radius = boneRadius(r);
  return (
    <div
      aria-hidden="true"
      className={cn('oz-bone shrink-0', radius.cls, BONE_TONE_CLASS[tone], className)}
      style={{ width: w, height: h, ...radius.style, ...style }}
    />
  );
}
