import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import type { LucideIcon } from '@/shared/lucide';

/**
 * Chip/icon tint. The measured empty frames (`Q2IfPl`, `B4MeL3`…) paint a
 * `brand-soft` chip with a `brand` glyph; `muted` is the quieter
 * `surface2`/`ink3` pairing from states-catalog.md §0.
 */
export type StateTone = 'muted' | 'brand';

const TONE: Record<StateTone, { chip: string; icon: string }> = {
  muted: { chip: 'bg-surface2', icon: 'text-ink3' },
  brand: { chip: 'bg-brand-soft', icon: 'text-brand' },
};

export type EmptyStateProps = {
  /** Lucide icon component from `@/shared/lucide`. */
  icon?: LucideIcon;
  /** Already-localized title. This package localizes nothing. */
  title: ReactNode;
  /** One sentence, already localized. */
  body?: ReactNode;
  /** Primary CTA — pass a `<Button>`/`<StateButton>`. */
  action?: ReactNode;
  /** Optional ghost/soft second action. */
  secondaryAction?: ReactNode;
  tone?: StateTone;
  /** Section-level variant: smaller chip, h4 title, tighter spacing. */
  compact?: boolean;
  /** Wrap in the `surface` / `rounded-bento` panel with 56px vertical padding. */
  panel?: boolean;
  /** Extra content under the actions (a "Çox alınanlar" rail, chips…). */
  children?: ReactNode;
  className?: string;
  /** Set when navigation should move focus here (`states-catalog.md` §0). */
  titleId?: string;
  /** Heading element for the title, so the page's heading order stays valid. */
  titleAs?: 'h2' | 'h3' | 'p';
};

/**
 * The empty block: `[icon tile] → title → description → [actions] → [extra]`,
 * centred inside the page content (below the real page header).
 *
 * `role="status"` per states-catalog.md §0; the title carries `tabIndex={-1}`
 * so a caller can focus it after a navigation.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  secondaryAction,
  tone = 'muted',
  compact = false,
  panel = false,
  children,
  className,
  titleId,
  titleAs: Title = 'h2',
}: EmptyStateProps) {
  const palette = TONE[tone];
  const chipSize = compact ? 64 : 120;
  const iconSize = compact ? 28 : 52;

  return (
    <div
      role="status"
      className={cn(
        'flex w-full flex-col items-center text-center',
        compact ? 'gap-3' : 'gap-5',
        panel && (compact ? 'rounded-card bg-surface px-5 py-10' : 'rounded-bento bg-surface px-5 py-14'),
        className,
      )}
    >
      {Icon ? (
        <div
          aria-hidden="true"
          className={cn('flex shrink-0 items-center justify-center rounded-pill', palette.chip)}
          style={{ width: chipSize, height: chipSize }}
        >
          <Icon size={iconSize} className={palette.icon} />
        </div>
      ) : null}

      <Title
        id={titleId}
        tabIndex={-1}
        className={cn('font-bold text-ink outline-none', compact ? 'text-h4' : 'text-h3')}
      >
        {title}
      </Title>

      {body ? (
        <p className={cn('text-ink2', compact ? 'max-w-[360px] text-body-sm' : 'max-w-[420px] text-body')}>
          {body}
        </p>
      ) : null}

      {action || secondaryAction ? (
        <div className="flex flex-row flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}

      {children}
    </div>
  );
}
