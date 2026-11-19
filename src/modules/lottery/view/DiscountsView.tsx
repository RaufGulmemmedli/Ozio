'use client';

/**
 * `/offers/discounts` — "Endirimlər" (L7/PR6). **Guest-visible route**, `?category=<chainId>`.
 *
 * The design has no dedicated export frame for this screen, so it follows the catalogue
 * rules from `app-category.html`: chips row → result head with the campaign period → sort
 * menu → product grid at gap 20 → "load more".
 *
 * Hard constraints from the API (all verified by probing):
 *   · "Categories" are the **store chains**, not product categories;
 *   · the campaign `name` IS the period ("2-16 noyabr"); its end date comes from
 *     `ozio-plus/campaigns`;
 *   · `ozio-plus/products` **ignores** `page, skip, search, keyword, q, name,
 *     product_name, sort, order_by, sortBy, order, sub_category_id`, and ignores
 *     `campaign_id` when `category_id` is set, and caps `limit` at 50.
 *
 * So search and sort are client-side over the **pages already loaded**, and the toolbar
 * says so instead of implying a global ordering. Only `category_id`, `limit` and `offset`
 * are ever sent.
 */
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { usePreview } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';
import { Calendar, Percent, Search as SearchIcon } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { ChipRowSkeleton, ProductGridSkeleton, SectionHeaderSkeleton, Shimmer } from '@/shared/skeleton';
import { EmptyState, ErrorState, GuestGate } from '@/shared/states';
import { Button, ChipGroup, Input, Select, type ChipOption, type SelectOption } from '@/shared/ui';

import { LinkButton } from '../components/link-button';
import { PlusProductCard } from '../components/plus-product-card';
import { filterPlusProducts, sortPlusProducts, type PlusSort } from '../data/models/plus';
import { usePlusCampaigns, usePlusChains, usePlusProducts } from '../hooks/use-plus';

const SORTS: readonly PlusSort[] = ['default', 'discount', 'priceAsc', 'priceDesc'] as const;

export interface DiscountsViewProps {
  /** `?category=` — a chain id from `ozio-plus/categories`. */
  category?: string;
}

function DiscountsSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6" label={label}>
      <ChipRowSkeleton count={4} h={40} />
      <SectionHeaderSkeleton titleW={260} />
      <ProductGridSkeleton cols={4} count={8} />
    </Shimmer>
  );
}

