'use client';

/**
 * Stats row (`Phh2w`, 96 high) — 4 tiles of 263×96 at gap 20 (1112 content width).
 *
 * Tile: `surface`, `rounded-card` (24), padding 22, gap 16; icon chip 52 with radius 16
 * (`brand-soft` · `success-soft` · `violet-soft` · `yellow`), label 13/400 `ink2`,
 * value 26/800 `ink`. Tablet/mobile: 2×2 at gap 12, radius 20, padding 16, chip 44/14,
 * label 12, value 17/700 — exactly the tablet-768 / mobil-390 frames.
 *
 * Every value is nullable: a tile whose own request failed shows "—" instead of a wrong number.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import type { LucideIcon } from '@/shared/lucide';

export type StatTone = 'brand' | 'success' | 'violet' | 'yellow';

const TONES: Record<StatTone, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  violet: 'bg-violet-soft text-violet',
  yellow: 'bg-yellow text-on-yellow',
};

export interface StatTileProps {
  icon: LucideIcon;
  tone: StatTone;
  label: string;
  /** Already formatted; `null` renders the neutral dash. */
  value: string | null;
  href?: string;
  className?: string;
}

export function StatTile({ icon: Icon, tone, label, value, href, className }: StatTileProps) {
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-md lg:size-[52px] lg:rounded-[16px]',
          TONES[tone],
        )}
      >
        <Icon className="size-5 lg:size-[26px]" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-micro text-ink2 lg:text-caption">{label}</span>
        <span className="truncate text-[17px] font-bold text-ink lg:text-[26px] lg:font-extrabold">
          {value ?? '—'}
        </span>
      </span>
    </>
  );

  const shell = cn(
    'flex min-w-0 flex-1 flex-row items-center gap-3 rounded-lg bg-surface p-4',
    'lg:h-24 lg:gap-4 lg:rounded-card lg:p-[22px]',
    className,
  );

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link
      href={href}
      className={cn(
        shell,
        'transition-transform duration-[var(--oz-dur-fast)] ease-out hover:bg-surface active:scale-[.99]',
      )}
    >
      {body}
    </Link>
  );
}

/** The row itself: 2×2 below 1200, 4-up on desktop (gap 12 / 20 per the frames). */
export function StatTileRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid w-full grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5', className)}>
      {children}
    </div>
  );
}
