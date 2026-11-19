'use client';

/**
 * `/viral/wishlists/[id]` — V4 "Kampaniya detalı" (`v4-viral-campaign-detail.html`, frame `YClzu`;
 * loading from `cZbyt`). See `WishlistsView` for the full frame → route table.
 *
 * Layout from the export: a `brand-soft` hero (radius 28, padding 36, gap 36) with a 180 progress
 * **ring** (the export draws a full circle; the screen spec says to draw the real arc, so this
 * uses `<ProgressRing>`), "80 ₼ / 480 ₼" at 40/800, the quoted message, a 12-high bar and the dark
 * "İştirak et"; then the "İştirakçılar" list (40 avatars, name 16/700, relative time 13/400, the
 * amount 17/800 `success`); and the 380-wide share column.
 *
 * States:
 *  - loading → `<WishlistDetailSkeleton>` (the drawn `-skeleton` export);
 *  - error / 404 → `State · Yüklənmədi`;
 *  - `completed` → `State · Hədiyyə tam yığıldı` replaces the "İştirak et" action;
 *  - `Dialog · İştirak et` → `<ContributeDialog>`; `Dialog · Təşəkkür` → `<ThanksDialog>`.
 *
 * **Nothing is charged.** The contribution is a mock write; the dialog's footnote says so.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFormat } from '@/core/i18n';
import { copyToClipboard } from '@/core/lib/clipboard';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Copy } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Avatar, Button, Progress, ProgressRing, toast } from '@/shared/ui';

import { ContributeDialog } from '../components/contribute-dialog';
import { HandCoins, PartyPopper } from '../components/icons';
import { ShareCard } from '../components/share-card';
import { ThanksDialog } from '../components/thanks-dialog';
import { ViralDemoBanner } from '../components/viral-demo-banner';
import { contributorTone } from '../data/models/wishlist';
import { useContribute, useWishlist } from '../hooks/use-wishlists';
import { WishlistDetailSkeleton } from './WishlistDetailSkeleton';

export interface WishlistDetailViewProps {
  id: string;
}

export function WishlistDetailView({ id }: WishlistDetailViewProps) {
  const t = useTranslations('viral');
  const { money, relative } = useFormat();

  const wishlist = useWishlist(id);
  const contribute = useContribute(id);

  const [contributeOpen, setContributeOpen] = useState(false);
  const [thanks, setThanks] = useState<{ amount: number; copied: boolean } | null>(null);

  const data = wishlist.data;

  const header = (
    <>
      <PageHeader
        title={data?.product.name ?? t('detail.titleFallback')}
        subtitle={
          data
            ? t('detail.subtitle', {
                occasion: t(`occasion.${data.occasion}`),
                days: data.daysLeft,
              })
            : undefined
        }
        backHref={paths.viralWishlists}
        backLabel={t('crumb.wishlists')}
        actions={
          data ? (
            <Button
              variant="soft"
              size="lg"
              leadingIcon={<Copy size={20} aria-hidden="true" />}
              onClick={() =>
                void copyToClipboard(data.shareLink).then((ok) =>
                  ok ? toast.success(t('share.copied')) : toast.error(t('share.failed')),
                )
              }
            >
              {t('share.copy')}
            </Button>
          ) : undefined
        }
      />
      <ViralDemoBanner />
    </>
  );

  if (wishlist.isPending) {
    return (
      <>
        {header}
        <WishlistDetailSkeleton />
      </>
    );
  }

  if (wishlist.isError || !data) {
    return (
      <>
        {header}
        <ErrorState
          failure={wishlist.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={() => void wishlist.refetch()}
          retrying={wishlist.isFetching}
        />
      </>
    );
  }

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <section
            aria-labelledby="wishlist-hero"
            className="flex w-full flex-col items-start gap-9 rounded-xl bg-brand-soft p-7 lg:flex-row lg:items-center lg:p-9"
          >
            <ProgressRing
              value={data.progressPercent}
              max={100}
              size={180}
              strokeWidth={14}
              tone="brand"
              label={t('detail.ringLabel', { product: data.product.name })}
              valueText={t('percent', { value: data.progressPercent })}
              className="shrink-0"
            >
              <span className="flex flex-col items-center">
                <span className="text-hero-lg font-extrabold text-brand lg:text-[44px]">
                  {t('percent', { value: data.progressPercent })}
                </span>
                <span className="text-caption text-ink2">{t('detail.raisedLabel')}</span>
              </span>
            </ProgressRing>

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <h2 id="wishlist-hero" className="text-h1 font-extrabold text-ink lg:text-[40px]">
                {t('wishlists.card.raised', {
                  raised: money(data.raised),
                  target: money(data.target),
                })}
              </h2>

              {data.message ? (
                <p className="text-body text-ink2">
                  {t('create.previewQuote', { message: data.message })}
                </p>
              ) : null}

              <Progress
                value={data.progressPercent}
                max={100}
                height={12}
                tone={data.completed ? 'success' : 'brand'}
                label={t('detail.ringLabel', { product: data.product.name })}
                valueText={t('percent', { value: data.progressPercent })}
                trackClassName="bg-surface"
              />

              {data.completed ? (
                <EmptyState
                  compact
                  icon={PartyPopper}
                  title={t('detail.complete.title')}
                  body={t('detail.complete.body', {
                    product: data.product.name,
                    amount: money(data.raised),
                  })}
                  className="items-start text-left"
                />
              ) : (
                <Button
                  variant="primary"
                  size="xl"
                  className="w-fit"
                  leadingIcon={<HandCoins size={20} aria-hidden="true" />}
                  onClick={() => {
                    contribute.reset();
                    setContributeOpen(true);
                  }}
                >
                  {t('detail.contribute')}
                </Button>
              )}
            </div>
          </section>

          <section
            aria-labelledby="wishlist-contributors"
            className="flex w-full flex-col gap-0 rounded-xl bg-surface p-7"
          >
            <h2
              id="wishlist-contributors"
              className="mb-2 text-h4 font-extrabold text-ink"
            >
              {t('detail.contributors')}
            </h2>

            {data.contributions.length === 0 ? (
              <p className="py-4 text-body-sm text-ink2">{t('detail.noContributors')}</p>
            ) : (
              <ul className="flex w-full flex-col divide-y divide-line">
                {data.contributions.map((contribution, index) => (
                  <li
                    key={contribution.id}
                    className="flex h-16 flex-row items-center gap-[14px]"
                  >
                    <Avatar size={40} name={contribution.name} tone={contributorTone(index)} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-body font-bold text-ink">
                        {contribution.name}
                      </span>
                      <span className="text-caption text-ink3">
                        {contribution.at ? relative(contribution.at) : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-[17px] font-extrabold text-success">
                      {t('detail.plus', { amount: money(contribution.amount) })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <ShareCard link={data.shareLink} title={data.product.name} />
      </div>

      <ContributeDialog
        open={contributeOpen}
        onOpenChange={(open) => {
          setContributeOpen(open);
          if (!open) contribute.reset();
        }}
        busy={contribute.isPending}
        failure={contribute.error ?? null}
        onSubmit={(amount) =>
          contribute.mutate(amount, {
            onSuccess: async (updated) => {
              setContributeOpen(false);
              // The export's thank-you copy says the link was copied, so it actually is.
              const copied = await copyToClipboard(updated.shareLink);
              setThanks({ amount, copied });
            },
          })
        }
      />

      <ThanksDialog
        open={thanks !== null}
        onOpenChange={(open) => {
          if (!open) setThanks(null);
        }}
        amount={thanks?.amount ?? 0}
        linkCopied={thanks?.copied ?? false}
      />
    </>
  );
}
