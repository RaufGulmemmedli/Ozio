'use client';

/**
 * The entry point other modules place: the home quick-action tile / profile-menu row for
 * "Bağlama göndər" (08-feature-flags-mocks.md "Entry points to hide when off").
 *
 * It renders nothing when the `parcel` flag is off, so a host screen does not need to know about
 * the flag — just drop `<ParcelQuickAction />` in the grid.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ChevronRight, Package } from '@/shared/lucide';

import { parcelEnabled } from '../parcel.flags';

export interface ParcelQuickActionProps {
  /** `tile` for the home quick-action grid, `row` for a profile menu list. */
  variant?: 'tile' | 'row';
  className?: string;
}

export function ParcelQuickAction({ variant = 'tile', className }: ParcelQuickActionProps) {
  const t = useTranslations('parcel');
  if (!parcelEnabled()) return null;

  if (variant === 'row') {
    return (
      <Link
        href={paths.parcel}
        className={cn(
          'flex w-full flex-row items-center gap-3.5 rounded-card bg-surface p-5 hover:bg-surface2',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"
        >
          <Package size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-label font-bold text-ink">{t('entry.title')}</span>
          <span className="truncate text-caption text-ink2">{t('entry.body')}</span>
        </span>
        <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
      </Link>
    );
  }

  return (
    <Link
      href={paths.parcel}
      className={cn(
        'flex flex-col items-start gap-3.5 rounded-card bg-surface p-[18px]',
        'transition-transform duration-[var(--oz-dur-base)] hover:-translate-y-0.5 active:scale-[.99]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-[18px] bg-brand-soft text-brand"
      >
        <Package size={24} />
      </span>
      <span className="text-body-sm font-bold text-ink">{t('entry.title')}</span>
      <span className="text-caption text-ink2">{t('entry.body')}</span>
    </Link>
  );
}
