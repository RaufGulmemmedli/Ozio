'use client';

/**
 * The module's **entry point for other modules**.
 *
 * `08-feature-flags-mocks.md` puts school behind Profil → "Daha çox", so the profile module needs
 * a row it can place without reaching inside this module. It is exported from `index.ts` and is
 * the only school component another module should render.
 *
 * It hides itself when the flag is off (entry-level gating, the counterpart to the route guard),
 * and it carries the compact "Demo rejim" chip so the row is honest before the user taps it.
 */
import { useTranslations } from 'next-intl';

import { FeatureFlags } from '@/core/config';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { ChevronRight } from '@/shared/lucide';
import { DemoBanner } from '@/shared/states';

import { GraduationCap } from './icons';

export interface SchoolProfileEntryProps {
  className?: string;
}

export function SchoolProfileEntry({ className }: SchoolProfileEntryProps) {
  const t = useTranslations('school');
  if (!FeatureFlags.school) return null;

  return (
    <Link
      href={paths.school}
      className={
        className ??
        'flex w-full flex-row items-center gap-4 rounded-card bg-surface px-5 py-4 transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2'
      }
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-soft"
      >
        <GraduationCap size={22} className="text-brand" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-bold text-ink">{t('hub.title')}</span>
        <span className="text-caption text-ink2">{t('hub.subtitle')}</span>
      </span>
      <DemoBanner module="school" compact />
      <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
    </Link>
  );
}
