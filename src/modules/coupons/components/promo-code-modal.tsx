'use client';

/**
 * "Kod daxil et" — modal S (400) from the Kuponlar screen header.
 *
 * `POST v1/promo-code/apply` is `live: 'unverified'`: the body key is a guess, nothing is
 * known about whether it is stateful server-side, and the response has never been seen.
 * So this dialog:
 *   - never says "applied" — it says the code was sent and cannot be confirmed yet;
 *   - offers the **verified** route as the primary follow-up: hand the code to the cart,
 *     which sends `promo_code` with `POST v2/orders/checkout`;
 *   - surfaces 4xx field errors inline (S1 inline validation).
 */
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

import { useFailureMessage } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { Button, Field, Input, Modal, toast } from '@/shared/ui';

import { useApplyPromoCode } from '../hooks/use-coupons';

export interface PromoCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Trim + uppercase; the server decides whether the code is real. */
const normalize = (raw: string) => raw.trim().toUpperCase();

export function PromoCodeModal({ open, onOpenChange }: PromoCodeModalProps) {
  const t = useTranslations('coupons');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();
  const router = useRouter();
  const apply = useApplyPromoCode();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const value = normalize(code);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!value) {
      setError(t('promo.required'));
      return;
    }

    apply.mutate(value, {
      onSuccess: (result) => {
        // `result.verified` is always false — the endpoint is unverified, so a 2xx is not proof.
        toast.info({ title: t('promo.sent.title'), body: t('promo.sent.body') });
        onOpenChange(false);
        setCode('');
        // TODO(cart): hand the code over in-process once the cart exposes an entry point —
        //   import { useCart } from '@/modules/cart';   // then: applyPromoCode(result.code)
        // `@/modules/cart`'s public surface currently exports only
        // `useCart / useCartCount / useCartAction / useCartDrawer / AddToCartButton / cartKeys`,
        // with nothing for a promo code, and the verified path is `promo_code` on
        // `POST v2/orders/checkout`, which the cart owns. Until then the code travels in the URL
        // and `/cart?sheet=promo` picks it up.
        router.push(`${paths.cartPromo}&code=${encodeURIComponent(result.code)}`);
      },
      onError: (failure) => {
        setError(failureMessage(failure));
      },
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="s"
      title={t('promo.title')}
      description={t('promo.body')}
      closeLabel={tc('close')}
    >
      <form className="flex w-full flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <Field
          label={t('promo.label')}
          state={error ? 'error' : 'default'}
          helper={error ?? t('promo.helper')}
        >
          {(aria) => (
            <Input
              {...aria}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('promo.placeholder')}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              className="uppercase"
            />
          )}
        </Field>

        <div className="flex flex-row justify-end gap-3">
          <Button type="button" variant="soft" size="lg" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="submit" variant="brand" size="lg" loading={apply.isPending}>
            {tc('apply')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
