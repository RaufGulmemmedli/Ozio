'use client';

/**
 * The language radio cards from `app-dil-sec.html` (`Option · AZ/RU/EN`): 72 high, r20, a 44px
 * code badge, native name 16/700, English name 13/400, a 22px check on the selected row.
 * Selected row = `brand-soft` fill with `brand-dark` text and a `brand` badge.
 *
 * It is a **real radio group**: a `<fieldset>`/`<legend>` names it and each row is a native
 * `<input type="radio">` inside its `<label>`, so arrow-key navigation, `aria-checked` and the
 * group name all come from the platform. Choosing a language applies instantly (no confirm) —
 * `localeLabels` from `@/core/i18n/routing` is the source for the names.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { locales, type AppLocale } from '@/core/i18n';
import { Check } from '@/shared/lucide';

const CODE: Record<AppLocale, string> = { az: 'AZ', ru: 'RU', en: 'EN' };

export interface LanguagePickerProps {
  value: AppLocale;
  onSelect: (locale: AppLocale) => void;
  disabled?: boolean;
  className?: string;
}

export function LanguagePicker({ value, onSelect, disabled, className }: LanguagePickerProps) {
  const t = useTranslations('settings');

  return (
    <fieldset className={cn('m-0 flex w-full min-w-0 flex-col gap-2.5 border-0 p-0', className)}>
      <legend className="sr-only">{t('language.groupLabel')}</legend>
      {locales.map((locale) => {
        const selected = locale === value;
        return (
          <label
            key={locale}
            className={cn(
              'flex min-h-[72px] w-full cursor-pointer items-center gap-4 rounded-lg px-5 py-3',
              'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
              'focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 focus-within:ring-offset-surface',
              selected ? 'bg-brand-soft' : 'bg-bg hover:bg-surface2',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name="ozio-locale"
              value={locale}
              checked={selected}
              disabled={disabled}
              onChange={() => onSelect(locale)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'grid size-11 shrink-0 place-items-center rounded-pill text-label font-extrabold',
                selected ? 'bg-brand text-white' : 'bg-surface2 text-ink',
              )}
            >
              {CODE[locale]}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  'truncate text-body font-bold',
                  selected ? 'text-brand-dark' : 'text-ink',
                )}
              >
                {t(`language.native.${locale}`)}
              </span>
              <span className="truncate text-caption font-normal text-ink2">
                {t(`language.sub.${locale}`)}
              </span>
            </span>
            {selected ? (
              <Check size={22} aria-hidden="true" className="shrink-0 text-brand-dark" />
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}
