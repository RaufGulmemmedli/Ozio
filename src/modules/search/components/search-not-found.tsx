'use client';

/**
 * AX3 (`RHpew` → `h8PMhX`), drawn truth from `app-search-not-found.html`:
 * a `surface` r36 panel, padding 56/48, gap 20 — a 96 `brand-soft` circle with `search-x`, the
 * title 30/800, the body 16/400 `ink2`, the "Bəlkə bunu nəzərdə tutdunuz:" chip row, then
 * "Bütün məhsullara bax" (brand 52) + "Axtarışı təmizlə" (soft 52).
 *
 * The suggestion chips are client-side fuzzy matches over the terms we already have (recent +
 * popular) — there is no suggestions endpoint.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { SearchX } from '@/shared/lucide';
import { EmptyState, StateButton } from '@/shared/states';
import { Chip } from '@/shared/ui';

export interface SearchNotFoundProps {
  keyword: string;
  suggestions: readonly string[];
  onPick: (term: string) => void;
  onClear: () => void;
  className?: string;
}

export function SearchNotFound({
  keyword,
  suggestions,
  onPick,
  onClear,
  className,
}: SearchNotFoundProps) {
  const t = useTranslations('search');

  return (
    <EmptyState
      icon={SearchX}
      tone="brand"
      panel
      title={t('notFound.title', { query: keyword })}
      body={
        <>
          {t('notFound.body')}
          {suggestions.length > 0 ? (
            /* `<span>` wrappers: `<EmptyState>` renders `body` inside a `<p>`. */
            <span className="mt-5 flex flex-row flex-wrap items-center justify-center gap-2.5">
              <span className="text-body-sm text-ink2">{t('notFound.didYouMean')}</span>
              {suggestions.map((term, index) => (
                <Chip key={term} selected={index === 0} onClick={() => onPick(term)}>
                  {term}
                </Chip>
              ))}
            </span>
          ) : null}
        </>
      }
      action={<StateButton href={paths.market}>{t('notFound.browseAll')}</StateButton>}
      secondaryAction={
        <StateButton variant="soft" onClick={onClear}>
          {t('notFound.clear')}
        </StateButton>
      }
      className={cn(className)}
    />
  );
}
