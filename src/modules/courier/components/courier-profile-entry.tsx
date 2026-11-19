'use client';

/**
 * The entry point other modules place: the profile row **"Ozio ilə işlə"**
 * (08-feature-flags-mocks.md → "Profile → 'Ozio ilə işlə'").
 *
 * It renders nothing when the `courier` flag is off, and it points at the right screen for the
 * courier's current state — apply / status / panel — so the host screen needs to know nothing
 * about this module.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Briefcase, ChevronRight } from '@/shared/lucide';

import { courierEnabled } from '../courier.flags';
import { useCourierMe } from '../hooks/use-courier';

export interface CourierProfileEntryProps {
  /** `row` for the profile menu list (default), `tile` for a quick-action grid. */
  variant?: 'row' | 'tile';
  className?: string;
}

export function CourierProfileEntry({
  variant = 'row',
  className,
}: CourierProfileEntryProps) {
  const t = useTranslations('courier');
  const me = useCourierMe();

  if (!courierEnabled()) return null;

  const status = me.data?.status ?? 'none';
  const href =
    status === 'active'
      ? paths.courier
      : status === 'pending'
        ? paths.courierApplyStatus
        : paths.courierApply;

  if (variant === 'tile') {
    return (
      <Link
        href={href}
        className={cn(
          'flex flex-col items-start gap-3.5 rounded-card bg-surface p-[18px]',
          'transition-transform duration-[var(--oz-dur-base)] hover:-translate-y-0.5 active:scale-[.99]',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-[18px] bg-sky-soft text-sky"
        >
          <Briefcase size={24} />
        </span>
        <span className="text-body-sm font-bold text-ink">{t('entry.title')}</span>
        <span className="text-caption text-ink2">{t('entry.body')}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex w-full flex-row items-center gap-3.5 rounded-card bg-surface p-5 hover:bg-surface2',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-md bg-sky-soft text-sky"
      >
        <Briefcase size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label font-bold text-ink">{t('entry.title')}</span>
        <span className="truncate text-caption text-ink2">{t('entry.body')}</span>
      </span>
      <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
    </Link>
  );
}