export function DiscountsView({ category }: DiscountsViewProps) {
  const t = useTranslations('lottery');
  const tc = useTranslations('common');
  const { date } = useFormat();
  const router = useRouter();
  const authenticated = useIsAuthenticated();
  const previewing = usePreview() !== null;
  const failureMessage = useFailureMessage();

  const chains = usePlusChains();
  const campaigns = usePlusCampaigns();

  const initial = Number(category);
  const [picked, setPicked] = useState<number | null>(
    Number.isFinite(initial) && initial > 0 ? initial : null,
  );
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PlusSort>('default');

  // `category_id` is what fills `price_info`, so the first chain stands in as soon as the chains
  // land and neither the URL nor a chip named one — derived during render, not synced in an effect.
  const chainId = picked ?? chains.data?.[0]?.id ?? null;

  // Disabled until a chain is picked: `category_id` is what makes the server fill `price_info`.
  const products = usePlusProducts(chainId, { limit: 24, enabled: chainId !== null });

  const chain = useMemo(
    () => chains.data?.find((row) => row.id === chainId) ?? null,
    [chains.data, chainId],
  );

  const campaign = useMemo(() => {
    const list = campaigns.data ?? [];
    return list.find((row) => row.categoryId === chainId) ?? null;
  }, [campaigns.data, chainId]);

  const visible = useMemo(
    () => sortPlusProducts(filterPlusProducts(products.items, query), sort),
    [products.items, query, sort],
  );

  const chips: ChipOption[] = (chains.data ?? []).map((row) => ({
    value: String(row.id),
    label: row.name,
  }));

  const sortOptions: SelectOption[] = SORTS.map((value) => ({
    value,
    label: t(`discounts.sort.${value}`),
  }));

  const header = (
    <PageHeader
      title={t('discounts.title')}
      subtitle={
        campaign?.name
          ? t('discounts.subtitlePeriod', { period: campaign.name })
          : t('discounts.subtitle')
      }
    />
  );

  // `?preview=` must reach the data states even without a session (BUILD-CONTRACT rule 4).
  if (!authenticated && !previewing) {
    return (
      <>
        {header}
        <GuestGate
          icon={Percent}
          title={t('discounts.guest.title')}
          body={t('discounts.guest.body')}
          actionLabel={tc('signIn')}
          next={paths.discounts}
        />
      </>
    );
  }

  if (chains.isPending) {
    return (
      <>
        {header}
        <DiscountsSkeleton label={tc('loading')} />
      </>
    );
  }

  if (chains.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={chains.error}
          title={tc('error.generic.title')}
          message={failureMessage(chains.error)}
          retryLabel={tc('retry')}
          onRetry={() => chains.refetch()}
        />
      </>
    );
  }

  if ((chains.data ?? []).length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Percent}
          title={t('discounts.empty.title')}
          body={t('discounts.empty.body')}
          panel
          action={
            <LinkButton href={paths.market} variant="primary" size="lg">
              {t('discounts.empty.action')}
            </LinkButton>
          }
        />
      </>
    );
  }

  const filtering = query.trim().length > 0;

  return (
    <>
      {header}

      <ChipGroup
        value={chainId === null ? '' : String(chainId)}
        onValueChange={(value) => {
          const next = Number(value);
          setPicked(Number.isFinite(next) ? next : null);
          setQuery('');
          // Keep the URL shareable: `?category=` is the documented filter.
          router.replace(paths.discountsCategory(next));
        }}
        options={chips}
        label={t('discounts.chainsLabel')}
        scroll
      />

      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-h4 font-bold text-ink">
            {chain?.name ?? t('discounts.allChains')}
          </h2>
          <p className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink2">
            <span>{t('discounts.count', { count: products.total })}</span>
            {campaign?.endsAt ? (
              <span className="flex flex-row items-center gap-1.5">
                <Calendar size={14} aria-hidden="true" />
                <time dateTime={campaign.endsAt.raw}>
                  {t('discounts.until', { date: date(campaign.endsAt.at, 'long') })}
                </time>
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('discounts.searchPlaceholder')}
            aria-label={t('discounts.searchPlaceholder')}
            leadingIcon={<SearchIcon size={18} aria-hidden="true" />}
            containerClassName="h-12 rounded-pill sm:w-[280px]"
          />
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PlusSort)}
            options={sortOptions}
            aria-label={t('discounts.sortLabel')}
            className="h-12 sm:w-[220px]"
          />
        </div>
      </div>

      {/* The server sorts and searches nothing — say so rather than implying a global order. */}
      <p className="text-caption text-ink3">{t('discounts.clientSideNote')}</p>

      {products.isPending ? (
        <ProductGridSkeleton cols={4} count={8} />
      ) : products.isError ? (
        <ErrorState
          failure={products.error}
          title={tc('error.generic.title')}
          message={products.error ? failureMessage(products.error) : undefined}
          retryLabel={tc('retry')}
          onRetry={products.refetch}
        />
      ) : visible.length === 0 ? (
        filtering ? (
          <EmptyState
            icon={SearchIcon}
            title={t('discounts.noMatch.title')}
            body={t('discounts.noMatch.body')}
            panel
            action={
              <Button variant="soft" size="lg" onClick={() => setQuery('')}>
                {tc('clear')}
              </Button>
            }
            secondaryAction={
              products.hasMore ? (
                <Button variant="ghost" size="lg" onClick={products.loadMore}>
                  {tc('loadMore')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EmptyState
            icon={Percent}
            title={t('discounts.emptyChain.title')}
            body={t('discounts.emptyChain.body')}
            panel
          />
        )
      ) : (
        <>
          <ul className="grid w-full list-none grid-cols-2 gap-5 p-0 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((product, index) => (
              <li key={product.id} className="min-w-0">
                <PlusProductCard
                  product={product}
                  chainName={chain?.name}
                  priority={index < 4}
                />
              </li>
            ))}
          </ul>

          {products.hasMore ? (
            <Button
              variant="soft"
              size="xl"
              loading={products.isFetchingNextPage}
              onClick={products.loadMore}
              className="mx-auto"
            >
              {t('discounts.loadMore', { count: products.total - products.loadedCount })}
            </Button>
          ) : null}
        </>
      )}
    </>
  );
}
