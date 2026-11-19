'use client';

/**
 * PR1 · "Partnyorlar" — `/market/partners` (`app-partnyorlar.html`, frame `rzpeI`).
 *
 * The live catalog does not match the screen's name: `GET v1/ozio-partners` returns the partner
 * **categories** (8 on live), and the brands only exist inside `modules/{categoryId}`. So:
 *  - the chip row is the category list;
 *  - "Hamısı" shows the categories as cards (one request);
 *  - a chip (or a category card) sets `?category=<id>` and the grid becomes that category's
 *    brands (one more request).
 *
 * That keeps every view at a single request — a fan-out over all 8 categories would trip the
 * gateway's per-path rate limit and is not what the data supports.
 */
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/core/lib/cn';
import { Link, usePathname, useRouter } from '@/core/i18n/navigation';
import { useFormat, useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/shared/ui';
import { EmptyState, ErrorState } from '@/shared/states';
import { ArrowRight, ChevronDown, Sparkles, Store, Users } from '@/shared/lucide';

import { CategoryChipRow } from '../components/CategoryChipRow';
import { PartnerCard } from '../components/PartnerCard';
import { ViewToggle } from '../components/ViewToggle';
import { usePartnerCategories, usePartnerModule, useCampaigns } from '../hooks';
import type { PartnerBrand, PartnerCategory } from '../data/models/partner';
import { PartnersSkeleton } from './PartnersSkeleton';

type SortKey = 'cashback' | 'name';

const SORT_KEYS: readonly SortKey[] = ['cashback', 'name'];

function sortBrands(brands: readonly PartnerBrand[], key: SortKey, locale: string): PartnerBrand[] {
  const rows = [...brands];
  if (key === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name, locale));
  return rows.sort((a, b) => {
    const left = a.cashbackPercent ?? -1;
    const right = b.cashbackPercent ?? -1;
    return right - left || a.name.localeCompare(b.name, locale);
  });
}

