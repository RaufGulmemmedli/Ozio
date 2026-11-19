'use client';

/**
 * The module's entry point, for the profile "Tətbiq" card to place: a Sadə rejim switch row that
 * turns the preference on from anywhere, plus a link to `/senior/mode` for the scale and contrast
 * options.
 *
 * Exported from `@/modules/senior` so the profile module never reaches inside this folder.
 * Renders nothing when the `senior` flag is off.
 *
 * The switch is wrapped in `<SeniorScreen>`'s scope class on the senior screens, but here it may
 * sit anywhere — flipping it writes the `<html>` attributes, and each senior screen applies the
 * scoped stylesheet itself.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ChevronRight, Sparkles } from '@/shared/lucide';
import { Switch } from '@/shared/ui';

import { useSeniorMode } from '../hooks/use-senior-mode';
import { seniorEnabled } from '../senior.flags';

export interface SeniorModeToggleProps {
  /** `row` is the settings-card row; `switch` is the bare control. */
  variant?: 'row' | 'switch';
  className?: string;
}

export function SeniorModeToggle({ variant = 'row', className }: SeniorModeToggleProps) {
  const t = useTranslations('senior');
  const { enabled, setEnabled } = useSeniorMode();

  if (!seniorEnabled()) return null;

  const control = (
    <Switch
      checked={enabled}
      aria-label={t('mode.title')}
      onCheckedChange={setEnabled}
    />
  );

  if (variant === 'switch') return <span className={className}>{control}</span>;

  return (
    <div
      className={cn(
        'flex min-h-[64px] w-full flex-row items-center gap-[14px] rounded-card px-4 py-3',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface2"
      >
        <Sparkles size={22} className="text-ink" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold text-ink">{t('mode.title')}</span>
        <span className="truncate text-label text-ink2">{t('mode.entryBody')}</span>
      </span>

      {control}

      <Link
        href={paths.seniorMode}
        aria-label={t('mode.openSettings')}
        className="flex size-11 shrink-0 items-center justify-center rounded-pill text-ink3 transition-colors hover:bg-bg"
      >
        <ChevronRight aria-hidden="true" size={20} />
      </Link>
    </div>
  );
}
