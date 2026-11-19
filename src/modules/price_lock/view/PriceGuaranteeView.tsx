'use client';

/**
 * PL1 — `/price-guarantee` (`pl1-price-guarantee-active.html` node `jrPWL` and
 * `pl1-price-guarantee-not-linked.html` node `MlQAr`).
 *
 * The two top-level states are both first class:
 * - **active** → the dark hero + the eight-row staples table + the `Kartı ayır` ghost action;
 * - **not linked** → the brand card-number form and the four-row staples preview. It has its own
 *   CTA and is *not* an error.
 *
 * Plus, from the combined PL2/PL3 frame: `State · Kart bağlanır…` while the link is in flight and
 * `State · Kart bağlanmadı` for a wrong number. The six-month window elapsing on screen is
 * watched (`useExpiryWatch` on `endsAt`) and triggers a refetch, so the screen is told the window
 * closed rather than deciding it.
 *
 * `?preview=loading|empty|error|offline|expired` all work: `empty` is the not-linked state and
 * `expired` is an elapsed window.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { CreditCard } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner } from '@/shared/states';
import { Button, confirmDialog } from '@/shared/ui';

import { ActiveHero } from '../components/active-hero';
import { LinkCardForm } from '../components/link-card-form';
import {
  CardLinkFailedPanel,
  CardLinkingPanel,
  GuaranteeExpiredPanel,
  PriceLockError,
} from '../components/price-lock-states';
import { StaplesTable } from '../components/staples-table';
import { useExpiryWatch } from '../hooks/use-expiry-watch';
import { useGuarantee, useLinkCard, useUnlinkCard } from '../hooks/use-price-lock';
import {
  PriceGuaranteeHeaderActionSkeleton,
  PriceGuaranteeSkeleton,
} from './PriceGuaranteeSkeleton';

export function PriceGuaranteeView() {
  const t = useTranslations('price_lock');
  const query = useGuarantee();
  const link = useLinkCard();
  const unlink = useUnlinkCard();
  /** Set when the user dismisses the `Kart bağlanmadı` panel to try the form again. */
  const [retrying, setRetrying] = useState(false);

  const guarantee = query.data ?? null;
  const refetch = () => {
    void query.refetch();
  };

  // The window can close while the page is open — ask the source, do not assume.
  useExpiryWatch([guarantee?.endsAt], refetch);

  const askUnlink = () => {
    void confirmDialog({
      title: t('guarantee.unlinkConfirm.title'),
      body: t('guarantee.unlinkConfirm.body'),
      confirmLabel: t('guarantee.unlink'),
      cancelLabel: t('guarantee.unlinkConfirm.cancel'),
      destructive: true,
    }).then((confirmed) => {
      if (confirmed) unlink.mutate();
    });
  };

  const active = guarantee?.status === 'active' && !guarantee.expired;

  return (
    <>
      <PageHeader
        title={t('guarantee.title')}
        subtitle={t('guarantee.subtitle')}
        backHref={paths.profile}
        backLabel={t('breadcrumb')}
        actions={
          query.isPending ? (
            <PriceGuaranteeHeaderActionSkeleton />
          ) : active ? (
            <Button
              variant="soft"
              size="lg"
              loading={unlink.isPending}
              leadingIcon={<CreditCard size={20} aria-hidden="true" />}
              onClick={askUnlink}
            >
              {t('guarantee.unlink')}
            </Button>
          ) : null
        }
      />

      <DemoBanner module={t('demo.module')} body={t('demo.body')} />

      {query.isPending ? (
        <PriceGuaranteeSkeleton label={t('loading')} />
      ) : query.isError || !guarantee ? (
        <PriceLockError
          failure={query.error}
          title={t('guaranteeError.title')}
          onRetry={refetch}
          retrying={query.isRefetching}
        />
      ) : link.isPending ? (
        <CardLinkingPanel />
      ) : link.isError && !retrying ? (
        <CardLinkFailedPanel
          failure={link.error}
          onRetry={() => {
            setRetrying(true);
            link.reset();
          }}
        />
      ) : guarantee.expired ? (
        <GuaranteeExpiredPanel
          onRelink={() => {
            unlink.mutate();
          }}
        />
      ) : guarantee.status === 'active' ? (
        <div className="flex flex-col gap-5">
          <ActiveHero guarantee={guarantee} />
          <h2 className="text-[22px] font-extrabold text-ink">{t('staples.title')}</h2>
          <StaplesTable items={guarantee.items} />
        </div>
      ) : (
        <LinkCardForm
          items={guarantee.items}
          submitting={link.isPending}
          failure={link.isError ? link.error : null}
          onSubmit={(cardNumber) => {
            setRetrying(false);
            link.mutate(cardNumber);
          }}
        />
      )}
    </>
  );
}
