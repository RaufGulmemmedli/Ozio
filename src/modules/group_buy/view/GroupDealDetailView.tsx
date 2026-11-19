'use client';

/**
 * GB2 — `/group-buy/deal/[id]` (`gb2-group-deal-detail.html`, node `dXpzp`).
 *
 * Left: the brand-soft hero (180 thumb, tags, 52px current price, retail + best price, countdown),
 * `Qiymət pillələri`, `İştirakçılar`. Right: the 400px join card (quantity, shared address with the
 * 0 ₼ tag, line/delivery/total, `Qoşul`, `Dəvət et`, the invite link).
 *
 * Every state the screens brief lists is reachable:
 * - loading → `GroupDealDetailSkeleton` (the drawn `-skeleton` export);
 * - error → `GroupBuyError` panel with retry;
 * - **expired** (`deal.expired`, decided by the source) → the `State · Qrupun vaxtı bitdi` panel;
 * - **joined** (`deal.mine`) → no `Qoşul`, the drawn "Qoşulmusan · N ədəd" line and invite only;
 * - **complete** (`deal.complete`) → no `Qoşul`, the `Qrup tamamlandı` tag;
 * - the GB4 confirm dialog, the GB5a/GB5b result dialogs and the share dialog.
 *
 * Expiry while the page is open: the hero countdown reaching zero calls `refetch()` — the screen
 * never flips itself to expired, it asks. A join that races the deadline is refused by the source
 * with 409 and the same refetch settles the screen.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { paths } from '@/core/routes';
import { Share2 } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner } from '@/shared/states';
import { Badge, Button, Card, QuantityStepper } from '@/shared/ui';

import { CountdownText } from '../components/countdown-text';
import { DealThumb } from '../components/deal-thumb';
import { GroupBuyError, GroupDealExpired } from '../components/group-state-panels';
import { JoinConfirmDialog } from '../components/join-confirm-dialog';
import { JoinResultDialog } from '../components/join-result-dialog';
import { ParticipantsPanel } from '../components/participants-panel';
import { ShareDialog, useShareInvite } from '../components/share-dialog';
import { TierLadder } from '../components/tier-ladder';
import type { GroupDeal } from '../data/models/group-deal';
import type { JoinResult } from '../data/models/join-result';
import { useGroupDeal, useJoinGroupDeal } from '../hooks/use-group-buy';
import { GroupDealDetailSkeleton, GroupDealHeaderSkeleton } from './GroupDealDetailSkeleton';

function Hero({ deal, onElapsed }: { deal: GroupDeal; onElapsed: () => void }) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();

  return (
    <Card
      tone="surface"
      radius="xl"
      className="flex w-full flex-col gap-7 border-transparent bg-brand-soft p-7 sm:flex-row sm:items-center"
    >
      <DealThumb iconKey={deal.iconKey} alt="" size={180} radius="xl" tone="white" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-brand-soft text-brand">
            {t('tag.discount', { percent: deal.discountPercent })}
          </Badge>
          <Badge tone="success">
            {deal.sameBuilding ? t('tag.sameBuilding') : t('tag.nextBuilding')}
          </Badge>
          {deal.complete ? <Badge tone="yellow">{t('tag.complete')}</Badge> : null}
        </div>
        <p className="text-label text-ink2">{t('detail.currentPrice')}</p>
        <p className="text-hero-lg font-extrabold text-ink">{money(deal.currentPrice)}</p>
        <p className="text-body-sm text-ink2">
          {t('detail.retailAndBest', {
            retail: money(deal.retailPrice),
            target: deal.target,
            best: money(deal.bestPrice),
          })}
        </p>
        <p className="text-body-sm font-bold text-brand">
          <CountdownText closesAt={deal.closesAt} onElapsed={onElapsed} announce />
        </p>
      </div>
    </Card>
  );
}

function JoinCard({
  deal,
  qty,
  onQty,
  onJoin,
  onInvite,
  joining,
}: {
  deal: GroupDeal;
  qty: number;
  onQty: (next: number) => void;
  onJoin: () => void;
  onInvite: () => void;
  joining: boolean;
}) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();
  // Display arithmetic only: `line × qty` is the one computation BUILD-CONTRACT rule 7 allows.
  // The charged breakdown comes from `GET deals/{id}/quote` inside the confirm dialog.
  const lineTotal = deal.currentPrice * qty;
  const canJoin = !deal.mine && !deal.complete && !deal.expired;

  return (
    <Card
      as="section"
      tone="surface"
      radius="bento"
      className="flex w-full flex-col gap-[18px] p-7 xl:w-[400px] xl:shrink-0"
      aria-labelledby="gb-join-title"
    >
      <h2 id="gb-join-title" className="text-[22px] font-extrabold text-ink">
        {t('join.title')}
      </h2>

      {canJoin ? (
        <div className="flex flex-col gap-2">
          <span id="gb-qty-label" className="text-body-sm font-semibold text-ink2">
            {t('join.qty')}
          </span>
          <QuantityStepper
            value={qty}
            min={1}
            max={20}
            onChange={onQty}
            decreaseLabel={t('join.qtyDecrease')}
            increaseLabel={t('join.qtyIncrease')}
          />
        </div>
      ) : (
        <p className="text-body-sm font-semibold text-ink2">
          {deal.mine ? t('join.alreadyJoined', { qty: deal.myQty }) : t('tag.complete')}
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-lg bg-surface2 p-4">
        <span className="text-micro text-ink3">{t('join.address')}</span>
        <span className="text-label font-bold text-ink">{deal.address}</span>
        <Badge tone="success" className="mt-1">
          {t('join.freeDelivery')}
        </Badge>
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-body-sm text-ink2">
            {t('join.line', { qty: deal.mine ? deal.myQty : qty, price: money(deal.currentPrice) })}
          </span>
          <span className="text-body-sm font-bold text-ink">
            {money(deal.mine ? deal.currentPrice * deal.myQty : lineTotal)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-body-sm text-ink2">{t('join.delivery')}</span>
          <span className="text-body-sm font-bold text-success">{money(0)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-body-sm text-ink">{t('join.total')}</span>
          <span className="text-[22px] font-extrabold text-ink">
            {money(deal.mine ? deal.currentPrice * deal.myQty : lineTotal)}
          </span>
        </div>
      </div>

      {canJoin ? (
        <Button variant="primary" fullWidth loading={joining} onClick={onJoin}>
          {t('join.submit')}
        </Button>
      ) : null}

      <Button
        variant="soft"
        fullWidth
        leadingIcon={<Share2 size={20} aria-hidden="true" />}
        onClick={onInvite}
      >
        {t('detail.invite')}
      </Button>

      <p className="break-all text-caption text-ink2">
        <span className="sr-only">{t('join.link')}: </span>
        {deal.inviteLink}
      </p>
    </Card>
  );
}

export function GroupDealDetailView({ id }: { id: string }) {
  const t = useTranslations('group_buy');
  const query = useGroupDeal(id);
  const join = useJoinGroupDeal(id);

  const [qty, setQty] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [result, setResult] = useState<JoinResult | null>(null);

  const deal = query.data ?? null;
  const refetch = () => {
    void query.refetch();
  };
  // The header's `Dəvət et` renders before the deal does; an empty link makes it a no-op.
  const share = useShareInvite(deal?.inviteLink ?? '');

  const submit = () => {
    join.mutate(
      { qty },
      {
        onSuccess: (value) => {
          setConfirmOpen(false);
          setResult(value);
        },
      },
    );
  };

  return (
    <>
      {deal ? (
        <PageHeader
          title={t('detail.title', { title: deal.title, pack: deal.pack })}
          subtitle={t('detail.subtitle', { id: deal.id, address: deal.address })}
          backHref={paths.groupBuy}
          backLabel={t('detail.breadcrumb')}
          actions={
            <Button
              variant="soft"
              size="lg"
              leadingIcon={<Share2 size={20} aria-hidden="true" />}
              onClick={() => {
                void share.share();
              }}
            >
              {t('detail.invite')}
            </Button>
          }
        />
      ) : (
        <GroupDealHeaderSkeleton />
      )}

      <DemoBanner module={t('demo.module')} body={t('demo.body')} />

      {query.isPending ? (
        <GroupDealDetailSkeleton label={t('loading')} />
      ) : query.isError || !deal ? (
        <GroupBuyError
          failure={query.error as Failure | null}
          title={t('errorDeal.title')}
          onRetry={refetch}
          retrying={query.isRefetching}
        />
      ) : deal.expired ? (
        <GroupDealExpired />
      ) : (
        <>
          <div className="flex flex-col gap-5 xl:flex-row xl:gap-8">
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <Hero deal={deal} onElapsed={refetch} />
              <TierLadder tiers={deal.tiers} />
              <ParticipantsPanel deal={deal} />
            </div>
            <JoinCard
              deal={deal}
              qty={qty}
              onQty={setQty}
              onJoin={() => setConfirmOpen(true)}
              onInvite={() => setShareOpen(true)}
              joining={join.isPending}
            />
          </div>

          <JoinConfirmDialog
            open={confirmOpen}
            onOpenChange={(open) => {
              if (!open) join.reset();
              setConfirmOpen(open);
            }}
            deal={deal}
            qty={qty}
            submitting={join.isPending}
            failure={join.error ?? null}
            onConfirm={submit}
          />

          {result ? (
            <JoinResultDialog
              open
              onOpenChange={(open) => {
                if (!open) setResult(null);
              }}
              result={result}
              onInvite={() => {
                setResult(null);
                setShareOpen(true);
              }}
              onElapsed={refetch}
            />
          ) : null}

          <ShareDialog open={shareOpen} onOpenChange={setShareOpen} deal={deal} />
        </>
      )}
    </>
  );
}
