'use client';

/**
 * `<SearchField>` — the in-page search bar (`iHn0T` / `IkSX2` / `op4m0`), 64 high, pill, `surface`,
 * 2 px `brand` ring while focused, padding 0 12 0 24, gap 14: magnifier → input 18/500 → clear
 * circle 40 (only with text) → the 44 `cta` pill ("Bağla" when empty, "Axtar" with a term).
 *
 * The camera button is the entry point for search-by-photo: it is gated by `useFlag('imageSearch')`
 * and only links to `/search/image` — that screen belongs to another module (mock `image_search`).
 *
 * a11y: `role="search"` on the form, a labelled input, and submit on Enter. The results region
 * announces its count politely (see `<SearchResults>`), not this field.
 */
import { useId, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { useFlag } from '@/core/config';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Camera, Search, X } from '@/shared/lucide';
import { IconButton } from '@/shared/ui';

export interface SearchFieldProps {
  value: string;
  onValueChange: (next: string) => void;
  /** Enter / the trailing button. */
  onSubmit?: (value: string) => void;
  /** The trailing button with an empty field ("Bağla" → usually `router.back()`). */
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function SearchField({
  value,
  onValueChange,
  onSubmit,
  onCancel,
  autoFocus = false,
  className,
}: SearchFieldProps) {
  const t = useTranslations('search');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageSearch = useFlag('imageSearch');
  const hasValue = value.trim().length > 0;

  return (
    <form
      role="search"
      aria-label={t('field.label')}
      onSubmit={(event) => {
        event.preventDefault();
        if (hasValue) onSubmit?.(value.trim());
      }}
      className={cn(
        'flex h-16 w-full flex-row items-center gap-[14px] rounded-pill bg-surface ps-6 pe-3',
        'outline outline-2 -outline-offset-2 outline-transparent',
        'focus-within:outline-brand',
        className,
      )}
    >
      <Search size={22} aria-hidden="true" className="shrink-0 text-ink3" />

      <label htmlFor={inputId} className="sr-only">
        {t('field.label')}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={t('field.placeholder')}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-body-l font-medium text-ink outline-none',
          'placeholder:font-medium placeholder:text-ink3',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />

      {hasValue ? (
        <IconButton
          aria-label={t('field.clear')}
          size={36}
          tone="surface2"
          onClick={() => {
            onValueChange('');
            inputRef.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </IconButton>
      ) : null}

      {imageSearch ? (
        <Link
          href={paths.searchImage}
          aria-label={t('field.photo')}
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-pill bg-surface2 text-ink',
            'transition-colors duration-[var(--oz-dur-fast)] ease-out hover:bg-line',
          )}
        >
          <Camera size={18} aria-hidden="true" />
        </Link>
      ) : null}

      <button
        type={hasValue ? 'submit' : 'button'}
        onClick={hasValue ? undefined : onCancel}
        className={cn(
          'inline-flex h-11 shrink-0 items-center rounded-pill bg-cta px-[22px] text-body-sm font-bold text-on-cta',
          'transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-out active:scale-[.97]',
        )}
      >
        {hasValue ? t('field.submit') : t('field.cancel')}
      </button>
    </form>
  );
}
