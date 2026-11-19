'use client';

/**
 * The entry point other modules place — the "Dəstək" row in the profile menu / utility nav.
 *
 * Flag **on**  → a row that opens `/support`.
 * Flag **off** → the documented fallback (`api/mock-modules.md` §9): no chat, a row to `/help`
 *                (the real privacy-policy screen) and the contact number, so the user is never
 *                left without a way to reach support. This is why the component renders something
 *                in both cases instead of disappearing.
 */
import { useTranslations } from 'next-intl';

import { FeatureFlags } from '@/core/config';
import { Link } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ChevronRight, Headphones, Phone } from '@/shared/lucide';

export interface SupportEntryProps {
  /** `'row'` (profile menu, default) or `'link'` (a compact inline link). */
  variant?: 'row' | 'link';
  className?: string;
}

const ROW_CLASS =
  'flex min-h-14 w-full flex-row items-center gap-3 rounded-lg bg-bg px-4 py-3 text-left ' +
  'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--ease-out)] hover:bg-surface2';

export function SupportEntry({ variant = 'row', className }: SupportEntryProps) {
  const t = useTranslations('support');
  const enabled = FeatureFlags.supportChat;

  if (variant === 'link') {
    return (
      <Link
        href={enabled ? paths.support : paths.help}
        className={cn(
          'flex w-fit min-h-11 flex-row items-center gap-2 rounded-sm text-body-sm font-bold text-brand hover:text-brand-dark md:min-h-0',
          className,
        )}
      >
        <Headphones aria-hidden="true" size={16} className="shrink-0" />
        {enabled ? t('entry.label') : t('fallback.help')}
      </Link>
    );
  }

  if (enabled) {
    return (
      <Link href={paths.support} className={cn(ROW_CLASS, className)}>
        <Headphones aria-hidden="true" size={20} className="shrink-0 text-ink2" />
        <span className="min-w-0 flex-1 text-body-sm font-semibold text-ink">
          {t('entry.label')}
        </span>
        <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink3" />
      </Link>
    );
  }

  const phone = t('phone');

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <p className="m-0 text-caption text-ink2">{t('unavailable.body')}</p>
      <Link href={paths.help} className={ROW_CLASS}>
        <Headphones aria-hidden="true" size={20} className="shrink-0 text-ink2" />
        <span className="min-w-0 flex-1 text-body-sm font-semibold text-ink">
          {t('fallback.help')}
        </span>
        <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink3" />
      </Link>
      <a href={`tel:${phone.replace(/\s+/g, '')}`} className={ROW_CLASS}>
        <Phone aria-hidden="true" size={20} className="shrink-0 text-ink2" />
        <span className="min-w-0 flex-1 text-body-sm font-semibold text-ink">
          {t('action.call')}
        </span>
        <span className="shrink-0 text-body-sm font-bold text-ink2">{phone}</span>
      </a>
    </div>
  );
}
