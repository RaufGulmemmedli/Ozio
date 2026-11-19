'use client';

/**
 * The bid confirmation for V6's "İndi al · 812 ₼".
 *
 * The export draws the action as a single button; the brief requires a confirm step and
 * server-side validation, so the button opens this dialog. It is styled like the other dialogs in
 * `v-states-dialogs.html` (`bg` fill, radius 32, padding 28, gap 16, a soft cancel and a brand
 * confirm at 52 high).
 *
 * **The client never judges the bid.** The amount shown is the price the server last reported; the
 * mock re-checks it against the price that is live when the request lands, and a stale (too low)
 * offer comes back as a 422 whose `amount` message is rendered here. That is also what happens if
 * the price drops between opening this dialog and confirming — which is exactly the case the rule
 * exists for.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { isValidation, type Failure } from '@/core/network';
import { CircleAlert, Zap } from '@/shared/lucide';
import { Button, Modal } from '@/shared/ui';

import type { Auction } from '../data/models/auction';

export interface BidDialogProps {
  auction: Auction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number) => void;
  busy?: boolean;
  failure?: Failure | null;
}

export function BidDialog({
  auction,
  open,
  onOpenChange,
  onConfirm,
  busy = false,
  failure = null,
}: BidDialogProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const amountError =
    failure && isValidation(failure)
      ? failure.fieldErrors.find((entry) => entry.path === 'amount')?.message
      : undefined;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="s"
      title={t('bid.title')}
      footer={
        <>
          <Button variant="soft" size="lg" disabled={busy} onClick={() => onOpenChange(false)}>
            {t('bid.cancel')}
          </Button>
          <Button
            variant="brand"
            size="lg"
            loading={busy}
            leadingIcon={<Zap size={18} aria-hidden="true" />}
            onClick={() => onConfirm(auction.currentPrice)}
          >
            {t('bid.confirm', { price: money(auction.currentPrice) })}
          </Button>
        </>
      }
    >
      <div className="flex w-full flex-col gap-4">
        <p className="text-body-sm text-ink2">
          {t('bid.body', { title: auction.title, price: money(auction.currentPrice) })}
        </p>

        <dl className="flex w-full flex-col gap-2 rounded-md bg-surface2 p-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <dt className="text-caption text-ink2">{t('bid.priceLabel')}</dt>
            <dd className="text-body font-extrabold text-ink">{money(auction.currentPrice)}</dd>
          </div>
          <div className="flex flex-row items-center justify-between gap-3">
            <dt className="text-caption text-ink2">{t('bid.stockLabel')}</dt>
            <dd className="text-caption font-bold text-ink">
              {t('auction.stockLeft', { left: auction.stockLeft, total: auction.totalStock })}
            </dd>
          </div>
        </dl>

        {amountError ? (
          <p
            role="alert"
            className="flex w-full flex-row items-start gap-2 rounded-md bg-brand-soft p-3 text-caption text-brand"
          >
            <CircleAlert size={16} aria-hidden="true" className="mt-px shrink-0" />
            {t('bid.rejected')}
          </p>
        ) : failure ? (
          <p
            role="alert"
            className="flex w-full flex-row items-start gap-2 rounded-md bg-brand-soft p-3 text-caption text-brand"
          >
            <CircleAlert size={16} aria-hidden="true" className="mt-px shrink-0" />
            {failureMessage(failure)}
          </p>
        ) : null}

        <p className="text-caption text-ink3">{t('bid.note')}</p>
      </div>
    </Modal>
  );
}
