/**
 * Landing section rhythm (layout.md §3): **120 px top padding and no bottom
 * padding** — the next section's 120 supplies the gap (72 at 768, 48 at 390,
 * via `--oz-section-y`). Header → content gap is 48, or 40 for the Market
 * section.
 */
import type { ElementType, ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { Container } from './container';

export interface SectionProps {
  as?: ElementType;
  /** `40` for the Market section, `48` everywhere else. */
  gap?: 48 | 40 | 24;
  /** `false` when the section itself needs a full-bleed child. */
  contained?: boolean;
  /** Drops the 120/72/48 top padding (first section under the hero). */
  flush?: boolean;
  id?: string;
  'aria-labelledby'?: string;
  children?: ReactNode;
  className?: string;
}

const GAPS: Record<48 | 40 | 24, string> = {
  48: 'gap-12',
  40: 'gap-10',
  24: 'gap-6',
};

export function Section({
  as: Tag = 'section',
  gap = 48,
  contained = true,
  flush = false,
  id,
  children,
  className,
  ...rest
}: SectionProps) {
  const content = <div className={cn('flex flex-col', GAPS[gap])}>{children}</div>;

  return (
    <Tag
      id={id}
      className={cn('w-full', flush ? undefined : 'pt-[var(--oz-section-y)]', className)}
      {...rest}
    >
      {contained ? <Container>{content}</Container> : content}
    </Tag>
  );
}
