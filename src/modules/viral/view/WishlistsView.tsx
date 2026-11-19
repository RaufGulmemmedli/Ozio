'use client';

/**
 * `/viral/wishlists` — V2 "Mənim kampaniyalarım" (`v2-viral-campaigns.html`, frame `qpdYI`).
 *
 * ## Frame → route
 *
 * The design frames are named after the feature's older wording ("kampaniya" = campaign) while
 * `architecture/02-routing.md` — the authority for URLs — puts the same screens under
 * `/viral/wishlists*`. The mapping this module ships is:
 *
 * | frame | design name | route | view |
 * | --- | --- | --- | --- |
 * | `qpdYI` (V2) | Mənim kampaniyalarım | `/viral/wishlists` | `WishlistsView` (this file) |
 * | `a9yoQI` (V3) | Kampaniya yarat | `/viral/wishlists/new` | `WishlistNewView` |
 * | `YClzu` (V4) | Kampaniya detalı | `/viral/wishlists/[id]` | `WishlistDetailView` |
 * | `cZbyt` | V4 skeleton | the same route, loading | `WishlistDetailSkeleton` |
 *
 * So one wishlist **is** one campaign: a gift someone is collecting contributions for. The visible
 * az copy keeps the export's wording ("kampaniya"); only the URLs and the type names follow the
 * route table.
 *
 * States from `v-states-dialogs.html`: `State · Hələ kampaniya yoxdur` (empty) and
 * `State · Yüklənmədi` (error), plus the brief-mandated delete confirm.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Gift, Plus, Trash2 } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { confirmDialog, IconButton, InfiniteList, toast } from '@/shared/ui';

import { LinkButton } from '../components/link-button';

import { ViralDemoBanner } from '../components/viral-demo-banner';
import { WishlistCard } from '../components/wishlist-card';
import type { Wishlist } from '../data/models/wishlist';
import { useDeleteWishlist, useWishlists } from '../hooks/use-wishlists';
import { WishlistsSkeleton } from './WishlistsSkeleton';

export function WishlistsView() {
  const t = useTranslations('viral');
  const failureMessage = useFailureMessage();

  const wishlists = useWishlists();
  const remove = useDeleteWishlist();

  const confirmDelete = async (wishlist: Wishlist) => {
    const ok = await confirmDialog({
      title: t('wishlists.delete.title'),
      body: t('wishlists.delete.body', { product: wishlist.product.name }),
      confirmLabel: t('wishlists.delete.confirm'),
      cancelLabel: t('wishlists.delete.cancel'),
      destructive: true,
    });
    if (ok) {
      remove.mutate(wishlist.id, {
        onSuccess: () => toast.success(t('wishlists.delete.done')),
        onError: (failure) => toast.error(failureMessage(failure)),
      });
    }
  };

  const header = (
    <>
      <PageHeader
        title={t('wishlists.title')}
        subtitle={t('wishlists.subtitle')}
        backHref={paths.viral}
        backLabel={t('crumb.viral')}
        actions={
          <LinkButton
            href={paths.viralWishlistNew}
            variant="brand"
            size="lg"
            leadingIcon={<Plus size={20} aria-hidden="true" />}
          >
            {t("wishlists.create")}
          </LinkButton>
        }
      />
      <ViralDemoBanner />
    </>
  );

  if (wishlists.isPending) {
    return (
      <>
        {header}
        <WishlistsSkeleton />
      </>
    );
  }

  if (wishlists.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={wishlists.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={wishlists.refetch}
          retrying={wishlists.isFetching}
        />
      </>
    );
  }

  if (wishlists.isEmpty) {
    return (
      <>
        {header}
        <EmptyState
          panel
          tone="brand"
          icon={Gift}
          title={t('wishlists.empty.title')}
          body={t('wishlists.empty.body')}
          action={
            <LinkButton href={paths.viralWishlistNew} variant="primary" size="md">
              {t("wishlists.create")}
            </LinkButton>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}

      <InfiniteList<Wishlist>
        items={wishlists.items}
        itemKey={(wishlist) => wishlist.id}
        hasNextPage={wishlists.hasMore}
        isFetchingNextPage={wishlists.isFetchingNextPage}
        fetchNextPage={wishlists.loadMore}
        loadingLabel={t('loading')}
        className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2"
        renderItem={(wishlist) => (
          <div className="relative w-full">
            <WishlistCard wishlist={wishlist} />
            <div className="absolute right-5 top-5">
              <IconButton
                size={36}
                aria-label={t('wishlists.delete.action', { product: wishlist.product.name })}
                loading={remove.isPending && remove.variables === wishlist.id}
                onClick={() => void confirmDelete(wishlist)}
              >
                <Trash2 size={18} aria-hidden="true" />
              </IconButton>
            </div>
          </div>
        )}
      />
    </>
  );
}
