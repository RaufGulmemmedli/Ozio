'use client';

/**
 * `?sheet=promo` — the promo-code modal (OD3, export `app-orders/app-promo-code.html`).
 *
 * **How a code is applied:** `POST v1/promo-code/apply` is unverified (its body is a guess, there
 * is no documented cart context and removal is undocumented), so this sheet does **not** call it.
 * It stores the code in the cart selection, which re-runs `POST v2/orders/checkout` with
 * `promo_code` — the verified path — and the calculation's own answer decides the state:
 *
 * - `applied_promo` / a `total_discount` → the green "ETİBARLI KOD" state with the discount;
 * - `purchasing_disabled_reasons` or no discount → the "ETİBARSIZ KOD" state with the server's
 *   wording when it sent one.
 *
 * `GET v1/promo-code` is verified but empty on live, so the coupon list below renders whatever
 * rows ever appear and an empty line until then.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { CircleAlert, CircleCheck, CircleX, Ticket } from '@/shared/lucide';
import { Button, Modal } from '@/shared/ui';

import type { CheckoutCalc } from '../data/models/checkout';
import { normalizePromoInput } from '../data/models/promo';
import { useCartSelection } from '../hooks/use-cart-selection';
import { usePromoCodes } from '../hooks/use-promo-codes';

export interface PromoSheetProps {
  open: boolean;
  onClose: () => void;
  /** The calculation for the current selection — the only judge of whether the code worked. */
  calc: CheckoutCalc | undefined;
  calcPending: boolean;
}

type PromoState = 'idle' | 'checking' | 'valid' | 'invalid';

export function PromoSheet({ open, onClose, calc, calcPending }: PromoSheetProps) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const { money, date } = useFormat();
  const applied = useCartSelection((state) => state.promoCode);
  const setPromoCode = useCartSelection((state) => state.setPromoCode);
  const promoCodes = usePromoCodes();

  const [input, setInput] = useState(applied ?? '');
  const [submitted, setSubmitted] = useState<string | null>(applied);

  // Reopening the sheet starts from whatever is applied right now. Adjusting state during render
  // on a prop change is React's own pattern for this — an effect here would re-render twice.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setInput(applied ?? '');
      setSubmitted(applied);
    }
  }

  const discount = calc?.appliedPromoDiscount ?? calc?.breakdown.totalDiscount ?? null;
  const state: PromoState =
    submitted === null
      ? 'idle'
      : calcPending
        ? 'checking'
        : calc?.appliedPromoCode || (discount !== null && discount > 0)
          ? 'valid'
          : 'invalid';

  function apply() {
    const code = normalizePromoInput(input);
    if (code.length === 0) return;
    setSubmitted(code);
    setPromoCode(code);
  }

  function clear() {
    setSubmitted(null);
    setInput('');
    setPromoCode(null);
  }

  const serverReason = calc?.purchasingDisabledReasons[0] ?? null;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('promo.title')}
      description={t('promo.subtitle')}
      size="m"
      closeLabel={tc('close')}
    >
      <div className="flex w-full flex-col gap-5">
        {state === 'valid' ? (
          <p className="text-micro font-bold tracking-[1px] text-success">{t('promo.valid')}</p>
        ) : state === 'invalid' ? (
          <p className="text-micro font-bold tracking-[1px] text-brand">{t('promo.invalid')}</p>
        ) : null}

        <div className="flex w-full flex-row items-center gap-[10px]">
          <div
            className={cn(
              'flex h-14 min-w-0 flex-1 flex-row items-center gap-[10px] rounded-md bg-bg px-[18px]',
              'outline outline-2 -outline-offset-1',
              state === 'valid'
                ? 'outline-success'
                : state === 'invalid'
                  ? 'outline-brand'
                  : 'outline-line',
            )}
          >
            <Ticket size={20} aria-hidden="true" className="shrink-0 text-ink3" />
            <input
              value={input}
              onChange={(event) => setInput(normalizePromoInput(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') apply();
              }}
              placeholder={t('promo.placeholder')}
              aria-label={t('promo.title')}
              autoComplete="off"
              spellCheck={false}
              className={cn(
                'min-w-0 flex-1 bg-transparent text-body font-bold tracking-[1px] text-ink',
                'placeholder:font-normal placeholder:tracking-normal placeholder:text-ink3',
                'outline-none',
              )}
            />
            {state === 'valid' ? (
              <CircleCheck size={20} aria-hidden="true" className="shrink-0 text-success" />
            ) : state === 'invalid' ? (
              <CircleX size={20} aria-hidden="true" className="shrink-0 text-brand" />
            ) : null}
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={state === 'checking'}
            onClick={apply}
            disabled={input.length === 0}
          >
            {t('promo.apply')}
          </Button>
        </div>

        {state === 'valid' ? (
          <div className="flex w-full flex-row items-center gap-3 rounded-[16px] bg-success-soft p-4">
            <CircleCheck size={22} aria-hidden="true" className="shrink-0 text-success" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-body-sm font-bold text-ink">
                {t('promo.appliedTitle', { code: calc?.appliedPromoCode ?? submitted ?? '' })}
              </p>
              {discount !== null && discount > 0 ? (
                <p className="text-caption text-ink2">
                  {t('promo.appliedBody', { amount: money(discount) })}
                </p>
              ) : null}
            </div>
            {discount !== null && discount > 0 ? (
              <span className="shrink-0 text-body-l font-extrabold text-success">
                {money(-discount)}
              </span>
            ) : null}
          </div>
        ) : null}

        {state === 'invalid' ? (
          <div className="flex w-full flex-row items-start gap-3 rounded-[16px] bg-brand-soft p-4">
            <CircleAlert size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-body-sm font-bold text-ink">{t('promo.invalidTitle')}</p>
              {/* The server's own message wins whenever it sent one. */}
              <p className="text-caption leading-[18px] text-ink2">
                {serverReason ?? t('promo.invalidBody')}
              </p>
            </div>
          </div>
        ) : null}

        {applied ? (
          <Button variant="soft" size="lg" fullWidth onClick={clear}>
            {t('promo.remove')}
          </Button>
        ) : null}

        <p className="text-label font-bold text-ink2">{t('promo.myCoupons')}</p>

        {promoCodes.data && promoCodes.data.codes.length > 0 ? (
          <ul className="flex w-full flex-col gap-[10px]">
            {promoCodes.data.codes.map((promo) => (
              <li
                key={promo.code}
                className="flex h-16 w-full flex-row items-center gap-[14px] rounded-[16px] px-4 outline outline-1 -outline-offset-[0.5px] outline-line"
              >
                <span className="shrink-0 rounded-pill bg-yellow px-3 py-1.5 text-caption font-extrabold text-on-yellow">
                  {promo.code}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-label font-semibold text-ink">
                    {promo.title ?? promo.code}
                  </span>
                  {promo.endDate ? (
                    <span className="truncate text-micro text-ink3">
                      {t('promo.expires', { date: date(promo.endDate, 'dayMonth') })}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInput(promo.code);
                    setSubmitted(promo.code);
                    setPromoCode(promo.code);
                  }}
                  className="shrink-0 text-label font-bold text-brand hover:underline"
                >
                  {t('promo.select')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-caption text-ink3">{t('promo.emptyList')}</p>
        )}

        <Button as="a" href={paths.coupons} variant="soft" size="lg" fullWidth>
          {t('promo.seeCoupons')}
        </Button>
      </div>
    </Modal>
  );
}
