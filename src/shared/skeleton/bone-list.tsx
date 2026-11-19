import { Fragment, type ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { Bone, type BoneRadius } from './bone';

/**
 * Bone widths vary per row so a list does not look like a barcode
 * (skeletons.md §0: "keep deterministic (index-based), not random per render").
 */
const TITLE_WIDTHS = [150, 184, 132, 166, 148, 176];
const META_WIDTHS = [220, 188, 240, 204, 232, 196];

export type BoneRowProps = {
  /** Leading avatar/thumbnail bone size in px. `false` removes it. Default `56`. */
  thumb?: number | false;
  /** Radius of the leading bone. Default `'md'` (14). `circle` overrides it. */
  thumbRadius?: BoneRadius;
  /** Render the leading bone as a circle (avatar, step dot). */
  circle?: boolean;
  titleW?: number | string;
  titleH?: number | string;
  metaW?: number | string;
  metaH?: number | string;
  /** Trailing bone (status / amount / chevron). `false` removes it. */
  trailing?: boolean;
  trailingW?: number | string;
  trailingH?: number | string;
  trailingRadius?: BoneRadius;
  /** Gap between thumb / text / trailing. Default `16`. */
  gap?: number;
  /** Gap between the two text bones. Default `10`. */
  textGap?: number;
  /** Deterministic width variation. Default `0`. */
  index?: number;
  className?: string;
};

/**
 * The design's generic list-row content: leading bone + two text bones +
 * trailing bone (skeletons.md §0 "List Row Skeleton"). No card around it —
 * wrap it in a `BoneCard` (or use `<ListRowSkeleton>`) when the row is a card.
 */
export function BoneRow({
  thumb = 56,
  thumbRadius = 'md',
  circle = false,
  titleW,
  titleH = 14,
  metaW,
  metaH = 11,
  trailing = true,
  trailingW = 60,
  trailingH = 18,
  trailingRadius = 'sm',
  gap = 16,
  textGap = 10,
  index = 0,
  className,
}: BoneRowProps) {
  const i = Math.abs(index);
  const title = titleW ?? TITLE_WIDTHS[i % TITLE_WIDTHS.length];
  const meta = metaW ?? META_WIDTHS[i % META_WIDTHS.length];

  return (
    <div className={cn('flex w-full flex-row items-center', className)} style={{ gap }}>
      {thumb === false ? null : (
        <Bone w={thumb} h={thumb} r={circle ? 'full' : thumbRadius} />
      )}
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: textGap }}>
        <Bone w={title} h={titleH} r="sm" />
        <Bone w={meta} h={metaH} r="xs" />
      </div>
      {trailing ? <Bone w={trailingW} h={trailingH} r={trailingRadius} /> : null}
    </div>
  );
}

export type BoneListProps = {
  /** Number of rows. Default `5`. */
  count?: number;
  /** Row renderer. Default: `<BoneRow index={i} />`. */
  renderItem?: (index: number) => ReactNode;
  /** Gap between rows. Default `16`. */
  gap?: number;
  /** Lay the items out horizontally (a rail). */
  row?: boolean;
  className?: string;
};

/**
 * `count` copies of `renderItem` with the list's gap — the counterpart of the
 * loaded list so the skeleton cannot drift from it.
 */
export function BoneList({
  count = 5,
  renderItem,
  gap = 16,
  row = false,
  className,
}: BoneListProps) {
  return (
    <div
      className={cn('flex w-full', row ? 'flex-row' : 'flex-col', className)}
      style={{ gap }}
    >
      {Array.from({ length: Math.max(count, 0) }, (_, i) => (
        <Fragment key={i}>{renderItem ? renderItem(i) : <BoneRow index={i} />}</Fragment>
      ))}
    </div>
  );
}
