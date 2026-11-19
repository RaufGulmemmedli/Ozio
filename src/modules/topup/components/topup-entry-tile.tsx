'use client';

/**
 * The "Balansı artır" entry point, exported from this module's `index.ts` so the card page
 * (`/card`, agent M7) and the home Ozio card (agent M3) can place it **without reaching inside
 * this module** — they import `<TopupEntryTile>` and nothing else.
 *
 * It is flag-aware on its own: with `NEXT_PUBLIC_FEATURE_TOPUP` off it renders `null`, which is
 * the "hide entry points when off" rule from 08-feature-flags-mocks.md. Callers therefore do not
 * need a `<FlagGate>`.
 *
 * Two shapes: `tile` (the default — a `surface` card row with a `brand-soft` disc, matching the
 * method rows) and `button` (a pill, for the dark Ozio card block where a card-on-card would be
 * wrong).
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ChevronRight, Plus, Wallet } from '@/shared/lucide';

import { topupEnabled } from '../topup.flags';

export interface TopupEntryTileProps {
  variant?: 'tile' | 'button';
  className?: string;
}

export function TopupEntryTile({ variant = 'tile', className }: TopupEntryTileProps) {
  const t = useTranslations('topup');

  // Flag off → no entry point at all.
  if (!topupEnabled()) return null;

  if (variant === 'button') {
    return (
      <Link
        href={paths.topup}
        className={cn(
          'flex h-11 w-fit flex-row items-center gap-2 rounded-pill bg-on-block/[0.12] px-[18px]',
          'text-body-sm font-bold text-on-block transition-colors hover:bg-on-block/20',
          className,
        )}
      >
        <Plus aria-hidden="true" size={18} className="shrink-0" />
        {t('tile.title')}
      </Link>
    );
  }

  return (
    <Link
      href={paths.topup}
      className={cn(
        'group flex w-full flex-row items-center gap-4 rounded-card bg-surface p-5',
        'transition-transform duration-[var(--oz-dur-base)] ease-out hover:-translate-y-0.5',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand"
      >
        <Wallet size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-body font-bold text-ink">{t('tile.title')}</span>
        <span className="text-caption text-ink2">{t('tile.body')}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        size={20}
        className="shrink-0 text-ink3 transition-colors group-hover:text-ink"
      />
    </Link>
  );
}
