'use client';

/**
 * AX1 — the search landing (`qfWIo`): a two-column body, gap 32.
 *
 * Left (`Left`, gap 36):
 *  - "Son axtarışlar" + "Təmizlə" and the 52-high history rows (client-only, `usePrefs`);
 *  - "Populyar axtarışlar" chips — no endpoint, the drawn list is the config (`POPULAR_SEARCHES`);
 *  - "Kateqoriyalar üzrə" tiles, 96 high r24, from `GET v1/categories/products?store_id=`.
 *
 * Right (`Frequent`, 380 wide, `block` r36): "Tez-tez aldıqların". There is no endpoint for it
 * (it would come from order history), so the card states that instead of showing invented rows.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { History, TrendingUp, X } from '@/shared/lucide';
import { ChipRowSkeleton, ListRowSkeleton, Shimmer } from '@/shared/skeleton';
import { Chip } from '@/shared/ui';
import { Link } from '@/core/i18n/navigation';

import { POPULAR_SEARCHES } from '../data/search.repository';
import type { ProductCategory } from '../data/store-bridge';

/**
 * `app-search.html` paints the four tiles success-soft / yellow / sky-soft / violet-soft. The soft
 * tints invert in dark mode, so their label is `ink` (which inverts with them); `yellow` is the
 * same colour in both themes, so its label is the theme-constant `on-yellow`.
 */
const TILE_TONES = [
  'bg-success-soft text-ink',
  'bg-yellow text-on-yellow',
  'bg-sky-soft text-ink',
  'bg-violet-soft text-ink',
] as const;

export interface SearchLandingProps {
  recent: readonly string[];
  onPick: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
  categories: readonly ProductCategory[];
  categoriesPending: boolean;
  className?: string;
}

export function SearchLanding({
  recent,
  onPick,
  onRemoveRecent,
  onClearRecent,
  categories,
  categoriesPending,
  className,
}: SearchLandingProps) {
  const t = useTranslations('search');

  return (
    <div className={cn('flex w-full flex-col gap-8 lg:flex-row', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-9">
        <section aria-labelledby="oz-recent-head" className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-row items-center justify-between gap-5">
            <h2 id="oz-recent-head" className="m-0 text-h4 font-extrabold text-ink md:text-[22px]">
              {t('recent.title')}
            </h2>
            {recent.length > 0 ? (
              <button
                type="button"
                onClick={onClearRecent}
                className="shrink-0 text-label font-bold text-brand hover:text-brand-dark"
              >
                {t('recent.clear')}
              </button>
            ) : null}
          </div>

          {recent.length === 0 ? (
            <p className="m-0 text-body text-ink2">{t('recent.empty')}</p>
          ) : (
            <ul className="m-0 flex w-full list-none flex-col p-0">
              {recent.map((term, index) => (
                <li
                  key={term}
                  className={cn(
                    'flex h-13 flex-row items-center gap-[14px]',
                    index < recent.length - 1 && 'border-b border-line',
                  )}
                >
                  <History size={18} aria-hidden="true" className="shrink-0 text-ink3" />
                  <button
                    type="button"
                    onClick={() => onPick(term)}
                    className="min-w-0 flex-1 truncate text-start text-body font-medium text-ink hover:text-brand"
                  >
                    {term}
                  </button>
                  <button
                    type="button"
                    aria-label={t('recent.remove', { term })}
                    onClick={() => onRemoveRecent(term)}
                    className="grid size-11 shrink-0 place-items-center rounded-pill text-ink3 hover:text-ink"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="oz-popular-head" className="flex w-full flex-col gap-4">
          <h2 id="oz-popular-head" className="m-0 text-h4 font-extrabold text-ink md:text-[22px]">
            {t('popular.title')}
          </h2>
          <div className="flex w-full flex-row flex-wrap gap-2.5">
            {POPULAR_SEARCHES.map((term) => (
              <Chip key={term} leadingIcon={TrendingUp} onClick={() => onPick(term)}>
                {term}
              </Chip>
            ))}
          </div>
        </section>

        <section aria-labelledby="oz-cats-head" className="flex w-full flex-col gap-4">
          <h2 id="oz-cats-head" className="m-0 text-h4 font-extrabold text-ink md:text-[22px]">
            {t('categories.title')}
          </h2>

          {categoriesPending ? (
            <Shimmer className="flex w-full flex-col gap-4">
              <ChipRowSkeleton count={4} h={96} />
            </Shimmer>
          ) : categories.length === 0 ? (
            <p className="m-0 text-body text-ink2">{t('categories.empty')}</p>
          ) : (
            <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
              {categories.slice(0, 8).map((category, index) => (
                <Link
                  key={category.id}
                  href={paths.category(category.id)}
                  className={cn(
                    'flex h-24 flex-col justify-end rounded-card p-[18px]',
                    'text-body-sm font-extrabold',
                    'transition-transform duration-[var(--oz-dur-base)] ease-out hover:-translate-y-0.5',
                    TILE_TONES[index % TILE_TONES.length],
                  )}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* `Frequent` — order-history driven, and there is no endpoint for it (screen spec AX1). */}
      <aside className="flex w-full flex-col gap-5 rounded-bento bg-block p-7 lg:w-[380px] lg:shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-h4 font-extrabold text-on-block">{t('frequent.title')}</h2>
          <p className="m-0 text-caption text-on-block3">{t('frequent.subtitle')}</p>
        </div>
        <p className="m-0 text-body-sm text-on-block2">{t('frequent.unavailable')}</p>
      </aside>
    </div>
  );
}

/** The landing's mirror skeleton: chips + history rows, with the real headings kept. */
export function SearchLandingSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-9">
      <div className="flex w-full flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <ListRowSkeleton key={i} index={i} h={52} />
        ))}
      </div>
      <ChipRowSkeleton count={7} />
      <ChipRowSkeleton count={4} h={96} />
    </Shimmer>
  );
}
