'use client';

/**
 * `Dialog · Xalları dəyişək?` from `sc-states-dialogs.html`.
 *
 * Measured: 400 wide, `bg` fill, radius 32, padding 28, gap 16 — title 22/800, body 15/400 `ink2`,
 * a soft "Ləğv et" and a dark "Təsdiqlə" at 48 high, and (the third state drawn in the same frame)
 * a `success-soft` strip reading "Endirim kuponu əlavə olundu".
 *
 * `<Modal>` is used rather than `confirmDialog()` because the frame carries that result strip
 * inside the dialog: it stays open after a successful redeem to show the coupon. Focus trapping
 * and restore come from `<Modal>` (Radix).
 *
 * The 422 "not enough points" answer is rendered as the inline error strip, because the decision
 * belongs to the handler, never to this component.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { CircleAlert, CircleCheck } from '@/shared/lucide';
import { Button, Modal } from '@/shared/ui';

import type { RedeemResult, SchoolReward } from '../data/models/grade';

export interface RedeemDialogProps {
  reward: SchoolReward | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  busy?: boolean;
  result?: RedeemResult | null;
  failure?: Failure | null;
}

export function RedeemDialog({
  reward,
  open,
  onOpenChange,
  onConfirm,
  busy = false,
  result = null,
  failure = null,
}: RedeemDialogProps) {
  const t = useTranslations('school');
  const failureMessage = useFailureMessage();
  const done = result !== null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="s"
      title={t('redeem.title')}
      description={
        reward ? t('redeem.body', { cost: reward.cost, title: reward.title }) : undefined
      }
      footer={
        done ? (
          <Button variant="primary" size="lg" fullWidth onClick={() => onOpenChange(false)}>
            {t('redeem.close')}
          </Button>
        ) : (
          <>
            <Button variant="soft" size="lg" onClick={() => onOpenChange(false)} disabled={busy}>
              {t('redeem.cancel')}
            </Button>
            <Button variant="primary" size="lg" loading={busy} onClick={onConfirm}>
              {t('redeem.confirm')}
            </Button>
          </>
        )
      }
    >
      <div className="flex w-full flex-col gap-4">
        {reward ? (
          <p className="text-body-sm text-ink2">
            {t('redeem.body', { cost: reward.cost, title: reward.title })}
          </p>
        ) : null}

        {failure ? (
          <p
            role="alert"
            className="flex w-full flex-row items-start gap-2 rounded-md bg-brand-soft p-3 text-caption text-brand"
          >
            <CircleAlert size={16} aria-hidden="true" className="mt-px shrink-0" />
            {failureMessage(failure)}
          </p>
        ) : null}

        {result ? (
          <p
            role="status"
            className="flex w-full flex-row items-start gap-2.5 rounded-md bg-success-soft p-3.5 text-caption text-success"
          >
            <CircleCheck size={16} aria-hidden="true" className="mt-px shrink-0" />
            <span>
              {t('redeem.success')}
              {result.couponCode ? ` · ${result.couponCode}` : null}
            </span>
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
