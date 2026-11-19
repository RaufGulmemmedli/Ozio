'use client';

/**
 * The module's entry point, for the profile / "Ailə kartı" settings card to place: the
 * "Üzv limitləri" row at the bottom of that card (`api/mock-modules.md` §12, "Entry").
 *
 * Exported from `@/modules/family_limits` so the profile module never reaches inside this folder.
 * Renders nothing when the `familyLimits` flag is off.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ChevronRight, Users } from '@/shared/lucide';

import { familyLimitsEnabled } from '../family_limits.flags';
import { useFamilyLimits } from '../hooks/use-family-limits';

export interface FamilyLimitsEntryProps {
  className?: string;
}

export function FamilyLimitsEntry({ className }: FamilyLimitsEntryProps) {
  const t = useTranslations('family_limits');
  const limits = useFamilyLimits();

  if (!familyLimitsEnabled()) return null;

  const active = limits.data?.summary.activeLimits ?? 0;

  return (
    <Link
      href={paths.familyLimits}
      className={cn(
        'flex min-h-[64px] w-full flex-row items-center gap-[14px] rounded-card px-4 py-3 transition-colors hover:bg-bg',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface2"
      >
        <Users size={22} className="text-ink" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold text-ink">{t('entry.title')}</span>
        <span className="truncate text-label text-ink2">
          {active > 0 ? t('entry.active', { count: active }) : t('entry.none')}
        </span>
      </span>
      <ChevronRight aria-hidden="true" size={20} className="shrink-0 text-ink3" />
    </Link>
  );
}
