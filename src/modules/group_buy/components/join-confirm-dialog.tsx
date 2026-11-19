'use client';

/**
 * GB4 `Dialog · Qoşulmanı təsdiqlə` (board `AZf7h`).
 *
 * The breakdown is **fetched** (`GET deals/{id}/quote?qty=`), not computed here: line total,
 * 0 ₼ shared delivery, savings against retail and the payable total are all the source's numbers.
 * Submitting shows the in-button spinner; a failure paints the inline error strip the board draws
 * and leaves the dialog open so the user can retry.
 *
 * Nothing is charged and no cart row is written — the note says the card is charged when the
 * group fills, and in the demo that is where the flow stops.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { Badge, Button, Modal } from '@/shared/ui';
import { InlineNotice } from '@/shared/states';
import { CircleAlert } from '@/shared/lucide';
import { BoneText, Shimmer } from '@/shared/skeleton';

import type { GroupDeal } from '../data/models/group-deal';
import { useJoinQuote } from '../hooks/use-group-buy';
import { DealThumb } from './deal-thumb';

export interface JoinConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: GroupDeal;
  qty: number;
  submitting: boolean;
  failure: Failure | null;
  onConfirm: () => void;
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-body-sm text-ink2">{label}</span>
      <span className={valueClassName ?? 'text-body-sm font-bold text-ink'}>{value}</span>
    </div>
  );
}

export function JoinConfirmDialog({
  open,
  onOpenChange,
  deal,
  qty,
  submitting,
  failure,
  onConfirm,
}: JoinConfirmDialogProps) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();
  const quote = useJoinQuote(deal.id, qty, open);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('confirm.title')}
      size="s"
      closeLabel={t('close')}
      dismissible={!submitting}
      footer={
        <Button
          variant="primary"
          fullWidth
          loading={submitting}
          disabled={!quote.isSuccess}
          onClick={onConfirm}
        >
          {t('confirm.submit')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-[14px]">
          <DealThumb iconKey={deal.iconKey} alt="" size={64} radius="inner" tone="white" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body font-bold text-ink">
              {t('detail.title', { title: deal.title, pack: deal.pack })}
            </p>
            <p className="text-caption text-ink3">
              {t('confirm.group', {
                id: deal.id,
                joined: deal.joined,
                target: deal.target,
              })}
            </p>
          </div>
        </div>

        {quote.isPending ? (
          <Shimmer label={t('loading')} className="flex flex-col gap-3">
            <BoneText lines={3} h={16} />
          </Shimmer>
        ) : null}

        {quote.isError ? (
          <InlineNotice tone="error" multiline icon={CircleAlert}>
            {t('error.body')}
          </InlineNotice>
        ) : null}

        {quote.isSuccess ? (
          <div className="flex flex-col gap-[10px]">
            <Row
              label={t('join.line', { qty: quote.data.qty, price: money(quote.data.unitPrice) })}
              value={money(quote.data.lineTotal)}
            />
            <Row
              label={t('join.delivery')}
              value={money(quote.data.deliveryFee)}
              valueClassName="text-body-sm font-bold text-success"
            />
            <Row
              label={t('confirm.savings')}
              value={money(quote.data.savings)}
              valueClassName="text-body-sm font-bold text-brand"
            />
            <div className="h-px w-full bg-line" />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-body-sm text-ink">{t('join.total')}</span>
              <span className="text-[22px] font-extrabold text-ink">{money(quote.data.total)}</span>
            </div>
          </div>
        ) : null}

        <div className="flex items-start gap-2">
          <Badge tone="success" className="shrink-0">
            {t('join.freeDelivery')}
          </Badge>
          <p className="min-w-0 flex-1 text-caption text-ink2">{t('confirm.note')}</p>
        </div>

        {failure ? (
          <InlineNotice tone="error" multiline icon={CircleAlert}>
            {t('confirm.failed')}
          </InlineNotice>
        ) : null}
      </div>
    </Modal>
  );
}