export function PartnersView() {
  const t = useTranslations('partners');
  const failureMessage = useFailureMessage();
  const { number, percentPoints } = useFormat();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const categoryId = params?.get('category') ?? null;
  const sort: SortKey = SORT_KEYS.includes((params?.get('sort') ?? '') as SortKey)
    ? ((params?.get('sort') as SortKey) ?? 'cashback')
    : 'cashback';

  const categories = usePartnerCategories();
  const selectedCategory = useMemo<PartnerCategory | null>(
    () => categories.data?.find((c) => c.id === categoryId) ?? null,
    [categories.data, categoryId],
  );
  const brands = usePartnerModule(selectedCategory);
  const campaigns = useCampaigns();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params?.toString() ?? '');
      if (value === null) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const showingBrands = categoryId !== null;
  const activeQuery = showingBrands ? brands : categories;
  const sortedBrands = useMemo(
    () => sortBrands(brands.data ?? [], sort, 'az'),
    [brands.data, sort],
  );

  /**
   * "Ayın partnyoru": the design's featured tile. There is **no** server flag and no brand-level
   * cashback on live, so the feature is the first row of the active listing — the only honest
   * pick — and the big figure falls back to the branch count when no rate is known.
   */
  const featuredBrand = sortedBrands[0] ?? null;
  const featuredCategory = categories.data?.[0] ?? null;
  const campaignCount = campaigns.data?.length ?? 0;

  const grid = (() => {
    if (activeQuery.isPending) return <PartnersSkeleton label={t('loading')} />;

    if (activeQuery.isError) {
      return (
        <ErrorState
          failure={activeQuery.error}
          title={t('error.title')}
          message={failureMessage(activeQuery.error)}
          onRetry={() => activeQuery.refetch()}
          retryLabel={t('error.retry')}
        />
      );
    }

    if (showingBrands) {
      if (sortedBrands.length === 0) {
        return (
          <EmptyState
            icon={Store}
            tone="brand"
            panel
            title={t('empty.category.title')}
            body={t('empty.category.body')}
            action={
              <Button variant="soft" size="lg" onClick={() => setParam('category', null)}>
                {t('empty.category.action')}
              </Button>
            }
          />
        );
      }
      return (
        <ul className="grid w-full list-none grid-cols-2 gap-5 p-0 md:grid-cols-3 lg:grid-cols-4">
          {sortedBrands.map((brand) => (
            <li key={brand.id} className="contents">
              <PartnerCard
                id={brand.id}
                name={brand.name}
                subtitle={brand.categoryName}
                imageUrl={brand.imageUrl}
                cashbackPercent={brand.cashbackPercent}
                categoryId={brand.categoryId}
              />
            </li>
          ))}
        </ul>
      );
    }

    const rows = categories.data ?? [];
    if (rows.length === 0) {
      return (
        <EmptyState
          icon={Users}
          tone="brand"
          panel
          title={t('empty.all.title')}
          body={t('empty.all.body')}
        />
      );
    }
    return (
      <ul className="grid w-full list-none grid-cols-2 gap-5 p-0 md:grid-cols-3 lg:grid-cols-4">
        {rows.map((category) => (
          <li key={category.id} className="contents">
            <PartnerCard
              id={category.id}
              name={category.name}
              imageUrl={category.imageUrl}
              onSelect={(id) => setParam('category', id)}
            />
          </li>
        ))}
      </ul>
    );
  })();

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Header — static chrome, never shimmered */}
      <header className="flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.03em] text-ink lg:text-h1-app">
            {t('title')}
          </h1>
          <p className="m-0 text-body text-ink2">
            {showingBrands && selectedCategory
              ? t('subtitle.category', { category: selectedCategory.name })
              : t('subtitle.all', { count: number(categories.data?.length ?? 0) })}
          </p>
        </div>
        <ViewToggle
          active="grid"
          gridHref={paths.marketPartners}
          mapHref={paths.marketPartnersMap}
          gridLabel={t('toggle.grid')}
          mapLabel={t('toggle.map')}
          label={t('toggle.label')}
        />
      </header>

      {categories.data && categories.data.length > 0 ? (
        <CategoryChipRow
          categories={categories.data}
          value={categoryId}
          onChange={(id) => setParam('category', id)}
          allLabel={t('chips.all')}
          label={t('chips.label')}
        />
      ) : null}

      {/* Featured row */}
      <div className="flex w-full flex-col gap-5 lg:flex-row">
        <article className="flex min-h-[220px] flex-1 flex-col justify-between gap-5 rounded-bento bg-block p-8">
          <div className="flex w-full flex-row items-start justify-between gap-4">
            <div className="flex flex-col items-start gap-2.5">
              <span className="rounded-pill bg-yellow px-3.5 py-1.5 text-caption font-bold text-on-yellow">
                {t('featured.tag')}
              </span>
              <p className="m-0 text-h2 font-extrabold tracking-[-0.015em] text-on-block">
                {featuredBrand?.name ?? featuredCategory?.name ?? t('featured.fallbackName')}
              </p>
              <p className="m-0 max-w-[420px] text-body-sm text-on-block/75">
                {t('featured.body')}
              </p>
            </div>
            <p className="m-0 shrink-0 text-right text-[64px] font-extrabold leading-none tracking-[-0.05em] text-yellow lg:text-[88px]">
              {featuredBrand?.cashbackPercent
                ? percentPoints(featuredBrand.cashbackPercent)
                : number(featuredBrand?.branchCount ?? categories.data?.length ?? 0)}
              <span className="block text-label font-bold text-on-block/75">
                {featuredBrand?.cashbackPercent
                  ? t('featured.rateCaption')
                  : featuredBrand
                    ? t('featured.branchCaption')
                    : t('featured.categoryCaption')}
              </span>
            </p>
          </div>
          {featuredBrand ? (
            <Button
              as="a"
              href={`${paths.marketPartner(featuredBrand.id)}?category=${encodeURIComponent(featuredBrand.categoryId)}`}
              variant="white"
              size="md"
              trailingIcon={<ArrowRight size={18} aria-hidden="true" />}
            >
              {t('featured.cta')}
            </Button>
          ) : null}
        </article>

        <Link
          href={paths.offers}
          className={cn(
            'flex min-h-[220px] w-full flex-col justify-between gap-5 rounded-bento bg-yellow p-7 lg:w-[380px]',
            'transition-transform duration-[var(--oz-dur-fast)] active:scale-[.99]',
          )}
        >
          <Sparkles size={36} aria-hidden="true" className="text-on-yellow" />
          <div className="flex w-full flex-col gap-1.5">
            <p className="m-0 text-[22px] font-extrabold text-on-yellow">
              {t('campaignPromo.title', { count: number(campaignCount) })}
            </p>
            <p className="m-0 text-label text-on-yellow/80">{t('campaignPromo.body')}</p>
          </div>
        </Link>
      </div>

      {/* List header + sort */}
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <h2 className="m-0 text-[22px] font-bold text-ink">
          {showingBrands ? t('list.brands') : t('list.categories')}
        </h2>
        {showingBrands ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-row items-center gap-2 text-label text-ink2">
              {t('sort.label')}
              <span className="font-bold text-ink">{t(`sort.${sort}`)}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => setParam('sort', value)}
              >
                {SORT_KEYS.map((key) => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    {t(`sort.${key}`)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {grid}
    </div>
  );
}
