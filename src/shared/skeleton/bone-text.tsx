import { cn } from '@/core/lib/cn';

import { Bone, type BoneRadius, type BoneTone } from './bone';

export type BoneTextProps = {
  /** Number of line bones. Default `2`. */
  lines?: number;
  /** Width of the last line, so a paragraph does not look like a block. Default `'60%'`. */
  last?: number | string;
  /** Width of every other line. Default `'100%'`. */
  w?: number | string;
  /** Line bone height. Default `12` (the caption bone from skeletons.md §0). */
  h?: number | string;
  /** Gap between lines. Default `8`. */
  gap?: number;
  r?: BoneRadius;
  tone?: BoneTone;
  className?: string;
};

/** A paragraph of line bones: 12px high, gap 8, last line narrower. */
export function BoneText({
  lines = 2,
  last = '60%',
  w = '100%',
  h = 12,
  gap = 8,
  r = 'xs',
  tone,
  className,
}: BoneTextProps) {
  return (
    <div className={cn('flex w-full flex-col', className)} style={{ gap }}>
      {Array.from({ length: Math.max(lines, 0) }, (_, i) => (
        <Bone key={i} h={h} r={r} tone={tone} w={lines > 1 && i === lines - 1 ? last : w} />
      ))}
    </div>
  );
}

export type BoneTitleProps = {
  /** Default `'60%'`. */
  w?: number | string;
  /** Default `20` (the `h4` line box). */
  h?: number | string;
  r?: BoneRadius;
  tone?: BoneTone;
  className?: string;
};

/** A heading bone: 20px high at 60% width. */
export function BoneTitle({ w = '60%', h = 20, r = 'sm', tone, className }: BoneTitleProps) {
  return <Bone w={w} h={h} r={r} tone={tone} className={className} />;
}
