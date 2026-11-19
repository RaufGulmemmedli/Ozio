'use client';

/**
 * The payment-method chooser behind the summary's "Ödəniş üsulu" row — a **state** of `/cart`, not
 * a route.
 *
 * `orders/checkout` takes `payment_method: "cash" | "card"` (+ `payment_card_id` when a saved card
 * is chosen), so switching here re-prices the cart. Saved cards themselves belong to the payment
 * module: `GET v1/profile/me/cards` is verified but has only ever answered `[]`, so the card row
 * shape is unobserved and this sheet does not render a card list — it links to
 * `/checkout/payment` (OD1) instead.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Button, Modal, Radio, RadioGroup } from '@/shared/ui';

import type { PaymentMethod } from '../data/models/checkout';
import { useCartSelection } from '../hooks/use-cart-selection';

export interface PaymentMethodSheetProps {
  open: boolean;
  onClose: () => void;
}

export function PaymentMethodSheet({ open, onClose }: PaymentMethodSheetProps) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const method = useCartSelection((state) => state.paymentMethod);
  const setPaymentMethod = useCartSelection((state) => state.setPaymentMethod);

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('summary.payment.label')}
      size="s"
      closeLabel={tc('close')}
      footer={
        <Button
          as="a"
          // TODO(payment): `/checkout/payment` (OD1) owns the saved-card list and add-card flow.
          href={paths.checkoutPayment}
          variant="soft"
          size="lg"
          fullWidth
        >
          {t('summary.payment.manageCards')}
        </Button>
      }
    >
      <RadioGroup
        value={method}
        onValueChange={(value) => {
          setPaymentMethod(value as PaymentMethod);
          onClose();
        }}
        aria-label={t('summary.payment.label')}
      >
        <Radio value="cash" label={t('summary.payment.cash')} />
        <Radio value="card" label={t('summary.payment.card')} />
      </RadioGroup>
    </Modal>
  );
}
